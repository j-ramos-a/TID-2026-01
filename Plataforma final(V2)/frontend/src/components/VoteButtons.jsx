import { useState, useEffect, useCallback } from 'react';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { useContract } from '../hooks/useContract';
import { parseContractError } from '../utils/errors';

/**
 * Columna lateral de votos tipo Reddit/StackOverflow para una respuesta.
 * Props:
 *  - answerId: ID de la respuesta
 *  - authorAddress: Dirección del autor
 *  - likes: Contador de likes
 *  - dislikes: Contador de dislikes
 *  - onVoted: Callback tras votar
 */
export default function VoteButtons({ answerId, authorAddress, likes, dislikes, onVoted }) {
  const { account } = useWeb3();
  const { voteAnswer, getVote } = useContract();
  const [currentVote, setCurrentVote] = useState(0); // 0=None, 1=Like, 2=Dislike
  const [voting, setVoting] = useState(false);
  const [votingType, setVotingType] = useState(null);
  const [error, setError] = useState(null);

  const isOwnAnswer = Boolean(
    account && authorAddress && account.toLowerCase() === authorAddress.toLowerCase()
  );

  // Cargar voto actual del usuario
  useEffect(() => {
    if (account && answerId) {
      getVote(answerId, account)
        .then(setCurrentVote)
        .catch(() => setCurrentVote(0));
    }
  }, [account, answerId, getVote]);

  const handleVote = useCallback(
    async (voteType) => {
      if (!account || isOwnAnswer || voting) return;

      setVoting(true);
      setVotingType(voteType);
      setError(null);
      try {
        await voteAnswer(answerId, voteType);
        setCurrentVote(voteType);
        onVoted?.();
      } catch (err) {
        setError(parseContractError(err));
        setTimeout(() => setError(null), 4000);
      } finally {
        setVoting(false);
        setVotingType(null);
      }
    },
    [account, isOwnAnswer, voting, voteAnswer, answerId, onVoted]
  );

  return (
    <div className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-slate-950/60 border border-slate-800/80 select-none">
      {/* Botón Like */}
      <button
        onClick={() => handleVote(1)}
        disabled={!account || isOwnAnswer || voting}
        className={`flex flex-col items-center justify-center w-11 h-12 rounded-xl transition-all duration-200 group active:scale-90 ${
          isOwnAnswer
            ? 'cursor-not-allowed text-slate-400'
            : currentVote === 1
            ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
            : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/30'
        }`}
        title={
          !account
            ? 'Conecta tu wallet para votar'
            : isOwnAnswer
            ? 'No puedes votar tu propia respuesta'
            : currentVote === 1
            ? 'Votaste me gusta'
            : 'Me gusta (+1)'
        }
      >
        {voting && votingType === 1 ? (
          <Loader2 size={16} className="animate-spin text-emerald-400" />
        ) : (
          <ThumbsUp
            size={16}
            className="transition-transform group-hover:-translate-y-0.5 duration-150"
            fill={currentVote === 1 ? 'currentColor' : 'none'}
          />
        )}
        <span className="text-[11px] font-bold mt-1 font-mono">{likes}</span>
      </button>

      {/* Separador sutil */}
      <div className="w-4 h-px bg-slate-800" />

      {/* Botón Dislike */}
      <button
        onClick={() => handleVote(2)}
        disabled={!account || isOwnAnswer || voting}
        className={`flex flex-col items-center justify-center w-11 h-12 rounded-xl transition-all duration-200 group active:scale-90 ${
          isOwnAnswer
            ? 'cursor-not-allowed text-slate-400'
            : currentVote === 2
            ? 'bg-rose-950/50 text-rose-400 border border-rose-500/30 shadow-sm shadow-rose-500/10'
            : 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/30'
        }`}
        title={
          !account
            ? 'Conecta tu wallet para votar'
            : isOwnAnswer
            ? 'No puedes votar tu propia respuesta'
            : currentVote === 2
            ? 'Votaste no me gusta'
            : 'No me gusta (-1)'
        }
      >
        {voting && votingType === 2 ? (
          <Loader2 size={16} className="animate-spin text-rose-400" />
        ) : (
          <ThumbsDown
            size={16}
            className="transition-transform group-hover:translate-y-0.5 duration-150"
            fill={currentVote === 2 ? 'currentColor' : 'none'}
          />
        )}
        <span className="text-[11px] font-bold mt-1 font-mono">{dislikes}</span>
      </button>

      {/* Mensaje de error emergente */}
      {error && (
        <div className="absolute left-full ml-3 top-0 z-20 w-48 p-2.5 rounded-xl bg-slate-900 border border-rose-500/40 text-rose-300 text-[11px] shadow-xl animate-fade-in">
          {error}
        </div>
      )}
    </div>
  );
}
