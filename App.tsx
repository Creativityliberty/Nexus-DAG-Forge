
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
  FolderOpen
} from 'lucide-react';
import { Task, TaskStatus, SubTask, PriorityLevel, TaskComment } from './types';
import DAGVisualizer from './components/DAGVisualizer';
import { generateWorkflow, enhanceTask, generateSubtasks } from './services/geminiService';

const INITIAL_TASKS: Task[] = [
  {
    id: 'T-001',
    title: 'Data Nexus Ingestion',
    description: 'High-throughput stream from distributed edge sensors.',
    status: TaskStatus.DONE,
    dependencies: [],
    owner: 'Root-Admin',
    duration: '240ms',
    priority: 'HIGH',
    subtasks: [
      { id: 'S1', title: 'Socket handshake', completed: true },
      { id: 'S2', title: 'Buffer allocation', completed: true }
    ],
    comments: [
      { id: 'C-INIT', author: 'System', text: 'Pipeline initialized successfully.', timestamp: '1h ago' }
    ]
  },
  {
    id: 'T-002',
    title: 'Semantic Normalizer',
    description: 'Schema enforcement and field mapping.',
    status: TaskStatus.RUNNING,
    dependencies: ['T-001'],
    owner: 'AI-Kernel',
    duration: '1.2s',
    priority: 'MEDIUM',
    subtasks: [
      { id: 'S3', title: 'JSON Validation', completed: true },
      { id: 'S4', title: 'Type casting', completed: false }
    ],
    comments: [{ id: 'C1', author: 'System', text: 'Normalizing large batches...', timestamp: '2m ago' }]
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
  const [isEnhancingForm, setIsEnhancingForm] = useState(false);
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const stats = useMemo(() => ({
    total: tasks.length,
    done: tasks.filter(t => t.status === TaskStatus.DONE).length,
    running: tasks.filter(t => t.status === TaskStatus.RUNNING).length,
    highPriority: tasks.filter(t => t.priority === 'HIGH').length,
  }), [tasks]);

  const selectedTasks = useMemo(() => tasks.filter(t => selectedTaskIds.includes(t.id)), [tasks, selectedTaskIds]);
  const primarySelectedTask = useMemo(() => selectedTasks.length === 1 ? selectedTasks[0] : null, [selectedTasks]);

  const subtaskProgress = useMemo(() => {
    if (!primarySelectedTask || !primarySelectedTask.subtasks || primarySelectedTask.subtasks.length === 0) {
      return { completed: 0, total: 0, percent: 0 };
    }
    const total = primarySelectedTask.subtasks.length;
    const completed = primarySelectedTask.subtasks.filter(s => s.completed).length;
    return {
      completed,
      total,
      percent: Math.round((completed / total) * 100)
    };
  }, [primarySelectedTask]);

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const pushToHistory = useCallback((newTasks: Task[]) => {
    setHistory(prev => {
      const next = prev.slice(0, historyIndex + 1);
      const updatedHistory = [...next, newTasks].slice(-20);
      setHistoryIndex(updatedHistory.length - 1);
      return updatedHistory;
    });
  }, [historyIndex]);

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

  const handleSaveWorkflow = () => {
    try {
      localStorage.setItem('nexus_forge_workflow', JSON.stringify(tasks));
      setNotification({ message: 'Orchestration snapshot saved to local registry.', type: 'success' });
    } catch (e) {
      console.error(e);
      setNotification({ message: 'Failed to write to local registry.', type: 'info' });
    }
  };

  const handleLoadWorkflow = () => {
    const saved = localStorage.getItem('nexus_forge_workflow');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTasks(parsed);
        pushToHistory(parsed);
        setNotification({ message: 'Local orchestration manifest restored.', type: 'success' });
      } catch (e) {
        console.error(e);
        setNotification({ message: 'Corruption detected in local manifest.', type: 'info' });
      }
    } else {
      setNotification({ message: 'No local manifest found in storage.', type: 'info' });
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

  const handleUpdateStatus = (id: string, newStatus: TaskStatus) => {
    const next = tasks.map(t => t.id === id ? { ...t, status: newStatus, lastUpdated: new Date().toISOString() } : t);
    setTasks(next);
    pushToHistory(next);
  };

  const handleBulkUpdateStatus = (newStatus: TaskStatus) => {
    const next = tasks.map(t => selectedTaskIds.includes(t.id) ? { ...t, status: newStatus, lastUpdated: new Date().toISOString() } : t);
    setTasks(next);
    pushToHistory(next);
  };

  const handleBulkUpdatePriority = (newPriority: PriorityLevel) => {
    const next = tasks.map(t => selectedTaskIds.includes(t.id) ? { ...t, priority: newPriority } : t);
    setTasks(next);
    pushToHistory(next);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedTaskIds.length} registry nodes?`)) {
      const next = tasks.filter(t => !selectedTaskIds.includes(t.id));
      setTasks(next);
      setSelectedTaskIds([]);
      pushToHistory(next);
    }
  };

  const handleUpdatePriority = (id: string, newPriority: PriorityLevel) => {
    const next = tasks.map(t => t.id === id ? { ...t, priority: newPriority } : t);
    setTasks(next);
    pushToHistory(next);
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const next = tasks.map(t => {
      if (t.id === taskId && t.subtasks) {
        const updatedSubtasks = t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
        return {
          ...t,
          subtasks: updatedSubtasks
        };
      }
      return t;
    });
    setTasks(next);
  };

  const handleAddComment = () => {
    if (!newCommentText.trim() || !primarySelectedTask) return;
    
    const newComment: TaskComment = {
      id: `C-${Date.now()}`,
      author: 'Operator',
      text: newCommentText,
      timestamp: 'Just now'
    };

    const next = tasks.map(t => {
      if (t.id === primarySelectedTask.id) {
        return {
          ...t,
          comments: [...(t.comments || []), newComment]
        };
      }
      return t;
    });
    
    setTasks(next);
    setNewCommentText('');
    pushToHistory(next);
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
      console.error(err);
    } finally {
      setIsGenerating(false);
      setPrompt('');
    }
  };

  const handleAISuggest = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!formRef.current) return;
    const form = formRef.current;
    const title = (form.elements.namedItem('title') as HTMLInputElement).value;
    const description = (form.elements.namedItem('description') as HTMLTextAreaElement).value;
    if (!title && !description) return;
    setIsEnhancingForm(true);
    try {
      const enhanced = await enhanceTask({ title, description });
      if (enhanced.title) (form.elements.namedItem('title') as HTMLInputElement).value = enhanced.title;
      if (enhanced.description) (form.elements.namedItem('description') as HTMLTextAreaElement).value = enhanced.description;
      if (enhanced.priority) (form.elements.namedItem('priority') as HTMLSelectElement).value = enhanced.priority;
    } finally {
      setIsEnhancingForm(false);
    }
  };

  const handleAISuggestSubtasks = async () => {
    if (!primarySelectedTask) return;
    setIsGeneratingSubtasks(true);
    try {
      const subtasks = await generateSubtasks(primarySelectedTask);
      const next = tasks.map(t => t.id === primarySelectedTask.id ? { ...t, subtasks } : t);
      setTasks(next);
      pushToHistory(next);
    } finally {
      setIsGeneratingSubtasks(false);
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
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#0f172a_0%,#020617_100%)]"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[180px] rounded-full animate-pulse opacity-50"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay"></div>
      </div>

      {/* Global Notifications */}
      {notification && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4 fade-in duration-500">
           <div className={`px-6 py-3 rounded-2xl glass-heavy border shadow-2xl flex items-center gap-4 ${notification.type === 'success' ? 'border-green-500/40 text-green-400' : 'border-blue-500/40 text-blue-400'}`}>
              {notification.type === 'success' ? <CheckCircle2 size={18} /> : <Info size={18} />}
              <span className="text-xs font-black uppercase tracking-widest">{notification.message}</span>
           </div>
        </div>
      )}

      <nav className="w-20 border-r border-white/5 flex flex-col items-center py-8 gap-8 relative z-50 glass-2">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)] relative group overflow-hidden">
          <Workflow size={24} className="text-white relative z-10" />
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        </div>
        <div className="flex flex-col gap-4">
          {[
            { icon: Layers, label: 'Orchestrator' },
            { icon: Activity, label: 'Analytics' },
            { icon: Settings, label: 'Protocols' }
          ].map((item, i) => (
            <button key={i} className="w-12 h-12 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all flex items-center justify-center group relative">
              <item.icon size={22} />
              <span className="absolute left-16 bg-slate-900 px-3 py-1.5 rounded-lg text-[10px] font-black invisible group-hover:visible whitespace-nowrap z-50 border border-white/10 uppercase tracking-[0.2em] shadow-2xl">
                {item.label}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-auto pb-4 space-y-4">
          <button 
            onClick={() => setLassoEnabled(!lassoEnabled)}
            title="Lasso Selection"
            className={`w-12 h-12 rounded-xl transition-all flex items-center justify-center border shadow-lg ${lassoEnabled ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'text-slate-500 border-white/5 bg-white/5 hover:text-white'}`}
          >
            <MousePointer2 size={20} />
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col relative z-10 p-6 gap-6 min-w-0">
        <header className="h-20 glass-2 rounded-[2.5rem] px-10 flex items-center justify-between border border-white/10 shadow-2xl">
          <div className="flex items-center gap-8">
            <div>
              <h1 className="font-black text-2xl tracking-tighter text-white flex items-center gap-3">
                NEXUS <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300 italic">FORGE PRO</span>
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Synapse Engine v5.2.2</span>
              </div>
            </div>
            <div className="h-10 w-px bg-white/10 hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-4">
              <button onClick={undo} disabled={historyIndex <= 0} className="p-2.5 rounded-xl hover:bg-white/5 text-slate-500 disabled:opacity-10 transition-colors" title="Undo"><History size={18} className="rotate-180" /></button>
              <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2.5 rounded-xl hover:bg-white/5 text-slate-500 disabled:opacity-10 transition-colors" title="Redo"><History size={18} /></button>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="hidden lg:flex gap-6 text-center items-center">
              {selectedTaskIds.length > 0 && (
                <div className="bg-blue-600/10 border border-blue-500/20 px-4 py-2 rounded-2xl flex items-center gap-3 animate-in zoom-in duration-300 shadow-xl">
                  <LayoutGrid size={14} className="text-blue-400" />
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Active Multi-Selection:</span>
                  <span className="text-sm font-mono font-bold text-blue-400 px-2 py-0.5 bg-blue-500/20 rounded-lg">{selectedTaskIds.length}</span>
                </div>
              )}
              <div className="flex gap-4">
                <button 
                  onClick={handleSaveWorkflow} 
                  className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-blue-500/40 transition-all group relative"
                  title="SAVE_ORCHESTRATION"
                >
                  <Save size={18} />
                  <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-[8px] font-black invisible group-hover:visible whitespace-nowrap border border-white/10 uppercase tracking-widest">SAVE_LOCALLY</span>
                </button>
                <button 
                  onClick={handleLoadWorkflow} 
                  className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-indigo-500/40 transition-all group relative"
                  title="LOAD_ORCHESTRATION"
                >
                  <FolderOpen size={18} />
                  <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-[8px] font-black invisible group-hover:visible whitespace-nowrap border border-white/10 uppercase tracking-widest">LOAD_LOCALLY</span>
                </button>
              </div>
              <div className="w-px h-8 bg-white/5 mx-2"></div>
              <div><p className="text-[8px] font-black text-slate-600 uppercase">Critical</p><p className="text-sm font-mono font-bold text-red-400">{stats.highPriority}</p></div>
              <div><p className="text-[8px] font-black text-slate-600 uppercase">Active</p><p className="text-sm font-mono font-bold text-blue-400">{stats.running}</p></div>
            </div>
            <button onClick={() => setIsExportOpen(true)} className="px-7 py-3 rounded-2xl bg-slate-900 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] hover:border-blue-500/50 transition-all flex items-center gap-3 shadow-xl">
              <Download size={14} className="text-blue-400" /> DEPLOY_MANIFEST
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
          
          <div className="h-24 glass-2 rounded-[3rem] flex items-center px-10 gap-8 border border-white/10 group shadow-2xl relative overflow-hidden transition-all focus-within:ring-2 ring-blue-500/20">
            <div className="absolute inset-0 bg-blue-500/5 translate-y-full group-focus-within:translate-y-0 transition-transform duration-700 pointer-events-none"></div>
            <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600/10 text-blue-500 flex items-center justify-center flex-shrink-0 border border-blue-500/20 z-10 shadow-inner group-hover:scale-105 transition-transform">
              <Terminal size={28} />
            </div>
            <div className="flex-1 z-10">
              <input 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateAI()}
                className="w-full bg-transparent border-none outline-none text-2xl font-bold text-white placeholder:text-slate-800" 
                placeholder="Instruct the neural core for workflow synthesis..." 
              />
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                AI Core Online // Command: ARCHITECT_SYNAPSE
              </p>
            </div>
            <button 
              onClick={handleGenerateAI}
              disabled={isGenerating || !prompt.trim()}
              className="px-12 py-4.5 rounded-[1.5rem] bg-blue-600 text-white font-black uppercase tracking-[0.2em] hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/40 disabled:opacity-50 flex items-center gap-4 z-10 active:scale-95"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
              <span className="text-xs">Synthesize</span>
            </button>
          </div>
        </div>

        <footer className="h-16 glass-2 rounded-3xl border border-white/5 flex items-center px-8 gap-6 shadow-xl relative">
          {/* Selection HUD */}
          {selectedTaskIds.length > 0 && (
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 glass-heavy rounded-2xl border border-blue-500/40 px-6 py-3 flex items-center gap-8 shadow-[0_0_60px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 pr-6 border-r border-white/10">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest whitespace-nowrap">Group Context: {selectedTaskIds.length} Nodes</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button onClick={() => handleBulkUpdateStatus(TaskStatus.DONE)} className="p-2.5 rounded-xl hover:bg-green-500/20 text-green-400 transition-all group relative" title="Mark Selection as Done">
                  <CheckCircle2 size={20} />
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-[8px] invisible group-hover:visible whitespace-nowrap border border-white/5 uppercase">DONE</span>
                </button>
                <button onClick={() => handleBulkUpdateStatus(TaskStatus.RUNNING)} className="p-2.5 rounded-xl hover:bg-blue-500/20 text-blue-400 transition-all group relative" title="Start Selection">
                  <Play size={20} fill="currentColor" />
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-[8px] invisible group-hover:visible whitespace-nowrap border border-white/5 uppercase">RUN</span>
                </button>
                <button onClick={() => handleBulkUpdateStatus(TaskStatus.FAILED)} className="p-2.5 rounded-xl hover:bg-red-400/20 text-red-400 transition-all group relative" title="Mark Selection as Failed">
                  <AlertCircle size={20} />
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-[8px] invisible group-hover:visible whitespace-nowrap border border-white/5 uppercase">FAILED</span>
                </button>
                <div className="w-px h-6 bg-white/10 mx-2"></div>
                <button onClick={() => handleBulkUpdatePriority('HIGH')} className="p-2.5 rounded-xl hover:bg-red-500/20 text-red-400 transition-all group relative" title="Set Selection Priority: HIGH">
                  <ShieldAlert size={20} />
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-[8px] invisible group-hover:visible whitespace-nowrap border border-white/5 uppercase">PRIORITY_HIGH</span>
                </button>
                <button onClick={handleBulkDelete} className="p-2.5 rounded-xl hover:bg-red-600/30 text-red-500 transition-all group relative" title="Delete Selection">
                  <Trash2 size={20} />
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-[8px] invisible group-hover:visible whitespace-nowrap border border-white/5 uppercase">PURGE_NODES</span>
                </button>
              </div>

              <button onClick={() => setSelectedTaskIds([])} className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-all ml-2" title="Clear Selection">
                <X size={20} />
              </button>
            </div>
          )}

          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3"><Clock size={14} className="text-blue-500" /> Registry Timeline</span>
          <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar py-2">
            {history.map((_, i) => (
              <button key={i} onClick={() => { setHistoryIndex(i); setTasks(history[i]); }} className={`h-2.5 min-w-[36px] rounded-full transition-all duration-500 ${i === historyIndex ? 'bg-blue-500 w-12 shadow-[0_0_10px_#3b82f6]' : i < historyIndex ? 'bg-slate-700/60' : 'bg-slate-900/60'}`} />
            ))}
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase">v{historyIndex + 1}.synapse</span>
        </footer>
      </main>

      {/* Inspector Sidebar */}
      <aside className={`fixed inset-y-0 right-0 w-[550px] glass-heavy border-l border-white/10 z-[100] transform transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-2xl ${isSidebarOpen && selectedTaskIds.length === 1 ? 'translate-x-0' : 'translate-x-full'}`}>
        {primarySelectedTask && (
          <div className="h-full flex flex-col">
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-inner"><Box size={28}/></div>
                <div><h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Node Analysis</h2><p className="text-[10px] font-mono text-slate-500 uppercase mt-1">Registry Context Layer</p></div>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="w-12 h-12 rounded-2xl hover:bg-white/5 text-slate-500 hover:text-white transition-all flex items-center justify-center border border-white/10"><X size={24}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 space-y-12 no-scrollbar">
              <section className="space-y-6">
                 <div className="flex items-center gap-5">
                   <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-2xl border border-white/5">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Severity:</span>
                     <select 
                        value={primarySelectedTask.priority || 'MEDIUM'}
                        onChange={(e) => handleUpdatePriority(primarySelectedTask.id, e.target.value as PriorityLevel)}
                        className={`text-[10px] font-black uppercase bg-transparent outline-none cursor-pointer ${primarySelectedTask.priority === 'HIGH' ? 'text-red-400' : primarySelectedTask.priority === 'LOW' ? 'text-emerald-400' : 'text-amber-400'}`}
                     >
                       <option value="LOW">LOW</option><option value="MEDIUM">MEDIUM</option><option value="HIGH">HIGH</option>
                     </select>
                   </div>
                   <div className="px-4 py-2 rounded-2xl bg-slate-900/80 border border-white/5 font-mono text-[10px] text-slate-500">REF: {primarySelectedTask.id}</div>
                 </div>
                 <h3 className="text-5xl font-black text-white tracking-tighter mb-4">{primarySelectedTask.title}</h3>
                 <p className="text-slate-400 text-lg leading-relaxed font-medium bg-slate-900/40 p-6 rounded-[2rem] border border-white/5">{primarySelectedTask.description}</p>
              </section>

              {/* Node Metadata (Owner) Section */}
              <section className="space-y-4">
                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3"><User size={16} className="text-indigo-400" /> Assigned Authority</h4>
                <div className="p-6 rounded-[1.8rem] bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white uppercase tracking-tight">{primarySelectedTask.owner || 'System_Automaton'}</p>
                      <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Authority ID: {primarySelectedTask.id}-AUTH</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[8px] font-black text-green-400 uppercase tracking-widest">Verified</span>
                  </div>
                </div>
              </section>

              <section className="space-y-8">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3"><Zap size={16} className="text-blue-500" /> Operational Morsels</h4>
                  <button onClick={handleAISuggestSubtasks} disabled={isGeneratingSubtasks} className="text-[10px] font-black text-blue-500 uppercase flex items-center gap-2 hover:text-blue-400 transition-colors">
                    {isGeneratingSubtasks ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} RE-SYNAPSE
                  </button>
                </div>

                {/* Enhanced Subtask Progress Bar */}
                {primarySelectedTask.subtasks && primarySelectedTask.subtasks.length > 0 && (
                  <div className="p-8 rounded-[2rem] bg-slate-900/40 border border-white/5 space-y-4 shadow-inner">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Synchronization State</span>
                        <div className="flex items-center gap-3">
                          <BarChart3 size={18} className="text-blue-500" />
                          <span className="text-2xl font-black text-white">{subtaskProgress.percent}%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-500 block uppercase">{subtaskProgress.completed} / {subtaskProgress.total}</span>
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">Morsels Locked</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden border border-white/5 p-0.5">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                        style={{ width: `${subtaskProgress.percent}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {primarySelectedTask.subtasks?.length ? primarySelectedTask.subtasks.map(sub => (
                    <button key={sub.id} onClick={() => handleToggleSubtask(primarySelectedTask.id, sub.id)} className="w-full p-6 rounded-[1.8rem] bg-slate-900/60 border border-white/5 flex items-center gap-5 group hover:border-blue-500/30 transition-all text-left">
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all duration-500 ${sub.completed ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'border-slate-700 text-transparent group-hover:border-slate-500 bg-white/5'}`}><CheckCircle2 size={18} /></div>
                      <div className="flex-1"><span className={`block font-bold text-base transition-all ${sub.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{sub.title}</span><span className="text-[9px] font-mono text-slate-700 uppercase">SUB_ID: {sub.id}</span></div>
                    </button>
                  )) : <div className="p-10 border border-dashed border-white/5 rounded-[2rem] text-center text-slate-600 text-sm font-medium">No morsels defined. <button onClick={handleAISuggestSubtasks} className="text-blue-500 uppercase font-black text-[10px] ml-2">Generate Now</button></div>}
                </div>
              </section>

              {/* Registry Logs (Comments) Section */}
              <section className="space-y-6 pb-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3"><MessageSquare size={16} className="text-emerald-400" /> Registry Logs</h4>
                  <span className="text-[9px] font-mono text-slate-600 uppercase">Status: {primarySelectedTask.comments?.length || 0} entries</span>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
                  {primarySelectedTask.comments?.map((comment) => (
                    <div key={comment.id} className="p-5 rounded-[1.5rem] bg-slate-900/40 border border-white/5 space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-blue-600/20 flex items-center justify-center text-blue-400 border border-blue-500/20">
                            <Terminal size={10} />
                          </div>
                          <span className="text-[10px] font-black text-white uppercase tracking-tight">{comment.author}</span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-600 uppercase">{comment.timestamp}</span>
                      </div>
                      <p className="text-[12px] text-slate-400 leading-relaxed font-medium pl-7">{comment.text}</p>
                    </div>
                  ))}
                  {!primarySelectedTask.comments?.length && (
                    <div className="p-8 border border-dashed border-white/5 rounded-[1.5rem] text-center">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">No registry logs detected.</p>
                    </div>
                  )}
                </div>

                {/* Add Comment Input Area */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-600 group-focus-within:text-blue-500 transition-colors">
                    <Hash size={14} />
                  </div>
                  <input 
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    placeholder="Input log entry..."
                    className="w-full bg-slate-950/60 border border-white/5 rounded-2xl py-4 pl-12 pr-14 text-xs text-white placeholder:text-slate-700 outline-none focus:border-blue-500/40 transition-all shadow-inner"
                  />
                  <button 
                    onClick={handleAddComment}
                    disabled={!newCommentText.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white disabled:opacity-30 disabled:hover:bg-blue-600/10 disabled:hover:text-blue-500 flex items-center justify-center transition-all"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </section>
            </div>

            <div className="p-10 border-t border-white/5 grid grid-cols-2 gap-6 bg-slate-950/60 backdrop-blur-3xl">
               <button onClick={() => handleUpdateStatus(primarySelectedTask.id, TaskStatus.RUNNING)} className="py-6 rounded-[1.5rem] bg-blue-600 text-white font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/40 flex items-center justify-center gap-3"><Play size={22} fill="currentColor" /> Initialize</button>
               <button onClick={() => handleUpdateStatus(primarySelectedTask.id, TaskStatus.DONE)} className="py-6 rounded-[1.5rem] bg-slate-900 border border-white/10 text-green-400 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3"><CheckCircle2 size={22} /> Complete</button>
            </div>
          </div>
        )}
      </aside>

      {isCreatingTask && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl" onClick={() => setIsCreatingTask(false)}></div>
           <form ref={formRef} id="manual-task-form" className="w-full max-w-2xl glass-heavy rounded-[3.5rem] p-14 border border-white/10 shadow-2xl relative z-10 overflow-hidden" onSubmit={handleManualInject}>
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-500"></div>
              <div className="flex justify-between items-center mb-12">
                <div><h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Manual Injection</h2><p className="text-[10px] font-mono text-slate-500 uppercase mt-2 tracking-widest">Force register node</p></div>
                <button type="button" onClick={handleAISuggest} disabled={isEnhancingForm} className="px-6 py-3 rounded-2xl bg-blue-600/10 border border-blue-500/40 text-blue-400 text-[11px] font-black uppercase flex items-center gap-3 disabled:opacity-50">{isEnhancingForm ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} AI_AUGMENT</button>
              </div>
              <div className="space-y-8">
                <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] ml-6">Registry Title</label><input required name="title" className="w-full bg-slate-950/60 border border-white/10 rounded-3xl p-6 text-white text-xl font-bold outline-none focus:border-blue-500/60 transition-all shadow-inner" placeholder="e.g. Lambda Deployment System" /></div>
                <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] ml-6">Specifications</label><textarea required name="description" className="w-full bg-slate-950/60 border border-white/10 rounded-3xl p-6 text-white text-sm outline-none focus:border-blue-500/60 h-36 resize-none font-medium leading-relaxed shadow-inner" placeholder="Objective details..." /></div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] ml-6">Criticality</label><select name="priority" className="w-full bg-slate-950/60 border border-white/10 rounded-3xl p-6 text-white outline-none focus:border-blue-500/60 appearance-none font-bold text-sm shadow-inner uppercase"><option value="LOW">LOW</option><option value="MEDIUM">MEDIUM</option><option value="HIGH">HIGH</option></select></div>
                  <div className="space-y-3"><label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] ml-6">Upstream Links (IDs)</label><input name="deps" className="w-full bg-slate-950/60 border border-white/10 rounded-3xl p-6 text-white font-mono text-xs outline-none focus:border-blue-500/60 shadow-inner" placeholder="T-001, T-002" /></div>
                </div>
              </div>
              <div className="flex gap-6 pt-12">
                <button type="button" onClick={() => setIsCreatingTask(false)} className="flex-1 py-6 rounded-[1.5rem] bg-white/5 text-slate-500 font-black uppercase tracking-[0.2em] hover:text-white transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-6 rounded-[1.5rem] bg-blue-600 text-white font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">Inject Protocol</button>
              </div>
           </form>
        </div>
      )}

      {isExportOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setIsExportOpen(false)}></div>
           <div className="w-full max-w-3xl glass-heavy rounded-[4rem] p-16 border border-white/10 shadow-2xl relative z-10">
              <div className="flex justify-between items-center mb-12"><div><h2 className="text-4xl font-black text-white italic uppercase leading-none">Manifest Export</h2><p className="text-[11px] font-mono text-slate-500 uppercase mt-2 tracking-[0.3em]">Codebase generation module</p></div><button onClick={() => setIsExportOpen(false)} className="text-slate-600 hover:text-white w-14 h-14 rounded-2xl hover:bg-white/5 transition-all border border-white/5"><X size={28}/></button></div>
              <div className="grid grid-cols-2 gap-8">
                {[{ title: 'Argo Workflow', icon: Cloud, action: () => {} }, { title: 'Raw Nexus JSON', icon: Terminal, action: () => {} }].map((item, i) => (
                  <button key={i} onClick={item.action} className="p-10 rounded-[2.5rem] bg-slate-900/60 border border-white/5 hover:border-blue-500/40 transition-all text-left group flex flex-col items-start gap-6">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-all"><item.icon size={36} /></div>
                    <div><h3 className="text-xl font-black text-white uppercase tracking-tighter">{item.title}</h3><p className="text-[10px] text-slate-600 mt-2 uppercase font-black">Generation Module</p></div>
                  </button>
                ))}
              </div>
           </div>
        </div>
      )}

      <button onClick={() => setIsCreatingTask(true)} className="fixed bottom-32 right-12 w-20 h-20 rounded-[2.5rem] bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 group z-[50]" title="Manual Inject">
         <Plus size={40} className="group-hover:rotate-90 transition-transform duration-700" />
      </button>

      {(isSidebarOpen && selectedTaskIds.length === 1) && <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[90] animate-in fade-in duration-700" onClick={() => setIsSidebarOpen(false)} />}
    </div>
  );
}
