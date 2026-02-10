
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  Plus, Sparkles, Trash2, Play, CheckCircle2, AlertCircle, X, Terminal, Settings, Activity, Workflow,
  Command, ArrowUpRight, Layers, Loader2, Cpu, Layers2, History, Download, MousePointer2, MessageSquare,
  Clock, ChevronRight, FileCode, Box, Cloud, Database, Zap, Info, Check, LayoutGrid, ShieldAlert,
  BarChart3, User, Send, Hash, Save, FolderOpen, Wand2, Monitor, Layout, Pause, AlertTriangle, ShieldCheck,
  Search, ExternalLink, Globe, HardDrive, FileText, ClipboardList, Package, Share2, FileType, Code2, Bot, Menu
} from 'lucide-react';
import { Task, TaskStatus, SubTask, PriorityLevel, TaskComment, Artifact } from './types';
import DAGVisualizer from './components/DAGVisualizer';
import NeuralBoard from './components/NeuralBoard';
import MissionRecap from './components/MissionRecap';
import ArtifactRepository from './components/ArtifactRepository';
import NeuralTerminal from './components/NeuralTerminal';
import AgentChatOverlay from './components/AgentChatOverlay';
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'flow' | 'board' | 'recap' | 'artifacts'>('flow');
  const [lassoEnabled, setLassoEnabled] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState(0);
  const [isEnhancingSidebar, setIsEnhancingSidebar] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);
  
  const [logs, setLogs] = useState<{id: string, timestamp: string, type: 'INFO' | 'WARN' | 'SYNC' | 'PACKET', message: string, source: string}[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [terminalExpanded, setTerminalExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const stats = useMemo(() => ({
    total: tasks.length,
    active: tasks.filter(t => t.status === TaskStatus.RUNNING).length,
    pending: tasks.filter(t => t.status === TaskStatus.PENDING).length,
    critical: tasks.filter(t => t.priority === 'HIGH').length,
    completed: tasks.filter(t => t.status === TaskStatus.DONE).length,
  }), [tasks]);

  const effectiveness = useMemo(() => stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0, [stats]);

  const selectedTasks = useMemo(() => tasks.filter(t => selectedTaskIds.includes(t.id)), [tasks, selectedTaskIds]);
  const primarySelectedTask = useMemo(() => selectedTasks.length === 1 ? selectedTasks[0] : null, [selectedTasks]);

  useEffect(() => {
    const interval = setInterval(() => {
        if (tasks.length === 0) return;
        const types: ('INFO' | 'SYNC' | 'PACKET')[] = ['INFO', 'SYNC', 'PACKET'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
        const messages = [
            `Handshake validated with ${randomTask.id}`,
            `Buffer flushed: ${Math.floor(Math.random() * 500)}ms latency`,
            `Neural weights updated for node ${randomTask.id.split('-')[1]}`,
            `Syncing local cache...`,
            `Telemetry received from Edge_Node_${Math.floor(Math.random() * 99)}`
        ];
        
        const newLog = {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString().split(' ')[0],
            type: randomType,
            message: messages[Math.floor(Math.random() * messages.length)],
            source: randomTask.owner || 'System'
        };

        setLogs(prev => [...prev.slice(-49), newLog]);
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
    setLogs(prev => [...prev, {id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), type: 'WARN', message: 'Initiating Neural Synthesis...', source: 'Gemini_Core'}]);
    try {
      const newTasks = await generateWorkflow(prompt);
      if (newTasks.length > 0) {
        setTasks(newTasks);
        pushToHistory(newTasks);
        setSelectedTaskIds([]);
        setIsSidebarOpen(false);
        setLogs(prev => [...prev, {id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), type: 'SYNC', message: 'Topology Refreshed.', source: 'Gemini_Core'}]);
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

  const exportMission = (format: 'json' | 'pdf' | 'img' | 'ld' | 'md' | 'mermaid') => {
    const data = {
      mission: prompt,
      timestamp: new Date().toISOString(),
      tasks,
      stats: {
        effectiveness,
        totalTasks: tasks.length,
        completed: stats.completed,
        critical: stats.critical
      }
    };

    let content = '';
    let type = 'text/plain';
    let ext: string = format;

    switch(format) {
      case 'json':
      case 'ld':
        content = JSON.stringify(data, null, 2);
        type = 'application/json';
        break;
      case 'md':
        content = `# Mission Recap: NEXUS_FORGE\n\n`;
        content += `**Objective**: ${prompt}\n`;
        content += `**Timestamp**: ${data.timestamp}\n\n`;
        content += `## Stats Overview\n`;
        content += `- Effectiveness: ${effectiveness}%\n`;
        content += `- Total Tasks: ${stats.total}\n`;
        content += `- Completed: ${stats.completed}\n\n`;
        content += `## Task Manifest\n`;
        tasks.forEach(t => {
          content += `### [${t.status}] ${t.title} (${t.id})\n`;
          content += `- Owner: ${t.owner || 'Unassigned'}\n`;
          content += `- Priority: ${t.priority}\n`;
          content += `- Dependencies: ${t.dependencies.join(', ') || 'None'}\n`;
          content += `> ${t.description}\n\n`;
          if (t.artifacts && t.artifacts.length > 0) {
            content += `#### Neural Artifacts\n`;
            t.artifacts.forEach(a => {
              const lang = a.type === 'json' ? 'json' : 'typescript';
              content += `- **${a.label}** (${a.type})\n\`\`\`${lang}\n${a.content}\n\`\`\`\n\n`;
            });
          }
        });
        type = 'text/markdown';
        break;
      case 'mermaid':
        content = `graph LR\n`;
        tasks.forEach(t => {
          const style = t.status === TaskStatus.DONE ? 'stroke:#10b981,stroke-width:2px' : 
                        t.status === TaskStatus.RUNNING ? 'stroke:#3b82f6,stroke-width:2px' : '';
          content += `  ${t.id.replace('-','_')}("${t.title}")\n`;
          if (style) content += `  style ${t.id.replace('-','_')} ${style}\n`;
          t.dependencies.forEach(dep => {
            content += `  ${dep.replace('-','_')} --> ${t.id.replace('-','_')}\n`;
          });
        });
        type = 'text/plain';
        ext = 'mermaid.txt';
        break;
      case 'pdf':
      case 'img':
        window.print();
        setIsExportMenuOpen(false);
        return;
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexus_mission_${Date.now()}.${ext}`;
    link.click();
    
    setNotification({ message: `Exporting as ${format.toUpperCase()}...`, type: 'info' });
    setIsExportMenuOpen(false);
  };

  const navItems = [
    { mode: 'flow', icon: Layers, label: 'FLOW' },
    { mode: 'board', icon: LayoutGrid, label: 'BOARD' },
    { mode: 'recap', icon: ClipboardList, label: 'RECAP' },
    { mode: 'artifacts', icon: Package, label: 'ARTIFACTS' }
  ];

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#0f172a_0%,#020617_100%)] pointer-events-none"></div>
      
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[500] animate-in slide-in-from-top-4 fade-in duration-500">
           <div className={`px-4 md:px-6 py-2 md:py-3 rounded-2xl glass-heavy border shadow-2xl flex items-center gap-3 md:gap-4 ${
             notification.type === 'success' ? 'border-green-500/40 text-green-400' : 
             notification.type === 'error' ? 'border-red-500/40 text-red-400' : 'border-blue-500/40 text-blue-400'
           }`}>
              <Info size={16} />
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{notification.message}</span>
           </div>
        </div>
      )}

      {/* Deployment Modal Overlay */}
      {isDeploying && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/90 backdrop-blur-3xl animate-in fade-in duration-500 p-6">
           <div className="max-w-xl w-full p-8 md:p-12 glass-heavy rounded-[2.5rem] md:rounded-[3rem] border border-blue-500/30 shadow-[0_0_100px_rgba(37,99,235,0.2)] overflow-y-auto max-h-[90vh]">
              <div className="flex flex-col items-center gap-6 md:gap-8 text-center">
                 <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-blue-600/10 border border-blue-500/30 flex items-center justify-center">
                    <Cloud size={40} className="text-blue-500 animate-pulse" />
                 </div>
                 <div>
                    <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter uppercase">Initializing_Deploy</h2>
                    <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-2">Synapse_Link_Orchestration</p>
                 </div>
                 <div className="w-full space-y-3">
                    {[
                      { l: 'Building Artifacts', s: deployStep >= 1 },
                      { l: 'Provisioning Infrastructure', s: deployStep >= 2 },
                      { l: 'Syncing Data Nodes', s: deployStep >= 3 },
                      { l: 'Final Validation', s: deployStep >= 4 }
                    ].map((step, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all ${step.s ? 'bg-blue-600/10 border-blue-500/40 text-white' : 'border-white/5 text-slate-600'}`}>
                        {step.s ? <CheckCircle2 size={14} className="text-blue-500" /> : <div className="w-3.5 h-3.5 rounded-full border border-current" />}
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{step.l}</span>
                      </div>
                    ))}
                 </div>
                 {deployStep < 4 && <Loader2 className="animate-spin text-blue-500 mt-2" size={28} />}
              </div>
           </div>
        </div>
      )}

      {/* Mobile Nav Overlay */}
      {isNavOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[400] lg:hidden" 
          onClick={() => setIsNavOpen(false)}
        />
      )}

      {/* Sidebar Navigation - Rail/Sidebar Hybrid */}
      <nav className={`fixed lg:relative inset-y-0 left-0 w-20 border-r border-white/5 flex flex-col items-center py-6 gap-6 z-[450] glass-heavy transition-transform duration-300 ${isNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)] relative">
          <Workflow size={24} className="text-white" />
        </div>
        <div className="flex flex-col gap-4">
          {navItems.map(item => (
            <button 
              key={item.mode} 
              onClick={() => { setViewMode(item.mode as any); setIsNavOpen(false); }} 
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
           <button onClick={() => handleGenerateAI()} className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white hover:scale-105 transition-all shadow-lg">
             <Plus size={24} />
           </button>
        </div>
      </nav>

      {/* Main Orchestration Layer */}
      <main className="flex-1 flex flex-col p-4 md:p-6 gap-4 md:gap-6 min-w-0 relative z-10 overflow-hidden">
        {/* Responsive Header */}
        <header className="h-20 min-h-[80px] md:h-24 md:min-h-[96px] glass-heavy rounded-[1.5rem] md:rounded-[2.5rem] px-6 md:px-10 flex items-center justify-between border border-white/5 shadow-2xl relative">
          <button 
            className="lg:hidden p-2.5 mr-4 rounded-xl bg-white/5 text-slate-400" 
            onClick={() => setIsNavOpen(true)}
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center gap-4 md:gap-10 flex-1 min-w-0">
            <div className="flex flex-col shrink-0">
              <h1 className="font-black text-xl md:text-3xl tracking-tighter text-white italic leading-none">NEXUS_FORGE</h1>
              <p className="text-[7px] md:text-[9px] font-black text-blue-500 uppercase tracking-[0.3em] md:tracking-[0.5em] mt-1.5 md:mt-2 animate-pulse truncate">HYPER_CONNECTED</p>
            </div>
            
            <div className="hidden sm:block h-10 w-px bg-white/10 shrink-0 mx-2 md:mx-4"></div>

            <div className="hidden xs:flex gap-6 md:gap-10 items-center shrink-0">
              <div className="text-center min-w-[50px] md:min-w-[60px]">
                <p className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest">Efficiency</p>
                <p className="text-lg md:text-xl font-mono font-bold text-blue-400 leading-none">{effectiveness}%</p>
              </div>
              <div className="hidden md:block text-center min-w-[60px]">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active</p>
                <p className="text-xl font-mono font-bold text-white leading-none">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
             <div className="hidden sm:flex gap-2">
                <button onClick={handleSaveWorkflow} className="p-2.5 md:p-3.5 rounded-2xl bg-white/5 text-slate-400 border border-white/5 hover:border-blue-500/50 hover:text-white transition-all"><Save size={16} md:size={18} /></button>
                <div className="relative">
                  <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="p-2.5 md:p-3.5 rounded-2xl bg-white/5 text-slate-400 border border-white/5 hover:border-blue-500/50 hover:text-white transition-all"><Download size={16} md:size={18} /></button>
                  {isExportMenuOpen && (
                    <div className="absolute top-14 right-0 w-56 md:w-64 glass-heavy rounded-[1.2rem] md:rounded-[1.5rem] border border-blue-500/30 p-2 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-[600] animate-in fade-in slide-in-from-top-4 duration-300">
                       {[
                         { id: 'json', label: 'JSON_MANIFEST', icon: FileType },
                         { id: 'md', label: 'MARKDOWN_RECAP', icon: FileText },
                         { id: 'mermaid', label: 'MERMAID_DAG', icon: Code2 },
                         { id: 'ld', label: 'LINKED_DATA', icon: Share2 },
                         { id: 'pdf', label: 'PDF_REPORT', icon: FileText }
                       ].map(f => (
                         <button 
                           key={f.id} 
                           onClick={() => exportMission(f.id as any)}
                           className="w-full flex items-center gap-3 md:gap-4 p-2.5 md:p-3.5 rounded-xl hover:bg-blue-600/10 text-[8px] md:text-[9px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-all"
                         >
                           <f.icon size={14} md:size={16} className="text-blue-500" /> {f.label}
                         </button>
                       ))}
                    </div>
                  )}
                </div>
             </div>
             <button onClick={handleDeploy} className="px-5 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl bg-blue-600 text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] hover:bg-blue-500 transition-all flex items-center gap-2 md:gap-3 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95">
                <Globe size={14} md:size={16} /> <span className="hidden xs:inline">DEPLOY_CORE</span>
             </button>
          </div>
        </header>

        {/* Content Dynamic Layer */}
        <div className="flex-1 flex flex-col gap-4 md:gap-8 min-h-0 overflow-hidden relative">
          <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
            {viewMode === 'flow' && (
              <div className="flex-1 flex flex-col min-h-0">
                <DAGVisualizer tasks={tasks} onSelectTask={handleSelectTask} selectedTaskIds={selectedTaskIds} lassoEnabled={lassoEnabled} />
              </div>
            )}
            {viewMode === 'board' && <NeuralBoard tasks={tasks} onSelectTask={handleSelectTask} />}
            {viewMode === 'recap' && <MissionRecap tasks={tasks} originalPrompt={prompt} />}
            {viewMode === 'artifacts' && <ArtifactRepository tasks={tasks} />}
          </div>
          
          {/* Terminal / Logging Section */}
          <div className={`shrink-0 transition-all duration-500 ${terminalExpanded ? 'h-[400px]' : 'h-12'}`}>
             <div className="flex h-full flex-col relative">
               <div className="absolute -top-10 right-4 z-20">
                 <button 
                  onClick={() => setTerminalExpanded(!terminalExpanded)}
                  className="px-4 py-1.5 rounded-t-xl glass-heavy border-t border-x border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-400 transition-all"
                 >
                   {terminalExpanded ? 'Minimize_Stream' : 'Expand_Stream'}
                 </button>
               </div>
               <div className="flex-1 overflow-hidden">
                 <NeuralTerminal logs={logs} />
               </div>
             </div>
          </div>

          {/* Prompt Hub - Refined Ergonomics */}
          {selectedTaskIds.length === 0 && !terminalExpanded && (
            <div className="absolute bottom-12 md:bottom-20 left-1/2 -translate-x-1/2 z-[50] w-full max-w-2xl px-4 animate-in slide-in-from-bottom-8 duration-700">
                <div className="glass-heavy rounded-[1.5rem] md:rounded-[2rem] p-3 md:p-4 border border-blue-500/20 shadow-[0_0_60px_rgba(0,0,0,0.6)] flex items-end gap-3 md:gap-4 backdrop-blur-3xl">
                    <textarea 
                        ref={textareaRef}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerateAI(); } }}
                        placeholder="Inject topology instructions here..."
                        className="flex-1 bg-transparent border-none outline-none text-sm md:text-base font-bold text-white px-3 md:px-4 py-2 placeholder:text-slate-600 resize-none min-h-[40px] max-h-[120px] no-scrollbar leading-relaxed"
                    />
                    <button 
                      onClick={handleGenerateAI} 
                      disabled={isGenerating || !prompt.trim()} 
                      className="h-10 md:h-12 px-5 md:px-8 bg-blue-600 rounded-xl md:rounded-2xl text-white font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:bg-blue-500 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 shrink-0"
                    >
                       {isGenerating ? <Loader2 className="animate-spin" size={12}/> : <Zap size={12} />} <span className="hidden xs:inline">SYNTHESIZE</span>
                    </button>
                </div>
            </div>
          )}

          {/* Batch Actions Footer */}
          {selectedTaskIds.length > 0 && (
            <div className="absolute top-2 md:top-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-8 duration-500 w-full max-w-[95vw] md:max-w-max px-4">
              <footer className="h-16 md:h-20 glass-heavy rounded-2xl md:rounded-3xl border border-blue-500/40 flex items-center px-4 md:px-10 gap-3 md:gap-8 shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-x-auto no-scrollbar">
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest whitespace-nowrap hidden sm:inline">Selection: {selectedTaskIds.length} Nodes</span>
                <div className="flex gap-2 md:gap-4 shrink-0">
                  <button onClick={() => handleBulkUpdateStatus(TaskStatus.RUNNING)} className="px-4 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center gap-2 text-[9px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all"><Play size={12} fill="currentColor" /> Play</button>
                  <button onClick={() => handleBulkUpdateStatus(TaskStatus.PENDING)} className="px-4 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-xl bg-slate-800 text-slate-400 border border-white/5 flex items-center gap-2 text-[9px] font-black uppercase hover:bg-slate-700 hover:text-white transition-all"><Pause size={12} fill="currentColor" /> Pause</button>
                  <button onClick={() => handleBulkUpdateStatus(TaskStatus.DONE)} className="px-4 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-xl bg-green-600/10 text-green-400 border border-green-500/20 flex items-center gap-2 text-[9px] font-black uppercase hover:bg-green-600 hover:text-white transition-all"><Check size={12} /> Done</button>
                </div>
                <div className="hidden sm:block w-px h-8 bg-white/10 shrink-0"></div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => { setTasks(prev => prev.filter(t => !selectedTaskIds.includes(t.id))); setSelectedTaskIds([]); }} className="p-2 md:p-3 rounded-lg md:rounded-xl hover:bg-red-500 text-white transition-all group" title="Delete Selection"><Trash2 size={18} className="group-hover:scale-110" /></button>
                  <button onClick={() => setSelectedTaskIds([])} className="p-2 md:p-3 rounded-lg md:rounded-xl hover:bg-white/5 text-slate-500 transition-all" title="Clear Selection"><X size={18} /></button>
                </div>
              </footer>
            </div>
          )}
        </div>
      </main>

      {/* Detail Sidebar - Optimized for all screens */}
      <aside className={`fixed inset-y-0 right-0 w-full md:max-w-[500px] lg:max-w-[650px] glass-heavy border-l border-white/10 z-[500] transform transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-2xl overflow-hidden flex flex-col ${isSidebarOpen && selectedTaskIds.length === 1 ? 'translate-x-0' : 'translate-x-full'}`}>
        {primarySelectedTask && (
          <div className="h-full flex flex-col min-h-0">
            <div className="p-6 md:p-10 border-b border-white/5 flex justify-between items-center bg-slate-950/20 shrink-0">
              <div className="flex items-center gap-4 md:gap-5">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center border border-blue-500/20"><Box size={24} md:size={28}/></div>
                <div><h2 className="text-xl md:text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Node_Analysis</h2><p className="text-[8px] md:text-[9px] font-mono text-slate-500 uppercase mt-2">Registry Context // {primarySelectedTask.id}</p></div>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl hover:bg-white/5 text-slate-500 flex items-center justify-center transition-all"><X size={20} md:size={24}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 md:space-y-12 no-scrollbar scroll-smooth">
              <section className="space-y-6">
                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                  <div onClick={handleCycleAgent} className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-xl bg-blue-600/10 border border-blue-500/20 cursor-pointer group">
                    <User size={12} className="text-blue-500" />
                    <span className="text-[8px] md:text-[10px] font-black text-blue-400 uppercase tracking-widest">{primarySelectedTask.owner || 'UNASSIGNED'}</span>
                  </div>
                  <button onClick={() => setIsChatOpen(true)} className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-xl bg-green-600/10 border border-green-500/20 cursor-pointer hover:bg-green-600/20 text-green-400 transition-all">
                    <MessageSquare size={12} />
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Open_Link</span>
                  </button>
                  <button onClick={handleEnhanceSelectedTask} disabled={isEnhancingSidebar} className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 text-[8px] md:text-[10px] font-black uppercase hover:border-blue-500/50 transition-all">
                    {isEnhancingSidebar ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />} AI_Augment
                  </button>
                </div>
                <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase leading-tight italic">{primarySelectedTask.title}</h3>
                <p className="text-slate-400 text-sm md:text-lg leading-relaxed font-medium bg-white/5 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 shadow-inner">
                  {primarySelectedTask.description}
                </p>
              </section>

              {/* Status Controls */}
              <section className="space-y-6">
                 <h4 className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3"><Zap size={14} className="text-blue-500" /> Execution_Status</h4>
                 <div className="grid grid-cols-2 xs:grid-cols-4 gap-3 md:gap-4">
                    {[
                      { s: TaskStatus.RUNNING, l: 'Start', i: Play, c: 'text-blue-400', bg: 'bg-blue-600/10' },
                      { s: TaskStatus.PENDING, l: 'Pause', i: Pause, c: 'text-slate-400', bg: 'bg-slate-800' },
                      { s: TaskStatus.DONE, l: 'Finish', i: Check, c: 'text-green-400', bg: 'bg-green-600/10' },
                      { s: TaskStatus.FAILED, l: 'Halt', i: AlertTriangle, c: 'text-red-400', bg: 'bg-red-600/10' },
                    ].map(btn => (
                      <button key={btn.l} onClick={() => handleUpdateStatus(primarySelectedTask.id, btn.s)} className={`flex flex-col items-center gap-2 md:gap-3 p-4 md:p-6 rounded-[1.5rem] md:rounded-3xl border transition-all ${primarySelectedTask.status === btn.s ? `border-current ${btn.bg} ${btn.c}` : 'border-white/5 text-slate-600 hover:text-white'}`}>
                        <btn.i size={20} md:size={24} />
                        <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">{btn.l}</span>
                      </button>
                    ))}
                 </div>
              </section>

              {/* Artifacts/Subtasks Preview */}
              <section className="space-y-6 pb-12">
                 <h4 className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3"><ClipboardList size={14} className="text-purple-400" /> Synapse_Steps</h4>
                 <div className="space-y-3">
                   {primarySelectedTask.subtasks?.map(st => (
                     <div key={st.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group hover:border-purple-500/20 transition-all">
                        <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors uppercase italic">{st.title}</span>
                        {st.completed ? <CheckCircle2 size={16} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border border-slate-700" />}
                     </div>
                   ))}
                 </div>
              </section>
            </div>
          </div>
        )}
      </aside>

      {isChatOpen && primarySelectedTask && (
        <AgentChatOverlay task={primarySelectedTask} onClose={() => setIsChatOpen(false)} />
      )}

      {(isSidebarOpen && selectedTaskIds.length === 1) && <div className="fixed inset-0 bg-black/60 backdrop-blur-[4px] z-[480] animate-in fade-in duration-700" onClick={() => setIsSidebarOpen(false)} />}
    </div>
  );
}
