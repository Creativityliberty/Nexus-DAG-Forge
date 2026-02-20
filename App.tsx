
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  Plus, Sparkles, Trash2, Play, CheckCircle2, X, Terminal, Activity, Workflow,
  Layers, Loader2, Download, MousePointer2, MessageSquare, Box, Cloud, Zap, 
  Info, Check, LayoutGrid, User, Wand2, Pause, AlertTriangle, 
  Globe, ClipboardList, Package, Sun, Moon, Menu, Link as LinkIcon, BrainCircuit, FileText, Send
} from 'lucide-react';
import { Task, TaskStatus, Artifact } from './types';
import DAGVisualizer from './components/DAGVisualizer';
import NeuralBoard from './components/NeuralBoard';
import MissionRecap from './components/MissionRecap';
import ArtifactRepository from './components/ArtifactRepository';
import NeuralTerminal from './components/NeuralTerminal';
import AgentChatOverlay from './components/AgentChatOverlay';
// Fix: Removed enhanceTask as it is not exported from geminiService.ts
import { generateWorkflow, optimizeWorkflow, quickRefine, generateMissionReport, generateNodeDocs } from './services/geminiService';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('nexus_theme') as any) || 'dark');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'flow' | 'board' | 'recap' | 'artifacts'>('flow');
  const [lassoEnabled, setLassoEnabled] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isGeneratingDocs, setIsGeneratingDocs] = useState(false);
  const [missionReport, setMissionReport] = useState<string>('');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);
  
  const [logs, setLogs] = useState<any[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [terminalExpanded, setTerminalExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const stats = useMemo(() => ({
    total: tasks.length,
    active: tasks.filter(t => t.status === TaskStatus.RUNNING).length,
    completed: tasks.filter(t => t.status === TaskStatus.DONE).length,
    efficiency: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === TaskStatus.DONE).length / tasks.length) * 100) : 0
  }), [tasks]);

  const primarySelectedTask = useMemo(() => tasks.find(t => t.id === selectedTaskIds[0]) || null, [tasks, selectedTaskIds]);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSelectTask = useCallback((task: Task, isMultiSelect: boolean) => {
    setSelectedTaskIds(prev => {
      if (isMultiSelect) {
        return prev.includes(task.id) ? prev.filter(id => id !== task.id) : [...prev, task.id];
      }
      return [task.id];
    });
    if (!isMultiSelect) setIsSidebarOpen(true);
  }, []);

  const handleUpdateStatus = useCallback((taskId: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status, lastUpdated: new Date().toISOString() } : t));
    showNotification(`Node ${taskId} updated to ${status}`, 'success');
  }, []);

  const handleBulkUpdateStatus = useCallback((status: TaskStatus) => {
    setTasks(prev => prev.map(t => selectedTaskIds.includes(t.id) ? { ...t, status, lastUpdated: new Date().toISOString() } : t));
    showNotification(`${selectedTaskIds.length} nodes updated`, 'success');
  }, [selectedTaskIds]);

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('nexus_theme', theme);
  }, [theme]);

  const handleGenerateAI = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    showNotification('Gemini 3 synthesizing neural topology...', 'info');
    try {
      const newTasks = await generateWorkflow(prompt);
      if (newTasks.length > 0) {
        setTasks(newTasks);
        setSelectedTaskIds([]);
        setIsSidebarOpen(false);
        const report = await generateMissionReport(newTasks, prompt);
        setMissionReport(report);
      }
    } catch (err) { 
      showNotification('Synthesis interruption: check connectivity', 'error'); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  const handleOptimize = async () => {
    if (tasks.length === 0) return;
    setIsOptimizing(true);
    showNotification('Lead Architect auditing topology...', 'info');
    try {
      const optimized = await optimizeWorkflow(tasks);
      if (optimized.length > 0) {
        setTasks(optimized);
        showNotification('Workflow optimized for maximum throughput', 'success');
        const report = await generateMissionReport(optimized, prompt);
        setMissionReport(report);
      }
    } catch (e) { 
      showNotification('Optimization bypass engaged due to error', 'error'); 
    } finally { 
      setIsOptimizing(false); 
    }
  };

  const handleGenerateDocs = async () => {
    if (!primarySelectedTask) return;
    setIsGeneratingDocs(true);
    showNotification('Drafting technical specification...', 'info');
    try {
      const docs = await generateNodeDocs(primarySelectedTask);
      const newArtifact: Artifact = {
        id: `DOC-${Date.now()}`,
        type: 'code',
        label: `${primarySelectedTask.id}_Spec.md`,
        content: docs
      };
      setTasks(tasks.map(t => t.id === primarySelectedTask.id ? { 
        ...t, 
        artifacts: [...(t.artifacts || []), newArtifact] 
      } : t));
      showNotification('Technical Spec archived to repository', 'success');
    } catch (e) {
      showNotification('Documentation stream failure', 'error');
    } finally {
      setIsGeneratingDocs(false);
    }
  };

  // Mock logging for immersion
  useEffect(() => {
    const interval = setInterval(() => {
      if (tasks.length === 0) return;
      const t = tasks[Math.floor(Math.random() * tasks.length)];
      const types: any[] = ['INFO', 'SYNC', 'PACKET'];
      const messages = [
        `Syncing weights for ${t.id}`,
        `Packet received from uplink_${Math.floor(Math.random()*10)}`,
        `Handshake validated for node ${t.owner}`,
        `Latency stabilized at ${Math.floor(Math.random()*20)}ms`
      ];
      setLogs(prev => [{
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString().split(' ')[0],
        type: types[Math.floor(Math.random() * types.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        source: t.owner || 'System'
      }, ...prev].slice(0, 50));
    }, 5000);
    return () => clearInterval(interval);
  }, [tasks]);

  const isDark = theme === 'dark';
  const themeClasses = isDark ? 'bg-[#020617] text-slate-200' : 'bg-slate-50 text-slate-900';
  const textContrast = isDark ? 'text-white' : 'text-slate-900';

  return (
    <div className={`flex h-screen overflow-hidden font-sans relative transition-colors duration-500 ${themeClasses}`}>
      {/* Background decoration */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${isDark ? 'opacity-40' : 'opacity-10'} bg-[radial-gradient(circle_at_50%_50%,#3b82f633_0%,transparent_70%)]`}></div>
      
      {/* Navigation Rail */}
      <nav className={`fixed lg:relative inset-y-0 left-0 w-20 border-r border-slate-500/10 flex flex-col items-center py-8 gap-8 z-[450] glass-heavy transition-transform duration-300 ${isNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]"><Workflow size={24} className="text-white" /></div>
        <div className="flex flex-col gap-5">
          {[
            { mode: 'flow', icon: Layers, label: 'Flow' },
            { mode: 'board', icon: LayoutGrid, label: 'Board' },
            { mode: 'recap', icon: ClipboardList, label: 'Recap' },
            { mode: 'artifacts', icon: Package, label: 'Registry' }
          ].map(item => (
            <button 
              key={item.mode} 
              onClick={() => setViewMode(item.mode as any)} 
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all group relative ${viewMode === item.mode ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-500/10'}`}
              title={item.label}
            >
              <item.icon size={20} />
            </button>
          ))}
          <div className="w-8 h-px bg-slate-500/10 my-2"></div>
          <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-500/10 transition-all">{isDark ? <Moon size={20} /> : <Sun size={20} />}</button>
        </div>
        <div className="mt-auto flex flex-col gap-5">
           <button onClick={() => setLassoEnabled(!lassoEnabled)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${lassoEnabled ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-500/10'}`} title="Selection Lasso"><MousePointer2 size={20} /></button>
           <button onClick={() => {setTasks([]); setSelectedTaskIds([]); setMissionReport('');}} className="w-12 h-12 rounded-xl bg-slate-500/10 text-slate-500 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all" title="Reset Core"><Trash2 size={20} /></button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-6 gap-6 min-w-0 relative z-10 overflow-hidden">
        {/* Modern Header */}
        <header className="h-24 glass-heavy rounded-[2.5rem] px-10 flex items-center justify-between border border-slate-500/10 shadow-2xl relative">
          <button className="lg:hidden p-3 mr-4 rounded-xl bg-slate-500/10 text-slate-500" onClick={() => setIsNavOpen(true)}><Menu size={24} /></button>
          <div className="flex items-center gap-10 flex-1 min-w-0">
            <div className="flex flex-col shrink-0">
              <h1 className={`font-extrabold text-3xl tracking-tighter italic leading-none transition-colors ${textContrast}`}>NEXUS_FORGE <span className="text-blue-600">v2</span></h1>
              <p className="text-[10px] font-bold text-blue-500/60 uppercase mt-1 tracking-[0.2em] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> SYSTEM_ONLINE
              </p>
            </div>
            <div className="hidden sm:block h-10 w-px bg-slate-500/10 mx-2"></div>
            <div className="hidden xs:flex gap-12 items-center shrink-0">
              <div className="text-center"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Efficiency</p><p className={`text-2xl font-mono font-black leading-none ${stats.efficiency > 70 ? 'text-green-500' : 'text-blue-500'}`}>{stats.efficiency}%</p></div>
              <div className="text-center"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Registry</p><p className={`text-2xl font-mono font-black leading-none ${textContrast}`}>{stats.total}</p></div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={handleOptimize} disabled={isOptimizing || tasks.length === 0} className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest border ${isDark ? 'bg-purple-600/10 text-purple-400 border-purple-500/20' : 'bg-purple-50 text-purple-600 border-purple-200'} hover:scale-105 active:scale-95 disabled:opacity-40`}>
                {isOptimizing ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={18} />} Brain_Audit
             </button>
             <button onClick={() => showNotification('Core Deployment Initialized', 'info')} className="px-8 py-3.5 rounded-2xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-[0_8px_20px_rgba(59,130,246,0.3)] hover:bg-blue-500 hover:shadow-blue-500/50">
                <Globe size={18} /> DEPLOY
             </button>
          </div>
        </header>

        {/* Viewport View */}
        <div className="flex-1 flex flex-col gap-6 min-h-0 overflow-hidden relative">
          <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
            {viewMode === 'flow' && <DAGVisualizer tasks={tasks} onSelectTask={handleSelectTask} selectedTaskIds={selectedTaskIds} lassoEnabled={lassoEnabled} theme={theme} />}
            {viewMode === 'board' && <NeuralBoard tasks={tasks} onSelectTask={handleSelectTask} theme={theme} />}
            {viewMode === 'recap' && <MissionRecap tasks={tasks} originalPrompt={prompt} theme={theme} aiReport={missionReport} />}
            {viewMode === 'artifacts' && <ArtifactRepository tasks={tasks} theme={theme} />}
          </div>
          
          {/* Bottom Terminal Section */}
          <div className={`shrink-0 transition-all duration-700 ${terminalExpanded ? 'h-[400px]' : 'h-14'}`}>
             <div className="flex h-full flex-col relative">
               <div className="absolute -top-10 right-6 z-20">
                 <button onClick={() => setTerminalExpanded(!terminalExpanded)} className={`px-5 py-2 rounded-t-2xl glass-heavy border-t border-x border-slate-500/10 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-600'} hover:text-blue-500 transition-all`}>
                   {terminalExpanded ? 'Minimize_Console' : 'System_Console'}
                 </button>
               </div>
               <div className="flex-1 overflow-hidden">
                 <NeuralTerminal logs={logs} theme={theme} />
               </div>
             </div>
          </div>

          {/* AI Generation Prompt Bar (Floating) */}
          {selectedTaskIds.length === 0 && viewMode === 'flow' && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[50] w-full max-w-2xl px-4 animate-in slide-in-from-bottom-10 duration-700">
                <div className="glass-heavy rounded-[2.5rem] p-4 border border-blue-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-end gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                      <Zap size={20} className="text-blue-500" />
                    </div>
                    <textarea 
                      ref={textareaRef}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerateAI(); } }}
                      placeholder="Synthesize new orchestration blueprint..."
                      className={`flex-1 bg-transparent border-none outline-none text-base font-bold px-2 py-2 placeholder:text-slate-500 resize-none min-h-[44px] max-h-[120px] no-scrollbar leading-relaxed ${textContrast}`}
                    />
                    <button 
                      onClick={handleGenerateAI} 
                      disabled={isGenerating || !prompt.trim()} 
                      className={`h-12 px-8 bg-blue-600 rounded-2xl text-white font-black uppercase text-[11px] tracking-widest hover:bg-blue-500 flex items-center gap-3 shadow-lg disabled:opacity-40 shrink-0 transform transition-all active:scale-95`}
                    >
                       {isGenerating ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16} />} <span>SYNTHESIZE</span>
                    </button>
                </div>
            </div>
          )}

          {/* Context Actions Bar (Selection) */}
          {selectedTaskIds.length > 0 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-8 duration-500 w-full max-w-max px-4">
              <footer className="h-20 glass-heavy rounded-3xl border border-blue-500/40 flex items-center px-10 gap-8 shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
                <div className="flex items-center gap-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
                   <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{selectedTaskIds.length} Nodes Selected</span>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => handleBulkUpdateStatus(TaskStatus.RUNNING)} className="px-5 py-2.5 rounded-xl bg-blue-600/10 text-blue-500 border border-blue-500/20 flex items-center gap-2 text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all"><Play size={14} fill="currentColor" /> Play</button>
                  <button onClick={() => handleBulkUpdateStatus(TaskStatus.DONE)} className="px-5 py-2.5 rounded-xl bg-green-600/10 text-green-600 border border-green-500/20 flex items-center gap-2 text-[10px] font-black uppercase hover:bg-green-600 hover:text-white transition-all"><Check size={14} /> Commit</button>
                </div>
                <div className="w-px h-8 bg-slate-500/20"></div>
                <button onClick={() => { setTasks(tasks.filter(t => !selectedTaskIds.includes(t.id))); setSelectedTaskIds([]); }} className="p-3 rounded-xl hover:bg-red-500 text-white transition-all" title="Purge Selection"><Trash2 size={20} /></button>
                <button onClick={() => setSelectedTaskIds([])} className="p-3 rounded-xl hover:bg-slate-500/20 text-slate-500 transition-all"><X size={20} /></button>
              </footer>
            </div>
          )}
        </div>
      </main>

      {/* Sidebar - Precise Node Analytics */}
      <aside className={`fixed inset-y-0 right-0 w-full md:max-w-[550px] lg:max-w-[650px] glass-heavy border-l border-slate-500/10 z-[500] transform transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-[-20px_0_50px_rgba(0,0,0,0.3)] flex flex-col ${isSidebarOpen && selectedTaskIds.length === 1 ? 'translate-x-0' : 'translate-x-full'}`}>
        {primarySelectedTask && (
          <div className="h-full flex flex-col min-h-0">
            <div className={`p-10 border-b border-slate-500/10 flex justify-between items-center ${isDark ? 'bg-slate-900/40' : 'bg-slate-100/40'} shrink-0`}>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600 text-white flex items-center justify-center shadow-[0_10px_20px_rgba(59,130,246,0.3)]"><Box size={32}/></div>
                <div>
                   <h2 className={`text-3xl font-black italic tracking-tighter uppercase leading-none ${textContrast}`}>Node_Analysis</h2>
                   <p className="text-[10px] font-mono text-slate-500 uppercase mt-2 font-bold tracking-[0.2em]">{primarySelectedTask.id}</p>
                </div>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className={`w-12 h-12 rounded-2xl ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-200'} text-slate-500 flex items-center justify-center transition-all`}><X size={28}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 space-y-12 no-scrollbar scroll-smooth">
              <section className="space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/10 border border-blue-500/20"><User size={14} className="text-blue-500" /><span className="text-[11px] font-black text-blue-500 uppercase tracking-widest">{primarySelectedTask.owner || 'ORCHESTRATOR'}</span></div>
                  <button onClick={() => setIsChatOpen(true)} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-green-600/10 border border-green-500/20 text-green-600 text-[10px] font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all shadow-sm"><MessageSquare size={14} /> Agent_Link</button>
                  <button onClick={handleGenerateDocs} disabled={isGeneratingDocs} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isDark ? 'bg-blue-600/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200'} hover:scale-105 active:scale-95`}>
                     {isGeneratingDocs ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} Node_Spec
                  </button>
                </div>
                <h3 className={`text-5xl font-black tracking-tighter uppercase italic leading-[1.1] ${textContrast}`}>{primarySelectedTask.title}</h3>
                <div className={`text-lg leading-relaxed font-medium p-10 rounded-[2rem] border transition-all ${isDark ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-700 shadow-inner'}`}>
                  {primarySelectedTask.description}
                </div>
              </section>

              {/* Status Section */}
              <section className="space-y-6">
                 <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3"><Zap size={16} className="text-blue-500" /> Operational_Execution</h4>
                 <div className="grid grid-cols-4 gap-4">
                    {[ 
                      { s: TaskStatus.RUNNING, l: 'Start', i: Play, c: 'text-blue-500' }, 
                      { s: TaskStatus.DONE, l: 'Commit', i: Check, c: 'text-green-500' }, 
                      { s: TaskStatus.FAILED, l: 'Halt', i: AlertTriangle, c: 'text-red-500' }, 
                      { s: TaskStatus.PENDING, l: 'Wait', i: Pause, c: 'text-slate-500' }
                    ].map(btn => (
                      <button 
                        key={btn.l} 
                        onClick={() => handleUpdateStatus(primarySelectedTask.id, btn.s)} 
                        className={`flex flex-col items-center gap-3 p-5 rounded-[1.8rem] border transition-all group ${primarySelectedTask.status === btn.s ? `border-current ${btn.c} bg-current/10 shadow-lg` : 'border-slate-500/10 text-slate-500 hover:border-slate-400'}`}
                      >
                        <btn.i size={24} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-black uppercase tracking-widest">{btn.l}</span>
                      </button>
                    ))}
                 </div>
              </section>

              {/* Subtasks Section */}
              {primarySelectedTask.subtasks && primarySelectedTask.subtasks.length > 0 && (
                <section className="space-y-6">
                  <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3"><Activity size={16} className="text-purple-500" /> Neural_Steps</h4>
                  <div className="space-y-3">
                    {primarySelectedTask.subtasks.map((st, i) => (
                      <div 
                        key={st.id} 
                        className={`p-5 rounded-2xl border flex items-center justify-between group transition-all ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'}`}
                      >
                         <div className="flex items-center gap-4">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${st.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-500/30 text-transparent'}`}>
                               <Check size={12} strokeWidth={4} />
                            </div>
                            <span className={`text-[13px] font-bold ${st.completed ? 'text-slate-500 line-through' : textContrast}`}>{st.title}</span>
                         </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Dependency Map */}
              <section className="space-y-6">
                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3"><LinkIcon size={16} className="text-blue-500" /> Logic_Flow</h4>
                <div className="space-y-3">
                   {primarySelectedTask.dependencies.length > 0 ? (
                      primarySelectedTask.dependencies.map(depId => {
                         const dep = tasks.find(t => t.id === depId);
                         return (
                           <div key={depId} className={`p-5 rounded-[1.5rem] border flex justify-between items-center group ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                              <div className="flex items-center gap-4 overflow-hidden">
                                 <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/10 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                    <Activity size={18} />
                                 </div>
                                 <div className="truncate">
                                    <span className={`text-[13px] font-black uppercase truncate block ${textContrast}`}>{dep?.title || depId}</span>
                                    <span className="text-[9px] font-mono text-slate-500 uppercase">Input_Node</span>
                                 </div>
                              </div>
                              <span className={`text-[9px] font-black px-3 py-1 rounded-full ${dep?.status === TaskStatus.DONE ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'}`}>{dep?.status || 'UNKNOWN'}</span>
                           </div>
                         );
                      })
                   ) : ( 
                     <div className="p-10 border-2 border-dashed border-slate-500/10 rounded-[2rem] text-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase opacity-30 tracking-[0.3em]">ROOT_INITIATOR</span>
                     </div> 
                   )}
                </div>
              </section>
            </div>
          </div>
        )}
      </aside>

      {/* Floating Overlays */}
      {isChatOpen && primarySelectedTask && (
        <AgentChatOverlay 
          task={primarySelectedTask} 
          onClose={() => setIsChatOpen(false)} 
          theme={theme}
        />
      )}
      
      {/* Background Dimmer */}
      {(isSidebarOpen && selectedTaskIds.length === 1) && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-[4px] z-[480] animate-in fade-in duration-700" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}
      
      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-32 right-10 z-[600] animate-in slide-in-from-right-10 fade-in duration-500">
          <div className={`px-6 py-4 rounded-2xl glass-heavy border shadow-2xl flex items-center gap-4 ${
            notification.type === 'success' ? 'border-green-500/40 text-green-500' : 
            notification.type === 'error' ? 'border-red-500/40 text-red-500' : 'border-blue-500/40 text-blue-500'
          }`}>
             {notification.type === 'success' ? <CheckCircle2 size={20} /> : <Info size={20} />}
             <div className="flex flex-col">
               <span className="text-[9px] font-black uppercase tracking-widest opacity-60">System_Feedback</span>
               <span className="text-[11px] font-bold uppercase tracking-tight">{notification.message}</span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
