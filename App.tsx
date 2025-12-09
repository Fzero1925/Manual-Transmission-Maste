import React, { useState, useEffect, useRef } from 'react';
import Dashboard from './components/Dashboard';
import Controls from './components/Controls';
import Visualizer from './components/Visualizer';
import { SimulationState, Gear, GEAR_RATIOS, IDLE_RPM, REDLINE_RPM, FINAL_DRIVE_RATIO } from './types';
import { explainMechanics } from './services/geminiService';

const App: React.FC = () => {
  // State
  const [engineOn, setEngineOn] = useState(false);
  const [rpm, setRpm] = useState(0);
  const [speed, setSpeed] = useState(0); // km/h
  const [gear, setGear] = useState<Gear>(Gear.N);
  const [clutchPedal, setClutchPedal] = useState(0); // 0 = engaged (up), 1 = disengaged (down)
  const [throttlePedal, setThrottlePedal] = useState(0);
  const [brakePedal, setBrakePedal] = useState(0);
  const [isStalled, setIsStalled] = useState(false);
  
  // AI Explanation
  const [explanation, setExplanation] = useState<string>("点击下方按钮获取当前状态的 AI 讲解...");
  const [isExplaining, setIsExplaining] = useState(false);

  // Physics Refs for smooth animation loop
  const stateRef = useRef({
    rpm: 0,
    speed: 0,
    gear: Gear.N,
    clutch: 0,
    throttle: 0,
    brake: 0,
    engineOn: false,
    isStalled: false
  });

  // Sync refs with state for the loop
  useEffect(() => {
    stateRef.current = { rpm, speed, gear, clutch: clutchPedal, throttle: throttlePedal, brake: brakePedal, engineOn, isStalled };
  }, [rpm, speed, gear, clutchPedal, throttlePedal, brakePedal, engineOn, isStalled]);

  // Physics Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const updatePhysics = (time: number) => {
      const dt = (time - lastTime) / 1000; // Delta time in seconds
      lastTime = time;

      const s = stateRef.current;
      
      if (!s.engineOn) {
        // Engine off logic
        let newRpm = s.rpm - (s.rpm * 2 * dt); // Spin down
        if (newRpm < 0) newRpm = 0;
        setRpm(newRpm);
        
        // Car slows down
        let newSpeed = s.speed - (s.speed * 0.5 * dt) - (s.brake * 50 * dt);
        if (newSpeed < 0) newSpeed = 0;
        setSpeed(newSpeed);
        
        animationFrameId = requestAnimationFrame(updatePhysics);
        return;
      }

      if (s.isStalled) {
         setRpm(0);
         setSpeed(s.speed * (1 - dt)); // Friction stops car
         animationFrameId = requestAnimationFrame(updatePhysics);
         return;
      }

      // Physics Constants
      const ENGINE_POWER_FACTOR = 4000; // How fast RPM rises
      const ENGINE_DRAG = 500; // Internal friction
      const VEHICLE_DRAG = 0.2; // Air resistance
      const BRAKE_POWER = 100; // Brake deceleration
      
      const ratio = GEAR_RATIOS[s.gear];
      const isNeutral = s.gear === Gear.N;
      
      // Clutch engagement factor (0 = fully engaged, 1 = fully disengaged)
      // When clutch is 0, engine and wheels are locked.
      // When clutch is 1, they are independent.
      const engagement = 1 - s.clutch; 

      // 1. Calculate Engine Target RPM based on Throttle (Free revving)
      // Simple model: Throttle adds RPM, Drag removes it.
      let rpmChange = (s.throttle * ENGINE_POWER_FACTOR * dt) - (ENGINE_DRAG * dt);
      
      // Return to idle logic
      if (s.throttle === 0 && s.rpm > IDLE_RPM) {
          rpmChange -= 1000 * dt; // Decelerate to idle
      }

      let newRpm = s.rpm + rpmChange;
      
      // 2. Calculate Vehicle Speed Physics
      // Drag
      let speedChange = -(s.speed * VEHICLE_DRAG * dt) - (s.brake * BRAKE_POWER * dt);
      
      let newSpeed = s.speed + speedChange;
      if (newSpeed < 0) newSpeed = 0;

      // 3. Coupling Logic
      if (isNeutral || engagement < 0.1) {
          // Disconnected: Engine and Wheels act independently
          if (newRpm < IDLE_RPM) newRpm = IDLE_RPM;
          if (newRpm > REDLINE_RPM) newRpm = REDLINE_RPM;
      } else {
          // Connected (partially or fully)
          // Calculate the RPM implied by current wheel speed
          // Speed (km/h) to m/s -> / 3.6
          // Tire circumference approx 2m.
          // Axle RPM = (Speed / 3.6 / 2) * 60
          // Engine RPM = Axle RPM * Final Drive * Gear Ratio
          const wheelRpm = (s.speed * 1000 / 60 / 2); // Roughly
          const targetEngineRpmFromSpeed = Math.abs(s.speed * ratio * 30); // Simplified constant 30 to match scales
          
          // Interpolate RPM towards the speed-matched RPM based on clutch engagement
          // If clutch is fully engaged (1.0), RPM is forced to match speed.
          
          // Torque Transfer:
          // If Engine RPM > Target, Car speeds up.
          // If Engine RPM < Target, Car slows down (Engine braking).
          
          const rpmDiff = newRpm - targetEngineRpmFromSpeed;
          
          // Force transfer
          // This effectively "pulls" the RPM towards the wheel speed, and pulls wheel speed towards RPM
          const transferRate = engagement * 5 * dt; 
          
          newRpm = newRpm - (rpmDiff * transferRate);
          
          // Apply torque to speed
          // If engine has power (throttle), add speed. If not, engine braking.
          const torqueToWheels = (rpmDiff * engagement * 0.05 * dt);
          newSpeed += torqueToWheels;
          
          // Stall Logic
          if (newRpm < 400 && engagement > 0.8) {
              setIsStalled(true);
              setEngineOn(false);
          }
      }

      // Bounds
      if (newRpm < 0) newRpm = 0;
      if (newSpeed < 0) newSpeed = 0;
      
      // Rev Limiter
      if (newRpm > REDLINE_RPM + 500) newRpm = REDLINE_RPM + 500; // Bounce

      setRpm(newRpm);
      setSpeed(newSpeed);

      animationFrameId = requestAnimationFrame(updatePhysics);
    };

    animationFrameId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animationFrameId);
  }, []); // Empty dependency array ensures loop setup only once, refs handle current values

  // Handlers
  const handleToggleEngine = () => {
    if (engineOn) {
      setEngineOn(false);
    } else {
      setEngineOn(true);
      setIsStalled(false);
      setRpm(IDLE_RPM);
    }
  };

  const handleAskAI = async (question: string) => {
    setIsExplaining(true);
    const currentState: SimulationState = {
        rpm, speed, gear, clutchPedal, throttlePedal, brakePedal, isStalled, engineOn
    };
    const text = await explainMechanics(question, currentState);
    setExplanation(text);
    setIsExplaining(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-10">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl md:text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
              MANUAL<span className="text-slate-500 font-thin">.sim</span>
            </h1>
            <div className="text-xs text-slate-500 font-mono hidden md:block">
               CLUTCH CONTROL SIMULATOR v1.0
            </div>
        </div>
      </header>

      <main className="container mx-auto p-4 space-y-6 max-w-5xl">
        
        {/* Main Dashboard Area */}
        <section className="space-y-4">
             <Visualizer state={{ rpm, speed, gear, clutchPedal, throttlePedal, brakePedal, isStalled, engineOn }} />
             <Dashboard rpm={rpm} speed={speed} gear={gear} isStalled={isStalled} engineOn={engineOn} />
        </section>

        {/* Controls Area */}
        <section>
            <Controls 
                throttle={throttlePedal}
                setThrottle={setThrottlePedal}
                clutch={clutchPedal}
                setClutch={setClutchPedal}
                brake={brakePedal}
                setBrake={setBrakePedal}
                currentGear={gear}
                setGear={setGear}
                engineOn={engineOn}
                toggleEngine={handleToggleEngine}
            />
        </section>

        {/* AI Tutor Section */}
        <section className="bg-slate-900 rounded-xl border border-slate-700 p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <h3 className="text-lg font-bold text-slate-200">AI 机械导师</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <button 
                    onClick={() => handleAskAI("我现在应该怎么做才能起步？")}
                    className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-left transition-colors border border-slate-700 hover:border-purple-500"
                >
                    🚗 教学：如何平稳起步？
                </button>
                <button 
                    onClick={() => handleAskAI("解释一下离合器现在的工作状态。")}
                    className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-left transition-colors border border-slate-700 hover:border-purple-500"
                >
                    ⚙️ 原理：离合器现在在干嘛？
                </button>
                <button 
                    onClick={() => handleAskAI("为什么需要换挡？齿轮比是什么？")}
                    className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-left transition-colors border border-slate-700 hover:border-purple-500"
                >
                    🔧 理论：变速箱齿轮比
                </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 min-h-[100px]">
                {isExplaining ? (
                    <div className="flex items-center gap-2 text-purple-400">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        分析系统数据中...
                    </div>
                ) : (
                    <p className="text-slate-300 leading-relaxed whitespace-pre-line">{explanation}</p>
                )}
            </div>
        </section>

      </main>
    </div>
  );
};

export default App;
