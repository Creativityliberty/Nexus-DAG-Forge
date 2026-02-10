
import React, { useEffect, useRef } from 'react';
import { Terminal, Wifi, Activity, Share2 } from 'lucide-react';

interface Log {
  id: string;
  timestamp: string;
  type: 'INFO' | 'WARN' | 'SYNC' | 'PACKET';
  message: string;
  source: string;
}

interface NeuralTerminalProps {
  logs: Log[];
  theme?: 'dark' | 'light';
}

const NeuralTerminal: React.FC<NeuralTerminalProps> = ({ logs, theme = 'dark' }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-48 glass-heavy rounded-t-[2.5rem] border-t border-x border-slate-500/10 flex flex-col overflow-hidden relative group">
      <div className={`absolute inset-0 pointer-events-none ${theme === 'dark' ? 'bg-black/40' : 'bg-slate-50/10'}`}></div>
      
      {/* Terminal Header */}
      <div className={`flex items-center justify-between px-6 py-3 border-b border-slate-500/10 relative z-10 ${theme === 'dark' ? 'bg-slate-950/50' : 'bg-white/50'}`}>
        <div className="flex items-center gap-3">
          <Terminal size={14} className="text-blue-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">System_Cortex_Stream</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Wifi size={12} className="text-green-500 animate-pulse" />
            <span className="text-[9px] font-mono text-green-500">UPLINK_STABLE</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={12} className="text-blue-500" />
            <span className="text-[9px] font-mono text-blue-500">Packet_Loss: 0.0%</span>
          </div>
        </div>
      </div>

      {/* Logs Stream */}
      <div className="flex-1 overflow-y-auto p-6 font-mono text-[10px] space-y-2 relative z-10 no-scrollbar">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-4 hover:bg-slate-500/10 p-1 rounded transition-colors group/item">
            <span className="text-slate-500 shrink-0">{log.timestamp}</span>
            <span className={`font-bold shrink-0 w-16 ${
              log.type === 'SYNC' ? 'text-purple-500' :
              log.type === 'PACKET' ? 'text-blue-500' :
              log.type === 'WARN' ? 'text-yellow-600' : 'text-slate-500'
            }`}>[{log.type}]</span>
            <span className="text-slate-400 shrink-0 w-24 truncate">@{log.source}</span>
            <span className={`break-all flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
               {log.type === 'PACKET' && <Share2 size={10} />} {log.message}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Decorative Scanline */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent h-[10px] w-full animate-[scan_2s_linear_infinite] pointer-events-none opacity-20"></div>
    </div>
  );
};

export default NeuralTerminal;
