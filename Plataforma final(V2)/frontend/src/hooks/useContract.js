import { useState, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { parseContractError } from '../utils/errors';
import { storeContentOffChain, resolveIpfsContent, isIpfsUriOrCid, extractCid } from '../utils/ipfs';
import { ethers } from 'ethers';

const RELAYER_URL =
  import.meta.env.VITE_RELAYER_URL || 'https://tid-2026-01.onrender.com';

/**
 * Hook para interactuar con las funciones del contrato QandA_platform_V2.
 * Soporta:
 *  - Meta-transacciones sin gas (EIP-2771 / EIP-712) a través del Relayer.
 *  - Optimización de Gas Off-Chain con IPFS para textos >= 100 caracteres.
 *  - Resolución transparente de CIDs al leer preguntas y respuestas.
 */
export function useContract() {
  const { contract, readContract, signer, provider, account, contractData } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null); // null | 'signing' | 'relaying' | 'confirming' | 'success' | 'error'
  const [txError, setTxError] = useState(null);
  const [txInfo, setTxInfo] = useState({ hash: null, blockNumber: null });

  const reader = contract || readContract;

  const resetTx = useCallback(() => {
    setTxStatus(null);
    setTxError(null);
    setTxInfo({ hash: null, blockNumber: null });
  }, []);

  // ── Lectura: Obtener total de preguntas ──
  const getQuestionCount = useCallback(async () => {
    if (!reader) return 0;
    const count = await reader.questionCount();
    return Number(count);
  }, [reader]);

  // ── Lectura: Obtener una pregunta por ID (con resolución automática de IPFS) ──
  const getQuestion = useCallback(async (id) => {
    if (!reader) return null;
    const q = await reader.getQuestion(id);
    const resolvedContent = await resolveIpfsContent(q.content);
    const isIpfs = isIpfsUriOrCid(q.content);

    return {
      id: Number(q.id),
      author: q.author,
      title: q.title,
      content: resolvedContent,
      rawContent: q.content,
      category: Number(q.category),
      isIpfs: isIpfs,
      cid: isIpfs ? extractCid(q.content) : null,
      timestamp: Number(q.timestamp),
      answerIds: q.answerIds.map(Number),
    };
  }, [reader]);

  // ── Lectura: Obtener respuestas de una pregunta (con resolución de IPFS) ──
  const getAnswersForQuestion = useCallback(async (questionId) => {
    if (!reader) return [];
    const answers = await reader.getAnswersForQuestion(questionId);
    return Promise.all(
      answers.map(async (a) => {
        const resolvedContent = await resolveIpfsContent(a.content);
        const isIpfs = isIpfsUriOrCid(a.content);
        return {
          id: Number(a.id),
          questionId: Number(a.id_question),
          author: a.author,
          content: resolvedContent,
          rawContent: a.content,
          isIpfs: isIpfs,
          cid: isIpfs ? extractCid(a.content) : null,
          likes: Number(a.likes),
          dislikes: Number(a.dislikes),
        };
      })
    );
  }, [reader]);

  // ── Lectura: Obtener el voto actual del usuario en una respuesta ──
  const getVote = useCallback(async (answerId, voterAddress) => {
    if (!reader || !voterAddress) return 0;
    const vote = await reader.votes(answerId, voterAddress);
    return Number(vote);
  }, [reader]);

  // ── Lectura: Obtener datos del usuario ──
  const getUserData = useCallback(async (address) => {
    if (!reader || !address) return null;
    const data = await reader.users(address);
    return {
      answerCount: Number(data.count_answ),
      receivedLikes: Number(data.received_likes),
      receivedDislikes: Number(data.received_dislikes),
    };
  }, [reader]);

  // ── Escritura directa tradicional (con gas del usuario) ──
  const executeDirectTx = useCallback(async (txFn) => {
    if (!contract) throw new Error('Wallet no conectada');
    setTxStatus('signing');
    setTxError(null);
    setTxInfo({ hash: null, blockNumber: null });
    try {
      const tx = await txFn(contract);
      setTxInfo({ hash: tx.hash, blockNumber: null });
      setTxStatus('confirming');
      const receipt = await tx.wait();
      setTxInfo({ hash: receipt.hash || tx.hash, blockNumber: receipt.blockNumber });
      setTxStatus('success');
      return receipt;
    } catch (error) {
      const message = parseContractError(error);
      setTxError(message);
      setTxStatus('error');
      console.error('Error en transacción directa:', error);
      throw error;
    }
  }, [contract]);

  // ── Meta-Transacción Gasless EIP-2771 / EIP-712 (0 Gas para el usuario) ──
  const executeGaslessTx = useCallback(async (functionName, args) => {
    if (!contract || !signer || !account) throw new Error('Wallet no conectada');

    // Si no está registrado el Forwarder, recurrir a transacción directa
    if (!contractData?.forwarderAddress) {
      console.warn('⚠️ Forwarder no registrado aún en contractData.json. Usando transacción directa...');
      return executeDirectTx((c) => c[functionName](...args));
    }

    setTxStatus('signing');
    setTxError(null);
    setTxInfo({ hash: null, blockNumber: null });

    try {
      // 1. Obtener nonce del usuario para el Forwarder
      let nonce;
      try {
        const nonceRes = await fetch(`${RELAYER_URL}/api/nonce/${account}`);
        if (nonceRes.ok) {
          const nonceJson = await nonceRes.json();
          nonce = BigInt(nonceJson.nonce);
        }
      } catch (err) {
        console.warn('No se pudo consultar nonce vía relayer API, consultando provider on-chain...', err);
      }

      if (nonce === undefined) {
        const forwarderContract = new ethers.Contract(
          contractData.forwarderAddress,
          contractData.forwarderAbi || [
            "function nonces(address owner) external view returns (uint256)",
          ],
          provider || signer
        );
        nonce = await forwarderContract.nonces(account);
      }

      // 2. Preparar parámetros de la llamada
      const data = contract.interface.encodeFunctionData(functionName, args);
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hora de validez
      
      // Estimar gas dinámicamente para la subllamada con margen de seguridad
      let gasLimit = 1000000n;
      try {
        const est = await (provider || signer).estimateGas({
          to: contractData.proxyAddress,
          from: contractData.forwarderAddress,
          data: ethers.concat([data, account]),
        });
        gasLimit = (est * 130n) / 100n; // 30% de margen
        if (gasLimit < 600000n) gasLimit = 600000n;
      } catch (err) {
        console.warn('Usando gas límite seguro de 1M para la subllamada:', err);
        gasLimit = 1000000n;
      }

      const domain = {
        name: contractData.forwarderDomainName || "ComSCiForwarder",
        version: contractData.forwarderDomainVersion || "1",
        chainId: contractData.chainId || 11155111,
        verifyingContract: contractData.forwarderAddress,
      };

      const types = {
        ForwardRequest: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "gas", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint48" },
          { name: "data", type: "bytes" },
        ],
      };

      const message = {
        from: account,
        to: contractData.proxyAddress,
        value: 0n,
        gas: gasLimit,
        nonce: nonce,
        deadline: deadline,
        data: data,
      };

      console.log('✍️ Solicitando firma EIP-712 sin gas en MetaMask...');
      const signature = await signer.signTypedData(domain, types, message);

      // 3. Enviar la meta-transacción firmada al Relayer local
      setTxStatus('relaying');
      console.log('🚀 Enviando firma al relayer para patrocinio y validación en Sepolia...');

      const relayResponse = await fetch(`${RELAYER_URL}/api/relay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: {
            from: account,
            to: contractData.proxyAddress,
            value: '0',
            gas: gasLimit.toString(),
            nonce: nonce.toString(),
            deadline: deadline,
            data: data,
            signature: signature,
          },
        }),
      });

      if (!relayResponse.ok) {
        const errorJson = await relayResponse.json().catch(() => ({}));
        throw new Error(errorJson.error || `Error del relayer (${relayResponse.status})`);
      }

      const result = await relayResponse.json();
      console.log('🎉 Meta-transacción confirmada en bloque:', result);

      setTxInfo({ hash: result.txHash, blockNumber: result.blockNumber });
      setTxStatus('success');

      return result;
    } catch (error) {
      console.error('Error al procesar meta-transacción:', error);
      const message = parseContractError(error);
      setTxError(message);
      setTxStatus('error');
      throw error;
    }
  }, [contract, signer, account, contractData, provider, executeDirectTx]);

  // ── Funciones de negocio: Optimizadas con IPFS y Meta-Transacciones ──

  const askQuestion = useCallback(async (title, content, category = 0, options = {}) => {
    // Optimización Gas: Almacenar textos largos (>= 100 caracteres) en IPFS
    const offChainResult = await storeContentOffChain(content);
    const contentPayload = offChainResult.content;

    if (offChainResult.gasOptimized) {
      console.log(`⚡ Contenido optimizado en IPFS (${offChainResult.originalLength} chars -> CID: ${offChainResult.cid})`);
    }

    if (options.direct || !contractData?.forwarderAddress) {
      return executeDirectTx((c) => c.askQuestion(title, contentPayload, category));
    }
    return executeGaslessTx("askQuestion", [title, contentPayload, category]);
  }, [executeGaslessTx, executeDirectTx, contractData]);

  const answerQuestion = useCallback(async (questionId, content, options = {}) => {
    // Optimización Gas para respuestas
    const offChainResult = await storeContentOffChain(content);
    const contentPayload = offChainResult.content;

    if (options.direct || !contractData?.forwarderAddress) {
      return executeDirectTx((c) => c.answerQuestion(questionId, contentPayload));
    }
    return executeGaslessTx("answerQuestion", [questionId, contentPayload]);
  }, [executeGaslessTx, executeDirectTx, contractData]);

  const voteAnswer = useCallback(async (answerId, voteType, options = {}) => {
    if (options.direct || !contractData?.forwarderAddress) {
      return executeDirectTx((c) => c.voteAnswer(answerId, voteType));
    }
    return executeGaslessTx("voteAnswer", [answerId, voteType]);
  }, [executeGaslessTx, executeDirectTx, contractData]);

  return {
    loading,
    setLoading,
    txStatus,
    txError,
    txInfo,
    resetTx,
    getQuestionCount,
    getQuestion,
    getAnswersForQuestion,
    getVote,
    getUserData,
    askQuestion,
    answerQuestion,
    voteAnswer,
    executeDirectTx,
    executeGaslessTx,
    hasForwarder: Boolean(contractData?.forwarderAddress),
  };
}
