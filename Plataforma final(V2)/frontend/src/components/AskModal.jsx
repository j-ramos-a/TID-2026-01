import { useState } from 'react';
import { X, Send, Terminal, Sparkles, Zap, Database } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { useContract } from '../hooks/useContract';
import TxStatus from './TxStatus';

export default function AskModal({ onClose, onSuccess }) {
  const { account } = useWeb3();
  const { askQuestion, txStatus, txError, txInfo, resetTx, hasForwarder } = useContract();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = 'El título es obligatorio.';
    if (!content.trim()) e.content = 'El contenido es obligatorio.';
    if (title.trim().length > 200) e.title = 'Máximo 200 caracteres.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await askQuestion(title.trim(), content.trim());
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2500);
    } catch {
      // Error manejado por txStatus/txError
    }
  };

  const isSubmitting =
    txStatus === 'signing' || txStatus === 'relaying' || txStatus === 'confirming';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isSubmitting ? onClose : undefined}
      />

      <div className="relative glass-card w-full max-w-xl z-10 animate-slide-up overflow-hidden">
        {/* Línea de acento superior */}
        <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

        <div className="p-6">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-5 right-5 text-slate-600 hover:text-slate-300 transition-colors disabled:opacity-30"
          >
            <X size={18} />
          </button>

          {/* Encabezado */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600/15 text-indigo-400">
              <Terminal size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Nueva Consulta</h2>
              <p className="text-xs text-slate-500">Se publicará on-chain en Sepolia</p>
            </div>
          </div>

          {/* Aviso visual de Meta-Transacción 0 Gas */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-5">
            <Sparkles size={15} className="flex-shrink-0" />
            <span>
              <strong>Firma gratuita (0 Gas):</strong> Tu transacción será patrocinada por el Relayer. Solo firmas un mensaje EIP-712 sin pagar comisiones.
            </span>
          </div>

          {!account ? (
            <div className="p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 text-amber-300 text-sm">
              Conecta tu wallet para publicar una consulta.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Título</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setErrors((p) => ({ ...p, title: undefined }));
                  }}
                  placeholder="¿Cuál es tu consulta?"
                  className={`input-dark ${
                    errors.title
                      ? 'border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/20'
                      : ''
                  }`}
                  disabled={isSubmitting}
                  maxLength={200}
                />
                <div className="flex items-center justify-between mt-1.5">
                  {errors.title ? (
                    <p className="text-rose-400 text-xs">{errors.title}</p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-slate-600">{title.length}/200</span>
                </div>
              </div>

              {/* Contenido */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Descripción</label>
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setErrors((p) => ({ ...p, content: undefined }));
                  }}
                  placeholder="Describe tu consulta con detalle..."
                  rows={5}
                  className={`textarea-dark ${
                    errors.content
                      ? 'border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/20'
                      : ''
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
                {errors.content && (
                  <p className="text-rose-400 text-xs mt-1.5">{errors.content}</p>
                )}
              </div>

              <TxStatus txStatus={txStatus} txError={txError} txInfo={txInfo} onDismiss={resetTx} />

              {/* Acciones */}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="btn-ghost text-slate-400"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  <Send size={15} />
                  <span>
                    {isSubmitting
                      ? txStatus === 'relaying'
                        ? 'Patrocinando en Sepolia...'
                        : txStatus === 'confirming'
                        ? 'Minando bloque...'
                        : 'Firmando (0 Gas)...'
                      : 'Publicar Consulta (0 Gas)'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
