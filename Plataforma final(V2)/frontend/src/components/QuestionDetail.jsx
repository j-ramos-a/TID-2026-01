import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
 ArrowLeft,
 Clock,
 MessageSquare,
 Loader2,
 AlertTriangle,
 ExternalLink,
 Terminal,
 Share2,
 Database,
} from 'lucide-react';
import { useContract } from '../hooks/useContract';
import { useWeb3 } from '../context/Web3Context';
import {
 shortenAddress,
 formatTimestamp,
 getAvatarStyle,
 getAvatarInitials,
} from '../utils/formatters';
import VoteButtons from './VoteButtons';
import AnswerForm from './AnswerForm';


const CATEGORY_LABELS = ['Cálculo', 'Álgebra', 'Programación', 'Core', 'Otros'];
const CATEGORY_COLORS = [
 'bg-white/5 text-neutral-300 border-white/10',
 'bg-white/5 text-neutral-300 border-white/10',
 'bg-white/5 text-neutral-300 border-white/10',
 'bg-white/5 text-neutral-300 border-white/10',
 'bg-white/5 text-neutral-300 border-white/10',
];

export default function QuestionDetail() {
 const { id } = useParams();
 const navigate = useNavigate();
 const { contractData } = useWeb3();
 const { getQuestion, getAnswersForQuestion } = useContract();

 const [question, setQuestion] = useState(null);
 const [answers, setAnswers] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
 const [copied, setCopied] = useState(false);

 const load = useCallback(async () => {
 setLoading(true);
 setError(null);
 try {
 const q = await getQuestion(Number(id));
 setQuestion(q);

 const a = await getAnswersForQuestion(Number(id));
 setAnswers(a);
 } catch (err) {
 console.error('Error cargando consulta:', err);
 setError('No se pudo encontrar o cargar esta consulta desde Sepolia.');
 } finally {
 setLoading(false);
 }
 }, [id, getQuestion, getAnswersForQuestion]);

 useEffect(() => {
 load();
 }, [load]);

 const handleShare = () => {
 navigator.clipboard?.writeText(window.location.href);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 };

 if (loading) {
 return (
 <div className="glass-card py-24 flex flex-col items-center justify-center text-center p-6 border-neutral-800/80">
 <div className="w-12 h-12 rounded-md bg-neutral-500/10 text-neutral-400 flex items-center justify-center mb-4">
 <Loader2 size={24} className="animate-spin text-neutral-400" />
 </div>
 <p className="text-sm font-medium text-neutral-300 mb-1">Cargando consulta #{id}...</p>
 <p className="text-xs text-neutral-500">Leyendo estado inmutable desde la red Sepolia</p>
 </div>
 );
 }

 if (error || !question) {
 return (
 <div className="glass-card py-20 flex flex-col items-center justify-center text-center p-6 border-neutral-800/80">
 <div className="w-12 h-12 rounded-md bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
 <AlertTriangle size={24} />
 </div>
 <h2 className="text-lg font-bold text-neutral-200 mb-1">Consulta no encontrada</h2>
 <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mb-6">
 {error || 'El identificador solicitado no existe en el contrato.'}
 </p>
 <button onClick={() => navigate('/')} className="btn-secondary text-xs">
 <ArrowLeft size={14} /> Volver al listado
 </button>
 </div>
 );
 }

 const qAvatar = getAvatarStyle(question.author);
 const qInitials = getAvatarInitials(question.author);

 return (
 <div className="space-y-8 animate-fade-in">
 {/* ── Barra superior de navegación ── */}
 <div className="flex items-center justify-between">
 <button
 onClick={() => navigate('/')}
 className="btn-ghost -ml-2 text-neutral-400 hover:text-white"
 >
 <ArrowLeft size={16} />
 <span>Volver a Consultas</span>
 </button>

 <button
 onClick={handleShare}
 className="btn-ghost text-xs text-neutral-400 hover:text-neutral-400"
 title="Copiar enlace"
 >
 <Share2 size={14} />
 <span>{copied ? '¡Copiado!' : 'Compartir'}</span>
 </button>
 </div>

 {/* ── Tarjeta Principal de la Consulta ── */}
 <article className="glass-card p-6 sm:p-8 border-neutral-800/80 space-y-6 relative overflow-hidden bg-gradient-to-b from-neutral-900/80 to-neutral-950/80">
 <div className="h-px bg-gradient-to-r from-transparent via-neutral-500/40 to-transparent absolute top-0 left-0 right-0" />

 {/* Metadata y autor */}
 <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800/60">
 <div className="flex items-center gap-3">
 <div
 className={`w-9 h-9 rounded-md flex items-center justify-center font-mono font-bold text-xs border border-white/5 ${qAvatar.bg} ${qAvatar.text}`}
 >
 {qInitials}
 </div>
 <div>
 <div className="flex items-center gap-2">
 <span className="font-mono text-xs sm:text-sm font-semibold text-neutral-200">
 {shortenAddress(question.author, 5)}
 </span>
 <a
 href={`https://sepolia.etherscan.io/address/${question.author}`}
 target="_blank"
 rel="noopener noreferrer"
 className="text-neutral-500 hover:text-neutral-400 transition-colors"
 title="Ver cuenta en Etherscan"
 >
 <ExternalLink size={12} />
 </a>
 </div>
 <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-0.5">
 <Clock size={12} />
 <span>{formatTimestamp(question.timestamp)}</span>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-2">
 <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-neutral-800 text-neutral-400 border border-neutral-700/50">
 ID #{question.id}
 </span>
 {question.category !== undefined && question.category !== null && (
 <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${CATEGORY_COLORS[question.category] || CATEGORY_COLORS[4]}`}>
 {CATEGORY_LABELS[question.category] || 'Otros'}
 </span>
 )}
 {question.isIpfs && (
 <a
 href={
 question.rawContent?.startsWith('ipfs://')
 ? `https://ipfs.io/ipfs/${question.rawContent.replace('ipfs://', '')}`
 : '#'
 }
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-neutral-950/50 border border-neutral-800/60 text-neutral-300 hover:text-neutral-200 hover:border-neutral-700 transition-colors"
 title={`Almacenado descentralizado en IPFS (${question.rawContent}). Haz clic para verificar en gateway público.`}
 >
 <Database size={12} />
 <span>IPFS</span>
 <ExternalLink size={10} />
 </a>
 )}
 <span className="badge-net text-xs">
 <span className="dot-live" />
 <span>Sepolia</span>
 </span>
 </div>
 </div>

 {/* Título prominente */}
 <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-snug">
 {question.title}
 </h1>

 {/* Contenido formateado */}
 <div className="rounded-md bg-neutral-950/50 p-5 border border-neutral-800/50 text-neutral-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans selection:bg-neutral-500/40">
 {question.content}
 </div>
 </article>

 {/* ── Sección de Respuestas ── */}
 <section className="space-y-6">
 <div className="flex items-center justify-between">
 <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
 <MessageSquare size={20} className="text-neutral-400" />
 <span>{answers.length} {answers.length === 1 ? 'Respuesta' : 'Respuestas'}</span>
 </h2>
 <span className="text-xs text-neutral-500">Ordenadas cronológicamente</span>
 </div>

 {answers.length === 0 ? (
 <div className="glass-card py-16 flex flex-col items-center justify-center text-center p-6 border-neutral-800/60">
 <div className="w-12 h-12 rounded-md bg-neutral-800/60 text-neutral-500 flex items-center justify-center mb-3">
 <Terminal size={22} />
 </div>
 <p className="text-base font-semibold text-neutral-300 mb-1">
 Aún no hay respuestas
 </p>
 <p className="text-xs text-neutral-500 max-w-sm">
 ¿Sabes la respuesta o tienes una sugerencia? Ayuda al autor y publica tu solución abajo.
 </p>
 </div>
 ) : (
 <div className="space-y-4">
 {answers.map((answer) => (
 <AnswerCard key={answer.id} answer={answer} onVoted={load} />
 ))}
 </div>
 )}
 </section>

 {/* ── Formulario para Responder ── */}
 <AnswerForm questionId={Number(id)} onSuccess={load} />
 </div>
 );
}

