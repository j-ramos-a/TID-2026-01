import { useEffect, useState } from 'react';
import { MessageSquare, ThumbsUp, TrendingUp, Loader2, Sparkles } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { useContract } from '../hooks/useContract';

/**
 * Barra de estadísticas rápidas: total consultas en la red, tus respuestas aportadas y reputación neta.
 */
export default function StatsBar() {
 const { account } = useWeb3();
 const { getQuestionCount, getUserData } = useContract();
 const [totalQuestions, setTotalQuestions] = useState(null);
 const [userData, setUserData] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 let cancelled = false;
 setLoading(true);

 const load = async () => {
 try {
 const count = await getQuestionCount();
 if (!cancelled) setTotalQuestions(count);

 if (account) {
 const data = await getUserData(account);
 if (!cancelled) setUserData(data);
 } else {
 if (!cancelled) setUserData(null);
 }
 } catch (err) {
 console.warn('Error cargando métricas:', err);
 } finally {
 if (!cancelled) setLoading(false);
 }
 };

 load();
 return () => {
 cancelled = true;
 };
 }, [account, getQuestionCount, getUserData]);

 const reputation = userData ? userData.receivedLikes - userData.receivedDislikes : 0;

 const cards = [
 {
 icon: <MessageSquare size={16} className="text-neutral-400" />,
 iconBg: 'bg-neutral-500/10 border-neutral-500/20',
 label: 'Consultas en la red',
 value: totalQuestions !== null ? totalQuestions : '—',
 hint: 'Almacenadas on-chain',
 },
 {
 icon: <ThumbsUp size={16} className="text-emerald-400" />,
 iconBg: 'bg-emerald-500/10 border-emerald-500/20',
 label: 'Tus respuestas',
 value: account ? (userData?.answerCount ?? 0) : '—',
 hint: account ? 'Aportes a la comunidad' : 'Conecta tu wallet',
 },
 {
 icon: <TrendingUp size={16} className="text-neutral-400" />,
 iconBg: 'bg-neutral-500/10 border-neutral-500/20',
 label: 'Reputación neta',
 value: account ? (reputation >= 0 ? `+${reputation}` : reputation) : '—',
 hint: account ? 'Likes vs. Dislikes' : 'Conecta tu wallet',
 },
 ];

 return (
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
 {cards.map((card, i) => (
 <div
 key={i}
 className="glass-card p-4 flex items-center justify-between border-neutral-800/70 hover:border-neutral-800 transition-colors"
 >
 <div className="space-y-1">
 <p className="text-xs font-medium text-neutral-400">{card.label}</p>
 <div className="flex items-baseline gap-2">
 <p className="text-xl sm:text-2xl font-extrabold text-white font-mono tracking-tight">
 {loading && i === 0 ? (
 <Loader2 size={16} className="animate-spin text-neutral-600 inline" />
 ) : (
 card.value
 )}
 </p>
 </div>
 <p className="text-[11px] text-neutral-500">{card.hint}</p>
 </div>

 <div
 className={`w-10 h-10 rounded-md flex items-center justify-center border flex-shrink-0 ${card.iconBg}`}
 >
 {card.icon}
 </div>
 </div>
 ))}
 </div>
 );
}
