// relayer/server.js
// ============================================================
// Servicio Relayer de Meta-Transacciones (EIP-2771 / EIP-712)
// Patrocina y envía transacciones gasless en Ethereum Sepolia
// ============================================================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Almacén persistente local para CIDs de IPFS
const ipfsStoreDir = path.join(__dirname, "ipfs_store");
if (!fs.existsSync(ipfsStoreDir)) {
  fs.mkdirSync(ipfsStoreDir, { recursive: true });
}

// Generador determinista de CIDv1 en base32 (raw sha256 multihash)
function computeIpfsCid(content) {
  const hash = crypto.createHash("sha256").update(Buffer.from(content, "utf8")).digest();
  const multihash = Buffer.concat([Buffer.from([0x01, 0x55, 0x12, 0x20]), hash]);
  const base32 = "abcdefghijklmnopqrstuvwxyz234567";
  let bits = 0, value = 0, output = "b";
  for (let i = 0; i < multihash.length; i++) {
    value = (value << 8) | multihash[i];
    bits += 8;
    while (bits >= 5) {
      output += base32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += base32[(value << (5 - bits)) & 31];
  return output;
}

const PORT = process.env.PORT || process.env.RELAYER_PORT || 3001;
const RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!RPC_URL || !PRIVATE_KEY) {
  console.error("❌ ERROR: Faltan variables de entorno SEPOLIA_RPC_URL o PRIVATE_KEY en .env");
  console.error("   Asegúrate de configurar tu archivo .env en la raíz del proyecto.");
  process.exit(1);
}

// ── 1. Cargar datos del contrato y Forwarder ────────────────
const contractDataPath = path.join(
  __dirname,
  "..",
  "frontend",
  "src",
  "config",
  "contractData.json"
);

function loadContractData() {
  if (!fs.existsSync(contractDataPath)) {
    throw new Error(`No se encontró contractData.json en: ${contractDataPath}`);
  }
  return JSON.parse(fs.readFileSync(contractDataPath, "utf8"));
}

const contractData = loadContractData();
const provider = new ethers.JsonRpcProvider(RPC_URL);
const relayerWallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Forwarder ABI esencial para verify, execute y nonces
const forwarderAbi = contractData.forwarderAbi || [
  "function nonces(address owner) external view returns (uint256)",
  "function verify(tuple(address from, address to, uint256 value, uint256 gas, uint48 deadline, bytes data, bytes signature) request) external view returns (bool)",
  "function execute(tuple(address from, address to, uint256 value, uint256 gas, uint48 deadline, bytes data, bytes signature) request) external payable",
];

const forwarderAddress = contractData.forwarderAddress;
let forwarderContract = null;

if (forwarderAddress) {
  forwarderContract = new ethers.Contract(
    forwarderAddress,
    forwarderAbi,
    relayerWallet
  );
}

console.log("═══════════════════════════════════════════════════════");
console.log("  ⛽ SERVICIO RELAYER EIP-2771 (ComSCi Gasless)");
console.log("═══════════════════════════════════════════════════════");
console.log(`  Relayer Address:    ${relayerWallet.address}`);
console.log(`  Proxy Target:       ${contractData.proxyAddress}`);
console.log(`  Forwarder:          ${forwarderAddress || "(Pendiente de upgrade)"}`);
console.log(`  Network:            ${contractData.network} (Chain ID: ${contractData.chainId})`);
console.log("═══════════════════════════════════════════════════════\n");

// ── 2. Endpoints ──────────────────────────────────────────

/**
 * Almacenar contenido en IPFS (almacén descentralizado/relayer)
 */
app.post("/api/ipfs", (req, res) => {
  try {
    const { text, cid: providedCid } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Campo 'text' requerido y debe ser un string" });
    }
    const cid = providedCid || computeIpfsCid(text);
    const filePath = path.join(ipfsStoreDir, `${cid}.txt`);
    fs.writeFileSync(filePath, text, "utf8");
    console.log(`📦 Contenido IPFS almacenado: ${cid} (${text.length} caracteres)`);
    res.json({ success: true, cid, uri: `ipfs://${cid}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Resolver contenido IPFS por CID
 */
app.get("/api/ipfs/:cid", (req, res) => {
  try {
    const cleanCid = req.params.cid.replace(/^ipfs:\/\//, "");
    const filePath = path.join(ipfsStoreDir, `${cleanCid}.txt`);
    if (fs.existsSync(filePath)) {
      const text = fs.readFileSync(filePath, "utf8");
      return res.json({ cid: cleanCid, text });
    }
    return res.status(404).json({ error: "CID no encontrado en el almacenamiento del relayer" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Health check & información del relayer
 */
app.get("/api/info", async (req, res) => {
  try {
    const data = loadContractData();
    const balanceWei = await provider.getBalance(relayerWallet.address);

    res.json({
      status: "online",
      relayerAddress: relayerWallet.address,
      balanceEth: ethers.formatEther(balanceWei),
      proxyAddress: data.proxyAddress,
      forwarderAddress: data.forwarderAddress || null,
      chainId: data.chainId,
      domain: {
        name: data.forwarderDomainName || "ComSCiForwarder",
        version: data.forwarderDomainVersion || "1",
        chainId: data.chainId,
        verifyingContract: data.forwarderAddress,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Obtener nonce actual de un usuario en el Forwarder
 */
app.get("/api/nonce/:address", async (req, res) => {
  try {
    const { address } = req.params;
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: "Dirección Ethereum inválida" });
    }

    const data = loadContractData();
    if (!data.forwarderAddress) {
      return res.status(400).json({ error: "Forwarder no configurado aún" });
    }

    const forwarder = new ethers.Contract(
      data.forwarderAddress,
      forwarderAbi,
      provider
    );
    const nonce = await forwarder.nonces(address);

    res.json({ address, nonce: nonce.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Endpoint principal: Recibe la meta-transacción y la ejecuta en Sepolia
 */
app.post("/api/relay", async (req, res) => {
  const { request } = req.body;

  if (!request) {
    return res.status(400).json({ error: "Falta el objeto 'request' en el cuerpo de la petición" });
  }

  const { from, to, value, gas, nonce, deadline, data, signature } = request;

  if (!from || !to || !data || !signature) {
    return res.status(400).json({ error: "Campos requeridos faltantes en la solicitud" });
  }

  try {
    const currentContractData = loadContractData();
    const activeForwarderAddress = currentContractData.forwarderAddress;

    if (!activeForwarderAddress) {
      return res.status(400).json({
        error: "El contrato Forwarder aún no ha sido desplegado ni configurado.",
      });
    }

    // Seguridad: Whitelist estricta del contrato de destino
    if (to.toLowerCase() !== currentContractData.proxyAddress.toLowerCase()) {
      return res.status(403).json({
        error: `El destino ${to} no está autorizado por este relayer.`,
      });
    }

    const forwarder = new ethers.Contract(
      activeForwarderAddress,
      currentContractData.forwarderAbi || forwarderAbi,
      relayerWallet
    );

    // Formatear el struct para el contrato Solidity
    const formattedRequest = {
      from: from,
      to: to,
      value: BigInt(value || 0),
      gas: BigInt(gas || 350000),
      deadline: Number(deadline),
      data: data,
      signature: signature,
    };

    console.log(`\n📨 Recibida meta-transacción de: ${from}`);
    console.log(`   Destino (Proxy):   ${to}`);
    console.log(`   Deadline:          ${new Date(deadline * 1000).toLocaleTimeString()}`);

    // Validar firma y parámetros con el Forwarder
    const isValid = await forwarder.verify(formattedRequest);
    if (!isValid) {
      console.warn("⚠️  Firma rechazada por forwarder.verify()");
      return res.status(400).json({
        error: "Firma inválida o solicitud expirada/no confiable para el Forwarder.",
      });
    }

    console.log("✅ Firma verificada con éxito. Calculando gas y enviando a Sepolia...");

    // Calcular gas total para el Forwarder (llamada interna + verificación + storage)
    let executionGasLimit = (formattedRequest.gas * 125n) / 100n + 150000n;
    try {
      const estimated = await forwarder.getFunction("execute").estimateGas(formattedRequest);
      executionGasLimit = (estimated * 120n) / 100n;
      console.log(`⛽ Gas estimado para execute: ${estimated.toString()} (límite configurado: ${executionGasLimit.toString()})`);
    } catch {
      console.log(`⛽ Usando gas calculado: ${executionGasLimit.toString()}`);
    }

    // Enviar la transacción a Sepolia con la cuenta del relayer
    const tx = await forwarder.execute(formattedRequest, {
      gasLimit: executionGasLimit,
    });

    console.log(`🚀 Transacción enviada a la mempool: ${tx.hash}`);
    console.log("⏳ Esperando confirmación de bloque...");

    const receipt = await tx.wait(1);

    console.log(`🎉 Confirmado en bloque #${receipt.blockNumber} (Gas usado: ${receipt.gasUsed})`);

    return res.json({
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      sender: from,
    });
  } catch (err) {
    console.error("❌ Error en el relayer:", err);
    return res.status(500).json({
      error: err.reason || err.message || "Error al procesar la meta-transacción en Sepolia",
    });
  }
});

app.listen(PORT, () => {
  console.log(`📡 Relayer escuchando en http://localhost:${PORT}`);
});
