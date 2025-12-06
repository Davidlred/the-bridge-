
import React, { useEffect, useState } from 'react';

interface VisualizerProps {
  progress: number; // 0 to 100
  futureSelfImage: string | null;
  drift: number; // 0 to 100
}

const Visualizer: React.FC<VisualizerProps> = ({ progress, futureSelfImage, drift }) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [displayDrift, setDisplayDrift] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDisplayProgress(progress);
      setDisplayDrift(drift);
    }, 100);
    return () => clearTimeout(timeout);
  }, [progress, drift]);

  // Path length approx 300px height in SVG
  const pathHeight = 300;
  const currentY = pathHeight - (pathHeight * (displayProgress / 100));

  // Determine deviation x-offset based on drift (max +/- 100px)
  // We oscillate slightly to show instability if drift is high
  const deviationX = (displayDrift / 100) * 120; 

  const probability = Math.max(0, 100 - displayDrift - (100 - displayProgress) * 0.2);

  return (
    <div className="relative w-full h-[500px] flex items-center justify-center overflow-hidden bg-black border border-zinc-800 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-colors duration-500">
      
      {/* Background Grid effect */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ 
             backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`, 
             backgroundSize: '40px 40px' 
           }}>
      </div>

      {/* Trajectory Label */}
      <div className={`absolute top-4 left-4 z-40 bg-zinc-900/80 rounded-lg border p-1 transition-colors ${displayDrift > 40 ? 'border-red-900' : 'border-zinc-700'}`}>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded text-black transition-colors ${
          displayDrift > 60 ? 'bg-red-600 text-white' : 
          displayDrift > 30 ? 'bg-amber-500 text-black' : 
          'bg-white'
        }`}>
          Trajectory: {displayDrift > 60 ? 'CRITICAL FAILURE' : displayDrift > 30 ? 'DRIFTING' : 'LOCKED ON'}
        </span>
      </div>

      {/* Probability */}
      <div className="absolute top-4 right-4 z-40 flex flex-col items-end">
         <span className="text-[10px] uppercase text-zinc-500 tracking-widest">Success Prob.</span>
         <span className={`text-xl font-black font-mono ${probability < 50 ? 'text-red-500' : 'text-white'}`}>
           {Math.round(probability)}%
         </span>
      </div>

      {/* The Target Image Node */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center">
        <div className={`
          relative w-24 h-24 rounded-full border-2 overflow-hidden transition-all duration-1000 
          ${displayProgress === 100 ? 'border-white shadow-[0_0_50px_rgba(255,255,255,0.8)] scale-125' : 'border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] opacity-80'}
        `}>
          {futureSelfImage ? (
             <img src={futureSelfImage} alt="Target State" className="w-full h-full object-cover transition-opacity duration-500" />
          ) : (
            <div className="w-full h-full bg-zinc-900 animate-pulse" />
          )}
        </div>
      </div>

      {/* The Path */}
      <svg width="100%" height="100%" viewBox="0 0 400 500" className="absolute inset-0 z-10 pointer-events-none">
        <defs>
          <linearGradient id="pathGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
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
        <line x1="200" y1="130" x2="200" y2="450" stroke="url(#pathGradient)" strokeWidth="2" strokeDasharray="4 4" opacity="0.3" />

        {/* Connection Beam (fills up) - Fades if drifting */}
         <line 
            x1="200" 
            y1="450" 
            x2="200" 
            y2={130 + currentY * (320/300)} 
            stroke={displayDrift > 50 ? "#ef4444" : "#ffffff"} 
            strokeWidth={Math.max(1, 4 - (displayDrift/20))} 
            filter="url(#glow)"
            className="transition-all duration-1000 ease-out"
            opacity={1 - (displayDrift / 100)}
          />
          
          {/* Drift Line (Red tether) */}
          {displayDrift > 5 ? (
             <line 
               x1="200" 
               y1={130 + currentY * (320/300)} // Connects to ideal spot on beam
               x2={200 + deviationX} 
               y2={130 + currentY * (320/300)} // Connects to user
               stroke="#ef4444" 
               strokeWidth="1" 
               strokeDasharray="2 2"
               opacity="0.6"
             />
          ) : null}
      </svg>

      {/* The User (Orb) */}
      <div 
        className="absolute z-30 transition-all duration-1000 ease-in-out"
        style={{ 
            top: `${85 - (displayProgress * 0.65)}%`,
            left: `calc(50% + ${deviationX}px)`
        }}
      >
        <div className="relative transform -translate-x-1/2 -translate-y-1/2">
          <div className={`w-6 h-6 rounded-full shadow-[0_0_30px_rgba(255,255,255,1)] transition-colors ${displayDrift > 50 ? 'bg-red-500 shadow-red-500' : 'bg-white'}`} />
          <div className={`absolute -inset-4 rounded-full opacity-10 animate-ping ${displayDrift > 50 ? 'bg-red-500' : 'bg-white'}`} />
          
          {/* Progress Label tooltip */}
          <div className={`absolute top-0 w-max transition-all ${deviationX > 0 ? 'right-10 text-right' : 'left-10 text-left'}`}>
            <span className={`text-4xl font-black ${displayDrift > 50 ? 'text-red-500' : 'text-white'}`}>{Math.round(displayProgress)}%</span>
            <span className="block text-xs text-zinc-400 uppercase tracking-widest">To Achievement</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 text-center w-full">
         <p className="text-zinc-600 text-xs uppercase tracking-widest">
           Start Point: Current Routine
         </p>
      </div>

    </div>
  );
};

export default Visualizer;
