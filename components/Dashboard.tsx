
import React, { useState, useEffect } from 'react';
import { DailyTask, Goal } from '../types';
import Visualizer from './Visualizer';
import RealityCheck from './RealityCheck';
import ProgressChart from './ProgressChart';
import AIChat from './AIChat';
import Journal from './Journal';
import { CheckCircle2, Circle, Trophy, Share2, Plus, Edit2, Trash2, X, MessageSquare, Save, ChevronLeft, Flame, Clock, Book, AlertTriangle, Activity, CalendarClock } from 'lucide-react';

interface DashboardProps {
  goal: Goal;
  onBack: () => void;
  onToggleTask: (taskId: string) => void;
  onAddTask: (title: string, desc: string) => void;
  onEditTask: (id: string, title: string, desc: string) => void;
  onDeleteTask: (id: string) => void;
  onAddJournalEntry: (content: string) => void;
}

type Tab = 'PROTOCOL' | 'REALITY';

const Dashboard: React.FC<DashboardProps> = ({ goal, onBack, onToggleTask, onAddTask, onEditTask, onDeleteTask, onAddJournalEntry }) => {
  const [activeTab, setActiveTab] = useState<Tab>('PROTOCOL');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  
  // Adding Task State
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Editing Task State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Timers State
  const [refreshTimeLeft, setRefreshTimeLeft] = useState('');
  const [deadlineTimeLeft, setDeadlineTimeLeft] = useState('');
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    const updateTimers = () => {
      const now = Date.now();
      
      // Daily Refresh Timer
      const nextRefresh = goal.lastGeneratedAt + (24 * 60 * 60 * 1000);
      const refreshDiff = nextRefresh - now;
      if (refreshDiff <= 0) {
        setRefreshTimeLeft('00:00:00');
      } else {
        const h = Math.floor((refreshDiff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((refreshDiff / (1000 * 60)) % 60);
        const s = Math.floor((refreshDiff / 1000) % 60);
        setRefreshTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }

      // Deadline Timer
      const deadlineDiff = goal.targetDate - now;
      const days = Math.floor(deadlineDiff / (1000 * 60 * 60 * 24));
      setDaysRemaining(Math.max(0, days));
      
      if (deadlineDiff <= 0) {
        setDeadlineTimeLeft("DEADLINE REACHED");
      } else {
         const h = Math.floor((deadlineDiff / (1000 * 60 * 60)) % 24);
         setDeadlineTimeLeft(`${days}d ${h}h`);
      }
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [goal.lastGeneratedAt, goal.targetDate]);

  const handleShare = async () => {
    const text = `Day ${goal.streak + 1} on The Bridge. ${daysRemaining} days left to achieve: ${goal.title}. Trajectory: ${goal.drift < 20 ? 'OPTIMAL' : 'DRIFTING'}.`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'The Bridge - My Progress',
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Status copied to clipboard');
    }
  };

  const startEdit = (task: DailyTask) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDesc(task.description);
  };

  const saveEdit = () => {
    if (editingId && editTitle) {
      onEditTask(editingId, editTitle, editDesc);
      setEditingId(null);
    }
  };

  const saveNew = () => {
    if (newTitle) {
      onAddTask(newTitle, newDesc);
      setNewTitle('');
      setNewDesc('');
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-4xl mx-auto flex flex-col gap-8 animate-fade-in relative">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-zinc-800 pb-4">
        <button 
          onClick={onBack}
          className="self-start text-xs text-zinc-500 hover:text-white uppercase tracking-widest flex items-center gap-1 transition-colors"
        >
          <ChevronLeft size={14} /> Command Center
        </button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase mb-1 leading-none">{goal.title}</h1>
            <div className="flex flex-wrap gap-4 items-center text-xs md:text-sm">
                <div className="flex items-center gap-1 text-zinc-400">
                    <CalendarClock size={14} className={daysRemaining < 7 ? "text-red-500" : "text-zinc-600"} />
                    <span className={daysRemaining < 7 ? "text-red-500 font-bold" : "text-white font-bold"}>
                        {deadlineTimeLeft} Remaining
                    </span>
                </div>
                <div className="flex items-center gap-1 text-zinc-400">
                    <Flame size={14} className={goal.streak > 0 ? "text-orange-500" : "text-zinc-600"} />
                    <span className="text-white font-bold">{goal.streak} Day Streak</span>
                </div>
                <div className="flex items-center gap-1 text-zinc-400">
                    <Activity size={14} className={goal.drift > 30 ? "text-red-500" : "text-green-500"} />
                    <span className={goal.drift > 30 ? "text-red-500 font-bold" : "text-green-500 font-bold"}>
                        {goal.drift}% Drift
                    </span>
                </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 w-full md:w-auto">
             <div className="text-right">
                <span className="text-[10px] uppercase text-zinc-500 tracking-widest block">Next Directives In</span>
                <div className="font-mono text-xl font-bold text-white flex items-center gap-2 justify-end">
                   <Clock size={16} className="text-zinc-500" />
                   {refreshTimeLeft}
                </div>
             </div>
            <div className="flex gap-2">
                <button 
                  onClick={() => setIsJournalOpen(true)}
                  className="flex items-center gap-2 text-xs text-white bg-zinc-900 hover:bg-zinc-800 px-3 py-2 rounded-lg transition-colors uppercase tracking-widest border border-zinc-800"
                >
                  <Book size={12} /> Log
                </button>
                <button 
                  onClick={handleShare}
                  className="flex items-center gap-2 text-xs text-white bg-zinc-900 hover:bg-zinc-800 px-3 py-2 rounded-lg transition-colors uppercase tracking-widest border border-zinc-800"
                >
                  <Share2 size={12} /> Share
                </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-lg self-start border border-zinc-800">
         <button 
           onClick={() => setActiveTab('PROTOCOL')}
           className={`flex items-center gap-2 px-6 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'PROTOCOL' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
         >
           <Activity size={14} />
           Daily Protocol
         </button>
         <button 
           onClick={() => setActiveTab('REALITY')}
           className={`flex items-center gap-2 px-6 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'REALITY' ? 'bg-amber-900 text-amber-100 shadow-lg' : 'text-zinc-500 hover:text-white'}`}
         >
           <AlertTriangle size={14} />
           Reality Check
         </button>
      </div>

      {activeTab === 'PROTOCOL' ? (
        <>
          {/* Quote */}
          <div className="bg-zinc-900/50 p-6 rounded-xl border-l-4 border-white italic text-zinc-300 animate-in fade-in slide-in-from-bottom-2">
            "{goal.motivationalQuote}"
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
            
            {/* Left Col: Visualizer & Stats */}
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Proximity Sensor</h2>
                <Visualizer 
                    progress={goal.progress} 
                    futureSelfImage={goal.futureSelfImageBase64}
                    drift={goal.drift}
                />
              </div>
              <ProgressChart tasks={goal.tasks} />
            </div>

            {/* Right Col: Tasks */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Daily Directives</h2>
                <button 
                  onClick={() => setIsAdding(!isAdding)}
                  className="text-xs flex items-center gap-1 bg-white text-black px-2 py-1 rounded font-bold hover:bg-zinc-200 transition-colors"
                >
                  {isAdding ? <X size={12}/> : <Plus size={12} />} {isAdding ? 'Cancel' : 'Add'}
                </button>
              </div>
              
              <div className="flex flex-col gap-3">
                {/* Add New Task Form */}
                {isAdding && (
                  <div className="p-4 rounded-xl border border-zinc-700 bg-zinc-900/50 flex flex-col gap-3 animate-in fade-in">
                      <input 
                        type="text" 
                        placeholder="New Directive Title"
                        className="bg-black border border-zinc-700 rounded p-2 text-sm text-white focus:border-white focus:outline-none"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                      />
                      <input 
                        type="text" 
                        placeholder="Brief description..."
                        className="bg-black border border-zinc-700 rounded p-2 text-xs text-zinc-400 focus:border-white focus:outline-none"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                      />
                      <button onClick={saveNew} className="w-full bg-white text-black text-xs font-bold uppercase py-2 rounded hover:bg-zinc-200">
                        Confirm Addition
                      </button>
                  </div>
                )}

                {goal.tasks.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                        <p>No directives generated yet.</p>
                    </div>
                ) : (
                    goal.tasks.map((task) => (
                      <div 
                          key={task.id}
                          className={`
                            group relative p-4 rounded-xl border transition-all duration-300 overflow-hidden
                            ${task.completed 
                              ? 'bg-zinc-900 border-zinc-800 opacity-60' 
                              : 'bg-black border-zinc-700 hover:border-white hover:bg-zinc-900'
                            }
                          `}
                      >
                          {editingId === task.id ? (
                            // Edit Mode
                            <div className="flex flex-col gap-2 relative z-20">
                              <input 
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="bg-zinc-800 text-white p-1 rounded border border-zinc-600 focus:border-white outline-none font-bold"
                              />
                              <input 
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                className="bg-zinc-800 text-zinc-300 p-1 rounded border border-zinc-600 focus:border-white outline-none text-xs"
                              />
                              <div className="flex gap-2 mt-2">
                                <button onClick={saveEdit} className="bg-white text-black p-1 rounded"><Save size={14}/></button>
                                <button onClick={() => setEditingId(null)} className="bg-zinc-700 text-white p-1 rounded"><X size={14}/></button>
                              </div>
                            </div>
                          ) : (
                            // View Mode
                            <>
                              <div className="flex items-start gap-4 z-10 relative">
                                <button 
                                  onClick={() => onToggleTask(task.id)}
                                  className={`mt-1 transition-colors ${task.completed ? 'text-green-500' : 'text-zinc-500 group-hover:text-white'}`}
                                >
                                  {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                </button>
                                <div className="flex-1">
                                  <h3 className={`font-bold text-lg leading-tight mb-1 ${task.completed ? 'line-through text-zinc-500' : 'text-white'}`}>
                                    {task.title}
                                  </h3>
                                  <p className="text-xs text-zinc-400">{task.description}</p>
                                </div>
                              </div>
                              
                              {/* Action Buttons (Hover) */}
                              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                <button onClick={() => startEdit(task)} className="text-zinc-500 hover:text-white"><Edit2 size={14} /></button>
                                <button onClick={() => onDeleteTask(task.id)} className="text-zinc-500 hover:text-red-500"><Trash2 size={14} /></button>
                              </div>

                              {/* Impact Indicator */}
                              {!editingId && (
                                <div className="absolute bottom-4 right-4 flex gap-1">
                                  {Array.from({length: Math.ceil(task.impactScore / 3)}).map((_, i) => (
                                    <div key={i} className={`w-1 h-1 rounded-full ${task.completed ? 'bg-zinc-800' : 'bg-white'}`} />
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                      </div>
                    ))
                )}

                {goal.progress === 100 && (
                  <div className="mt-4 p-6 bg-white text-black rounded-xl flex items-center gap-4 animate-bounce">
                      <Trophy size={32} />
                      <div>
                        <h3 className="font-black text-xl">DAILY PROTOCOL COMPLETE</h3>
                        <p className="text-sm">You have aligned with your future self for today.</p>
                      </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="animate-in fade-in slide-in-from-right duration-500">
           <RealityCheck 
             image={goal.currentRoutineImageBase64} 
             routine={goal.routine} 
           />
        </div>
      )}

      {/* Chat FAB */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-white text-black rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center hover:scale-110 transition-transform z-50"
      >
        {isChatOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Chat Window */}
      <AIChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} goal={goal.title} />
      
      {/* Journal Window */}
      <Journal 
        isOpen={isJournalOpen} 
        onClose={() => setIsJournalOpen(false)} 
        entries={goal.journal || []} 
        onAddEntry={onAddJournalEntry}
      />

    </div>
  );
};

export default Dashboard;
