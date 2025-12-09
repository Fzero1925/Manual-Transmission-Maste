import React from 'react';
import { Gear } from '../types';

interface DashboardProps {
    rpm: number;
    speed: number;
    gear: Gear;
    isStalled: boolean;
    engineOn: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ rpm, speed, gear, isStalled, engineOn }) => {
    
    // Calculate rotation angles
    // RPM: 0-8000 -> -135deg to +135deg
    const rpmDeg = -135 + (rpm / 8000) * 270;
    // Speed: 0-240 -> -135deg to +135deg
    const speedDeg = -135 + (speed / 240) * 270;

    return (
        <div className="flex gap-8 justify-center items-center py-6 bg-black/40 rounded-xl border border-white/10 backdrop-blur-md">
            
            {/* Tachometer (RPM) */}
            <div className="relative w-48 h-48 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
                {/* Ticks */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                     <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="10" strokeDasharray="75 25" transform="rotate(135 50 50)" />
                     {/* Redline zone */}
                     <circle cx="50" cy="50" r="45" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="10 90" strokeDashoffset="-60" transform="rotate(135 50 50)" />
                </svg>
                
                {/* Needle */}
                <div 
                    className="absolute w-1 h-20 bg-red-500 origin-bottom rounded-full transition-transform duration-100 ease-out shadow-[0_0_10px_red]"
                    style={{ transform: `rotate(${rpmDeg}deg) translateY(-50%)`, bottom: '50%' }}
                ></div>
                
                {/* Center Cap */}
                <div className="absolute w-4 h-4 bg-slate-200 rounded-full shadow-lg z-10"></div>
                
                <div className="absolute bottom-10 flex flex-col items-center">
                    <span className="text-2xl font-mono font-bold text-white">{Math.round(rpm)}</span>
                    <span className="text-xs text-slate-400 font-bold">RPM</span>
                </div>
            </div>

            {/* Info Center */}
            <div className="flex flex-col items-center space-y-2 w-32">
                 <div className="w-16 h-16 bg-slate-800 rounded border-2 border-slate-600 flex items-center justify-center">
                     <span className={`text-4xl font-mono font-bold ${gear === Gear.R ? 'text-red-500' : 'text-blue-400'}`}>
                         {gear}
                     </span>
                 </div>
                 <div className="flex gap-2">
                     <div className={`w-3 h-3 rounded-full ${engineOn ? 'bg-green-500 shadow-[0_0_8px_lime]' : 'bg-red-900'}`} title="Engine Status"></div>
                     <div className={`w-3 h-3 rounded-full ${isStalled ? 'bg-red-600 animate-ping' : 'bg-red-900'}`} title="Battery/Stall"></div>
                     <div className={`w-3 h-3 rounded-full bg-amber-900`} title="Check Engine"></div>
                 </div>
            </div>

            {/* Speedometer */}
            <div className="relative w-48 h-48 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                     <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="10" strokeDasharray="75 25" transform="rotate(135 50 50)" />
                </svg>
                
                {/* Needle */}
                <div 
                    className="absolute w-1 h-20 bg-blue-500 origin-bottom rounded-full transition-transform duration-100 ease-out shadow-[0_0_10px_blue]"
                    style={{ transform: `rotate(${speedDeg}deg) translateY(-50%)`, bottom: '50%' }}
                ></div>

                 {/* Center Cap */}
                 <div className="absolute w-4 h-4 bg-slate-200 rounded-full shadow-lg z-10"></div>

                <div className="absolute bottom-10 flex flex-col items-center">
                    <span className="text-2xl font-mono font-bold text-white">{Math.round(speed)}</span>
                    <span className="text-xs text-slate-400 font-bold">km/h</span>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
