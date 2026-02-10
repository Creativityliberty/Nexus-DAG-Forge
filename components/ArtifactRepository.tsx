
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
  Filter,
  X,
  Maximize2
} from 'lucide-react';

interface ArtifactRepositoryProps {
  tasks: Task[];
}

const ArtifactRepository: React.FC<ArtifactRepositoryProps> = ({ tasks }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'code' | 'log' | 'json' | 'link'>('all');
  const [expandedArtifact, setExpandedArtifact] = useState<(Artifact & { parentTask: string, parentId: string }) | null>(null);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast here if needed
  };

  return (
    <div className="flex-1 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtifacts.map((art, idx) => (
            <div key={`${art.id}-${idx}`} className="glass-heavy rounded-[2.5rem] border border-white/5 p-8 flex flex-col gap-6 group hover:border-blue-500/40 transition-all shadow-xl hover:-translate-y-1">
              <div className="flex justify-between items-start">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                      {art.type === 'code' ? <FileCode size={20}/> : 
                       art.type === 'json' ? <Database size={20}/> : <Terminal size={20}/>}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-[10px] font-black text-white uppercase tracking-widest truncate">{art.label}</h4>
                      <p className="text-[8px] font-mono text-slate-500 uppercase mt-1 truncate">{art.parentId} // {art.parentTask}</p>
                    </div>
                 </div>
                 <div className="flex gap-1">
                    <button onClick={() => copyToClipboard(art.content)} className="p-2.5 rounded-xl hover:bg-white/5 text-slate-500 transition-colors" title="Copy Content"><Copy size={14}/></button>
                    <button className="p-2.5 rounded-xl hover:bg-white/5 text-slate-500 transition-colors" title="Download"><Download size={14}/></button>
                 </div>
              </div>
              
              <div className="flex-1 bg-black/40 rounded-3xl p-6 font-mono text-[11px] text-slate-400 overflow-hidden relative group/code h-48">
                <pre className="line-clamp-6 leading-relaxed whitespace-pre-wrap">{art.content}</pre>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover/code:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                   <button 
                    onClick={() => setExpandedArtifact(art)}
                    className="px-6 py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl hover:scale-105 transition-transform"
                   >
                    <Maximize2 size={12} /> Full_Expand
                   </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                 <span className="text-[9px] font-mono text-slate-600 uppercase tracking-tighter">Checksum: {Math.random().toString(16).substring(2, 8).toUpperCase()}</span>
                 <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${
                   art.type === 'code' ? 'border-purple-500/20 text-purple-400' : 
                   art.type === 'json' ? 'border-blue-500/20 text-blue-400' : 'border-slate-500/20 text-slate-500'
                 }`}>
                   {art.type}
                 </div>
              </div>
            </div>
          ))}

          {filteredArtifacts.length === 0 && (
            <div className="col-span-full py-40 flex flex-col items-center justify-center opacity-40">
               <Hash size={80} className="text-slate-800 mb-6" />
               <p className="text-xs font-black text-slate-600 uppercase tracking-[0.5em]">No_Artifacts_Indexed</p>
            </div>
          )}
        </div>
      </div>

      {/* Full Expand Modal */}
      {expandedArtifact && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-12 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div 
             className="max-w-6xl w-full h-full glass-heavy rounded-[3rem] border border-blue-500/30 shadow-[0_0_100px_rgba(37,99,235,0.2)] flex flex-col overflow-hidden"
             onClick={(e) => e.stopPropagation()}
           >
              {/* Modal Header */}
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/40">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600/10 text-blue-500 flex items-center justify-center border border-blue-500/20 shadow-inner">
                    {expandedArtifact.type === 'code' ? <FileCode size={32}/> : 
                     expandedArtifact.type === 'json' ? <Database size={32}/> : <Terminal size={32}/>}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">{expandedArtifact.label}</h2>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mt-1">
                      Module: {expandedArtifact.parentTask} // ID: {expandedArtifact.parentId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => copyToClipboard(expandedArtifact.content)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-blue-500/40 transition-all"
                  >
                    <Copy size={14} /> Copy_Source
                  </button>
                  <button 
                    onClick={() => setExpandedArtifact(null)}
                    className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-auto p-12 bg-black/40 custom-scrollbar relative">
                <div className="absolute top-8 left-8 text-[8px] font-mono text-slate-700 pointer-events-none select-none uppercase tracking-widest">
                  Neural_Stream_Live // Buffer_Read_Status_OK
                </div>
                <pre className="font-mono text-sm text-slate-300 leading-relaxed whitespace-pre p-4 selection:bg-blue-500/30 selection:text-white">
                  {expandedArtifact.content}
                </pre>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/5 bg-slate-900/40 flex justify-between items-center px-12">
                 <div className="flex gap-8">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-600 uppercase">Mime_Type</span>
                      <span className="text-[11px] font-mono text-blue-400">application/{expandedArtifact.type}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-600 uppercase">File_Size</span>
                      <span className="text-[11px] font-mono text-blue-400">{(expandedArtifact.content.length / 1024).toFixed(2)} KB</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-600 uppercase">Status</span>
                      <span className="text-[11px] font-mono text-green-400">VERIFIED_SECURE</span>
                    </div>
                 </div>
                 <button className="px-8 py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl">
                   <Download size={14} /> Commit_To_Local_Registry
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ArtifactRepository;
