
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Loader2, Sparkles } from 'lucide-react';
import { Task } from '../types';
import { chatWithNode } from '../services/geminiService';

interface AgentChatProps {
  task: Task;
  onClose: () => void;
}

const AgentChatOverlay: React.FC<AgentChatProps> = ({ task, onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: `Link established with ${task.owner || 'Automaton'}. Node "${task.title}" context loaded. Awaiting instructions.` }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await chatWithNode(task, userMsg);
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: "Connection interrupted. Packet loss detected." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-0 top-1/2 md:top-auto md:h-[600px] md:w-[450px] md:right-6 md:left-auto md:bottom-6 glass-heavy rounded-[2rem] border border-blue-500/30 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in z-[500]">
      {/* Header */}
      <div className="p-5 border-b border-white/10 bg-blue-600/10 flex justify-between items-center backdrop-blur-md">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                <Bot size={20} />
            </div>
            <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">{task.owner || 'Automaton'}</h3>
                <p className="text-[9px] text-blue-300 font-mono">SECURE_CHANNEL // {task.id}</p>
            </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={18} /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-950/30">
        {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none shadow-lg' 
                    : 'bg-slate-800 text-slate-200 border border-white/5 rounded-bl-none'
                }`}>
                    {m.text}
                </div>
            </div>
        ))}
        {loading && (
            <div className="flex justify-start">
                 <div className="bg-slate-800/50 p-4 rounded-2xl flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-blue-400" />
                    <span className="text-[10px] uppercase tracking-widest text-slate-500">Computing...</span>
                 </div>
            </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-slate-950/50 border-t border-white/5">
        <div className="relative">
            <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Transmission..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
            />
            <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 rounded-lg text-white disabled:opacity-50 hover:bg-blue-500 transition-colors shadow-lg"
            >
                <Send size={14} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default AgentChatOverlay;
