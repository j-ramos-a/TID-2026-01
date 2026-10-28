import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Loader2, RefreshCw, AlertTriangle, Terminal, Sparkles } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { useContract } from '../hooks/useContract';
import QuestionCard from './QuestionCard';
import AskModal from './AskModal';
import StatsBar from './StatsBar';

export default function QuestionList() {
  const { account } = useWeb3();
  const { getQuestionCount, getQuestion } = useContract();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [showAskModal, setShowAskModal] = useState(false);

  const CATEGORY_TABS = [
    { label: 'Todas', value: null },
    { label: 'Cálculo', value: 0 },
    { label: 'Álgebra', value: 1 },
    { label: 'Programación', value: 2 },
    { label: 'Core', value: 3 },
    { label: 'Otros', value: 4 },
  ];

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const count = await getQuestionCount();
      if (count === 0) {
        setQuestions([]);
        return;
      }

      // Cargar todas las preguntas en paralelo (de la más reciente a la más antigua)
      const promises = [];
      for (let i = count; i >= 1; i--) {
        promises.push(
          getQuestion(i).catch((err) => {
            console.warn(`Error cargando consulta ${i}:`, err);
            return null;
          })
        );
      }
      const results = await Promise.all(promises);
      setQuestions(results.filter(Boolean));
    } catch (err) {
      console.error('Error cargando consultas:', err);
      setError('No se pudieron cargar las consultas desde Sepolia. Verifica tu conexión o RPC.');
    } finally {
      setLoading(false);
    }
  }, [getQuestionCount, getQuestion]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Filtrar por categoría y búsqueda
  const categoryFiltered =
    activeCategory === null
      ? questions
      : questions.filter((q) => q.category === activeCategory);

  const filtered = search.trim()
    ? categoryFiltered.filter((q) =>
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        q.content.toLowerCase().includes(search.toLowerCase())
      )
    : categoryFiltered;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Hero / Encabezado ── */}
      <div className="relative glass-card p-6 sm:p-8 overflow-hidden border-slate-800/80 bg-gradient-to-b from-slate-900/80 via-slate-900/50 to-slate-950/80">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
              <Sparkles size={12} />
              <span>Smart Contract UUPS en Sepolia</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Consultas ComSCi
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Comunidad descentralizada de dudas y código sobre Ethereum Sepolia. Pregunta, responde y acumula reputación on-chain.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setShowAskModal(true)}
              className="btn-primary text-sm sm:text-base px-5 py-3 rounded-xl shadow-indigo-500/20 shadow-lg"
              title={!account ? 'Conecta tu wallet para consultar' : 'Crear una nueva consulta'}
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>Hacer una Consulta</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Panel de Estadísticas Rápidas ── */}
      <StatsBar />

      {/* ── Filtro por Categoría ── */}
      <div className="flex flex-wrap gap-2">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveCategory(tab.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              activeCategory === tab.value
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:border-indigo-500/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Filtros y Búsqueda ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar consultas por título o contenido..."
            className="input-dark pl-10 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300 font-mono"
            >
              limpiar
            </button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          <span className="text-xs text-slate-500 font-medium px-2">
            {filtered.length} {filtered.length === 1 ? 'consulta' : 'consultas'}
          </span>
          <button
            onClick={loadQuestions}
            className="btn-ghost text-xs text-slate-400 hover:text-white"
            title="Sincronizar con la blockchain"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-400' : ''} />
            <span className="hidden sm:inline">Refrescar</span>
          </button>
        </div>
      </div>

      {/* ── Listado de Consultas ── */}
      {loading ? (
        <div className="glass-card py-20 flex flex-col items-center justify-center text-center p-6 border-slate-800/60">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
            <Loader2 size={24} className="animate-spin text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-slate-300 mb-1">Cargando consultas on-chain...</p>
          <p className="text-xs text-slate-500 max-w-sm">
            Consultando el contrato ERC1967Proxy en la red Ethereum Sepolia
          </p>
        </div>
      ) : error ? (
        <div className="glass-card py-16 flex flex-col items-center justify-center text-center p-6 border-rose-900/40 bg-rose-950/10">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
            <AlertTriangle size={24} />
          </div>
          <p className="text-sm font-semibold text-rose-300 mb-1">Error de sincronización</p>
          <p className="text-xs text-slate-400 max-w-md mb-4">{error}</p>
          <button onClick={loadQuestions} className="btn-secondary text-xs">
            Reintentar conexión
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card py-20 flex flex-col items-center justify-center text-center p-6 border-slate-800/60">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/50 text-slate-500 flex items-center justify-center mb-4">
            <Terminal size={24} />
          </div>
          {search ? (
            <>
              <p className="text-base font-semibold text-slate-300 mb-1">
                Sin resultados para "{search}"
              </p>
              <p className="text-xs text-slate-500 max-w-sm mb-4">
                Prueba con otros términos o limpia el campo de búsqueda.
              </p>
              <button onClick={() => setSearch('')} className="btn-secondary text-xs">
                Ver todas las consultas
              </button>
            </>
          ) : (
            <>
              <p className="text-base font-semibold text-slate-300 mb-1">
                Aún no hay consultas publicadas
              </p>
              <p className="text-xs text-slate-500 max-w-sm mb-5">
                Sé el primero en iniciar una conversación técnica en Sepolia.
              </p>
              <button
                onClick={() => setShowAskModal(true)}
                className="btn-primary text-xs"
              >
                <Plus size={14} />
                Publicar primera consulta
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      )}

      {/* Modal de Publicar */}
      {showAskModal && (
        <AskModal
          onClose={() => setShowAskModal(false)}
          onSuccess={loadQuestions}
        />
      )}
    </div>
  );
}
