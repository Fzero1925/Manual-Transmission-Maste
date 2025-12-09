import React from 'react';
import { Gear } from '../types';

interface ControlsProps {
  throttle: number;
  setThrottle: (val: number) => void;
  clutch: number;
  setClutch: (val: number) => void;
  brake: number;
  setBrake: (val: number) => void;
  currentGear: Gear;
  setGear: (gear: Gear) => void;
  engineOn: boolean;
  toggleEngine: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  throttle,
  setThrottle,
  clutch,
  setClutch,
  brake,
  setBrake,
  currentGear,
  setGear,
  engineOn,
  toggleEngine
}) => {
  
  const gearsGrid = [
    [Gear.FIRST, Gear.THIRD, Gear.FIFTH],
    [Gear.SECOND, Gear.FOURTH, Gear.R]
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-800 rounded-xl border border-slate-700 shadow-xl">
      
      {/* Left: Pedals */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-200 border-b border-slate-600 pb-2">驾驶踏板 (Pedals)</h3>
        
        {/* Clutch */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-yellow-400 font-bold">离合器 (Clutch)</span>
            <span>{Math.round(clutch * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={clutch}
            onChange={(e) => setClutch(parseFloat(e.target.value))}
            className="w-full h-4 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
          />
          <p className="text-xs text-slate-400">最左侧踏板。踩下切断动力，抬起接合动力。</p>
        </div>

        {/* Brake */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-red-400 font-bold">刹车 (Brake)</span>
            <span>{Math.round(brake * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={brake}
            onChange={(e) => setBrake(parseFloat(e.target.value))}
            className="w-full h-4 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
        </div>

        {/* Throttle */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-green-400 font-bold">油门 (Throttle)</span>
            <span>{Math.round(throttle * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={throttle}
            onChange={(e) => setThrottle(parseFloat(e.target.value))}
            className="w-full h-4 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
          />
           <p className="text-xs text-slate-400">控制进气量，增加发动机转速。</p>
        </div>
      </div>

      {/* Right: Gear Stick & Ignition */}
      <div className="flex flex-col justify-between">
         <div>
            <h3 className="text-lg font-bold text-slate-200 border-b border-slate-600 pb-2 mb-4">换挡杆 (Gear Stick)</h3>
            <div className="flex flex-col items-center bg-slate-900 p-4 rounded-lg border border-slate-700">
                <div className="flex gap-4 mb-4">
                     <button 
                        onClick={() => setGear(Gear.N)}
                        className={`w-full py-2 px-4 rounded font-bold transition-all ${currentGear === Gear.N ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                     >
                        N (空挡)
                     </button>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                    {gearsGrid[0].map(g => (
                        <button
                            key={g}
                            onClick={() => setGear(g)}
                            className={`w-16 h-16 rounded-full font-bold text-xl flex items-center justify-center transition-all border-2
                                ${currentGear === g 
                                    ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] transform scale-105' 
                                    : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400'
                                }`}
                        >
                            {g}
                        </button>
                    ))}
                    {gearsGrid[1].map(g => (
                        <button
                            key={g}
                            onClick={() => setGear(g)}
                            className={`w-16 h-16 rounded-full font-bold text-xl flex items-center justify-center transition-all border-2
                                ${currentGear === g 
                                    ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] transform scale-105' 
                                    : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400'
                                }`}
                        >
                            {g}
                        </button>
                    ))}
                </div>
                <div className="mt-4 text-xs text-slate-500 text-center">
                    提示：换挡前请踩下离合器，否则可能损坏变速箱（模拟中无惩罚）。
                </div>
            </div>
         </div>

         <div className="mt-6 flex items-center justify-between bg-slate-900 p-4 rounded-lg border border-slate-700">
             <div className="text-sm text-slate-400">
                 ENGINE START/STOP
             </div>
             <button
                onClick={toggleEngine}
                className={`w-16 h-16 rounded-full border-4 flex items-center justify-center shadow-lg transition-all active:scale-95 ${engineOn ? 'bg-green-500/20 border-green-500 text-green-500 shadow-green-500/20 animate-pulse' : 'bg-red-500/10 border-red-800 text-red-800'}`}
             >
                 <span className="font-bold text-xs">{engineOn ? 'ON' : 'START'}</span>
             </button>
         </div>
      </div>
    </div>
  );
};

export default Controls;
