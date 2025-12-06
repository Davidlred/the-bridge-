
import React from 'react';
import { Goal } from '../types';
import { Plus, ChevronRight, Target, Clock, LogOut, Download } from 'lucide-react';

interface GoalListProps {
  goals: Goal[];
  onSelectGoal: (id: string) => void;
  onAddGoal: () => void;
  onSignOut: () => void;
  installPrompt: any;
  onInstall: () => void;
}

const GoalList: React.FC<GoalListProps> = ({ goals, onSelectGoal, onAddGoal, onSignOut, installPrompt, onInstall }) => {
  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-4xl mx-auto flex flex-col gap-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase mb-1">Command Center</h1>
          <p className="text-zinc-500 text-sm">Active Directives: {goals.length}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-4">
            <button 
                onClick={onSignOut}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-red-500 transition-colors"
            >
                <LogOut size={16} /> Sign Out
            </button>
            <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
                <Target size={20} className="text-white" />
            </div>
            </div>
            {installPrompt && (
                <button 
                    onClick={onInstall}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors animate-pulse"
                >
                    <Download size={14} /> Install App
                </button>
            )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal) => (
          <button
            key={goal.id}
            onClick={() => onSelectGoal(goal.id)}
            className="group relative h-48 rounded-2xl border border-zinc-800 bg-zinc-900/30 overflow-hidden text-left transition-all hover:border-white hover:bg-zinc-900 focus:outline-none"
          >
            {/* Background Image / Future Self Blur */}
            {goal.futureSelfImageBase64 && (
              <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity bg-center bg-cover" 
                   style={{ backgroundImage: `url(${goal.futureSelfImageBase64})` }} 
              />
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 flex flex-col justify-end">
              <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{goal.title}</h3>
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-xs text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                    <Clock size={10} /> Created: {new Date(goal.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-white transition-all" style={{ width: `${goal.progress}%` }} />
                    </div>
                    <span className="text-xs font-mono">{Math.round(goal.progress)}%</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center transform translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          </button>
        ))}

        {/* Add New Goal Card */}
        <button
          onClick={onAddGoal}
          className="h-48 rounded-2xl border-2 border-dashed border-zinc-800 bg-transparent flex flex-col items-center justify-center gap-4 text-zinc-500 hover:text-white hover:border-white hover:bg-zinc-900/50 transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={24} />
          </div>
          <span className="font-bold uppercase tracking-widest text-sm">Initiate New Protocol</span>
        </button>
      </div>
    </div>
  );
};

export default GoalList;
