
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
    <div className="flex-1 overflow-y-auto no-scrollbar pb-32 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { icon: Target, label: 'Effectiveness', val: `${stats.effectiveness}%`, color: 'blue', sub: 'Neural Accuracy' },
          { icon: CheckCircle2, label: 'Completed', val: stats.completed, color: 'green', sub: 'Nodes Finished' },
          { icon: ShieldAlert, label: 'Blocked/Failed', val: stats.failed + (blockers.length - stats.failed), color: 'red', sub: 'Critical Latency' },
          { icon: Activity, label: 'Total Nodes', val: stats.total, color: 'purple', sub: 'Registry Size' }
        ].map((stat, i) => (
          <div key={i} className={`p-8 glass-heavy rounded-[2.5rem] border border-${stat.color}-500/20 shadow-2xl relative overflow-hidden group hover:border-${stat.color}-500/50 transition-all`}>
            <div className={`absolute -right-6 -top-6 w-24 h-24 bg-${stat.color}-600/10 blur-3xl rounded-full group-hover:scale-150 transition-transform`}></div>
            <stat.icon className={`text-${stat.color}-500 mb-6`} size={36} />
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{stat.label}</h4>
            <div className="text-6xl font-black text-white italic tracking-tighter mt-2">{stat.val}</div>
            <p className="text-[9px] font-mono text-slate-600 uppercase mt-4 tracking-widest">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Mission Objectives */}
        <div className="lg:col-span-2 space-y-10">
          <div className="glass-heavy rounded-[3rem] p-12 border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5"><Target size={200} /></div>
            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-5 mb-10 relative z-10">
              <Zap className="text-blue-500" size={32} /> Mission_Definition
            </h3>
            <div className="p-10 rounded-[2.5rem] bg-blue-600/5 border border-blue-500/10 shadow-inner relative z-10">
              <p className="text-2xl text-slate-300 font-medium leading-relaxed italic">
                "{originalPrompt || 'Neural synthesis request pending...'}"
              </p>
            </div>
            <div className="mt-12 space-y-6 relative z-10">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3">
                <div className="w-8 h-px bg-slate-800"></div> Synthesized_Outcomes
              </h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {tasks.slice(0, 10).map(t => (
                  <li key={t.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                    <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] ${t.status === TaskStatus.DONE ? 'text-green-500 bg-green-500' : t.status === TaskStatus.FAILED ? 'text-red-500 bg-red-500' : 'text-slate-600 bg-slate-600'}`} />
                    <div className="overflow-hidden">
                      <span className="font-mono text-[9px] text-slate-500 uppercase block">{t.id}</span>
                      <span className="text-sm font-bold text-white uppercase truncate block group-hover:text-blue-400 transition-colors">{t.title}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Intelligence Report */}
        <div className="space-y-10">
          <div className="glass-heavy rounded-[3rem] p-10 border border-red-500/20 shadow-2xl bg-red-950/5 h-full flex flex-col">
            <h3 className="text-xl font-black text-red-400 italic uppercase tracking-tighter flex items-center gap-4 mb-8">
              <AlertTriangle size={24} /> Critical_Blockers
            </h3>
            <div className="flex-1 space-y-5 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              {blockers.map(t => (
                <div key={t.id} className="p-6 rounded-[1.8rem] bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-mono text-red-400 uppercase tracking-widest">{t.id}</span>
                    <ShieldAlert size={14} className="text-red-500" />
                  </div>
                  <h5 className="text-base font-black text-white uppercase italic tracking-tight">{t.title}</h5>
                  <div className="mt-4 pt-4 border-t border-red-500/10">
                    <p className="text-[10px] font-black text-red-300 opacity-60 uppercase tracking-widest">
                      Status: {t.status === TaskStatus.FAILED ? 'CRITICAL_FAILURE' : 'DEPENDENCY_LOCK'}
                    </p>
                  </div>
                </div>
              ))}
              {blockers.length === 0 && (
                <div className="text-center py-20 flex flex-col items-center opacity-50">
                  <Award className="text-green-400 mb-6" size={64} />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">No_Active_Impediments</p>
                  <p className="text-[8px] font-mono text-slate-700 mt-2">Optimal system synchronization detected.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="glass-heavy rounded-[3rem] p-10 border border-green-500/20 shadow-2xl bg-green-950/5">
            <h3 className="text-xl font-black text-green-400 italic uppercase tracking-tighter flex items-center gap-4 mb-8">
              <TrendingUp size={24} /> Core_Velocity
            </h3>
            <div className="space-y-6">
               <div className="flex justify-between items-end mb-2">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global_Synchronicity</span>
                 <span className="text-3xl font-black font-mono text-white italic">{stats.effectiveness}%</span>
               </div>
               <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden p-[2px] border border-white/5 relative">
                 <div 
                   className="h-full bg-green-500 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.6)] transition-all duration-1000 relative overflow-hidden" 
                   style={{ width: `${stats.effectiveness}%` }} 
                 >
                   <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                 </div>
               </div>
               <p className="text-[9px] font-mono text-slate-600 uppercase tracking-tighter text-right">Optimizing neural pathways...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionRecap;
