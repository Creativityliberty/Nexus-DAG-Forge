
import React, { useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  ConnectionLineType,
  Handle,
  Position,
  NodeProps,
  Edge,
  Node,
  MarkerType,
  SelectionMode
} from 'reactflow';
import dagre from 'dagre';
import { Task, TaskStatus } from '../types';
import { Activity, ShieldAlert, Loader2, Monitor, Box, CheckCircle2 } from 'lucide-react';

const TaskNode = ({ data, selected }: NodeProps) => {
  const task = data.task as Task;
  const theme = data.theme || 'dark';
  
  const statusStyles = {
    [TaskStatus.PENDING]: { color: 'text-slate-500', bg: theme === 'dark' ? 'bg-slate-900/60' : 'bg-slate-100', border: theme === 'dark' ? 'border-white/5' : 'border-slate-200', glow: '', progressColor: 'bg-slate-400' },
    [TaskStatus.RUNNING]: { color: 'text-blue-500', bg: theme === 'dark' ? 'bg-blue-600/10' : 'bg-blue-50', border: 'border-blue-500/40', glow: 'shadow-[0_0_40px_rgba(37,99,235,0.1)]', progressColor: 'bg-blue-500' },
    [TaskStatus.DONE]: { color: 'text-green-500', bg: theme === 'dark' ? 'bg-green-500/10' : 'bg-green-50', border: 'border-green-500/40', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.05)]', progressColor: 'bg-green-500' },
    [TaskStatus.FAILED]: { color: 'text-red-500', bg: theme === 'dark' ? 'bg-red-500/10' : 'bg-red-50', border: 'border-red-500/40', glow: 'shadow-[0_0_30px_rgba(239,68,68,0.05)]', progressColor: 'bg-red-500' },
  };

  const style = statusStyles[task.status] || statusStyles[TaskStatus.PENDING];
  
  const subtaskProgress = useMemo(() => {
    if (task.status === TaskStatus.DONE) return 100;
    if (!task.subtasks || task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter(s => s.completed).length;
    return Math.round((completed / task.subtasks.length) * 100);
  }, [task.subtasks, task.status]);

  return (
    <div className={`iridescent-border glass-heavy rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-7 min-w-[280px] md:min-w-[340px] transition-all duration-700 ${selected ? 'node-selected-fx scale-[1.05] z-50' : ''} ${style.bg} ${style.border} ${style.glow}`}>
      <Handle type="target" position={Position.Left} className="!bg-blue-500 !border-transparent !w-3 !h-3 md:!w-4 md:!h-4" />
      
      <div className="flex items-start gap-4 md:gap-5">
        <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] flex items-center justify-center ${style.color} bg-slate-500/5 border border-slate-500/10 shadow-inner`}>
          {task.status === TaskStatus.RUNNING ? <Loader2 size={24} className="animate-spin" /> : 
           task.status === TaskStatus.DONE ? <CheckCircle2 size={24} /> : <Activity size={24} />}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex justify-between items-center mb-1">
             <span className="text-[8px] md:text-[9px] font-mono text-slate-500 uppercase tracking-widest">{task.id}</span>
             {task.priority === 'HIGH' && <ShieldAlert size={12} className="text-red-500" />}
          </div>
          <h4 className={`text-lg md:text-xl font-black truncate italic tracking-tight uppercase leading-none transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{task.title}</h4>
          <p className="text-[9px] md:text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest truncate opacity-60">{task.owner || 'System_Automaton'}</p>
        </div>
      </div>
      
      <div className="mt-6 md:mt-8 space-y-3">
         <div className="flex justify-between items-end">
            <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Synapse_Sync</span>
            <span className="text-[12px] md:text-[14px] font-mono font-black text-blue-500">{subtaskProgress}%</span>
         </div>
         <div className={`h-2 w-full rounded-full overflow-hidden border border-slate-500/10 relative p-[1px] ${theme === 'dark' ? 'bg-slate-950/80' : 'bg-slate-200'}`}>
            <div 
              className={`h-full transition-all duration-1000 rounded-full ${style.progressColor}`}
              style={{ width: `${subtaskProgress}%` }}
            />
         </div>
      </div>

      <div className="mt-5 md:mt-7 flex items-center justify-between border-t border-slate-500/10 pt-3 md:pt-4">
         <div className="flex gap-1.5 md:gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`w-1 h-1 rounded-full ${subtaskProgress > (i * 25) ? 'bg-blue-500' : 'bg-slate-400'}`}></div>
            ))}
         </div>
         <span className="text-[8px] md:text-[9px] font-mono text-slate-500 bg-slate-500/5 px-2 py-0.5 rounded uppercase tracking-tighter italic">NEURAL_ID_{task.id.split('-')[1]}</span>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-blue-500 !border-transparent !w-3 !h-3 md:!w-4 md:!h-4" />
    </div>
  );
};

