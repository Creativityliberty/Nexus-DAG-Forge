
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  Plus, 
  Sparkles, 
  Trash2, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Terminal,
  Settings,
  Activity,
  Workflow,
  Command,
  ArrowUpRight,
  Layers,
  Loader2,
  Cpu,
  Layers2,
  History,
  Download,
  MousePointer2,
  MessageSquare,
  Clock,
  ChevronRight,
  FileCode,
  Box,
  Cloud,
  Database,
  Zap,
  Info,
  Check,
  LayoutGrid,
  ShieldAlert,
  BarChart3,
  User,
  Send,
  Hash,
  Save,
  FolderOpen,
  Wand2
} from 'lucide-react';
import { Task, TaskStatus, SubTask, PriorityLevel, TaskComment } from './types';
import DAGVisualizer from './components/DAGVisualizer';
import { generateWorkflow, enhanceTask, generateSubtasks } from './services/geminiService';

const INITIAL_TASKS: Task[] = [
  {
    id: 'T-001',
    title: 'Data Ingestion Layer',
    description: 'High-throughput stream processing from distributed edge sensors.',
    status: TaskStatus.DONE,
    dependencies: [],
    owner: 'Root-Admin',
    priority: 'HIGH',
    subtasks: [
      { id: 'S1', title: 'Socket handshake', completed: true },
      { id: 'S2', title: 'Buffer allocation', completed: true }
    ],
    comments: [{ id: 'C-INIT', author: 'System', text: 'Pipeline initialized.', timestamp: '1h ago' }]
  },
  {
    id: 'T-002',
    title: 'Semantic Processor',
    description: 'Real-time schema enforcement and field mapping using neural weights.',
    status: TaskStatus.RUNNING,
    dependencies: ['T-001'],
    owner: 'AI-Kernel',
    priority: 'MEDIUM',
    subtasks: [
      { id: 'S3', title: 'JSON Validation', completed: true },
      { id: 'S4', title: 'Normalizer.v2', completed: false }
    ],
    comments: [{ id: 'C1', author: 'System', text: 'Processing batch #4401...', timestamp: '2m ago' }]
  }
];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [history, setHistory] = useState<Task[][]>([INITIAL_TASKS]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [lassoEnabled, setLassoEnabled] = useState(false);
  const [isEnhancingSidebar, setIsEnhancingSidebar] = useState(false);
  const [isEnhancingForm, setIsEnhancingForm] = useState(false);
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const stats = useMemo(() => ({
    total: tasks.length,
    active: tasks.filter(t => t.status === TaskStatus.RUNNING || t.status === TaskStatus.PENDING).length,
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

  // Handle textarea resize and visibility
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(60, Math.min(textareaRef.current.scrollHeight, 300))}px`;
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

  const handleSaveWorkflow = () => {
    localStorage.setItem('nexus_snapshot', JSON.stringify(tasks));
    setNotification({ message: 'Snapshot saved to registry.', type: 'success' });
  };

  const handleLoadWorkflow = () => {
    const saved = localStorage.getItem('nexus_snapshot');
    if (saved) {
      const parsed = JSON.parse(saved);
      setTasks(parsed);
      pushToHistory(parsed);
      setNotification({ message: 'Registry restored from snapshot.', type: 'success' });
    } else {
      setNotification({ message: 'No snapshot found.', type: 'info' });
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setTasks(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setTasks(history[newIndex]);
    }
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
      console.error(err);
      setNotification({ message: 'Synthesis failed.', type: 'info' });
    } finally {
      setIsGenerating(false);
      setPrompt('');
    }
  };

  const handleEnhanceSelectedTask = async () => {
    if (!primarySelectedTask) return;
    setIsEnhancingSidebar(true);
    try {
      const enhanced = await enhanceTask({ 
        title: primarySelectedTask.title, 
        description: primarySelectedTask.description 
      });
      const next = tasks.map(t => t.id === primarySelectedTask.id ? { 
        ...t, 
        title: enhanced.title || t.title, 
        description: enhanced.description || t.description,
        priority: enhanced.priority || t.priority,
        subtasks: enhanced.subtasks || t.subtasks
      } : t);
      setTasks(next);
      pushToHistory(next);
      setNotification({ message: 'Node augmented.', type: 'success' });
    } finally {
      setIsEnhancingSidebar(false);
    }
  };

  const handleUpdateStatus = (id: string, newStatus: TaskStatus) => {
    const next = tasks.map(t => t.id === id ? { ...t, status: newStatus } : t);
    setTasks(next);
    pushToHistory(next);
  };

  const handleBulkUpdateStatus = (newStatus: TaskStatus) => {
    const next = tasks.map(t => selectedTaskIds.includes(t.id) ? { ...t, status: newStatus } : t);
    setTasks(next);
    pushToHistory(next);
  };

  const handleAddComment = () => {
    if (!newCommentText.trim() || !primarySelectedTask) return;
    const newComment: TaskComment = { id: `C-${Date.now()}`, author: 'Operator', text: newCommentText, timestamp: 'Now' };
    const next = tasks.map(t => t.id === primarySelectedTask.id ? { ...t, comments: [...(t.comments || []), newComment] } : t);
    setTasks(next);
    setNewCommentText('');
    pushToHistory(next);
  };

  const handleAISuggestForm = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!formRef.current) return;
    const form = formRef.current;
    const titleInput = form.elements.namedItem('title') as HTMLInputElement;
    const descInput = form.elements.namedItem('description') as HTMLTextAreaElement;
    if (!titleInput.value) return;
    setIsEnhancingForm(true);
    try {
      const enhanced = await enhanceTask({ title: titleInput.value, description: descInput.value });
      titleInput.value = enhanced.title || titleInput.value;
      descInput.value = enhanced.description || descInput.value;
    } finally {
      setIsEnhancingForm(false);
    }
  };

  const handleManualInject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newTask: Task = {
      id: `T-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      status: TaskStatus.PENDING,
      priority: (formData.get('priority') as PriorityLevel) || 'MEDIUM',
      dependencies: (formData.get('deps') as string).split(',').filter(Boolean).map(d => d.trim()),
      owner: 'Manual_Operator',
      subtasks: []
    };
    const nextTasks = [...tasks, newTask];
    setTasks(nextTasks);
    pushToHistory(nextTasks);
    setIsCreatingTask(false);
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#0f172a_0%,#020617_100%)] pointer-events-none"></div>
      
      {notification && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4 fade-in duration-500">
           <div className={`px-6 py-3 rounded-2xl glass-heavy border shadow-2xl flex items-center gap-4 ${notification.type === 'success' ? 'border-green-500/40 text-green-400' : 'border-blue-500/40 text-blue-400'}`}>
              <Info size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">{notification.message}</span>
           </div>
        </div>
      )}

      {/* Navigation Rail */}
      <nav className="w-20 border-r border-white/5 flex flex-col items-center py-8 gap-8 relative z-50 glass-heavy">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)] relative group overflow-hidden cursor-pointer">
          <Workflow size={24} className="text-white z-10" />
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        </div>
        <div className="flex flex-col gap-5">
          {[Layers, Activity, Database, Settings].map((Icon, i) => (
            <button key={i} className="w-12 h-12 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all flex items-center justify-center group relative">
              <Icon size={20} />
              <div className="absolute left-16 bg-slate-900 border border-white/10 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest invisible group-hover:visible whitespace-nowrap z-50 shadow-2xl">
                MODULE_{i + 1}
              </div>
            </button>
          ))}
        </div>
        <div className="mt-auto space-y-4">
           <button onClick={() => setLassoEnabled(!lassoEnabled)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${lassoEnabled ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40' : 'text-slate-500 hover:text-white'}`} title="Lasso Selection">
             <MousePointer2 size={20} />
           </button>
           <button onClick={() => setIsCreatingTask(true)} className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white hover:scale-105 transition-all shadow-lg" title="Manual Injection">
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
            <div className="hidden lg:flex gap-6 items-center">
              <div className="w-px h-10 bg-white/10 mx-2"></div>
              <div className="text-center">
                <p className="text-[8px] font-black text-slate-500 uppercase">Critical</p>
                <p className="text-xl font-mono font-bold text-red-400">{stats.critical}</p>
              </div>
              <div className="text-center">
                <p className="text-[8px] font-black text-slate-500 uppercase">Active</p>
                <p className="text-xl font-mono font-bold text-blue-400">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <button onClick={undo} disabled={historyIndex <= 0} className="p-2.5 rounded-xl hover:bg-white/5 text-slate-500 disabled:opacity-20"><History size={18} className="rotate-180" /></button>
             <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2.5 rounded-xl hover:bg-white/5 text-slate-500 disabled:opacity-20"><History size={18} /></button>
             <div className="w-px h-8 bg-white/10 mx-2"></div>
             <button onClick={handleSaveWorkflow} className="p-3.5 rounded-2xl bg-white/5 text-slate-400 border border-white/5 hover:border-blue-500/50 transition-all" title="Save Snapshot"><Save size={18} /></button>
             <button onClick={handleLoadWorkflow} className="p-3.5 rounded-2xl bg-white/5 text-slate-400 border border-white/5 hover:border-blue-500/50 transition-all" title="Load Snapshot"><FolderOpen size={18} /></button>
             <button onClick={() => setIsExportOpen(true)} className="px-8 py-4 rounded-2xl bg-slate-900 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] hover:border-blue-500/50 transition-all flex items-center gap-3 shadow-xl">
                <Download size={14} className="text-blue-500" /> DEPLOY
             </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col gap-6 min-h-0">
          <DAGVisualizer 
            tasks={tasks} 
            onSelectTask={handleSelectTask} 
            selectedTaskIds={selectedTaskIds} 
            lassoEnabled={lassoEnabled}
          />
          
          {/* AI Command Core - EXPANDED WORKSPACE */}
          <div className="glass-heavy rounded-[3rem] flex flex-col p-8 gap-4 border border-blue-500/20 shadow-[0_0_80px_rgba(37,99,235,0.2)] group relative transition-all focus-within:ring-2 ring-blue-500/40 focus-within:shadow-[0_0_120px_rgba(37,99,235,0.3)]">
            <div className="flex items-start gap-8 h-full">
              <div className="w-16 h-16 rounded-[1.8rem] bg-blue-600/10 text-blue-500 flex items-center justify-center flex-shrink-0 border border-blue-500/20 shadow-inner group-focus-within:scale-110 transition-transform duration-500">
                <Sparkles size={28} className={isGenerating ? "animate-pulse" : ""} />
              </div>
              <div className="flex-1 pt-1 min-h-[80px]">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Neural_Synthesis_Interface</span>
                  <div className="flex gap-4">
                    <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">{prompt.length} CHR</span>
                  </div>
                </div>
                <textarea 
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerateAI();
                    }
                  }}
                  className="w-full bg-transparent border-none outline-none text-2xl font-bold text-white placeholder:text-slate-800 resize-none min-h-[80px] max-h-[350px] overflow-y-auto no-scrollbar selection:bg-blue-600/30" 
                  placeholder="Inject topology instructions here. Describe the system architecture in detail..." 
                />
                <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-6">
                  <div className="flex items-center gap-4">
                     <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                       Status: {isGenerating ? 'PROCESSING_NEURAL_WEIGHTS' : (prompt.length > 0 ? 'READY_FOR_SEQUENCING' : 'IDLE_WAITING_FOR_INPUT')}
                     </p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setPrompt('')}
                      className="px-6 py-3 rounded-xl hover:bg-white/5 text-slate-500 text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      Clear
                    </button>
                    <button 
                      onClick={handleGenerateAI}
                      disabled={isGenerating || !prompt.trim()}
                      className="px-14 py-5 rounded-[1.8rem] bg-blue-600 text-white font-black uppercase tracking-[0.2em] hover:bg-blue-500 transition-all shadow-2xl disabled:opacity-50 flex items-center justify-center gap-4 group/btn"
                    >
                      {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} className="group-hover/btn:scale-125 transition-transform" />}
                      <span className="text-xs">Synthesize</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* History Timeline */}
        <footer className="h-16 glass-heavy rounded-3xl border border-white/5 flex items-center px-8 gap-6 shadow-xl relative">
          {selectedTaskIds.length > 0 && (
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 glass-heavy rounded-2xl border border-blue-500/40 px-6 py-3 flex items-center gap-8 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest whitespace-nowrap">Selection: {selectedTaskIds.length} Nodes</span>
              <div className="flex gap-2">
                <button onClick={() => handleBulkUpdateStatus(TaskStatus.DONE)} className="p-2.5 rounded-xl hover:bg-green-500/20 text-green-400" title="Set Done"><CheckCircle2 size={18} /></button>
                <button onClick={() => handleBulkUpdateStatus(TaskStatus.RUNNING)} className="p-2.5 rounded-xl hover:bg-blue-500/20 text-blue-400" title="Set Running"><Play size={18} fill="currentColor" /></button>
                <button onClick={() => { if(window.confirm('Delete nodes?')) { const next = tasks.filter(t => !selectedTaskIds.includes(t.id)); setTasks(next); pushToHistory(next); setSelectedTaskIds([]); }}} className="p-2.5 rounded-xl hover:bg-red-500/20 text-red-400" title="Delete Selection"><Trash2 size={18} /></button>
                <button onClick={() => setSelectedTaskIds([])} className="p-2.5 rounded-xl hover:bg-white/10 text-slate-500"><X size={18} /></button>
              </div>
            </div>
          )}
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3"><Clock size={14} className="text-blue-500" /> TIMELINE</span>
          <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar py-2">
            {history.map((_, i) => (
              <button key={i} onClick={() => { setHistoryIndex(i); setTasks(history[i]); }} className={`h-2.5 min-w-[30px] rounded-full transition-all ${i === historyIndex ? 'bg-blue-500 w-10 shadow-[0_0_15px_#3b82f6]' : 'bg-slate-800'}`} />
            ))}
          </div>
          <span className="text-[9px] font-mono text-slate-600 uppercase">v{historyIndex + 1}</span>
        </footer>
      </main>

      {/* Sidebar and Modals ... remain identical to previous functional state */}
      <aside className={`fixed inset-y-0 right-0 w-[550px] glass-heavy border-l border-white/10 z-[100] transform transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-2xl ${isSidebarOpen && selectedTaskIds.length === 1 ? 'translate-x-0' : 'translate-x-full'}`}>
        {primarySelectedTask && (
          <div className="h-full flex flex-col">
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-slate-950/20">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center border border-blue-500/20"><Box size={28}/></div>
                <div><h2 className="text-2xl font-black text-white italic tracking-tighter">NODE_ANALYSIS</h2><p className="text-[9px] font-mono text-slate-500 uppercase mt-1">Registry Context</p></div>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="w-12 h-12 rounded-2xl hover:bg-white/5 text-slate-500 border border-white/10 flex items-center justify-center"><X size={24}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 space-y-12 no-scrollbar">
              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${primarySelectedTask.priority === 'HIGH' ? 'text-red-400 bg-red-400/10 border-red-400/20' : 'text-blue-400 bg-blue-400/10 border-blue-400/20'}`}>
                    {primarySelectedTask.priority}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 opacity-60 uppercase">REF: {primarySelectedTask.id}</span>
                  <button onClick={handleEnhanceSelectedTask} disabled={isEnhancingSidebar} className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase hover:bg-blue-600/20 transition-all">
                    {isEnhancingSidebar ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />} AI_AUGMENT
                  </button>
                </div>

                <div className="relative group/title">
                  <h3 className="text-5xl font-black text-white tracking-tighter uppercase leading-none pr-12">{primarySelectedTask.title}</h3>
                  <button onClick={handleEnhanceSelectedTask} className="absolute top-0 right-0 p-2 text-blue-400 opacity-0 group-hover/title:opacity-100 transition-opacity"><Wand2 size={20}/></button>
                </div>
                
                <div className="relative group/desc">
                  <p className="text-slate-400 text-lg leading-relaxed font-medium bg-white/5 p-8 rounded-[2.5rem] border border-white/5 shadow-inner pr-14">
                    {primarySelectedTask.description}
                  </p>
                  <button onClick={handleEnhanceSelectedTask} className="absolute top-6 right-6 p-2 text-blue-400 opacity-0 group-hover/desc:opacity-100 transition-opacity"><Wand2 size={24}/></button>
                </div>
              </section>

              {/* Subtasks */}
              <section className="space-y-8">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3"><Zap size={16} className="text-blue-500" /> OPERATIONAL_STEPS</h4>
                  <button onClick={async () => {
                    setIsGeneratingSubtasks(true);
                    try {
                      const subs = await generateSubtasks(primarySelectedTask);
                      const next = tasks.map(t => t.id === primarySelectedTask.id ? { ...t, subtasks: subs } : t);
                      setTasks(next);
                      pushToHistory(next);
                    } finally { setIsGeneratingSubtasks(false); }
                  }} disabled={isGeneratingSubtasks} className="text-[10px] font-black text-blue-500 uppercase flex items-center gap-2">
                    {isGeneratingSubtasks ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} REGENERATE
                  </button>
                </div>
                <div className="space-y-3">
                  {primarySelectedTask.subtasks?.map(sub => (
                    <div key={sub.id} className="p-6 rounded-[2rem] bg-slate-900/40 border border-white/5 flex items-center gap-5 cursor-pointer hover:border-blue-500/30 transition-all" onClick={() => {
                      const next = tasks.map(t => t.id === primarySelectedTask.id ? { ...t, subtasks: t.subtasks?.map(s => s.id === sub.id ? { ...s, completed: !s.completed } : s) } : t);
                      setTasks(next);
                    }}>
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${sub.completed ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'border-slate-800 text-transparent'}`}><Check size={16} /></div>
                      <span className={`flex-1 font-bold text-base ${sub.completed ? 'text-slate-600 line-through' : 'text-slate-200'}`}>{sub.title}</span>
                    </div>
                  ))}
                  {!primarySelectedTask.subtasks?.length && <div className="text-center p-8 border border-dashed border-white/10 rounded-[2rem] text-slate-600 uppercase text-[10px] font-black">No steps mapped</div>}
                </div>
              </section>

              {/* Logs */}
              <section className="space-y-6 pb-12">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3"><MessageSquare size={16} className="text-emerald-400" /> REGISTRY_LOGS</h4>
                <div className="space-y-4">
                  {primarySelectedTask.comments?.map(c => (
                    <div key={c.id} className="p-5 rounded-[1.5rem] bg-slate-950/60 border border-white/5 space-y-2">
                       <div className="flex justify-between items-center mb-1">
                         <span className="text-[10px] font-black text-white uppercase tracking-tight">{c.author}</span>
                         <span className="text-[8px] font-mono text-slate-600 uppercase">{c.timestamp}</span>
                       </div>
                       <p className="text-xs text-slate-400 font-medium leading-relaxed">{c.text}</p>
                    </div>
                  ))}
                </div>
                <div className="relative mt-6">
                  <input 
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    placeholder="Input log entry..."
                    className="w-full bg-slate-950/60 border border-white/5 rounded-2xl py-4 pl-6 pr-14 text-xs text-white outline-none focus:border-blue-500/40 transition-all"
                  />
                  <button onClick={handleAddComment} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center"><Send size={14} /></button>
                </div>
              </section>
            </div>

            <div className="p-10 border-t border-white/5 grid grid-cols-2 gap-6 bg-slate-950/40 backdrop-blur-3xl">
               <button onClick={() => handleUpdateStatus(primarySelectedTask.id, TaskStatus.RUNNING)} className="py-6 rounded-[2rem] bg-blue-600 text-white font-black uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3"><Play size={22} fill="currentColor" /> Initialize</button>
               <button onClick={() => handleUpdateStatus(primarySelectedTask.id, TaskStatus.DONE)} className="py-6 rounded-[2rem] bg-slate-900 border border-white/10 text-green-400 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3"><CheckCircle2 size={22} /> Complete</button>
            </div>
          </div>
        )}
      </aside>

      {/* Manual Modal and Overlay */}
      {isCreatingTask && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl" onClick={() => setIsCreatingTask(false)}></div>
           <form ref={formRef} className="w-full max-w-2xl glass-heavy rounded-[3.5rem] p-14 border border-white/10 shadow-2xl relative z-10 overflow-hidden" onSubmit={handleManualInject}>
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-500"></div>
              <div className="flex justify-between items-center mb-12">
                <div><h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Injection</h2><p className="text-[10px] font-mono text-slate-500 uppercase mt-2">Force Node Registry</p></div>
                <button type="button" onClick={handleAISuggestForm} disabled={isEnhancingForm} className="px-6 py-3 rounded-2xl bg-blue-600/10 border border-blue-500/40 text-blue-400 text-[11px] font-black uppercase flex items-center gap-3">
                  {isEnhancingForm ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />} AI_AUGMENT
                </button>
              </div>
              <div className="space-y-8">
                <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] ml-6">Title</label><input required name="title" className="w-full bg-slate-950/60 border border-white/10 rounded-3xl p-6 text-white text-xl font-bold outline-none focus:border-blue-500/60 transition-all" /></div>
                <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] ml-6">Description</label><textarea required name="description" className="w-full bg-slate-950/60 border border-white/10 rounded-3xl p-6 text-white text-sm outline-none focus:border-blue-500/60 h-32 resize-none" /></div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] ml-6">Criticality</label><select name="priority" className="w-full bg-slate-950/60 border border-white/10 rounded-3xl p-6 text-white outline-none appearance-none font-bold uppercase"><option value="LOW">LOW</option><option value="MEDIUM">MEDIUM</option><option value="HIGH">HIGH</option></select></div>
                  <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] ml-6">Depends On (IDs)</label><input name="deps" className="w-full bg-slate-950/60 border border-white/10 rounded-3xl p-6 text-white font-mono text-xs outline-none" placeholder="e.g. T-001" /></div>
                </div>
              </div>
              <div className="flex gap-6 pt-12">
                <button type="button" onClick={() => setIsCreatingTask(false)} className="flex-1 py-6 rounded-[2rem] bg-white/5 text-slate-500 font-black uppercase tracking-[0.2em]">Cancel</button>
                <button type="submit" className="flex-1 py-6 rounded-[2rem] bg-blue-600 text-white font-black uppercase tracking-[0.2em] shadow-xl">Inject Node</button>
              </div>
           </form>
        </div>
      )}

      {(isSidebarOpen && selectedTaskIds.length === 1) && <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[90] animate-in fade-in duration-500" onClick={() => setIsSidebarOpen(false)} />}
    </div>
  );
}