/**
 * Tarjeta individual de respuesta con columna lateral de votos tipo Reddit/StackOverflow
 */
function AnswerCard({ answer, onVoted }) {
 const aAvatar = getAvatarStyle(answer.author);
 const aInitials = getAvatarInitials(answer.author);

 return (
 <article className="glass-card p-5 sm:p-6 border-neutral-800/70 hover:border-neutral-800 transition-all flex flex-col sm:flex-row items-start gap-4 sm:gap-6 bg-neutral-900/50">
 {/* Columna lateral de votos */}
 <div className="flex-shrink-0 relative sm:pt-1">
 <VoteButtons
 answerId={answer.id}
 authorAddress={answer.author}
 likes={answer.likes}
 dislikes={answer.dislikes}
 onVoted={onVoted}
 />
 </div>

 {/* Contenido principal de la respuesta */}
 <div className="flex-1 min-w-0 space-y-4 w-full">
 {/* Cuerpo de la respuesta */}
 <div className="text-neutral-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans">
 {answer.content}
 </div>

 {/* Footer con autor */}
 <div className="flex items-center justify-between pt-3 border-t border-neutral-800/60 text-xs">
 <div className="flex items-center gap-2">
 <div
 className={`w-6 h-6 rounded-md flex items-center justify-center font-mono font-bold text-[10px] border border-white/5 ${aAvatar.bg} ${aAvatar.text}`}
 >
 {aInitials}
 </div>
 <span className="font-mono text-neutral-300">
 {shortenAddress(answer.author, 4)}
 </span>
 <a
 href={`https://sepolia.etherscan.io/address/${answer.author}`}
 target="_blank"
 rel="noopener noreferrer"
 className="text-neutral-500 hover:text-neutral-400 transition-colors"
 title="Ver en Etherscan"
 >
 <ExternalLink size={11} />
 </a>
 </div>

 <div className="flex items-center gap-2">
 {answer.isIpfs && (
 <span
 className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-950/40 border border-neutral-800/40 text-neutral-300"
 title="Respuesta optimizada con IPFS (Gas reducido)"
 >
 <Database size={9} />
 <span>IPFS</span>
 </span>
 )}
 <span className="text-[11px] font-mono text-neutral-500 bg-neutral-950/60 px-2 py-0.5 rounded border border-neutral-800/80">
 Respuesta #{answer.id}
 </span>
 </div>
 </div>
 </div>
 </article>
 );
}
