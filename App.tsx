
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  Plus, Sparkles, Trash2, Play, CheckCircle2, AlertCircle, X, Terminal, Activity, Workflow,
  Layers, Loader2, Download, MousePointer2, MessageSquare, Box, Cloud, Zap, 
  Info, Check, LayoutGrid, User, Save, Wand2, Monitor, Pause, AlertTriangle, 
  Globe, ClipboardList, Package, Share2, Sun, Moon, Menu, Link as LinkIcon
} from 'lucide-react';
import { Task, TaskStatus } from './types';
import DAGVisualizer from './components/DAGVisualizer';
import NeuralBoard from './components/NeuralBoard';
import MissionRecap from './components/MissionRecap';
import ArtifactRepository from './components/ArtifactRepository';
import NeuralTerminal from './components/NeuralTerminal';
import AgentChatOverlay from './components/AgentChatOverlay';
import { generateWorkflow, enhanceTask } from './services/geminiService';

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
    comments: [
      { id: 'C1', author: 'Logic_Synthesizer', text: 'Weights calibrated to 0.44 threshold.', timestamp: '2m ago' },
      { id: 'C2', author: 'System', text: 'Syncing with T-001 uplink...', timestamp: 'Just now' }
    ]
  }
];

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('nexus_theme') as 'dark' | 'light') || 'dark';
  });
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('Neural edge computing pipeline for decentralized AI inference.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'flow' | 'board' | 'recap' | 'artifacts'>('flow');
  const [lassoEnabled, setLassoEnabled] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState(0);
  const [isEnhancingSidebar, setIsEnhancingSidebar] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);
  
  const [logs, setLogs] = useState<{id: string, timestamp: string, type: 'INFO' | 'WARN' | 'SYNC' | 'PACKET', message: string, source: string}[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [terminalExpanded, setTerminalExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const stats = useMemo(() => ({
    total: tasks.length,
    active: tasks.filter(t => t.status === TaskStatus.RUNNING).length,
    completed: tasks.filter(t => t.status === TaskStatus.DONE).length,
  }), [tasks]);

  const effectiveness = useMemo(() => stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0, [stats]);
  const primarySelectedTask = useMemo(() => tasks.find(t => t.id === selectedTaskIds[0]) || null, [tasks, selectedTaskIds]);

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('nexus_theme', theme);
  }, [theme]);

  useEffect(() => {
    const interval = setInterval(() => {
        if (tasks.length === 0) return;
        const types: ('INFO' | 'SYNC' | 'PACKET')[] = ['INFO', 'SYNC', 'PACKET'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
        const messages = [
            `Handshake validated with ${randomTask.id}`,
            `Neural weights updated for node ${randomTask.id.split('-')[1]}`,
            `Telemetry received from Node_${Math.floor(Math.random() * 99)}`
        ];
        setLogs(prev => [...prev.slice(-49), {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString().split(' ')[0],
            type: randomType,
            message: messages[Math.floor(Math.random() * messages.length)],
            source: randomTask.owner || 'System'
        }]);
    }, 4000);
    return () => clearInterval(interval);
  }, [tasks]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(40, Math.min(textareaRef.current.scrollHeight, 120))}px`;
    }
  }, [prompt]);

  const handleUpdateStatus = (id: string, newStatus: TaskStatus) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    setNotification({ message: `Node ${id} shifted to ${newStatus}`, type: 'info' });
  };

  const handleBulkUpdateStatus = (newStatus: TaskStatus) => {
    setTasks(tasks.map(t => selectedTaskIds.includes(t.id) ? { ...t, status: newStatus } : t));
    setNotification({ message: `${selectedTaskIds.length} nodes shifted to ${newStatus}`, type: 'success' });
  };

  const handleCycleAgent = () => {
    if (!primarySelectedTask) return;
    const currentIdx = AGENTS.indexOf(primarySelectedTask.owner || '');
    const nextAgent = AGENTS[(currentIdx + 1) % AGENTS.length];
    setTasks(tasks.map(t => t.id === primarySelectedTask.id ? { ...t, owner: nextAgent } : t));
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
      setTasks(tasks.map(t => t.id === primarySelectedTask.id ? { ...t, ...enhanced } : t));
    } finally {
      setIsEnhancingSidebar(false);
    }
  };

  const handleSelectTask = useCallback((task: Task, isMultiSelect: boolean) => {
    if (isMultiSelect) {
      setSelectedTaskIds(prev => prev.includes(task.id) ? prev.filter(id => id !== task.id) : [...prev, task.id]);
    } else {
      setSelectedTaskIds([task.id]);
      setIsSidebarOpen(true);
    }
  }, []);

  const themeClasses = theme === 'dark' ? 'bg-[#020617] text-slate-200' : 'bg-slate-50 text-slate-900';
  const textContrastClasses = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const secondaryTextClasses = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';

  return (
    <div className={`flex h-screen overflow-hidden font-sans relative transition-colors duration-500 ${themeClasses}`}>
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${theme === 'dark' ? 'opacity-100' : 'opacity-10'} bg-[radial-gradient(circle_at_50%_50%,#0f172a_0%,#020617_100%)]`}></div>
      
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[600] animate-in slide-in-from-top-4 fade-in duration-500">
           <div className={`px-4 md:px-6 py-2 md:py-3 rounded-2xl glass-heavy border shadow-2xl flex items-center gap-3 md:gap-4 ${
             notification.type === 'success' ? 'border-green-500/40 text-green-500' : 
             notification.type === 'error' ? 'border-red-500/40 text-red-500' : 'border-blue-500/40 text-blue-500'
           }`}>
              <Info size={16} />
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{notification.message}</span>
           </div>
        </div>
      )}

      {/* Deploy Modal */}
      {isDeploying && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-3xl animate-in fade-in duration-500 p-6">
           <div className="max-w-xl w-full p-8 md:p-12 glass-heavy rounded-[2.5rem] border border-blue-500/30 shadow-2xl">
              <div className="flex flex-col items-center gap-8 text-center">
                 <div className="w-20 h-20 rounded-full bg-blue-600/10 border border-blue-500/30 flex items-center justify-center">
                    <Cloud size={40} className="text-blue-500 animate-pulse" />
                 </div>
                 <h2 className={`text-2xl md:text-3xl font-black italic tracking-tighter uppercase ${textContrastClasses}`}>Initializing_Deploy</h2>
                 <div className="w-full space-y-3">
                    {['Building Artifacts', 'Provisioning Infrastructure', 'Syncing Data Nodes', 'Final Validation'].map((l, i) => (
                      <div key={i} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${deployStep >= i + 1 ? 'bg-blue-600/10 border-blue-500/40' : 'border-slate-500/10 opacity-40'}`}>
                        {deployStep >= i + 1 ? <CheckCircle2 size={14} className="text-blue-500" /> : <div className="w-3.5 h-3.5 rounded-full border border-current" />}
                        <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${textContrastClasses}`}>{l}</span>
                      </div>
                    ))}
                 </div>
                 {deployStep < 4 && <Loader2 className="animate-spin text-blue-500 mt-2" size={28} />}
              </div>
           </div>
        </div>
      )}

      {/* Navigation Rail (Simplified) */}
      <nav className={`fixed lg:relative inset-y-0 left-0 w-20 border-r border-slate-500/10 flex flex-col items-center py-6 gap-6 z-[450] glass-heavy transition-transform duration-300 ${isNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
          <Workflow size={24} className="text-white" />
        </div>
        <div className="flex flex-col gap-4">
          {[
            { mode: 'flow', icon: Layers },
            { mode: 'board', icon: LayoutGrid },
            { mode: 'recap', icon: ClipboardList },
            { mode: 'artifacts', icon: Package }
          ].map(item => (
            <button key={item.mode} onClick={() => setViewMode(item.mode as any)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all group relative ${viewMode === item.mode ? 'bg-blue-600/20 text-blue-500 border border-blue-500/40 shadow-sm' : 'text-slate-500 hover:text-blue-500'}`}>
              <item.icon size={20} />
            </button>
          ))}
          <div className="w-8 h-px bg-slate-500/10 my-2"></div>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-500 hover:text-blue-500 transition-all">
            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
        <div className="mt-auto space-y-4">
           <button onClick={() => setLassoEnabled(!lassoEnabled)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${lassoEnabled ? 'bg-blue-600/20 text-blue-500 border border-blue-500/40' : 'text-slate-500 hover:text-blue-500'}`}>
             <MousePointer2 size={20} />
           </button>
           <button onClick={handleGenerateAI} className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white hover:scale-105 transition-all shadow-lg">
             <Plus size={24} />
           </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col p-4 md:p-6 gap-4 md:gap-6 min-w-0 relative z-10 overflow-hidden">
        <header className="h-20 min-h-[80px] md:h-24 md:min-h-[96px] glass-heavy rounded-[1.5rem] md:rounded-[2.5rem] px-6 md:px-10 flex items-center justify-between border border-slate-500/10 shadow-xl relative">
          <button className="lg:hidden p-2.5 mr-4 rounded-xl bg-slate-500/10 text-slate-500" onClick={() => setIsNavOpen(true)}>
            <Menu size={20} />
          </button>
          
          <div className="flex items-center gap-4 md:gap-10 flex-1 min-w-0">
            <div className="flex flex-col shrink-0">
              <h1 className={`font-black text-xl md:text-3xl tracking-tighter italic leading-none transition-colors ${textContrastClasses}`}>NEXUS_FORGE</h1>
              <p className="text-[7px] md:text-[9px] font-black text-blue-500 uppercase tracking-[0.3em] mt-1.5 animate-pulse truncate">HYPER_CONNECTED</p>
            </div>
            
            <div className="hidden sm:block h-10 w-px bg-slate-500/10 shrink-0 mx-2 md:mx-4"></div>

            <div className="hidden xs:flex gap-6 md:gap-10 items-center shrink-0">
              <div className="text-center min-w-[50px] md:min-w-[60px]">
                <p className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest">Efficiency</p>
                <p className="text-lg md:text-xl font-mono font-bold text-blue-500 leading-none">{effectiveness}%</p>
              </div>
              <div className="hidden md:block text-center min-w-[60px]">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active</p>
                <p className={`text-xl font-mono font-bold leading-none ${textContrastClasses}`}>{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
             <button className={`p-2.5 md:p-3.5 rounded-2xl transition-all ${theme === 'dark' ? 'bg-white/5 text-slate-400' : 'bg-slate-200 text-slate-600'} hover:border-blue-500/50 hover:text-blue-500 border border-transparent`}>
                <Download size={18} />
             </button>
             <button onClick={handleDeploy} className="px-5 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl bg-blue-600 text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] hover:bg-blue-500 transition-all flex items-center gap-2 md:gap-3 shadow-lg hover:scale-105 active:scale-95">
                <Globe size={16} /> <span className="hidden xs:inline">DEPLOY_CORE</span>
             </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col gap-4 md:gap-8 min-h-0 overflow-hidden relative">
          <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
            {viewMode === 'flow' && <DAGVisualizer tasks={tasks} onSelectTask={handleSelectTask} selectedTaskIds={selectedTaskIds} lassoEnabled={lassoEnabled} theme={theme} />}
            {viewMode === 'board' && <NeuralBoard tasks={tasks} onSelectTask={handleSelectTask} />}
            {viewMode === 'recap' && <MissionRecap tasks={tasks} originalPrompt={prompt} />}
            {viewMode === 'artifacts' && <ArtifactRepository tasks={tasks} />}
          </div>
          
          <div className={`shrink-0 transition-all duration-500 ${terminalExpanded ? 'h-[400px]' : 'h-12'}`}>
             <div className="flex h-full flex-col relative">
               <div className="absolute -top-10 right-4 z-20">
                 <button onClick={() => setTerminalExpanded(!terminalExpanded)} className="px-4 py-1.5 rounded-t-xl glass-heavy border-t border-x border-slate-500/10 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-500 transition-all">
                   {terminalExpanded ? 'Minimize_Stream' : 'Expand_Stream'}
                 </button>
               </div>
               <div className="flex-1 overflow-hidden">
                 <NeuralTerminal logs={logs} theme={theme} />
               </div>
             </div>
          </div>

          {selectedTaskIds.length === 0 && !terminalExpanded && (
            <div className="absolute bottom-12 md:bottom-20 left-1/2 -translate-x-1/2 z-[50] w-full max-w-2xl px-4 animate-in slide-in-from-bottom-8 duration-700">
                <div className="glass-heavy rounded-[1.5rem] md:rounded-[2rem] p-3 md:p-4 border border-blue-500/20 shadow-2xl flex items-end gap-3 md:gap-4">
                    <textarea 
                        ref={textareaRef}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerateAI(); } }}
                        placeholder="Inject topology instructions here..."
                        className={`flex-1 bg-transparent border-none outline-none text-sm md:text-base font-bold px-3 md:px-4 py-2 placeholder:text-slate-400 resize-none min-h-[40px] max-h-[120px] no-scrollbar leading-relaxed ${textContrastClasses}`}
                    />
                    <button onClick={handleGenerateAI} disabled={isGenerating || !prompt.trim()} className="h-10 md:h-12 px-5 md:px-8 bg-blue-600 rounded-xl md:rounded-2xl text-white font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:bg-blue-500 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 shrink-0">
                       {isGenerating ? <Loader2 className="animate-spin" size={12}/> : <Zap size={12} />} <span className="hidden xs:inline">SYNTHESIZE</span>
                    </button>
                </div>
            </div>
          )}

          {selectedTaskIds.length > 0 && (
            <div className="absolute top-2 md:top-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-8 duration-500 w-full max-w-[95vw] md:max-w-max px-4">
              <footer className="h-16 md:h-20 glass-heavy rounded-2xl md:rounded-3xl border border-blue-500/40 flex items-center px-4 md:px-10 gap-3 md:gap-8 shadow-2xl overflow-x-auto no-scrollbar">
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest whitespace-nowrap hidden sm:inline">Selection: {selectedTaskIds.length} Nodes</span>
                <div className="flex gap-2 md:gap-4 shrink-0">
                  <button onClick={() => handleBulkUpdateStatus(TaskStatus.RUNNING)} className="px-4 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-xl bg-blue-600/10 text-blue-500 border border-blue-500/20 flex items-center gap-2 text-[9px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all"><Play size={12} fill="currentColor" /> Play</button>
                  <button onClick={() => handleBulkUpdateStatus(TaskStatus.DONE)} className="px-4 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-xl bg-green-600/10 text-green-500 border border-green-500/20 flex items-center gap-2 text-[9px] font-black uppercase hover:bg-green-600 hover:text-white transition-all"><Check size={12} /> Done</button>
                </div>
                <div className="hidden sm:block w-px h-8 bg-slate-500/10 shrink-0"></div>
                <button onClick={() => { setTasks(tasks.filter(t => !selectedTaskIds.includes(t.id))); setSelectedTaskIds([]); }} className="p-2 md:p-3 rounded-lg md:rounded-xl hover:bg-red-500 text-white transition-all"><Trash2 size={18} /></button>
                <button onClick={() => setSelectedTaskIds([])} className="p-2 md:p-3 rounded-lg md:rounded-xl hover:bg-slate-500/10 text-slate-500 transition-all"><X size={18} /></button>
              </footer>
            </div>
          )}
        </div>
      </main>

      {/* Sidebar - Node Analytics (Audit Text Colors) */}
      <aside className={`fixed inset-y-0 right-0 w-full md:max-w-[500px] lg:max-w-[650px] glass-heavy border-l border-slate-500/10 z-[500] transform transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-2xl flex flex-col ${isSidebarOpen && selectedTaskIds.length === 1 ? 'translate-x-0' : 'translate-x-full'}`}>
        {primarySelectedTask && (
          <div className="h-full flex flex-col min-h-0">
            <div className="p-6 md:p-10 border-b border-slate-500/10 flex justify-between items-center bg-slate-500/5 shrink-0">
              <div className="flex items-center gap-4 md:gap-5">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center border border-blue-500/20"><Box size={24}/></div>
                <div>
                   <h2 className={`text-xl md:text-2xl font-black italic tracking-tighter uppercase leading-none ${textContrastClasses}`}>Node_Analysis</h2>
                   <p className="text-[8px] md:text-[9px] font-mono text-slate-500 uppercase mt-2">Registry Context // {primarySelectedTask.id}</p>
                </div>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="w-10 h-10 rounded-xl hover:bg-slate-500/10 text-slate-500 flex items-center justify-center transition-all"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-10 md:space-y-12 no-scrollbar scroll-smooth">
              <section className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <div onClick={handleCycleAgent} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600/10 border border-blue-500/20 cursor-pointer group hover:bg-blue-600/20 transition-all">
                    <User size={12} className="text-blue-500" />
                    <span className="text-[8px] md:text-[10px] font-black text-blue-500 uppercase tracking-widest">{primarySelectedTask.owner || 'UNASSIGNED'}</span>
                  </div>
                  <button onClick={() => setIsChatOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600/10 border border-green-500/20 text-green-600 text-[8px] font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all"><MessageSquare size={12} /> Open_Link</button>
                  <button onClick={handleEnhanceSelectedTask} disabled={isEnhancingSidebar} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-500/10 border border-slate-500/10 text-slate-500 text-[8px] font-black uppercase hover:border-blue-500/50 transition-all">
                    {isEnhancingSidebar ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />} AI_Augment
                  </button>
                </div>
                <h3 className={`text-3xl md:text-5xl font-black tracking-tighter uppercase leading-tight italic ${textContrastClasses}`}>{primarySelectedTask.title}</h3>
                <p className={`text-sm md:text-lg leading-relaxed font-medium p-8 rounded-[1.5rem] border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                  {primarySelectedTask.description}
                </p>
              </section>

              {/* Status Section */}
              <section className="space-y-6">
                 <h4 className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3"><Zap size={14} className="text-blue-500" /> Execution_Status</h4>
                 <div className="grid grid-cols-2 xs:grid-cols-4 gap-3">
                    {[
                      { s: TaskStatus.RUNNING, l: 'Start', i: Play, c: 'text-blue-500', bg: 'bg-blue-600/10' },
                      { s: TaskStatus.DONE, l: 'Finish', i: Check, c: 'text-green-600', bg: 'bg-green-600/10' },
                      { s: TaskStatus.FAILED, l: 'Halt', i: AlertTriangle, c: 'text-red-500', bg: 'bg-red-600/10' },
                      { s: TaskStatus.PENDING, l: 'Pause', i: Pause, c: 'text-slate-500', bg: 'bg-slate-500/10' },
                    ].map(btn => (
                      <button key={btn.l} onClick={() => handleUpdateStatus(primarySelectedTask.id, btn.s)} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${primarySelectedTask.status === btn.s ? `border-current ${btn.bg} ${btn.c}` : 'border-slate-500/10 text-slate-500 hover:border-slate-400'}`}>
                        <btn.i size={20} />
                        <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">{btn.l}</span>
                      </button>
                    ))}
                 </div>
              </section>

              {/* Dependency Mapping (Filled) */}
              <section className="space-y-6">
                <h4 className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3"><LinkIcon size={14} className="text-blue-500" /> Dependency_Mapping</h4>
                <div className="space-y-3">
                   {primarySelectedTask.dependencies.length > 0 ? (
                      primarySelectedTask.dependencies.map(depId => {
                         const dep = tasks.find(t => t.id === depId);
                         return (
                           <div key={depId} className={`p-4 rounded-2xl border flex justify-between items-center transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                              <div className="flex items-center gap-3 overflow-hidden">
                                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-slate-900' : 'bg-white shadow-sm'}`}>
                                    <Activity size={14} className="text-blue-500" />
                                 </div>
                                 <span className={`text-[11px] font-bold uppercase truncate ${textContrastClasses}`}>{dep?.title || depId}</span>
                              </div>
                              <span className={`text-[8px] font-mono px-2 py-0.5 rounded ${dep?.status === TaskStatus.DONE ? 'bg-green-500/10 text-green-600' : 'bg-slate-500/10 text-slate-500'}`}>{dep?.status || 'UNKNOWN'}</span>
                           </div>
                         );
                      })
                   ) : (
                     <div className="p-8 border-2 border-dashed border-slate-500/10 rounded-2xl text-center">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest opacity-40">Root_Node // No_Upstream</span>
                     </div>
                   )}
                </div>
              </section>

              {/* Agent Logic Log (Filled) */}
              <section className="space-y-6 pb-12">
                <h4 className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3"><Terminal size={14} className="text-purple-500" /> Agent_Logic_Log</h4>
                <div className="space-y-4">
                   {primarySelectedTask.comments?.map(comment => (
                     <div key={comment.id} className="relative pl-6 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-slate-500/20">
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">{comment.author}</span>
                           <span className="text-[8px] font-mono text-slate-500 uppercase italic">// {comment.timestamp}</span>
                        </div>
                        <p className={`text-xs leading-relaxed font-medium ${secondaryTextClasses}`}>{comment.text}</p>
                     </div>
                   ))}
                   {!primarySelectedTask.comments?.length && (
                     <div className="p-4 rounded-xl bg-slate-500/5 text-center">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic opacity-30">No log entries found for this node.</span>
                     </div>
                   )}
                </div>
              </section>
            </div>
          </div>
        )}
      </aside>

      {isChatOpen && primarySelectedTask && <AgentChatOverlay task={primarySelectedTask} onClose={() => setIsChatOpen(false)} />}
      {(isSidebarOpen && selectedTaskIds.length === 1) && <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[480] animate-in fade-in duration-700" onClick={() => setIsSidebarOpen(false)} />}
    </div>
  );
}
