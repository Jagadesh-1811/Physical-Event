import React from 'react';
import { Clock, Users, Utensils, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatsProps {
  waitTimes: {
    foodA: number;
    foodB: number;
    restroom1: number;
    restroom2: number;
  };
}

export const VenueStats: React.FC<StatsProps> = ({ waitTimes }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="glass p-4 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-sky-400 flex items-center gap-2">
            <Utensils className="w-4 h-4" /> Concessions
          </h3>
          <span className="text-[10px] px-2 py-0.5 bg-sky-500/10 text-sky-400 rounded border border-sky-400/20 uppercase tracking-widest font-mono">Real-time</span>
        </div>
        <div className="space-y-4">
          <WaitItem label="North Food Plaza" time={waitTimes.foodA} />
          <WaitItem label="South Dining Hall" time={waitTimes.foodB} />
        </div>
      </div>

      <div className="glass p-4 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-sky-400 flex items-center gap-2">
            <Users className="w-4 h-4" /> Restrooms
          </h3>
          <span className="text-[10px] px-2 py-0.5 bg-sky-500/10 text-sky-400 rounded border border-sky-400/20 uppercase tracking-widest font-mono">Real-time</span>
        </div>
        <div className="space-y-4">
          <WaitItem label="Section 204 Restroom" time={waitTimes.restroom1} />
          <WaitItem label="Section 112 Restroom" time={waitTimes.restroom2} />
        </div>
      </div>
    </div>
  );
};

const WaitItem = ({ label, time }: { label: string; time: number }) => {
  const isHigh = time > 15;
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[10px] text-white/40 uppercase tracking-wider">Est. Wait Time</div>
      </div>
      <div className="flex items-center gap-3">
        <div className={cn("text-xl font-mono", isHigh ? "text-orange-400" : "text-sky-400")}>
          {time}
          <span className="text-[10px] ml-1 uppercase">min</span>
        </div>
        <div className="w-1.5 h-10 rounded-full bg-white/5 overflow-hidden">
          <div 
            className={cn("w-full transition-all duration-1000", isHigh ? "bg-orange-400" : "bg-sky-400")} 
            style={{ height: `${(time / 45) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
