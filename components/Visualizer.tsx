import React, { useEffect, useState, useRef } from 'react';
import { SimulationState, Gear, GEAR_RATIOS } from '../types';

interface VisualizerProps {
  state: SimulationState;
}

const Visualizer: React.FC<VisualizerProps> = ({ state }) => {
  const { rpm, speed, gear, clutchPedal, isStalled } = state;
  
  // Use a ref to accumulate rotation for smooth animation irrespective of RPM changes
  const rotationRef = useRef({ engine: 0, transmission: 0, wheels: 0 });
  const lastTimeRef = useRef(performance.now());
  const [, setFrame] = useState(0); // Force render loop

  // --- Calculate Effective Input RPM for both Animation and Visuals ---
  const currentRatio = GEAR_RATIOS[gear];
  const wheelRpm = (speed * 1000 / 60 / 2); // Approx axle rpm
  const transInputRpmFromWheels = currentRatio !== 0 ? Math.abs(wheelRpm * currentRatio * 3.5) : 0;
  
  // Simple blend based on clutch: 0 = engaged (engine), 1 = disengaged (wheels)
  const effectiveInputRpm = (rpm * (1 - clutchPedal)) + (transInputRpmFromWheels * clutchPedal);

  // Animation Loop for smooth continuous rotation
  useEffect(() => {
    let frameId: number;
    const animate = (time: number) => {
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      // 1. Engine Rotation (Degrees)
      // RPM = Rev per minute. Deg/sec = RPM * 360 / 60 = RPM * 6
      rotationRef.current.engine += (rpm * 6) * dt;

      // 2. Transmission Input Shaft Rotation
      rotationRef.current.transmission += (effectiveInputRpm * 6) * dt;

      // 3. Wheels Rotation
      // Speed km/h -> m/s -> rad/s -> deg/s
      // Approx: speed * 15
      rotationRef.current.wheels += (speed * 15) * dt;

      setFrame(f => f + 1);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [rpm, speed, gear, clutchPedal, effectiveInputRpm]);

  // --- Visual Calculations ---
  
  const engRot = rotationRef.current.engine % 360;
  const transRot = rotationRef.current.transmission % 360;
  const wheelRot = rotationRef.current.wheels % 360;

  // Piston Positions (offset by 180 degrees)
  // Sin wave -1 to 1. Piston stroke length 30px.
  // We convert angle to radians.
  const rad = (deg: number) => deg * (Math.PI / 180);
  const piston1Y = Math.sin(rad(engRot)) * 15;
  const piston2Y = Math.sin(rad(engRot + 180)) * 15;

  // Clutch Gap
  const gapPixels = clutchPedal * 25;
  
  // Gear Sizes for Visualization
  // Distance between shafts fixed at 70px.
  // r1 + r2 = 70. r2/r1 = ratio.
  // r1(1+ratio) = 70 => r1 = 70 / (1+ratio)
  const ratio = GEAR_RATIOS[gear];
  const isNeutral = gear === Gear.N;
  // Visual ratio clamp
  const safeRatio = isNeutral ? 1 : Math.max(0.5, Math.min(4, ratio));
  
  const inputGearRadius = 70 / (1 + safeRatio);
  const outputGearRadius = 70 - inputGearRadius;

  return (
    <div className="w-full bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden flex flex-col p-4 shadow-2xl">
       <div className="absolute top-3 left-4 text-blue-400/50 text-xs font-mono tracking-widest z-10 border-b border-blue-900/30 pb-1 w-full">
         POWERTRAIN VISUALIZER // 动力传动剖视图
       </div>
       
       <svg width="100%" height="280" viewBox="0 0 900 280" className="max-w-5xl mx-auto select-none mt-4">
          <defs>
            {/* Metallic Gradients */}
            <linearGradient id="cylinderGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="20%" stopColor="#0f172a" />
                <stop offset="80%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <linearGradient id="shaftGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748b" />
                <stop offset="50%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#475569" />
            </linearGradient>
             <linearGradient id="gearGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="50%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="1"/>
            </pattern>
          </defs>

          {/* Background Grid */}
          <rect x="0" y="0" width="900" height="280" fill="url(#grid)" opacity="0.3" />

          {/* ================= ENGINE (Left) ================= */}
          <g transform="translate(120, 140)">
              {/* Engine Block Silhouette */}
              <path d="M-80 -80 L 80 -80 L 80 40 L 40 80 L -40 80 L -80 40 Z" fill="#1e293b" stroke="#334155" strokeWidth="3" />
              <text x="0" y="-95" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="bold">ENGINE</text>

              {/* Cylinders */}
              <rect x="-50" y="-60" width="40" height="90" fill="url(#cylinderGrad)" stroke="#334155" rx="2" />
              <rect x="10" y="-60" width="40" height="90" fill="url(#cylinderGrad)" stroke="#334155" rx="2" />

              {/* Crankshaft Center */}
              <circle cx="0" cy="50" r="10" fill="#cbd5e1" />
              
              {/* Piston 1 System */}
              <g transform={`translate(-30, 0)`}>
                   {/* Piston Head */}
                   <rect x="-18" y={-50 + piston1Y} width="36" height="25" rx="2" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="2" />
                   {/* Connecting Rod (Calculated visuals) */}
                   {/* Top of rod follows piston. Bottom of rod follows crank. */}
                   {/* Simplified: Line from Piston Bottom Center to Crank Offset */}
                   <line 
                        x1="0" y1={-25 + piston1Y} 
                        x2={10 * Math.cos(rad(engRot + 90))} y2={50 + 10 * Math.sin(rad(engRot + 90))} 
                        stroke="#64748b" strokeWidth="6" strokeLinecap="round" 
                   />
              </g>

              {/* Piston 2 System */}
               <g transform={`translate(30, 0)`}>
                   <rect x="-18" y={-50 + piston2Y} width="36" height="25" rx="2" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="2" />
                   <line 
                        x1="0" y1={-25 + piston2Y} 
                        x2={10 * Math.cos(rad(engRot + 270))} y2={50 + 10 * Math.sin(rad(engRot + 270))} 
                        stroke="#64748b" strokeWidth="6" strokeLinecap="round" 
                   />
              </g>
              
              {/* Crankshaft Web Spinning */}
              <g transform={`translate(0, 50) rotate(${engRot})`}>
                  <path d="M -20 0 L 20 0" stroke="#475569" strokeWidth="8" strokeLinecap="round"/>
                  <circle cx="20" cy="0" r="4" fill="#cbd5e1" />
                  <circle cx="-20" cy="0" r="4" fill="#cbd5e1" />
              </g>

              {/* Output Shaft Stub */}
              <rect x="80" y="45" width="40" height="10" fill="url(#shaftGrad)" />
          </g>

          {/* ================= CLUTCH (Middle) ================= */}
          <g transform="translate(280, 190)">
               <text x="30" y="-140" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="bold">CLUTCH</text>
               
               {/* 1. Flywheel (Connected to Engine Shaft) */}
               {/* Engine Shaft comes from left at y=50 relative to engine center. Here y=0 implies aligned. */}
               {/* Let's align vertically. Engine center was y=140+50 = 190. So this Group y=190 is correct. */}
               
               <g transform={`rotate(${engRot})`}>
                    <circle r="45" fill="#334155" stroke="#1e293b" strokeWidth="2" />
                    {/* Visual texture for rotation */}
                    <circle r="35" fill="none" stroke="#475569" strokeWidth="2" strokeDasharray="10 10" />
                    <rect x="-45" y="-5" width="10" height="10" fill="#fbbf24" opacity="0.5" />
               </g>
               <text x="-60" y="-50" fill="#fbbf24" fontSize="10" opacity="0.7">FLYWHEEL</text>

               {/* 2. Clutch Disc & Pressure Plate (Moves with pedal) */}
               <g transform={`translate(${15 + gapPixels}, 0)`}>
                    
                    {/* Friction Disc (Connected to Transmission Input Shaft) */}
                    <g transform={`rotate(${transRot})`}>
                        <circle r="40" fill="#b45309" stroke="#78350f" strokeWidth="4" />
                        <circle r="25" fill="none" stroke="#fcd34d" strokeWidth="2" strokeDasharray="5 5" />
                    </g>

                    {/* Pressure Plate Housing (Visual only, usually spins with engine but simpler to show separated here) */}
                    <path d="M 45 -45 L 55 -45 L 55 45 L 45 45 Z" fill="#94a3b8" />
                    
                    {/* Diaphragm Spring Fingers */}
                    <circle r="15" fill="none" stroke="#cbd5e1" strokeWidth="3" opacity="0.5" />
               </g>
               
               {/* Throw-out Bearing / Fork */}
               <path d={`M ${60 + gapPixels} -30 L ${60 + gapPixels} 30`} stroke="#ef4444" strokeWidth="4" />
               <path d={`M ${60 + gapPixels} 0 L ${90} 40`} stroke="#64748b" strokeWidth="4" fill="none" />

               {/* Transmission Input Shaft (Green) */}
               {/* Starts at Clutch Disc center, goes right */}
               <rect x={15 + gapPixels} y="-6" width={200 - gapPixels} height="12" fill="url(#shaftGrad)" />

               {/* Interaction Glow */}
               {gapPixels < 5 && Math.abs(rpm - effectiveInputRpm) > 100 && (
                   <circle r="42" fill="none" stroke="orange" strokeWidth="4" opacity="0.6" filter="blur(4px)" />
               )}
          </g>

          {/* ================= TRANSMISSION (Right) ================= */}
          <g transform="translate(600, 190)">
               <text x="60" y="-140" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="bold">TRANSMISSION</text>
               
               {/* Gearbox Case */}
               <rect x="-20" y="-100" width="160" height="200" rx="10" fill="#1e293b" stroke="#334155" strokeWidth="2" opacity="0.8" />
               
               {/* Input Shaft (Top) - Driven by Clutch */}
               {/* Positioned vertically at -35px */}
               <g transform="translate(60, -35)">
                   <rect x="-80" y="-6" width="160" height="12" fill="url(#shaftGrad)" />
                   
                   {/* Input Gear */}
                   <g transform={`rotate(${transRot})`}>
                        <circle r={inputGearRadius} fill="url(#gearGrad)" stroke="#cbd5e1" strokeWidth="2" />
                        <circle r={inputGearRadius - 4} fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="6 4" opacity="0.5" />
                   </g>
               </g>

               {/* Output Shaft (Bottom) - To Wheels */}
               {/* Positioned vertically at +35px */}
               <g transform="translate(60, 35)">
                   <rect x="-80" y="-6" width="220" height="12" fill="url(#shaftGrad)" />
                   
                   {/* Output Gear */}
                   {/* Rotates opposite to input */}
                   <g transform={`rotate(${-transRot / ratio})`}> 
                   {/* Note: simplified rotation logic. Real gear ratio determines speed diff. */}
                   
                        <circle r={outputGearRadius} fill="url(#gearGrad)" stroke="#cbd5e1" strokeWidth="2" />
                        <circle r={outputGearRadius - 4} fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="6 4" opacity="0.5" />
                   </g>
               </g>

               {/* Neutral Visual */}
               {isNeutral && (
                   <path d="M 60 -35 L 60 35" stroke="red" strokeWidth="2" strokeDasharray="5 5" opacity="0.5">
                       <animate attributeName="opacity" values="0;1;0" dur="1s" repeatCount="indefinite" />
                   </path>
               )}
               {isNeutral && <text x="60" y="5" textAnchor="middle" fill="red" fontSize="14" fontWeight="bold">NEUTRAL</text>}

               {/* Output to Wheels */}
               <rect x="140" y="29" width="60" height="12" fill="#475569" />
          </g>

          {/* ================= WHEEL (Far Right) ================= */}
          <g transform="translate(850, 190)">
               <text x="0" y="-60" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="bold">DRIVE</text>
               <g transform={`rotate(${wheelRot})`}>
                   <circle r="40" fill="none" stroke="#334155" strokeWidth="8" strokeDasharray="20 10" />
                   <circle r="30" fill="#1e293b" />
                   <path d="M -30 0 L 30 0 M 0 -30 L 0 30" stroke="#475569" strokeWidth="2" />
               </g>
          </g>

          {/* Connectors / Annotations */}
          <g>
              {/* Clutch Pedal Line */}
              <line x1="300" y1="260" x2={340 + gapPixels} y2="220" stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
          </g>

       </svg>
       
       {/* Overlays */}
       {isStalled && (
        <div className="absolute inset-0 bg-red-950/80 flex items-center justify-center z-20 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-6xl mb-2">🛑</div>
            <div className="text-4xl font-black text-white tracking-widest uppercase">Engine Stalled</div>
            <div className="text-red-200 mt-2 font-mono">Restart Engine to Continue</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Visualizer;