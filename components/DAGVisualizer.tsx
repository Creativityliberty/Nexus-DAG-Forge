
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
import { Task, TaskStatus, PriorityLevel } from '../types';
import { Cpu, CheckCircle2, AlertCircle, Play, Loader2, Monitor, MessageSquare, Zap, ShieldAlert } from 'lucide-react';

const TaskNode = ({ data, selected }: NodeProps) => {
  const task = data.task as Task;
  
  const statusStyles = {
    [TaskStatus.PENDING]: { icon: Cpu, color: 'text-slate-400', bg: 'bg-slate-900/60', border: 'border-slate-800' },
    [TaskStatus.RUNNING]: { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/40' },
    [TaskStatus.DONE]: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/40' },
    [TaskStatus.FAILED]: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/40' },
  };

  const priorityStyles: Record<PriorityLevel, { text: string, bg: string, border: string, glow: string }> = {
    HIGH: { 
      text: 'text-red-400', 
      bg: 'bg-red-400/10', 
      border: 'border-red-400/40',
      glow: 'shadow-[0_0_20px_rgba(248,113,113,0.15)]' 
    },
    MEDIUM: { 
      text: 'text-amber-400', 
      bg: 'bg-amber-400/10', 
      border: 'border-amber-400/40',
      glow: 'shadow-[0_0_15px_rgba(251,191,36,0.1)]'
    },
    LOW: { 
      text: 'text-emerald-400', 
      bg: 'bg-emerald-400/10', 
      border: 'border-emerald-400/40',
      glow: ''
    },
  };

  const style = statusStyles[task.status] || statusStyles[TaskStatus.PENDING];
  const priorityStyle = priorityStyles[task.priority || 'LOW'];
  const Icon = style.icon;

  const subtaskProgress = useMemo(() => {
    if (!task.subtasks || task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter(s => s.completed).length;
    return Math.round((completed / task.subtasks.length) * 100);
  }, [task.subtasks]);

  return (
    <div className={`iridescent-border glass-2 rounded-2xl p-4 min-w-[260px] transition-all duration-500 ${selected ? 'node-selected-fx scale-[1.07] z-50 ring-2 ring-blue-500' : ''} ${style.bg} ${style.border} ${priorityStyle.glow}`}>
      <Handle type="target" position={Position.Left} className="!bg-blue-500 !border-slate-950 !w-3 !h-3" />
      
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl bg-black/40 ${style.color} relative overflow-hidden group border border-white/5`}>
          <Icon size={20} className={task.status === TaskStatus.RUNNING ? 'animate-spin' : 'group-hover:scale-110 transition-transform'} />
          {task.priority === 'HIGH' && (
            <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_red]"></div>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest truncate">{task.id}</p>
            {task.priority && (
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-tighter ${priorityStyle.text} ${priorityStyle.bg} ${priorityStyle.border}`}>
                {task.priority}
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-white truncate leading-tight group-hover:text-blue-400 transition-colors">{task.title}</h4>
        </div>
      </div>
      
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
            <span>Synapse Load</span>
            <span>{subtaskProgress}%</span>
          </div>
          <div className="h-1 w-full bg-black/60 rounded-full overflow-hidden border border-white/5">
            <div 
              className={`h-full transition-all duration-1000 ${task.status === TaskStatus.DONE ? 'bg-green-500' : task.status === TaskStatus.FAILED ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${subtaskProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
         <div className="flex items-center gap-2">
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${style.color}`}>
              {task.status}
            </span>
            {task.comments && task.comments.length > 0 && (
              <span className="flex items-center gap-1 text-[9px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">
                <MessageSquare size={10} /> {task.comments.length}
              </span>
            )}
         </div>
         {task.duration && (
           <span className="text-[9px] font-mono text-slate-500 opacity-60 italic">{task.duration}</span>
         )}
      </div>

      <Handle type="source" position={Position.Right} className="!bg-blue-500 !border-slate-950 !w-3 !h-3" />
    </div>
  );
};

const nodeTypes = {
  task: TaskNode,
};

interface DAGVisualizerProps {
  tasks: Task[];
  onSelectTask: (task: Task, isMultiSelect: boolean) => void;
  selectedTaskIds: string[];
  lassoEnabled: boolean;
}

const DAGVisualizer: React.FC<DAGVisualizerProps> = ({ tasks, onSelectTask, selectedTaskIds, lassoEnabled }) => {
  
  const { nodes, edges } = useMemo(() => {
    if (tasks.length === 0) return { nodes: [], edges: [] };

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'LR', nodesep: 120, ranksep: 220 });

    const initialNodes: Node[] = tasks.map((task) => {
      dagreGraph.setNode(task.id, { width: 280, height: 140 });
      return {
        id: task.id,
        type: 'task',
        data: { task },
        position: { x: 0, y: 0 },
        selected: selectedTaskIds.includes(task.id),
      };
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
            markerEnd: { 
              type: MarkerType.ArrowClosed, 
              color: sourceTask.status === TaskStatus.DONE ? '#10b981' : sourceTask.status === TaskStatus.RUNNING ? '#3b82f6' : 'rgba(100, 116, 139, 0.2)',
              width: 20,
              height: 20
            },
            style: { 
              stroke: sourceTask.status === TaskStatus.DONE ? '#10b981' : sourceTask.status === TaskStatus.RUNNING ? '#3b82f6' : 'rgba(100, 116, 139, 0.2)',
              strokeWidth: sourceTask.status === TaskStatus.RUNNING ? 3 : 2
            }
          });
        }
      });
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = initialNodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: (nodeWithPosition?.x || 0) - 140,
          y: (nodeWithPosition?.y || 0) - 70,
        },
      };
    });

    return { nodes: layoutedNodes, edges: initialEdges };
  }, [tasks, selectedTaskIds]);

  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    const task = tasks.find(t => t.id === node.id);
    if (task) {
      const isMulti = event.shiftKey || event.metaKey || lassoEnabled;
      onSelectTask(task, isMulti);
    }
  };

  return (
    <div className="flex-1 glass-2 rounded-[3rem] relative overflow-hidden flex items-center justify-center min-h-[500px] border border-white/10 shadow-2xl">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        connectionLineType={ConnectionLineType.SmoothStep}
        selectionMode={lassoEnabled ? SelectionMode.Partial : SelectionMode.Full}
        panOnScroll
        selectionOnDrag={lassoEnabled}
      >
        <Background color="#1e293b" gap={24} size={1} />
        <Controls className="!bg-slate-900/80 !border-white/10 !rounded-2xl !backdrop-blur-xl overflow-hidden !shadow-2xl" />
      </ReactFlow>

      <div className="absolute top-8 left-8 pointer-events-none z-10 space-y-3">
        <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/5 shadow-2xl animate-in slide-in-from-left duration-500">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Synapse Pulse Active</span>
        </div>
      </div>

      {lassoEnabled && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-blue-600/20 backdrop-blur-xl px-6 py-2 rounded-full border border-blue-500/40 text-[10px] font-black text-blue-400 uppercase tracking-widest z-20 animate-pulse">
          Lasso Interface Enabled
        </div>
      )}

      {tasks.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in duration-700 pointer-events-none">
          <div className="p-10 rounded-[3rem] bg-slate-800/20 border border-white/5 relative">
            <div className="absolute inset-0 bg-blue-500/10 blur-[80px]"></div>
            <Monitor size={80} className="text-slate-700 relative z-10" />
          </div>
          <div className="text-center space-y-2 relative z-10">
            <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">Neutral Engine Standby</h3>
            <p className="text-slate-500 text-sm max-w-sm font-medium">Inject project specifications to visualize the orchestration topology.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DAGVisualizer;
