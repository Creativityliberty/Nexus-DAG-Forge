
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  Plus, Sparkles, Trash2, Play, CheckCircle2, AlertCircle, X, Terminal, Settings, Activity, Workflow,
  Command, ArrowUpRight, Layers, Loader2, Cpu, Layers2, History, Download, MousePointer2, MessageSquare,
  Clock, ChevronRight, FileCode, Box, Cloud, Database, Zap, Info, Check, LayoutGrid, ShieldAlert,
  BarChart3, User, Send, Hash, Save, FolderOpen, Wand2, Monitor, Layout, Pause, AlertTriangle, ShieldCheck,
  Search, ExternalLink, Globe, HardDrive, FileText, ClipboardList, Package, Share2, FileType
} from 'lucide-react';
import { Task, TaskStatus, SubTask, PriorityLevel, TaskComment, Artifact } from './types';
import DAGVisualizer from './components/DAGVisualizer';
import NeuralBoard from './components/NeuralBoard';
import MissionRecap from './components/MissionRecap';
import ArtifactRepository from './components/ArtifactRepository';
import { generateWorkflow, enhanceTask, generateSubtasks } from './services/geminiService';

const AGENTS = ['DevOps_Agent_01', 'Security_Kernel_X', 'Orchestrator_Node', 'Logic_Synthesizer'];

