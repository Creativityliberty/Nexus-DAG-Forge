
import React, { useMemo } from 'react';
import { Task, TaskStatus } from '../types';
import { 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  ShieldAlert, 
  Zap, 
  Activity,
  Award
} from 'lucide-react';

interface MissionRecapProps {
  tasks: Task[];
  originalPrompt: string;
}

const MissionRecap: React.FC<MissionRecapProps> = ({ tasks, originalPrompt }) => {
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const failed = tasks.filter(t => t.status === TaskStatus.FAILED).length;
    const running = tasks.filter(t => t.status === TaskStatus.RUNNING).length;
    const effectiveness = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, failed, running, effectiveness };
  }, [tasks]);

  const blockers = useMemo(() => {
    return tasks.filter(t => t.status === TaskStatus.FAILED || t.status === TaskStatus.PENDING && t.dependencies.some(depId => {
      const dep = tasks.find(d => d.id === depId);
      return dep?.status === TaskStatus.FAILED;
    }));
  }, [tasks]);

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-20 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Stats */}
      <div className="grid grid-cols-4 gap-6">
        <div className="p-8 glass-heavy rounded-[2.5rem] border border-blue-500/20 shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-600/10 blur-3xl rounded-full group-hover:bg-blue-600/20 transition-all"></div>
          <Target className="text-blue-500 mb-4" size={32} />
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Effectiveness</h4>
          <div className="text-5xl font-black text-white italic tracking-tighter mt-1">{stats.effectiveness}%</div>
        </div>
        <div className="p-8 glass-heavy rounded-[2.5rem] border border-green-500/20 shadow-2xl relative overflow-hidden group">
           <CheckCircle2 className="text-green-400 mb-4" size={32} />
           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Completed</h4>
           <div className="text-5xl font-black text-white italic tracking-tighter mt-1">{stats.completed}</div>
        </div>
        <div className="p-8 glass-heavy rounded-[2.5rem] border border-red-500/20 shadow-2xl relative overflow-hidden group">
           <ShieldAlert className="text-red-400 mb-4" size={32} />
           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Blocked/Failed</h4>
           <div className="text-5xl font-black text-white italic tracking-tighter mt-1">{stats.failed + (blockers.length - stats.failed)}</div>
        </div>
        <div className="p-8 glass-heavy rounded-[2.5rem] border border-purple-500/20 shadow-2xl relative overflow-hidden group">
           <Activity className="text-purple-400 mb-4" size={32} />
           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Nodes</h4>
           <div className="text-5xl font-black text-white italic tracking-tighter mt-1">{stats.total}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Mission Objectives */}
        <div className="col-span-2 space-y-6">
          <div className="glass-heavy rounded-[3rem] p-10 border border-white/5 shadow-2xl">
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4 mb-6">
              <Zap className="text-blue-500" /> Mission_Definition
            </h3>
            <div className="p-8 rounded-3xl bg-blue-600/5 border border-blue-500/10">
              <p className="text-lg text-slate-300 font-medium leading-relaxed italic">
                "{originalPrompt || 'Neural synthesis request pending...'}"
              </p>
            </div>
            <div className="mt-8 space-y-4">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Synthesized Outcomes</h4>
              <ul className="space-y-3">
                {tasks.slice(0, 5).map(t => (
                  <li key={t.id} className="flex items-center gap-3 text-sm text-slate-400">
                    <div className={`w-1.5 h-1.5 rounded-full ${t.status === TaskStatus.DONE ? 'bg-green-500' : 'bg-slate-700'}`} />
                    <span className="font-mono">{t.id}:</span> {t.title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Intelligence Report */}
        <div className="space-y-8">
          <div className="glass-heavy rounded-[3rem] p-10 border border-red-500/20 shadow-2xl bg-red-950/5">
            <h3 className="text-xl font-black text-red-400 italic uppercase tracking-tighter flex items-center gap-4 mb-6">
              <AlertTriangle /> Critical_Blockers
            </h3>
            <div className="space-y-4">
              {blockers.map(t => (
                <div key={t.id} className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                  <span className="text-[9px] font-mono text-red-400 uppercase tracking-widest">{t.id}</span>
                  <h5 className="text-sm font-bold text-white mt-1 uppercase">{t.title}</h5>
                  <p className="text-[10px] text-red-300 opacity-60 mt-1">Status: {t.status === TaskStatus.FAILED ? 'CRITICAL_FAILURE' : 'DEPENDENCY_LOCK'}</p>
                </div>
              ))}
              {blockers.length === 0 && (
                <div className="text-center py-10">
                  <Award className="text-green-400 mx-auto mb-3" size={32} />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No Active Impediments</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="glass-heavy rounded-[3rem] p-10 border border-green-500/20 shadow-2xl bg-green-950/5">
            <h3 className="text-xl font-black text-green-400 italic uppercase tracking-tighter flex items-center gap-4 mb-6">
              <TrendingUp /> Core_Velocity
            </h3>
            <div className="space-y-4">
               <div className="flex justify-between items-end mb-2">
                 <span className="text-[10px] font-black text-slate-500 uppercase">Synchronicity</span>
                 <span className="text-xl font-mono text-white">{stats.effectiveness}%</span>
               </div>
               <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden p-[1px] border border-white/5">
                 <div className="h-full bg-green-500 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.4)]" style={{ width: `${stats.effectiveness}%` }} />
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionRecap;
