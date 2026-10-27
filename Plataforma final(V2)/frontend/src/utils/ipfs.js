/**
 * Utilidad de Optimización de Gas con IPFS / Almacenamiento Off-Chain.
 *
 * En Ethereum, escribir 1 palabra (32 bytes) en storage (SSTORE) cuesta 20,000 gas.
 * Un texto descriptivo de 1000 caracteres cuesta más de 650,000 gas solo en almacenamiento.
 *
 * Esta utilidad detecta textos largos (>= 100 caracteres), genera su identificador
 * de contenido determinista (CIDv1 base32), lo almacena de forma descentralizada y
 * guarda en la blockchain únicamente la referencia URI ("ipfs://bafk..."),
 * reduciendo el consumo de gas en más de un 80%.
 */

const memoryCache = new Map();
const RELAYER_URL =
  import.meta.env.VITE_RELAYER_URL || 'https://tid-2026-01.onrender.com';

/**
 * Genera un CIDv1 en base32 (raw sha256 multihash) compatible con IPFS usando Web Crypto.
 */
export async function computeIpfsCid(content) {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hash = new Uint8Array(hashBuffer);

  // Multihash prefix: 0x01 (CIDv1), 0x55 (raw-binary codec), 0x12 (sha256), 0x20 (32 bytes)
  const multihash = new Uint8Array(4 + hash.length);
  multihash[0] = 0x01;
  multihash[1] = 0x55;
  multihash[2] = 0x12;
  multihash[3] = 0x20;
  multihash.set(hash, 4);

  // Codificación Base32 RFC 4648 lowercase sin padding
  const base32Alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
  let bits = 0;
  let value = 0;
  let output = 'b'; // Prefijo multibase 'b' para base32 en CIDv1

  for (let i = 0; i < multihash.length; i++) {
    value = (value << 8) | multihash[i];
    bits += 8;
    while (bits >= 5) {
      output += base32Alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += base32Alphabet[(value << (5 - bits)) & 31];
  }
  return output;
}

/**
 * Determina si una cadena es una referencia o identificador CID de IPFS.
 */
export function isIpfsUriOrCid(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.startsWith('ipfs://')) return true;
  // CIDv1 base32 (empieza por bafy o bafk y longitud >= 50 sin espacios)
  if ((trimmed.startsWith('bafy') || trimmed.startsWith('bafk')) && trimmed.length >= 48 && !trimmed.includes(' ')) {
    return true;
  }
  // CIDv0 base58 (empieza por Qm y longitud 46 sin espacios)
  if (trimmed.startsWith('Qm') && trimmed.length === 46 && !trimmed.includes(' ')) {
    return true;
  }
  return false;
}

/**
 * Extrae el hash CID limpio eliminando el prefijo ipfs:// si existe.
 */
export function extractCid(text) {
  if (!text) return '';
  return text.trim().replace(/^ipfs:\/\//, '');
}

/**
 * Procesa el contenido antes de enviarlo a la blockchain:
 * - Si tiene menos de 100 caracteres: se envía como texto plano directo.
 * - Si tiene 100 caracteres o más: se almacena off-chain y se retorna el CID URI.
 */
export async function storeContentOffChain(text) {
  if (!text || text.length < 100) {
    return {
      isIpfs: false,
      content: text,
      cid: null,
      gasOptimized: false,
      originalLength: text ? text.length : 0,
    };
  }

  const cid = await computeIpfsCid(text);
  const uri = `ipfs://${cid}`;

  // 1. Guardar en caché local inmediato para disponibilidad instantánea sin latencia
  memoryCache.set(cid, text);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(`ipfs_${cid}`, text);
    }
  } catch (err) {
    console.warn('No se pudo guardar en localStorage:', err);
  }

  // 2. Persistir en el almacenamiento del Relayer en segundo plano
  fetch(`${RELAYER_URL}/api/ipfs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, cid }),
  }).catch((err) => {
    console.warn('Aviso: No se pudo sincronizar CID con el relayer local:', err.message);
  });

  return {
    isIpfs: true,
    content: uri,
    cid: cid,
    gasOptimized: true,
    originalLength: text.length,
    savingsPercent: Math.round(((text.length - uri.length) / text.length) * 100),
  };
}

/**
 * Resuelve el texto completo a partir de un CID o URI de IPFS de forma transparente.
 */
export async function resolveIpfsContent(rawContent) {
  if (!rawContent || !isIpfsUriOrCid(rawContent)) {
    return rawContent;
  }

  const cid = extractCid(rawContent);

  // 1. Verificar caché en memoria
  if (memoryCache.has(cid)) {
    return memoryCache.get(cid);
  }

  // 2. Verificar caché en localStorage del navegador
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cached = localStorage.getItem(`ipfs_${cid}`);
      if (cached) {
        memoryCache.set(cid, cached);
        return cached;
      }
    }
  } catch (e) {
    // Continuar con resolución por red
  }

  // 3. Consultar al Relayer local
  try {
    const relayerRes = await fetch(`${RELAYER_URL}/api/ipfs/${cid}`, { signal: AbortSignal.timeout(2000) });
    if (relayerRes.ok) {
      const data = await relayerRes.json();
      if (data.text) {
        memoryCache.set(cid, data.text);
        try { localStorage.setItem(`ipfs_${cid}`, data.text); } catch {}
        return data.text;
      }
    }
  } catch (e) {
    // Continuar con gateways públicos
  }

  // 4. Fallback: Gateways IPFS públicos
  const gateways = [
    `https://dweb.link/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`,
  ];

  for (const url of gateways) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
      if (res.ok) {
        const text = await res.text();
        memoryCache.set(cid, text);
        try { localStorage.setItem(`ipfs_${cid}`, text); } catch {}
        return text;
      }
    } catch (e) {
      // Intentar con el siguiente gateway
    }
  }

  // Si no se puede resolver en este momento, retornar la referencia con aviso
  return `[Contenido almacenado en IPFS: ${cid}]`;
}
