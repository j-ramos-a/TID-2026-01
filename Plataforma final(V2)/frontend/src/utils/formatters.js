/**
 * Utilidades de formato para la dApp
 */

/** Recorta una dirección Ethereum: 0x1234...abcd */
export function shortenAddress(address, chars = 4) {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/** Convierte un timestamp UNIX a fecha legible */
export function formatTimestamp(timestamp) {
  const ts = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
  const date = new Date(ts * 1000);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'hace unos segundos';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)} d`;

  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/** Formatea ETH con 4 decimales */
export function formatEth(weiValue, decimals = 4) {
  if (!weiValue) return '0';
  const formatted = Number(weiValue) / 1e18;
  return formatted.toFixed(decimals);
}

/** Recorta texto a N caracteres con "..." */
export function truncateText(text, maxLength = 150) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

/**
 * Genera un color de fondo y texto a partir de una dirección Ethereum.
 * Usado para avatares visuales de identidad.
 */
const AVATAR_PALETTES = [
  { bg: 'bg-indigo-500/20',  text: 'text-indigo-300'  },
  { bg: 'bg-violet-500/20',  text: 'text-violet-300'  },
  { bg: 'bg-cyan-500/20',    text: 'text-cyan-300'    },
  { bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  { bg: 'bg-amber-500/20',   text: 'text-amber-300'   },
  { bg: 'bg-rose-500/20',    text: 'text-rose-300'    },
  { bg: 'bg-sky-500/20',     text: 'text-sky-300'     },
  { bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-300' },
  { bg: 'bg-teal-500/20',    text: 'text-teal-300'    },
  { bg: 'bg-orange-500/20',  text: 'text-orange-300'  },
];

export function getAvatarStyle(address) {
  if (!address) return AVATAR_PALETTES[0];
  const idx = parseInt(address.slice(2, 6), 16) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[idx];
}

export function getAvatarInitials(address) {
  if (!address) return '??';
  return address.slice(2, 4).toUpperCase();
}
