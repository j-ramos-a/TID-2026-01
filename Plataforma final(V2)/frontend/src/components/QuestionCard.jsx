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
  'bg-blue-500/10 text-blue-300 border-blue-500/20',
  'bg-purple-500/10 text-purple-300 border-purple-500/20',
  'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  'bg-amber-500/10 text-amber-300 border-amber-500/20',
  'bg-slate-500/10 text-slate-300 border-slate-500/20',
];

export default function QuestionCard({ question }) {
  const navigate = useNavigate();
  const avatar = getAvatarStyle(question.author);
  const initials = getAvatarInitials(question.author);
  const answerCount = question.answerIds?.length || 0;

  return (
    <article
      onClick={() => navigate(`/question/${question.id}`)}
      className="glass-card p-5 sm:p-6 hover:border-slate-700/80 hover:bg-slate-900/70 transition-all duration-200 cursor-pointer group relative overflow-hidden"
    >
      {/* Indicador de acento izquierdo en hover */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-2.5 flex-1 min-w-0">
          {/* Fila del autor y metadata */}
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            {/* Avatar generado */}
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center font-mono font-bold text-[10px] border border-white/5 ${avatar.bg} ${avatar.text}`}
            >
              {initials}
            </div>

            <span className="font-mono text-slate-300 group-hover:text-indigo-300 transition-colors">
              {shortenAddress(question.author)}
            </span>

            <span className="text-slate-600">•</span>

            <span className="flex items-center gap-1 text-slate-500">
              <Clock size={12} />
              <span>{formatTimestamp(question.timestamp)}</span>
            </span>

            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
              #{question.id}
            </span>

            {question.isIpfs && (
              <span
                className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950/40 border border-cyan-800/40 text-cyan-300"
                title="Contenido optimizado en IPFS (Gas reducido)"
              >
                <Database size={9} />
                <span>IPFS</span>
              </span>
            )}
            {question.category !== undefined && question.category !== null && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${CATEGORY_COLORS[question.category] || CATEGORY_COLORS[4]}`}
              >
                {CATEGORY_LABELS[question.category] || 'Otros'}
              </span>
            )}
          </div>

          {/* Título de la consulta */}
          <h2 className="text-base sm:text-lg font-semibold text-slate-100 group-hover:text-white transition-colors leading-snug">
            {question.title}
          </h2>

          {/* Extracto de contenido */}
          <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
            {truncateText(question.content, 180)}
          </p>
        </div>

        {/* Lado derecho: Contador de respuestas y flecha */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 flex-shrink-0 pt-1">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              answerCount > 0
                ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 group-hover:border-indigo-500/40'
                : 'bg-slate-800/50 text-slate-400 border-slate-800'
            }`}
          >
            <MessageSquare size={13} />
            <span>
              {answerCount} {answerCount === 1 ? 'respuesta' : 'respuestas'}
            </span>
          </div>

          <span className="text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all duration-200 hidden sm:inline-block">
            <ChevronRight size={16} />
          </span>
        </div>
      </div>
    </article>
  );
}
