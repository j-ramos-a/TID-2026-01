import { useEffect, useState } from 'react';
import { X, MessageSquare, ThumbsUp, ThumbsDown, Loader2, TrendingUp, ExternalLink, ShieldCheck } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { useContract } from '../hooks/useContract';
import { shortenAddress, getAvatarStyle, getAvatarInitials } from '../utils/formatters';

export default function UserStats({ onClose }) {
 const { account } = useWeb3();
 const { getUserData } = useContract();
 const [data, setData] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 if (!account) return;
 setLoading(true);
 getUserData(account)
 .then(setData)
 .catch(console.error)
 .finally(() => setLoading(false));
 }, [account, getUserData]);

 const avatar = getAvatarStyle(account);
 const reputation = data ? data.receivedLikes - data.receivedDislikes : 0;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
 {/* Overlay */}
 <div className="absolute inset-0 bg-black/70 " onClick={onClose} />

 {/* Modal */}
 <div className="relative glass-card w-full max-w-md overflow-hidden z-10 animate-slide-up border-neutral-800 bg-neutral-900/90 ">
 {/* Header gradient */}
 <div className="h-24 bg-gradient-to-br from-neutral-600/25 via-neutral-600/15 to-transparent relative">
 <div className="absolute top-3 left-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-neutral-950/60 border border-neutral-800 text-[11px] text-neutral-400">
 <ShieldCheck size={12} className="text-emerald-400" />
 <span>Perfil On-Chain</span>
 </div>
 </div>

 {/* Close */}
 <button
 onClick={onClose}
 className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-300 transition-colors p-1"
 title="Cerrar"
 >
 <X size={18} />
 </button>

 {/* Content */}
 <div className="px-6 pb-6 -mt-9">
 {/* Avatar */}
 <div
 className={`w-16 h-16 rounded-md ${avatar.bg} ${avatar.text} flex items-center justify-center text-xl font-bold font-mono border-4 border-neutral-900 mb-3 `}
 >
 {getAvatarInitials(account)}
 </div>

 <h2 className="text-xl font-bold text-white mb-1">Mi Perfil</h2>

 {/* Address */}
 <div className="flex items-center gap-2 mb-5">
 <span className="font-mono text-xs sm:text-sm text-neutral-400 bg-neutral-950/60 px-2.5 py-1 rounded-md border border-neutral-800">
 {shortenAddress(account, 6)}
 </span>
 <a
 href={`https://sepolia.etherscan.io/address/${account}`}
 target="_blank"
 rel="noopener noreferrer"
 className="text-neutral-500 hover:text-neutral-400 transition-colors"
 title="Ver en Sepolia Etherscan"
 >
 <ExternalLink size={13} />
 </a>
 </div>

 {loading ? (
 <div className="flex items-center justify-center py-10">
 <Loader2 size={24} className="animate-spin text-neutral-500" />
 </div>
 ) : data ? (
 <div className="space-y-4">
 {/* Stats grid */}
 <div className="grid grid-cols-3 gap-2.5">
 <MetricCard
 icon={<MessageSquare size={16} />}
 iconColor="text-neutral-400 bg-neutral-500/10 border-neutral-500/20"
 label="Respuestas"
 value={data.answerCount}
 />
 <MetricCard
 icon={<ThumbsUp size={16} />}
 iconColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
 label="Likes"
 value={data.receivedLikes}
 />
 <MetricCard
 icon={<ThumbsDown size={16} />}
 iconColor="text-rose-400 bg-rose-500/10 border-rose-500/20"
 label="Dislikes"
 value={data.receivedDislikes}
 />
 </div>

 {/* Reputation */}
 <div className="flex items-center justify-between p-4 rounded-md bg-gradient-to-r from-neutral-950/30 to-neutral-950/20 border border-neutral-500/20">
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-md bg-neutral-500/10 text-neutral-400 flex items-center justify-center">
 <TrendingUp size={16} />
 </div>
 <div>
 <span className="text-xs font-semibold text-neutral-300 block">Reputación Neta</span>
 <span className="text-[10px] text-neutral-500">Likes recibidos menos dislikes</span>
 </div>
 </div>
 <span
 className={`text-2xl font-bold font-mono ${
 reputation >= 0 ? 'text-emerald-400' : 'text-rose-400'
 }`}
 >
 {reputation > 0 ? `+${reputation}` : reputation}
 </span>
 </div>
 </div>
 ) : (
 <p className="text-center text-neutral-500 py-10 text-xs">Sin datos disponibles en Sepolia.</p>
 )}
 </div>
 </div>
 </div>
 );
}

function MetricCard({ icon, iconColor, label, value }) {
 return (
 <div className="p-3 rounded-md bg-neutral-950/60 border border-neutral-800/80 text-center">
 <div className={`w-8 h-8 mx-auto rounded-md flex items-center justify-center mb-2 border ${iconColor}`}>
 {icon}
 </div>
 <p className="text-lg font-bold text-white font-mono">{value}</p>
 <p className="text-[11px] text-neutral-500 mt-0.5">{label}</p>
 </div>
 );
}
