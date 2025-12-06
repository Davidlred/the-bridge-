import React from 'react';
import { DailyTask } from '../types';

interface ProgressChartProps {
  tasks: DailyTask[];
}

const ProgressChart: React.FC<ProgressChartProps> = ({ tasks }) => {
  if (tasks.length === 0) return null;

  const totalImpact = tasks.reduce((sum, t) => sum + t.impactScore, 0);
  const completedImpact = tasks.filter(t => t.completed).reduce((sum, t) => sum + t.impactScore, 0);
  
  // Calculate bar heights (max height 100px)
  const maxImpact = Math.max(...tasks.map(t => t.impactScore), 1);

  // Generate path data for the line connecting the tops of the bars
  // We need to map the bar indices to x coordinates and impact scores to y coordinates
  // Assuming the SVG viewBox is 0 0 100 100
  const pathPoints = tasks.map((task, index) => {
    // X: Center of each bar section. Since we have 'tasks.length' sections, 
    // each section is (100 / length) wide. The center is at (index + 0.5) * width.
    const x = ((index + 0.5) / tasks.length) * 100;
    
    // Y: 0 is top, 100 is bottom.
    // Height of bar % = (score / max) * 100.
    // Y coordinate = 100 - Height %.
    const y = 100 - ((task.impactScore / maxImpact) * 100);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full bg-black border border-zinc-800 rounded-xl p-6 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Impact Velocity</h3>
        <span className="text-xs text-white font-mono">{Math.round((completedImpact / (totalImpact || 1)) * 100)}% Eff.</span>
      </div>
      
      <div className="relative h-32 mt-2 px-2 border-b border-zinc-800">
         {/* Background lines */}
         <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 z-0">
            <div className="w-full h-px bg-zinc-500" />
            <div className="w-full h-px bg-zinc-500" />
            <div className="w-full h-px bg-zinc-500" />
         </div>

         {/* SVG Line Overlay */}
         <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
           <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.2)" />
                <stop offset="100%" stopColor="rgba(255, 255, 255, 0.8)" />
              </linearGradient>
           </defs>
           <polyline 
             points={pathPoints} 
             fill="none" 
             stroke="url(#lineGradient)" 
             strokeWidth="0.5" 
             strokeLinecap="round"
             strokeLinejoin="round"
             className="drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]"
           />
           {/* Dots at vertices */}
           {tasks.map((task, index) => {
             const x = ((index + 0.5) / tasks.length) * 100;
             const y = 100 - ((task.impactScore / maxImpact) * 100);
             return (
               <circle 
                  key={index} 
                  cx={x} 
                  cy={y} 
                  r="1" 
                  fill={task.completed ? "#ffffff" : "#52525b"} 
                  className="transition-colors duration-300"
               />
             );
           })}
         </svg>

         {/* Bars Container */}
         <div className="absolute inset-0 flex items-end justify-between gap-2 z-20">
            {tasks.map((task, idx) => {
                const height = (task.impactScore / maxImpact) * 100;
                return (
                  <div key={task.id} className="flex flex-col items-center gap-2 flex-1 group h-full justify-end">
                    <div className="relative w-full flex justify-center items-end h-full">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black text-[10px] px-2 py-1 rounded whitespace-nowrap z-30 font-bold uppercase pointer-events-none">
                          {task.title.slice(0, 10)}... (Lvl {task.impactScore})
                        </div>
                        {/* Bar */}
                        <div 
                          style={{ height: `${height}%` }}
                          className={`w-2 md:w-4 rounded-t-sm transition-all duration-500 ${
                            task.completed 
                              ? 'bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.5)]' 
                              : 'bg-zinc-800'
                          }`}
                        />
                    </div>
                  </div>
                );
            })}
         </div>
      </div>
      <div className="flex justify-between text-xs text-zinc-500">
         <span>Initiation</span>
         <span>Completion</span>
      </div>
    </div>
  );
};

export default ProgressChart;