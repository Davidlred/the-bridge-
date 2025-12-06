import React, { useState } from 'react';
import { X, Book, Plus, Calendar, Save } from 'lucide-react';
import { JournalEntry } from '../types';

interface JournalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  onAddEntry: (content: string) => void;
}

const Journal: React.FC<JournalProps> = ({ isOpen, onClose, entries, onAddEntry }) => {
  const [content, setContent] = useState('');
  
  const handleSave = () => {
    if (content.trim()) {
      onAddEntry(content);
      setContent('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
             <Book size={20} className="text-white" />
             <h2 className="text-xl font-black uppercase tracking-tighter text-white">Captain's Log</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Sidebar / List (Desktop) */}
          <div className="hidden md:block w-1/3 border-r border-zinc-800 overflow-y-auto bg-black/20 p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Past Entries</h3>
            {entries.length === 0 ? (
               <p className="text-zinc-600 text-xs italic">No entries recorded.</p>
            ) : (
               <div className="space-y-2">
                 {entries.slice().reverse().map(entry => (
                   <div key={entry.id} className="p-3 rounded border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-2 text-zinc-400 text-[10px] uppercase font-bold mb-1">
                         <Calendar size={10} />
                         {new Date(entry.date).toLocaleDateString()}
                      </div>
                      <p className="text-zinc-300 text-xs line-clamp-2">{entry.content}</p>
                   </div>
                 ))}
               </div>
            )}
          </div>

          {/* Main Area */}
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            {/* Mobile History Toggle could go here */}
            
            <div className="mb-6">
               <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">New Entry</label>
               <div className="relative">
                  <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-40 bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-white text-sm focus:border-white focus:outline-none font-mono resize-none leading-relaxed"
                    placeholder="Log your progress, thoughts, or obstacles..."
                  />
                  <button 
                    onClick={handleSave}
                    disabled={!content.trim()}
                    className="absolute bottom-4 right-4 bg-white text-black p-2 rounded-lg hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                  >
                    <Save size={16} />
                  </button>
               </div>
            </div>

            <div className="flex-1">
               <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 md:hidden">Recent Logs</h3>
               <div className="space-y-6">
                 {entries.slice().reverse().map(entry => (
                   <div key={entry.id} className="relative pl-6 border-l border-zinc-800">
                     <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-zinc-700 border-2 border-zinc-950" />
                     <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-zinc-400 font-mono">
                          {new Date(entry.date).toLocaleString()}
                        </span>
                     </div>
                     <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                       {entry.content}
                     </p>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Journal;