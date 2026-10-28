import { MessageSquare, Clock, ChevronRight, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
 shortenAddress,
 formatTimestamp,
 truncateText,
 getAvatarStyle,
 getAvatarInitials,
} from '../utils/formatters';


const CATEGORY_LABELS = ['Cálculo', 'Álgebra', 'Programación', 'Core', 'Otros'];
const CATEGORY_COLORS = [
 'bg-white/5 text-neutral-300 border-white/10',
 'bg-white/5 text-neutral-300 border-white/10',
 'bg-white/5 text-neutral-300 border-white/10',
 'bg-white/5 text-neutral-300 border-white/10',
 'bg-white/5 text-neutral-300 border-white/10',
];

export default function QuestionCard({ question }) {
 const navigate = useNavigate();
 const avatar = getAvatarStyle(question.author);
 const initials = getAvatarInitials(question.author);
 const answerCount = question.answerIds?.length || 0;

 return (
 <article
 onClick={() => navigate(`/question/${question.id}`)}
 className="glass-card p-5 sm:p-6 hover:border-neutral-700/80 hover:bg-neutral-900/70 transition-all duration-200 cursor-pointer group relative overflow-hidden"
 >
 {/* Indicador de acento izquierdo en hover */}
 <div className="absolute left-0 top-0 bottom-0 w-1 bg-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

 <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
 <div className="space-y-2.5 flex-1 min-w-0">
 {/* Fila del autor y metadata */}
 <div className="flex items-center gap-2.5 text-xs text-neutral-400">
 {/* Avatar generado */}
 <div
 className={`w-6 h-6 rounded-md flex items-center justify-center font-mono font-bold text-[10px] border border-white/5 ${avatar.bg} ${avatar.text}`}
 >
 {initials}
 </div>

 <span className="font-mono text-neutral-300 group-hover:text-neutral-300 transition-colors">
 {shortenAddress(question.author)}
 </span>

 <span className="text-neutral-600">•</span>

 <span className="flex items-center gap-1 text-neutral-500">
 <Clock size={12} />
 <span>{formatTimestamp(question.timestamp)}</span>
 </span>

 <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-400">
 #{question.id}
 </span>

 {question.isIpfs && (
 <span
 className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-950/40 border border-neutral-800/40 text-neutral-300"
 title="Contenido optimizado en IPFS (Gas reducido)"
 >
 <Database size={9} />
 <span>IPFS</span>
 </span>
 )}
 {question.category !== undefined && question.category !== null && (
 <span
 className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-medium border ${CATEGORY_COLORS[question.category] || CATEGORY_COLORS[4]}`}
 >
 {CATEGORY_LABELS[question.category] || 'Otros'}
 </span>
 )}
 </div>

 {/* Título de la consulta */}
 <h2 className="text-base sm:text-lg font-semibold text-neutral-100 group-hover:text-white transition-colors leading-snug">
 {question.title}
 </h2>

 {/* Extracto de contenido */}
 <p className="text-neutral-400 text-sm leading-relaxed line-clamp-2">
 {truncateText(question.content, 180)}
 </p>
 </div>

 {/* Lado derecho: Contador de respuestas y flecha */}
 <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 flex-shrink-0 pt-1">
 <div
 className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
 answerCount > 0
 ? 'bg-neutral-500/10 text-neutral-300 border-neutral-500/20 group-hover:border-neutral-500/40'
 : 'bg-neutral-800/50 text-neutral-400 border-neutral-800'
 }`}
 >
 <MessageSquare size={13} />
 <span>
 {answerCount} {answerCount === 1 ? 'respuesta' : 'respuestas'}
 </span>
 </div>

 <span className="text-neutral-600 group-hover:text-neutral-400 group-hover:translate-x-1 transition-all duration-200 hidden sm:inline-block">
 <ChevronRight size={16} />
 </span>
 </div>
 </div>
 </article>
 );
}
