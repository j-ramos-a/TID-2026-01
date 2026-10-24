import { CheckCircle2, XCircle, Pen, Loader2, X, ExternalLink, Sparkles } from 'lucide-react';

/**
 * Banner / Toast de estado de transacción con soporte para Meta-Transacciones Gasless (EIP-2771).
 * txStatus: null | 'signing' | 'relaying' | 'confirming' | 'success' | 'error'
 * txInfo: { hash: string | null, blockNumber: number | null }
 */
export default function TxStatus({ txStatus, txError, txInfo, onDismiss }) {
  if (!txStatus) return null;

  const config = {
    signing: {
      icon: <Pen size={16} className="animate-pulse" />,
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/[0.06]',
      iconBg: 'bg-amber-500/10 text-amber-400',
      message: 'Firma gratuita (0 Gas)...',
      sub: 'Firma el mensaje EIP-712 en MetaMask sin pagar comisiones de red.',
    },
    relaying: {
      icon: <Loader2 size={16} className="animate-spin" />,
      border: 'border-indigo-500/30',
      bg: 'bg-indigo-500/[0.08]',
      iconBg: 'bg-indigo-500/15 text-indigo-400',
      message: 'Tu petición está siendo patrocinada y minada en Sepolia...',
      sub: 'El relayer está enviando la transacción y pagando el gas en tu nombre.',
    },
    confirming: {
      icon: <Loader2 size={16} className="animate-spin" />,
      border: 'border-indigo-500/30',
      bg: 'bg-indigo-500/[0.06]',
      iconBg: 'bg-indigo-500/10 text-indigo-400',
      message: 'Minando bloque en Sepolia...',
      sub: 'Esperando confirmación del bloque en la red Ethereum.',
    },
    success: {
      icon: <CheckCircle2 size={16} />,
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/[0.06]',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      message: txInfo?.blockNumber
        ? `¡Confirmado en bloque #${txInfo.blockNumber}!`
        : '¡Confirmado exitosamente!',
      sub: 'Operación confirmada on-chain. ¡0 Gas consumido de tu billetera!',
    },
    error: {
      icon: <XCircle size={16} />,
      border: 'border-rose-500/30',
      bg: 'bg-rose-500/[0.06]',
      iconBg: 'bg-rose-500/10 text-rose-400',
      message: txError || 'Error en la transacción',
      sub: null,
    },
  };

  const c = config[txStatus];
  if (!c) return null;

  return (
    <div
      className={`flex items-start gap-3 p-3.5 rounded-xl border ${c.border} ${c.bg} animate-slide-up relative`}
    >
      <div
        className={`flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 ${c.iconBg}`}
      >
        {c.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-200">{c.message}</p>
        {c.sub && <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>}

        {/* Enlace directo a Sepolia Etherscan */}
        {txInfo?.hash && (
          <a
            href={`https://sepolia.etherscan.io/tx/${txInfo.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 underline font-mono mt-1.5 transition-colors"
          >
            <span>Ver transacción en Sepolia Etherscan</span>
            <ExternalLink size={11} />
          </a>
        )}
      </div>

      {(txStatus === 'success' || txStatus === 'error') && onDismiss && (
        <button
          onClick={onDismiss}
          className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 mt-0.5"
          title="Descartar aviso"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
