import React, { useEffect, useState } from 'react';
import { RefreshCcw } from 'lucide-react';

interface VisualizerProps {
  progress: number; // 0 to 100
  futureSelfImage: string | null;
  currentRoutineImage: string | null;
}

const Visualizer: React.FC<VisualizerProps> = ({ progress, futureSelfImage, currentRoutineImage }) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [mode, setMode] = useState<'GOAL' | 'INERTIA'>('GOAL');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDisplayProgress(progress);
    }, 100);
    return () => clearTimeout(timeout);
  }, [progress]);

  // Path length approx 300px height in SVG
  const pathHeight = 300;
  // If INERTIA mode, the "user" doesn't move up, they stay near the bottom or move very little
  const effectiveProgress = mode === 'GOAL' ? displayProgress : 5; 
  const currentY = pathHeight - (pathHeight * (effectiveProgress / 100));

  const activeImage = mode === 'GOAL' ? futureSelfImage : currentRoutineImage;
  const isGoal = mode === 'GOAL';

  return (
    <div className={`relative w-full h-[500px] flex items-center justify-center overflow-hidden bg-black border rounded-2xl transition-colors duration-500 ${isGoal ? 'border-zinc-800 shadow-[0_0_30px_rgba(255,255,255,0.05)]' : 'border-amber-900/30 shadow-[0_0_30px_rgba(180,83,9,0.05)]'}`}>
      
      {/* Background Grid effect */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ 
             backgroundImage: `linear-gradient(${isGoal ? 'rgba(255, 255, 255, 0.1)' : 'rgba(120, 53, 15, 0.1)'} 1px, transparent 1px), linear-gradient(90deg, ${isGoal ? 'rgba(255, 255, 255, 0.1)' : 'rgba(120, 53, 15, 0.1)'} 1px, transparent 1px)`, 
             backgroundSize: '40px 40px' 
           }}>
      </div>

      {/* Mode Toggle */}
      <div className="absolute top-4 left-4 z-40 flex bg-zinc-900/80 rounded-lg border border-zinc-700 p-1">
        <button 
          onClick={() => setMode('GOAL')}
          className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded transition-colors ${mode === 'GOAL' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
        >
          Trajectory: Growth
        </button>
        <button 
          onClick={() => setMode('INERTIA')}
          className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded transition-colors ${mode === 'INERTIA' ? 'bg-amber-900 text-amber-100' : 'text-zinc-500 hover:text-white'}`}
        >
          Trajectory: Stagnation
        </button>
      </div>

      {/* The Target Image Node */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center">
        <div className={`
          relative w-24 h-24 rounded-full border-2 overflow-hidden transition-all duration-1000 
          ${isGoal 
             ? (displayProgress === 100 ? 'border-white shadow-[0_0_50px_rgba(255,255,255,0.8)] scale-125' : 'border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] opacity-80')
             : 'border-amber-900 opacity-60 grayscale brightness-75'
          }
        `}>
          {activeImage ? (
             <img src={activeImage} alt="Target State" className="w-full h-full object-cover transition-opacity duration-500" />
          ) : (
            <div className="w-full h-full bg-zinc-900 animate-pulse" />
          )}
        </div>
        <span className={`mt-2 text-xs font-bold tracking-widest uppercase ${isGoal ? 'text-zinc-500' : 'text-amber-900/60'}`}>
          {isGoal ? "Projected Outcome" : "Current Trajectory"}
        </span>
      </div>

      {/* The Path */}
      <svg width="100%" height="100%" viewBox="0 0 400 500" className="absolute inset-0 z-10 pointer-events-none">
        <defs>
          <linearGradient id="pathGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isGoal ? "#ffffff" : "#78350f"} stopOpacity="0.8" />
            <stop offset="100%" stopColor={isGoal ? "#ffffff" : "#78350f"} stopOpacity="0.1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Central Path Line */}
        <line x1="200" y1="130" x2="200" y2="450" stroke="url(#pathGradient)" strokeWidth="2" strokeDasharray="4 4" opacity="0.5" />

        {/* Connection Beam (fills up) */}
         <line 
            x1="200" 
            y1="450" 
            x2="200" 
            y2={130 + currentY * (320/300)} 
            stroke={isGoal ? "#ffffff" : "#451a03"} 
            strokeWidth="4" 
            filter="url(#glow)"
            className="transition-all duration-1000 ease-out"
          />
      </svg>

      {/* The User (Orb) */}
      <div 
        className="absolute left-1/2 transform -translate-x-1/2 z-30 transition-all duration-1000 ease-in-out"
        style={{ top: `${85 - (effectiveProgress * 0.65)}%` }}
      >
        <div className="relative">
          <div className={`w-6 h-6 rounded-full shadow-[0_0_30px_rgba(255,255,255,1)] ${isGoal ? 'bg-white' : 'bg-amber-900'}`} />
          <div className={`absolute -inset-4 rounded-full opacity-10 animate-ping ${isGoal ? 'bg-white' : 'bg-amber-600'}`} />
          
          {/* Progress Label tooltip */}
          <div className="absolute left-10 top-0 w-max">
            {isGoal ? (
              <>
                <span className="text-4xl font-black text-white">{Math.round(displayProgress)}%</span>
                <span className="block text-xs text-zinc-400 uppercase tracking-widest">To Achievement</span>
              </>
            ) : (
              <span className="text-xs font-bold text-amber-700 uppercase tracking-widest bg-black/50 px-2 py-1 rounded border border-amber-900/50">
                Drifting...
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 text-center w-full">
         <p className="text-zinc-600 text-xs uppercase tracking-widest">
           {isGoal ? "Start Point: Current Routine" : "Warning: No Change Detected"}
         </p>
      </div>

    </div>
  );
};

export default Visualizer;