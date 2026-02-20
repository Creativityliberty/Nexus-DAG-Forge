
import React, { useMemo } from 'react';
import { Task, TaskStatus } from '../types';
// Added Loader2 to the imports from lucide-react
import { Target, CheckCircle2, AlertTriangle, ShieldAlert, Zap, Activity, Award, BrainCircuit, Loader2 } from 'lucide-react';

interface MissionRecapProps {
  tasks: Task[];
  originalPrompt: string;
  theme: 'dark' | 'light';
  aiReport?: string;
}

const MissionRecap: React.FC<MissionRecapProps> = ({ tasks, originalPrompt, theme, aiReport }) => {
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const failed = tasks.filter(t => t.status === TaskStatus.FAILED).length;
    const effectiveness = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, failed, effectiveness };
  }, [tasks]);

  const textContrast = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const subtextContrast = theme === 'dark' ? 'text-slate-500' : 'text-slate-600';

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-32 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { icon: Target, label: 'Effectiveness', val: `${stats.effectiveness}%`, color: 'blue' },
          { icon: CheckCircle2, label: 'Completed', val: stats.completed, color: 'green' },
          { icon: ShieldAlert, label: 'Critical', val: stats.failed, color: 'red' },
          { icon: Activity, label: 'Registry', val: stats.total, color: 'purple' }
        ].map((stat, i) => (
          <div key={i} className={`p-8 glass-heavy rounded-[2.5rem] border border-slate-500/10 shadow-2xl relative overflow-hidden group hover:border-${stat.color}-500/50 transition-all`}>
            <stat.icon className={`text-${stat.color}-500 mb-6`} size={36} />
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{stat.label}</h4>
            <div className={`text-6xl font-black italic tracking-tighter mt-2 ${textContrast}`}>{stat.val}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Executive AI Report Section */}
          <div className="glass-heavy rounded-[3rem] p-12 border border-purple-500/20 shadow-2xl relative overflow-hidden bg-purple-500/5">
            <h3 className={`text-3xl font-black italic uppercase tracking-tighter flex items-center gap-5 mb-10 ${textContrast}`}><BrainCircuit className="text-purple-500" size={32} /> Neural_Executive_Summary</h3>
            <div className={`p-10 rounded-[2.5rem] border transition-all ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-white border-slate-200'}`}>
               {aiReport ? (
                 <div className={`prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert' : ''} leading-relaxed`}>
                   <div className="whitespace-pre-wrap font-medium">{aiReport}</div>
                 </div>
               ) : (
                 <div className="flex flex-col items-center gap-4 py-10">
                    <Loader2 className="animate-spin text-purple-500" size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Gemini analyzing architectural integrity...</p>
                 </div>
               )}
            </div>
          </div>

          <div className="glass-heavy rounded-[3rem] p-12 border border-slate-500/10 shadow-2xl relative overflow-hidden">
            <h3 className={`text-3xl font-black italic uppercase tracking-tighter flex items-center gap-5 mb-10 ${textContrast}`}><Zap className="text-blue-500" size={32} /> Mission_Definition</h3>
            <div className={`p-10 rounded-[2.5rem] border transition-all ${theme === 'dark' ? 'bg-blue-600/5 border-blue-500/10' : 'bg-slate-100 border-slate-200'}`}>
              <p className={`text-2xl font-medium leading-relaxed italic ${theme === 'dark' ? 'text-slate-300' : 'text-slate-900'}`}>"{originalPrompt || 'Synthesis pending...'}"</p>
            </div>
            <div className="mt-12 space-y-6">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Synthesized_Outcomes</h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {tasks.map(t => (
                  <li key={t.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-500/5 border border-slate-500/10 group">
                    <div className={`w-3 h-3 rounded-full ${t.status === TaskStatus.DONE ? 'bg-green-500' : t.status === TaskStatus.FAILED ? 'bg-red-500' : 'bg-slate-500'}`} />
                    <span className={`text-sm font-bold uppercase truncate transition-colors ${textContrast} group-hover:text-blue-500`}>{t.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <div className="glass-heavy rounded-[3rem] p-10 border border-slate-500/10 shadow-2xl h-full flex flex-col">
            <h3 className="text-xl font-black text-red-500 italic uppercase tracking-tighter flex items-center gap-4 mb-8"><AlertTriangle size={24} /> Blockers</h3>
            <div className="flex-1 space-y-5 overflow-y-auto pr-2 no-scrollbar">
              {tasks.filter(t => t.status === TaskStatus.FAILED).map(t => (
                <div key={t.id} className="p-6 rounded-[1.8rem] bg-red-500/5 border border-red-500/20">
                  <span className="text-[9px] font-mono text-red-500 uppercase tracking-widest">{t.id}</span>
                  <h5 className={`text-base font-black uppercase italic ${textContrast}`}>{t.title}</h5>
                </div>
              ))}
              {tasks.filter(t => t.status === TaskStatus.FAILED).length === 0 && (
                <div className="text-center py-20 flex flex-col items-center opacity-30"><Award className="text-green-600 mb-6" size={64} /><p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">NO_IMPEDIMENTS</p></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionRecap;