const nodeTypes = { task: TaskNode };

interface DAGVisualizerProps {
  tasks: Task[];
  onSelectTask: (task: Task, isMultiSelect: boolean) => void;
  selectedTaskIds: string[];
  lassoEnabled: boolean;
  theme: 'dark' | 'light';
}

const DAGVisualizer: React.FC<DAGVisualizerProps> = ({ tasks, onSelectTask, selectedTaskIds, lassoEnabled, theme }) => {
  const { nodes, edges } = useMemo(() => {
    if (tasks.length === 0) return { nodes: [], edges: [] };
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'LR', nodesep: 100, ranksep: 200 });

    const initialNodes: Node[] = tasks.map((task) => {
      dagreGraph.setNode(task.id, { width: 340, height: 220 });
      return { id: task.id, type: 'task', data: { task, theme }, position: { x: 0, y: 0 }, selected: selectedTaskIds.includes(task.id) };
    });

    const initialEdges: Edge[] = [];
    tasks.forEach((task) => {
      task.dependencies.forEach((depId) => {
        const sourceTask = tasks.find(t => t.id === depId);
        if (sourceTask) {
          dagreGraph.setEdge(depId, task.id);
          initialEdges.push({
            id: `e-${depId}-${task.id}`,
            source: depId,
            target: task.id,
            animated: sourceTask.status === TaskStatus.RUNNING || sourceTask.status === TaskStatus.DONE,
            type: ConnectionLineType.SmoothStep,
            className: sourceTask.status === TaskStatus.RUNNING ? 'animated-liquid' : '',
            markerEnd: { type: MarkerType.ArrowClosed, color: sourceTask.status === TaskStatus.DONE ? '#10b981' : '#3b82f6', width: 16, height: 16 },
            style: { stroke: sourceTask.status === TaskStatus.DONE ? '#10b981' : sourceTask.status === TaskStatus.RUNNING ? '#3b82f6' : 'rgba(148, 163, 184, 0.1)', strokeWidth: 3 }
          });
        }
      });
    });

    dagre.layout(dagreGraph);
    const layoutedNodes = initialNodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return { ...node, position: { x: (nodeWithPosition?.x || 0) - 170, y: (nodeWithPosition?.y || 0) - 110 } };
    });
    return { nodes: layoutedNodes, edges: initialEdges };
  }, [tasks, selectedTaskIds, theme]);

  return (
    <div className="flex-1 glass-heavy rounded-[2rem] md:rounded-[3rem] relative overflow-hidden flex items-center justify-center min-h-[400px] border border-slate-500/10 shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => {
          const task = tasks.find(t => t.id === node.id);
          if (task) onSelectTask(task, lassoEnabled);
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        connectionLineType={ConnectionLineType.SmoothStep}
        selectionMode={lassoEnabled ? SelectionMode.Partial : SelectionMode.Full}
        selectionOnDrag={lassoEnabled}
      >
        <Background color={theme === 'dark' ? '#1e293b' : '#cbd5e1'} gap={20} size={1} />
        <Controls className={`!rounded-xl md:!rounded-2xl !backdrop-blur-xl !shadow-2xl !bottom-4 !left-4 border ${theme === 'dark' ? '!bg-slate-900/80 !border-white/10' : '!bg-white/80 !border-slate-200'}`} />
      </ReactFlow>

      {tasks.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 md:gap-8 pointer-events-none p-6">
          <div className="p-10 md:p-16 rounded-[3rem] md:rounded-[4rem] bg-blue-500/5 border border-blue-500/10 relative">
             <div className="absolute inset-0 bg-blue-500/10 blur-[80px] md:blur-[120px]"></div>
             <Monitor size={80} className="text-slate-400 relative z-10" />
          </div>
          <div className="text-center space-y-3 relative z-10">
             <h3 className={`text-2xl md:text-4xl font-black italic tracking-tighter uppercase leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Neural_Core_Idle</h3>
             <p className="text-slate-500 text-[10px] md:text-sm font-medium tracking-widest uppercase">Inject manifest specifications to visualize orchestration.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DAGVisualizer;
