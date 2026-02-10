
import React from 'react';
import { Task, TaskStatus } from '../types';
import { Box, Clock, User, Zap, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface NeuralBoardProps {
  tasks: Task[];
  onSelectTask: (task: Task, isMultiSelect: boolean) => void;
}

const NeuralBoard: React.FC<NeuralBoardProps> = ({ tasks, onSelectTask }) => {
  const columns = [
    { status: TaskStatus.PENDING, label: 'BACKLOG', icon: Clock, color: 'text-slate-500', border: 'border-slate-800' },
    { status: TaskStatus.RUNNING, label: 'PROCESSING', icon: Zap, color: 'text-blue-400', border: 'border-blue-500/20' },
    { status: TaskStatus.DONE, label: 'COMMITTED', icon: CheckCircle2, color: 'text-green-400', border: 'border-green-500/20' },
    { status: TaskStatus.FAILED, label: 'HALTED', icon: AlertCircle, color: 'text-red-400', border: 'border-red-500/20' },
  ];

  return (
    <div className="flex-1 flex gap-6 overflow-x-auto pb-4 no-scrollbar">
      {columns.map((col) => {
        const colTasks = tasks.filter(t => t.status === col.status);
        return (
          <div key={col.status} className="flex-1 min-w-[350px] flex flex-col gap-6">
            <div className={`flex items-center justify-between p-6 glass-heavy rounded-3xl border ${col.border}`}>
              <div className="flex items-center gap-3">
                <col.icon size={18} className={col.color} />
                <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] ${col.color}`}>{col.label}</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-600 px-2 py-1 bg-white/5 rounded-lg">{colTasks.length}</span>
            </div>

            <div className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar pr-2">
              {colTasks.map((task) => (
                <div 
                  key={task.id}
                  onClick={() => onSelectTask(task, false)}
                  className="group p-6 glass-heavy rounded-[2rem] border border-white/5 hover:border-blue-500/40 transition-all cursor-pointer hover:translate-y-[-4px]"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{task.id}</span>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${task.priority === 'HIGH' ? 'text-red-400 border-red-400/20 bg-red-400/5' : 'text-blue-400 border-blue-500/20 bg-blue-500/5'}`}>
                      {task.priority}
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-white italic tracking-tight uppercase leading-tight mb-2 group-hover:text-blue-400 transition-colors">
                    {task.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 font-medium leading-relaxed mb-6">
                    {task.description}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/20">
                        <User size={12} className="text-blue-400" />
                      </div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {task.owner?.split('_')[0] || 'UNASSIGNED'}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {task.subtasks?.slice(0, 3).map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < (task.subtasks?.filter(s => s.completed).length || 0) ? 'bg-blue-500' : 'bg-slate-800'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {colTasks.length === 0 && (
                <div className="flex-1 border-2 border-dashed border-white/5 rounded-[2rem] flex items-center justify-center p-12">
                   <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Zone_Empty</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NeuralBoard;
