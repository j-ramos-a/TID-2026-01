import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import QuestionList from './components/QuestionList';
import QuestionDetail from './components/QuestionDetail';
import { ExternalLink, Terminal } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white relative overflow-x-hidden">
      {/* Luces ambientales sutiles estilo Vercel / Linear */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-indigo-600/[0.07] blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="fixed top-96 right-0 w-[500px] h-[300px] bg-violet-600/[0.04] blur-[160px] rounded-full pointer-events-none -z-10" />

      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        <Routes>
          <Route path="/" element={<QuestionList />} />
          <Route path="/question/:id" element={<QuestionDetail />} />
        </Routes>
      </main>

      <footer className="border-t border-slate-800/60 bg-slate-950/80 backdrop-blur-md py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Terminal size={12} />
            </div>
            <span className="font-semibold text-slate-300">Consultas ComSCi</span>
            <span className="text-slate-600">•</span>
            <span>Comunidad descentralizada sobre Ethereum Sepolia</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://sepolia.etherscan.io/address/0x5Ef236865697DFa5c9979bdB8e7a53c04976a077"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-slate-700 transition-colors"
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
