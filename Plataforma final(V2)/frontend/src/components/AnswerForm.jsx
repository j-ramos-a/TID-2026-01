import { useState } from 'react';
import { Send, MessageSquarePlus, Sparkles, Zap } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { useContract } from '../hooks/useContract';
import TxStatus from './TxStatus';

export default function AnswerForm({ questionId, onSuccess }) {
  const { account, connectWallet } = useWeb3();
  const { answerQuestion, txStatus, txError, txInfo, resetTx } = useContract();
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('La respuesta no puede estar vacía.');
      return;
    }
    setError('');

    try {
      await answerQuestion(questionId, content.trim());
      setContent('');
      setTimeout(() => {
        onSuccess?.();
      }, 2500);
    } catch {
      // Handled by txStatus
    }
  };

  const isSubmitting =
    txStatus === 'signing' || txStatus === 'relaying' || txStatus === 'confirming';

  if (!account) {
    return (
      <div className="glass-card p-6 sm:p-8 text-center border-slate-800/80 bg-slate-900/40">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
          <MessageSquarePlus size={22} />
        </div>
        <h3 className="text-base font-semibold text-slate-200 mb-1">
          Participa en esta conversación
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 mb-4 max-w-md mx-auto">
          Conecta tu wallet en Sepolia para responder esta consulta sin pagar gas (patrocinado por el Relayer).
        </p>
        <button
          onClick={connectWallet}
          className="btn-primary text-xs sm:text-sm rounded-full"
        >
          Conectar MetaMask
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-7 border-slate-800/80 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <MessageSquarePlus size={18} className="text-indigo-400" />
          <span>Tu Respuesta</span>
        </h3>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <Sparkles size={12} />
          <span>Firma gratuita (0 Gas)</span>
        </div>
      </div>

      <div>
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setError('');
          }}
          placeholder="Escribe tu solución técnica, snippet de código o explicación detallada..."
          rows={5}
          className={`w-full px-4 py-3 bg-slate-950/70 border rounded-xl text-slate-100 placeholder-slate-600 font-sans text-sm leading-relaxed transition-all duration-200 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/30 ${
            error ? 'border-rose-500/60' : 'border-slate-800/80'
          }`}
          disabled={isSubmitting}
        />
        <div className="flex flex-wrap items-center justify-between gap-1.5 mt-2">
          {content.trim().length >= 100 ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-medium animate-fade-in">
              <Zap size={12} className="text-cyan-400 fill-cyan-400" />
              <span>Optimización IPFS: <strong>~82% ahorro en Gas</strong> (On-chain CIDv1)</span>
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              {content.trim().length > 0 ? (
                <span>{100 - content.trim().length} caracteres más para optimización IPFS</span>
              ) : (
                <span>Textos &gt;100 caracteres se optimizan off-chain en IPFS</span>
              )}
            </div>
          )}
          <span className="text-xs font-mono text-slate-500">
            {content.length} caracteres
          </span>
        </div>
        {error && <p className="text-rose-400 text-xs mt-1.5">{error}</p>}
      </div>

      <TxStatus txStatus={txStatus} txError={txError} txInfo={txInfo} onDismiss={resetTx} />

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-slate-500 font-mono">
          Gas patrocinado vía EIP-2771
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary"
        >
          <Send size={15} />
          <span>
            {isSubmitting
              ? txStatus === 'relaying'
                ? 'Patrocinando en Sepolia...'
                : txStatus === 'confirming'
                ? 'Minando bloque...'
                : 'Firmando (0 Gas)...'
              : 'Publicar Respuesta (0 Gas)'}
          </span>
        </button>
      </div>
    </form>
  );
}
