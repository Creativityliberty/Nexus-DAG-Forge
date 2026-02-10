
import React, { useState, useMemo } from 'react';
import { Task, Artifact } from '../types';
import { 
  FileCode, 
  Terminal, 
  Database, 
  ExternalLink, 
  Search, 
  Download, 
  Copy,
  Hash,
  Filter
} from 'lucide-react';

interface ArtifactRepositoryProps {
  tasks: Task[];
}

const ArtifactRepository: React.FC<ArtifactRepositoryProps> = ({ tasks }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'code' | 'log' | 'json' | 'link'>('all');

  const allArtifacts = useMemo(() => {
    return tasks.flatMap(t => (t.artifacts || []).map(a => ({ ...a, parentTask: t.title, parentId: t.id })));
  }, [tasks]);

  const filteredArtifacts = useMemo(() => {
    return allArtifacts.filter(art => {
      const matchesSearch = art.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           art.parentTask.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = activeFilter === 'all' || art.type === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [allArtifacts, searchTerm, activeFilter]);

  return (
    <div className="flex-1 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Repository Controls */}
      <div className="glass-heavy rounded-[2.5rem] p-6 border border-white/5 flex items-center gap-8 shadow-2xl">
        <div className="flex-1 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search artifacts, modules, or codes..."
            className="w-full bg-slate-950/60 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm text-white outline-none focus:border-blue-500/40 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 p-1.5 bg-slate-950/60 rounded-2xl border border-white/5">
          {['all', 'code', 'log', 'json', 'link'].map(f => (
            <button 
              key={f}
              onClick={() => setActiveFilter(f as any)}
              className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeFilter === f ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Artifact Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
        <div className="grid grid-cols-3 gap-6">
          {filteredArtifacts.map((art, idx) => (
            <div key={`${art.id}-${idx}`} className="glass-heavy rounded-[2.5rem] border border-white/5 p-8 flex flex-col gap-6 group hover:border-blue-500/40 transition-all shadow-xl hover:-translate-y-1">
              <div className="flex justify-between items-start">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                      {art.type === 'code' ? <FileCode size={20}/> : 
                       art.type === 'json' ? <Database size={20}/> : <Terminal size={20}/>}
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-white uppercase tracking-widest">{art.label}</h4>
                      <p className="text-[8px] font-mono text-slate-500 uppercase mt-1">{art.parentId} // {art.parentTask}</p>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <button className="p-2.5 rounded-xl hover:bg-white/5 text-slate-500"><Copy size={14}/></button>
                    <button className="p-2.5 rounded-xl hover:bg-white/5 text-slate-500"><Download size={14}/></button>
                 </div>
              </div>
              
              <div className="flex-1 bg-black/40 rounded-3xl p-6 font-mono text-[11px] text-slate-400 overflow-hidden relative group/code">
                <pre className="line-clamp-6 leading-relaxed whitespace-pre-wrap">{art.content}</pre>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover/code:opacity-100 transition-opacity flex items-center justify-center">
                   <button className="px-6 py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest">Full_Expand</button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                 <span className="text-[9px] font-mono text-slate-600 uppercase tracking-tighter">Checksum: {Math.random().toString(16).substring(2, 8).toUpperCase()}</span>
                 <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${
                   art.type === 'code' ? 'border-purple-500/20 text-purple-400' : 
                   art.type === 'json' ? 'border-blue-500/20 text-blue-400' : 'border-slate-500/20 text-slate-500'
                 }`}>
                   Mime: {art.type}
                 </div>
              </div>
            </div>
          ))}

          {filteredArtifacts.length === 0 && (
            <div className="col-span-3 py-40 flex flex-col items-center justify-center opacity-40">
               <Hash size={80} className="text-slate-800 mb-6" />
               <p className="text-xs font-black text-slate-600 uppercase tracking-[0.5em]">No_Artifacts_Indexed</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtifactRepository;
