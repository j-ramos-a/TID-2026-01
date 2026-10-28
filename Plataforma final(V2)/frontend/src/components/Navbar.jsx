import { useState } from 'react';
import { Terminal, Wallet, LogOut, ExternalLink, ChevronDown, BarChart3 } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import { shortenAddress } from '../utils/formatters';
import UserStats from './UserStats';

export default function Navbar() {
 const {
 account, balance, isConnecting,
 connectWallet, disconnectWallet,
 isCorrectNetwork, switchToSepolia,
 } = useWeb3();
 const [showMenu, setShowMenu] = useState(false);
 const [showStats, setShowStats] = useState(false);

 return (
 <>
 <nav className="sticky top-0 z-40 bg-neutral-950/80 border-b border-neutral-800/60">
 <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
 {/* ── Logo ── */}
 <a href="/" className="flex items-center gap-3 group">
 <div className="flex items-center justify-center w-9 h-9 rounded-md bg-neutral-600/15 text-neutral-400 border border-neutral-500/20 group-hover:bg-neutral-600/25 group-hover:border-neutral-500/40 transition-all duration-200">
 <Terminal size={18} strokeWidth={2.5} />
 </div>
 <div className="flex items-center gap-2">
 <span className="font-bold text-base text-white tracking-tight">
 Consultas ComSCi
 </span>
 <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400">
 v1.0
 </span>
 </div>
 </a>

 {/* ── Derecha ── */}
 <div className="flex items-center gap-3">
 {/* Indicador de red "Ethereum Sepolia" */}
 <div className="badge-net hidden sm:flex">
 <span className="dot-live" />
 <span>Ethereum Sepolia</span>
 </div>

 {!account ? (
 <button
 onClick={connectWallet}
 disabled={isConnecting}
 className="btn-primary rounded-sm text-xs sm:text-sm px-4 sm:px-5"
 >
 <Wallet size={15} />
 {isConnecting ? 'Conectando...' : 'Conectar Wallet'}
 </button>
 ) : !isCorrectNetwork ? (
 <button
 onClick={switchToSepolia}
 className="btn-primary rounded-sm bg-amber-600 hover:bg-amber-500 text-xs sm:text-sm px-4 py-2"
 >
 ⚠️ Cambiar a Sepolia
 </button>
 ) : (
 <div className="relative">
 <button
 onClick={() => setShowMenu(!showMenu)}
 className="flex items-center gap-2.5 px-3.5 py-2 rounded-sm
 bg-neutral-900/90 border border-neutral-800
 hover:border-neutral-700 hover:bg-neutral-800
 transition-all duration-200 text-sm "
 >
 <span className="dot-live" />
 <span className="font-mono text-neutral-200 text-xs">{shortenAddress(account)}</span>
 {balance && (
 <span className="text-neutral-400 text-xs font-mono hidden md:inline">
 {Number(balance).toFixed(4)} ETH
 </span>
 )}
 <ChevronDown size={13} className="text-neutral-500" />
 </button>

 {showMenu && (
 <>
 <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
 <div className="absolute right-0 top-full mt-2 w-60 glass-card p-1.5 z-50 border border-neutral-800 animate-slide-up">
 <button
 onClick={() => { setShowStats(true); setShowMenu(false); }}
 className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-md text-neutral-300 hover:text-white hover:bg-white/[0.05] transition-colors"
 >
 <BarChart3 size={15} className="text-neutral-400" />
 Mi Perfil
 </button>
 <a
 href={`https://sepolia.etherscan.io/address/${account}`}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-md text-neutral-300 hover:text-white hover:bg-white/[0.05] transition-colors"
 onClick={() => setShowMenu(false)}
 >
 <ExternalLink size={15} className="text-neutral-500" />
 Ver en Etherscan
 </a>
 <div className="my-1 mx-2 border-t border-neutral-800/80" />
 <button
 onClick={() => { disconnectWallet(); setShowMenu(false); }}
 className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-md text-rose-400 hover:text-rose-300 hover:bg-rose-500/[0.08] transition-colors"
 >
 <LogOut size={15} />
 Desconectar
 </button>
 </div>
 </>
 )}
 </div>
 )}
 </div>
 </div>
 </nav>

 {showStats && <UserStats onClose={() => setShowStats(false)} />}
 </>
 );
}