const INITIAL_TASKS: Task[] = [
  {
    id: 'T-001',
    title: 'Cloud Edge Ingestion',
    description: 'High-throughput stream processing from distributed edge sensors with neural filtering.',
    status: TaskStatus.DONE,
    dependencies: [],
    owner: 'DevOps_Agent_01',
    priority: 'HIGH',
    subtasks: [
      { id: 'S1', title: 'Initialize socket handshake', completed: true },
      { id: 'S2', title: 'Allocate buffer pool', completed: true }
    ],
    artifacts: [
      { id: 'A1', type: 'code', label: 'Ingestion_Script.ts', content: 'const stream = connectToSensor("0x44");\nstream.pipe(buffer);' }
    ],
    comments: [{ id: 'C-INIT', author: 'System', text: 'Pipeline synchronized.', timestamp: '1h ago' }]
  },
  {
    id: 'T-002',
    title: 'Semantic Field Mapping',
    description: 'Real-time schema enforcement using weight-based validation.',
    status: TaskStatus.RUNNING,
    dependencies: ['T-001'],
    owner: 'Orchestrator_Node',
    priority: 'MEDIUM',
    subtasks: [
      { id: 'S3', title: 'JSON Schema Validation', completed: true },
      { id: 'S4', title: 'Field Normalization', completed: false }
    ],
    artifacts: [
      { id: 'A2', type: 'json', label: 'Neural_Schema.json', content: '{"weights": [0.1, 0.44, 0.99]}' }
    ],
    comments: [{ id: 'C1', author: 'System', text: 'Processing batch #4401...', timestamp: '2m ago' }]
  }
];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [history, setHistory] = useState<Task[][]>([INITIAL_TASKS]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('Neural edge computing pipeline for decentralized AI inference.');
  const [newCommentText, setNewCommentText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [viewMode, setViewMode] = useState<'flow' | 'board' | 'recap' | 'artifacts'>('flow');
  const [lassoEnabled, setLassoEnabled] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState(0);
  const [isEnhancingSidebar, setIsEnhancingSidebar] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const stats = useMemo(() => ({
    total: tasks.length,
    active: tasks.filter(t => t.status === TaskStatus.RUNNING).length,
    pending: tasks.filter(t => t.status === TaskStatus.PENDING).length,
    critical: tasks.filter(t => t.priority === 'HIGH').length,
  }), [tasks]);

  const selectedTasks = useMemo(() => tasks.filter(t => selectedTaskIds.includes(t.id)), [tasks, selectedTaskIds]);
  const primarySelectedTask = useMemo(() => selectedTasks.length === 1 ? selectedTasks[0] : null, [selectedTasks]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(60, Math.min(textareaRef.current.scrollHeight, 250))}px`;
    }
  }, [prompt]);

  const pushToHistory = useCallback((newTasks: Task[]) => {
    setHistory(prev => {
      const next = prev.slice(0, historyIndex + 1);
      const updatedHistory = [...next, newTasks].slice(-20);
      setHistoryIndex(updatedHistory.length - 1);
      return updatedHistory;
    });
  }, [historyIndex]);

  const handleUpdateStatus = (id: string, newStatus: TaskStatus) => {
    const next = tasks.map(t => t.id === id ? { ...t, status: newStatus } : t);
    setTasks(next);
    pushToHistory(next);
    setNotification({ message: `Node ${id} state: ${newStatus}`, type: 'info' });
  };

  const handleBulkUpdateStatus = (newStatus: TaskStatus) => {
    const next = tasks.map(t => selectedTaskIds.includes(t.id) ? { ...t, status: newStatus } : t);
    setTasks(next);
    pushToHistory(next);
    setNotification({ message: `${selectedTaskIds.length} nodes shifted to ${newStatus}`, type: 'success' });
  };

  const handleCycleAgent = () => {
    if (!primarySelectedTask) return;
    const currentIdx = AGENTS.indexOf(primarySelectedTask.owner || '');
    const nextAgent = AGENTS[(currentIdx + 1) % AGENTS.length];
    const next = tasks.map(t => t.id === primarySelectedTask.id ? { ...t, owner: nextAgent } : t);
    setTasks(next);
    pushToHistory(next);
  };

  const handleDeploy = () => {
    if (isDeploying) return;
    setIsDeploying(true);
    setDeployStep(0);
    const interval = setInterval(() => {
      setDeployStep(prev => {
        if (prev >= 4) {
          clearInterval(interval);
          setTimeout(() => {
            setIsDeploying(false);
            setNotification({ message: 'Global Deployment Successful', type: 'success' });
          }, 1500);
          return 4;
        }
        return prev + 1;
      });
    }, 1200);
  };

  const handleGenerateAI = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const newTasks = await generateWorkflow(prompt);
      if (newTasks.length > 0) {
        setTasks(newTasks);
        pushToHistory(newTasks);
        setSelectedTaskIds([]);
        setIsSidebarOpen(false);
      }
    } catch (err) {
      setNotification({ message: 'Synthesis Error', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEnhanceSelectedTask = async () => {
    if (!primarySelectedTask) return;
    setIsEnhancingSidebar(true);
    try {
      const enhanced = await enhanceTask({ title: primarySelectedTask.title, description: primarySelectedTask.description });
      const next = tasks.map(t => t.id === primarySelectedTask.id ? { ...t, ...enhanced } : t);
      setTasks(next);
      pushToHistory(next);
    } finally {
      setIsEnhancingSidebar(false);
    }
  };

  const handleSelectTask = useCallback((task: Task, isMultiSelect: boolean) => {
    if (isMultiSelect) {
      setSelectedTaskIds(prev => 
        prev.includes(task.id) ? prev.filter(id => id !== task.id) : [...prev, task.id]
      );
    } else {
      setSelectedTaskIds([task.id]);
      setIsSidebarOpen(true);
    }
  }, []);

  const handleSaveWorkflow = useCallback(() => {
    localStorage.setItem('nexus_forge_workflow', JSON.stringify(tasks));
    setNotification({ message: 'Topology Snapshot Saved', type: 'success' });
  }, [tasks]);

  const handleLoadWorkflow = useCallback(() => {
    const saved = localStorage.getItem('nexus_forge_workflow');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTasks(parsed);
        pushToHistory(parsed);
        setNotification({ message: 'Topology Snapshot Loaded', type: 'success' });
      } catch (e) {
        setNotification({ message: 'Load Error', type: 'error' });
      }
    }
  }, [pushToHistory]);

  const exportMission = (format: 'json' | 'pdf' | 'img' | 'ld') => {
    const data = {
      mission: prompt,
      timestamp: new Date().toISOString(),
      tasks,
      stats: {
        effectiveness: Math.round((tasks.filter(t => t.status === TaskStatus.DONE).length / tasks.length) * 100),
        totalTasks: tasks.length
      }
    };

    if (format === 'json' || format === 'ld') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nexus_mission_${Date.now()}.${format}`;
      link.click();
    } else {
      // Placeholder for PDF/IMG exports as they usually require complex libs like jspdf/html2canvas
      window.print();
    }
    setNotification({ message: `Exporting as ${format.toUpperCase()}...`, type: 'info' });
    setIsExportMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#0f172a_0%,#020617_100%)] pointer-events-none"></div>
      
      {notification && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4 fade-in duration-500">
           <div className={`px-6 py-3 rounded-2xl glass-heavy border shadow-2xl flex items-center gap-4 ${
             notification.type === 'success' ? 'border-green-500/40 text-green-400' : 
             notification.type === 'error' ? 'border-red-500/40 text-red-400' : 'border-blue-500/40 text-blue-400'
           }`}>
              <Info size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">{notification.message}</span>
           </div>
        </div>
      )}

      {/* Deployment Modal Overlay */}
      {isDeploying && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/90 backdrop-blur-3xl animate-in fade-in duration-500">
           <div className="max-w-xl w-full p-12 glass-heavy rounded-[3rem] border border-blue-500/30 shadow-[0_0_100px_rgba(37,99,235,0.2)]">
              <div className="flex flex-col items-center gap-8 text-center">
                 <div className="w-24 h-24 rounded-full bg-blue-600/10 border border-blue-500/30 flex items-center justify-center">
                    <Cloud size={48} className="text-blue-500 animate-pulse" />
                 </div>
                 <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Initializing_Deploy</h2>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-2">Synapse_Link_Orchestration</p>
                 </div>
                 <div className="w-full space-y-4">
                    {[
                      { l: 'Building Artifacts', s: deployStep >= 1 },
                      { l: 'Provisioning Infrastructure', s: deployStep >= 2 },
                      { l: 'Syncing Data Nodes', s: deployStep >= 3 },
                      { l: 'Final Validation', s: deployStep >= 4 }
                    ].map((step, i) => (
                      <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${step.s ? 'bg-blue-600/10 border-blue-500/40 text-white' : 'border-white/5 text-slate-600'}`}>
                        {step.s ? <CheckCircle2 size={16} className="text-blue-500" /> : <div className="w-4 h-4 rounded-full border border-current" />}
                        <span className="text-xs font-black uppercase tracking-widest">{step.l}</span>
                      </div>
                    ))}
                 </div>
                 {deployStep < 4 && <Loader2 className="animate-spin text-blue-500 mt-4" size={32} />}
              </div>
           </div>
        </div>
      )}

      {/* Navigation Rail */}
      <nav className="w-20 border-r border-white/5 flex flex-col items-center py-8 gap-8 relative z-50 glass-heavy">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)] relative">
          <Workflow size={24} className="text-white" />
        </div>
        <div className="flex flex-col gap-5">
          {[
            { mode: 'flow', icon: Layers, label: 'FLOW' },
            { mode: 'board', icon: LayoutGrid, label: 'BOARD' },
            { mode: 'recap', icon: ClipboardList, label: 'RECAP' },
            { mode: 'artifacts', icon: Package, label: 'ARTIFACTS' }
          ].map(item => (
            <button 
              key={item.mode} 
              onClick={() => setViewMode(item.mode as any)} 
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all group relative ${viewMode === item.mode ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              <item.icon size={20} />
              <div className="absolute left-16 bg-slate-900 border border-white/10 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest invisible group-hover:visible whitespace-nowrap z-50 shadow-2xl">
                {item.label}_VIEW
              </div>
            </button>
          ))}
          <div className="w-8 h-px bg-white/5 my-2"></div>
          <button className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-500 hover:text-white transition-all"><Database size={20} /></button>
          <button className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-500 hover:text-white transition-all"><Settings size={20} /></button>
        </div>
        <div className="mt-auto space-y-4">
           <button onClick={() => setLassoEnabled(!lassoEnabled)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${lassoEnabled ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40' : 'text-slate-500 hover:text-white'}`} title="Lasso Selection">
             <MousePointer2 size={20} />
           </button>
           <button onClick={() => setIsCreatingTask(true)} className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white hover:scale-105 transition-all shadow-lg">
             <Plus size={24} />
           </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col p-6 gap-6 min-w-0 relative z-10">
        <header className="h-24 glass-heavy rounded-[2.5rem] px-10 flex items-center justify-between border border-white/5 shadow-2xl">
          <div className="flex items-center gap-10">
            <div>
              <h1 className="font-black text-3xl tracking-tighter text-white italic">NEXUS_FORGE</h1>
              <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.5em] mt-1">Status: SYNAPSE_LINK_ACTIVE</p>
            </div>
            <div className="hidden lg:flex gap-10 items-center">
              <div className="w-px h-10 bg-white/10 mx-2"></div>
              <div className="flex gap-8">
                 <div className="text-center"><p className="text-[8px] font-black text-slate-500 uppercase">Success_Rate</p><p className="text-xl font-mono font-bold text-blue-400">{Math.round((tasks.filter(t => t.status === TaskStatus.DONE).length / tasks.length) * 100)}%</p></div>
                 <div className="text-center"><p className="text-[8px] font-black text-slate-500 uppercase">Critical</p><p className="text-xl font-mono font-bold text-red-400">{stats.critical}</p></div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <button onClick={handleSaveWorkflow} className="p-3.5 rounded-2xl bg-white/5 text-slate-400 border border-white/5 hover:border-blue-500/50 transition-all" title="Save Snapshot"><Save size={18} /></button>
             <button onClick={handleLoadWorkflow} className="p-3.5 rounded-2xl bg-white/5 text-slate-400 border border-white/5 hover:border-blue-500/50 transition-all" title="Load Snapshot"><FolderOpen size={18} /></button>
             
             <div className="relative">
                <button 
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  className="px-8 py-4 rounded-2xl bg-slate-900 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] hover:border-blue-500/50 transition-all flex items-center gap-3 shadow-xl"
                >
                   <Download size={16} className="text-blue-500" /> EXPORT
                </button>
                {isExportMenuOpen && (
                  <div className="absolute top-16 right-0 w-48 glass-heavy rounded-2xl border border-white/10 p-2 shadow-2xl z-[200] animate-in fade-in slide-in-from-top-2 duration-300">
                     {[
                       { id: 'json', label: 'JSON_MANIFEST', icon: FileType },
                       { id: 'ld', label: 'LINKED_DATA', icon: Share2 },
                       { id: 'pdf', label: 'PDF_REPORT', icon: FileText },
                       { id: 'img', label: 'DAG_SNAPSHOT', icon: Globe }
                     ].map(f => (
                       <button 
                         key={f.id} 
                         onClick={() => exportMission(f.id as any)}
                         className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-[9px] font-black text-slate-400 uppercase tracking-widest transition-all"
                       >
                         <f.icon size={14} className="text-blue-500" /> {f.label}
                       </button>
                     ))}
                  </div>
                )}
             </div>

             <button onClick={handleDeploy} className="px-10 py-4 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-500 transition-all flex items-center gap-3 shadow-[0_0_30px_rgba(37,99,235,0.3)]">
                <Globe size={16} /> DEPLOY_CORE
             </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col gap-6 min-h-0">
          {viewMode === 'flow' && (
            <DAGVisualizer tasks={tasks} onSelectTask={handleSelectTask} selectedTaskIds={selectedTaskIds} lassoEnabled={lassoEnabled} />
          )}
          {viewMode === 'board' && (
            <NeuralBoard tasks={tasks} onSelectTask={handleSelectTask} />
          )}
          {viewMode === 'recap' && (
            <MissionRecap tasks={tasks} originalPrompt={prompt} />
          )}
          {viewMode === 'artifacts' && (
            <ArtifactRepository tasks={tasks} />
          )}
          
          {/* AI Command Core */}
          <div className="glass-heavy rounded-[3rem] p-8 border border-blue-500/20 shadow-[0_0_80px_rgba(37,99,235,0.2)] group transition-all focus-within:ring-2 ring-blue-500/40">
            <div className="flex items-start gap-8">
              <div className="w-16 h-16 rounded-[1.8rem] bg-blue-600/10 text-blue-500 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                <Sparkles size={28} />
              </div>
              <div className="flex-1 pt-1">
                <textarea 
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerateAI(); } }}
                  className="w-full bg-transparent border-none outline-none text-2xl font-bold text-white placeholder:text-slate-800 resize-none min-h-[60px] max-h-[250px] overflow-y-auto no-scrollbar" 
                  placeholder="Inject topology instructions here..." 
                />
              </div>
              <button onClick={handleGenerateAI} disabled={isGenerating || !prompt.trim()} className="px-14 py-5 rounded-[1.8rem] bg-blue-600 text-white font-black uppercase tracking-[0.2em] hover:bg-blue-500 transition-all disabled:opacity-50 flex items-center gap-4">
                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
                <span className="text-xs">Synthesize</span>
              </button>
            </div>
          </div>
        </div>

        {/* Selection Tool Bar */}
        {selectedTaskIds.length > 0 && (
          <footer className="h-20 glass-heavy rounded-3xl border border-blue-500/40 flex items-center px-10 gap-8 shadow-2xl absolute bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-4 duration-500">
             <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Selection: {selectedTaskIds.length} Nodes</span>
             <div className="flex gap-4">
               <button onClick={() => handleBulkUpdateStatus(TaskStatus.RUNNING)} className="px-4 py-2 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center gap-2 text-[10px] font-black uppercase"><Play size={14} fill="currentColor" /> Play</button>
               <button onClick={() => handleBulkUpdateStatus(TaskStatus.PENDING)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 border border-white/5 flex items-center gap-2 text-[10px] font-black uppercase"><Pause size={14} fill="currentColor" /> Pause</button>
               <button onClick={() => handleBulkUpdateStatus(TaskStatus.DONE)} className="px-4 py-2 rounded-xl bg-green-600/10 text-green-400 border border-green-500/20 flex items-center gap-2 text-[10px] font-black uppercase"><Check size={14} /> Done</button>
               <button onClick={() => handleBulkUpdateStatus(TaskStatus.FAILED)} className="px-4 py-2 rounded-xl bg-red-600/10 text-red-400 border border-red-500/20 flex items-center gap-2 text-[10px] font-black uppercase"><AlertTriangle size={14} /> Fail</button>
             </div>
             <div className="w-px h-8 bg-white/10"></div>
             <button onClick={() => { setTasks(prev => prev.filter(t => !selectedTaskIds.includes(t.id))); setSelectedTaskIds([]); }} className="p-3 rounded-xl hover:bg-red-500/20 text-red-500"><Trash2 size={18} /></button>
             <button onClick={() => setSelectedTaskIds([])} className="p-3 rounded-xl hover:bg-white/5 text-slate-500"><X size={18} /></button>
          </footer>
        )}
      </main>

      {/* Sidebar - Agent Details */}
      <aside className={`fixed inset-y-0 right-0 w-[650px] glass-heavy border-l border-white/10 z-[100] transform transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-2xl ${isSidebarOpen && selectedTaskIds.length === 1 ? 'translate-x-0' : 'translate-x-full'}`}>
        {primarySelectedTask && (
          <div className="h-full flex flex-col">
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-slate-950/20">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center border border-blue-500/20"><Box size={28}/></div>
                <div><h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Node_Analysis</h2><p className="text-[9px] font-mono text-slate-500 uppercase mt-1">Registry Context</p></div>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="w-12 h-12 rounded-2xl hover:bg-white/5 text-slate-500 flex items-center justify-center"><X size={24}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 space-y-12 no-scrollbar">
              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <div onClick={handleCycleAgent} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/10 border border-blue-500/20 cursor-pointer group">
                    <User size={14} className="text-blue-500" />
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{primarySelectedTask.owner || 'UNASSIGNED'}</span>
                    <ChevronRight size={12} className="text-slate-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border ${primarySelectedTask.priority === 'HIGH' ? 'text-red-400 border-red-400/20' : 'text-blue-400 border-blue-500/20'}`}>{primarySelectedTask.priority}</span>
                  <button onClick={handleEnhanceSelectedTask} disabled={isEnhancingSidebar} className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 text-[10px] font-black uppercase hover:border-blue-500/50 transition-all">
                    {isEnhancingSidebar ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />} AI_Augment
                  </button>
                </div>
                <h3 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">{primarySelectedTask.title}</h3>
                <p className="text-slate-400 text-lg leading-relaxed font-medium bg-white/5 p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
                  {primarySelectedTask.description}
                </p>
              </section>

              {/* Status Controls */}
              <section className="space-y-6">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3"><Zap size={16} className="text-blue-500" /> Execution_Status</h4>
                 <div className="grid grid-cols-4 gap-4">
                    {[
                      { s: TaskStatus.RUNNING, l: 'Start', i: Play, c: 'text-blue-400', bg: 'bg-blue-600/10' },
                      { s: TaskStatus.PENDING, l: 'Pause', i: Pause, c: 'text-slate-400', bg: 'bg-slate-800' },
                      { s: TaskStatus.DONE, l: 'Finish', i: Check, c: 'text-green-400', bg: 'bg-green-600/10' },
                      { s: TaskStatus.FAILED, l: 'Halt', i: AlertTriangle, c: 'text-red-400', bg: 'bg-red-600/10' },
                    ].map(btn => (
                      <button key={btn.l} onClick={() => handleUpdateStatus(primarySelectedTask.id, btn.s)} className={`flex flex-col items-center gap-3 p-6 rounded-3xl border transition-all ${primarySelectedTask.status === btn.s ? `border-current ${btn.bg} ${btn.c}` : 'border-white/5 text-slate-600 hover:text-white'}`}>
                        <btn.i size={24} />
                        <span className="text-[8px] font-black uppercase tracking-widest">{btn.l}</span>
                      </button>
                    ))}
                 </div>
              </section>

              {/* Artifacts - Individual Node output */}
              <section className="space-y-8">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3"><FileCode size={16} className="text-purple-400" /> Neural_Artifacts</h4>
                <div className="grid grid-cols-2 gap-4">
                  {primarySelectedTask.artifacts?.map(art => (
                    <div key={art.id} className="p-6 rounded-[2rem] bg-slate-900/40 border border-white/5 space-y-4 group hover:border-purple-500/30 transition-all">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20"><Terminal size={18}/></div>
                         <div><span className="text-[10px] font-black text-white uppercase block">{art.label}</span></div>
                      </div>
                      <div className="bg-black/40 rounded-xl p-4 font-mono text-[10px] text-slate-500 overflow-hidden line-clamp-4 leading-relaxed">
                        {art.content}
                      </div>
                    </div>
                  ))}
                  {!primarySelectedTask.artifacts?.length && <div className="col-span-2 text-center p-12 border border-dashed border-white/10 rounded-[2rem] text-slate-600 uppercase text-[10px] font-black">Waiting for agent output...</div>}
                </div>
              </section>

              {/* Logs */}
              <section className="space-y-6 pb-12">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3"><MessageSquare size={16} className="text-emerald-400" /> Process_Logs</h4>
                <div className="space-y-4">
                  {primarySelectedTask.comments?.map(c => (
                    <div key={c.id} className="p-5 rounded-[1.5rem] bg-slate-950/60 border border-white/5 flex gap-4">
                       <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 text-[10px] text-white"><User size={12}/></div>
                       <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                             <span className="text-[10px] font-black text-white uppercase">{c.author}</span>
                             <span className="text-[8px] font-mono text-slate-600">{c.timestamp}</span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">{c.text}</p>
                       </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </aside>

      {(isSidebarOpen && selectedTaskIds.length === 1) && <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[90] animate-in fade-in duration-500" onClick={() => setIsSidebarOpen(false)} />}
    </div>
  );
}
