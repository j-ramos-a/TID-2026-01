import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import QuestionList from './components/QuestionList';
import QuestionDetail from './components/QuestionDetail';
import { ExternalLink, Terminal } from 'lucide-react';

export default function App() {
 return (
 <div className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col font-sans selection:bg-neutral-500/30 selection:text-white relative overflow-x-hidden">
 {/* Luces ambientales sutiles estilo Vercel / Linear */}
 <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-neutral-600/[0.07] blur-[140px] rounded-sm pointer-events-none -z-10" />
 <div className="fixed top-96 right-0 w-[500px] h-[300px] bg-neutral-600/[0.04] blur-[160px] rounded-sm pointer-events-none -z-10" />

 <Navbar />

 <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
 <Routes>
 <Route path="/" element={<QuestionList />} />
 <Route path="/question/:id" element={<QuestionDetail />} />
 </Routes>
 </main>

 <footer className="border-t border-neutral-800/60 bg-neutral-950/80 py-8 mt-auto">
 <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
 <div className="flex items-center gap-2">
 <div className="w-5 h-5 rounded-md bg-neutral-600/20 text-neutral-400 flex items-center justify-center">
 <Terminal size={12} />
 </div>
 <span className="font-semibold text-neutral-300">Consultas ComSCi</span>
 <span className="text-neutral-600">•</span>
 <span>Comunidad descentralizada sobre Ethereum Sepolia</span>
 </div>

 <div className="flex items-center gap-3">
 <a
 href="https://sepolia.etherscan.io/address/0x5Ef236865697DFa5c9979bdB8e7a53c04976a077"
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-400 hover:border-neutral-700 transition-colors"
 >
 <span className="font-mono">Proxy: 0x5Ef2...a077</span>
 <ExternalLink size={11} />
 </a>
 </div>
 </div>
 </footer>
 </div>
 );
}
