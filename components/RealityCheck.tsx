import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface RealityCheckProps {
  image: string | null;
  routine: string;
}

const RealityCheck: React.FC<RealityCheckProps> = ({ image, routine }) => {
  return (
    <div className="w-full h-[600px] relative rounded-3xl overflow-hidden border border-amber-900/50 group">
      {/* Background Image */}
      {image ? (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105 filter grayscale contrast-125 brightness-75 sepia-[.3]"
          style={{ backgroundImage: `url(${image})` }} 
        />
      ) : (
        <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
            <span className="text-zinc-700 uppercase tracking-widest font-bold">Image Unavailable</span>
        </div>
      )}

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
      
      {/* Scan lines effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,11,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#000000_120%)] pointer-events-none" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-20 flex flex-col items-start gap-4">
        <div className="flex items-center gap-2 text-amber-600 bg-black/80 px-4 py-2 rounded border border-amber-900/50 backdrop-blur-sm">
           <AlertTriangle size={18} />
           <span className="text-xs font-bold uppercase tracking-[0.2em] animate-pulse">Warning: Trajectory Drift</span>
        </div>
        
        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none max-w-2xl">
          The Cost of Inaction
        </h2>
        
        <div className="max-w-xl bg-black/60 border-l-2 border-amber-700 p-4 backdrop-blur-md">
           <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Based on current routine:</p>
           <p className="text-white text-sm md:text-base leading-relaxed italic">
             "{routine}"
           </p>
        </div>
        
        <div className="mt-4 flex gap-4">
             <div className="text-center">
                <span className="block text-2xl font-black text-zinc-600">0%</span>
                <span className="text-[10px] uppercase text-zinc-700 tracking-widest">Growth</span>
             </div>
             <div className="w-px h-10 bg-zinc-800" />
             <div className="text-center">
                <span className="block text-2xl font-black text-amber-700">100%</span>
                <span className="text-[10px] uppercase text-amber-900 tracking-widest">Stagnation</span>
             </div>
        </div>
      </div>
    </div>
  );
};

export default RealityCheck;