
import React from 'react';
import { Task, TaskStatus } from '../types';
import { Clock, User, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';

interface NeuralBoardProps {
  tasks: Task[];
  onSelectTask: (task: Task, isMultiSelect: boolean) => void;
  theme: 'dark' | 'light';
}

const NeuralBoard: React.FC<NeuralBoardProps> = ({ tasks, onSelectTask, theme }) => {
  const columns = [
    { status: TaskStatus.PENDING, label: 'BACKLOG', icon: Clock, color: 'text-slate-500' },
    { status: TaskStatus.RUNNING, label: 'PROCESSING', icon: Zap, color: 'text-blue-500' },
    { status: TaskStatus.DONE, label: 'COMMITTED', icon: CheckCircle2, color: 'text-green-600' },
    { status: TaskStatus.FAILED, label: 'HALTED', icon: AlertCircle, color: 'text-red-500' },
  ];

  const textContrast = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const subtextContrast = theme === 'dark' ? 'text-slate-500' : 'text-slate-600';

  return (
    <div className="flex-1 flex gap-6 overflow-x-auto pb-4 no-scrollbar">
      {columns.map((col) => {
        const colTasks = tasks.filter(t => t.status === col.status);
        return (
          <div key={col.status} className="flex-1 min-w-[350px] flex flex-col gap-6">
            <div className={`flex items-center justify-between p-6 glass-heavy rounded-3xl border border-slate-500/10`}>
              <div className="flex items-center gap-3">
                <col.icon size={18} className={col.color} />
                <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] ${col.color}`}>{col.label}</h3>
              </div>
              <span className={`text-[10px] font-mono px-2 py-1 rounded-lg ${theme === 'dark' ? 'bg-white/5 text-slate-500' : 'bg-slate-200 text-slate-700'}`}>{colTasks.length}</span>
            </div>

            <div className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar pr-2">
              {colTasks.map((task) => (
                <div 
                  key={task.id}
                  onClick={() => onSelectTask(task, false)}
                  className={`group p-6 glass-heavy rounded-[2rem] border border-slate-500/10 hover:border-blue-500/40 transition-all cursor-pointer hover:translate-y-[-4px]`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{task.id}</span>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${task.priority === 'HIGH' ? 'text-red-500 border-red-500/20 bg-red-500/5' : 'text-blue-500 border-blue-500/20 bg-blue-500/5'}`}>
                      {task.priority}
                    </span>
                  </div>
                  <h4 className={`text-lg font-black italic tracking-tight uppercase leading-tight mb-2 group-hover:text-blue-500 transition-colors ${textContrast}`}>
                    {task.title}
                  </h4>
                  <p className={`text-xs line-clamp-2 font-medium leading-relaxed mb-6 ${subtextContrast}`}>
                    {task.description}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-500/10">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                        <User size={12} className="text-blue-500" />
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${subtextContrast}`}>
                        {task.owner?.split('_')[0] || 'AUTO'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {colTasks.length === 0 && (
                <div className="flex-1 border-2 border-dashed border-slate-500/10 rounded-[2rem] flex items-center justify-center p-12">
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest opacity-20 italic">ZONE_EMPTY</span>
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
