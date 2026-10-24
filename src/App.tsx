import { useState, useEffect, useRef, useCallback } from 'react';
import {
  SimulationMode,
  ExplorerState,
  TunnelState,
  RotationState,
  VectorDisplayOptions,
  Language
} from './types';
import {
  EARTH_RADIUS,
  STANDARD_G,
  HEIGHT_ISS
} from './physics/constants';
import { stepVerletTunnel } from './physics/engine';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ExplorerCanvas } from './components/ExplorerCanvas';
import { TunnelCanvas } from './components/TunnelCanvas';
import { RotationCanvas } from './components/RotationCanvas';
import { GraphOverlay } from './components/GraphOverlay';
import { soundFx } from './utils/audio';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Maximize,
  Minimize,
  Grid3X3,
  Orbit,
  FastForward
} from 'lucide-react';

export default function App() {
  // Main simulation mode: Universal Earth Cross-Section & Orbit Lab
  const [mode, setMode] = useState<SimulationMode>('explorer');
  const [lang, setLang] = useState<Language>('bn');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // 1. Universal Earth Cross-Section & Orbit Lab State
  const [explorerState, setExplorerState] = useState<ExplorerState>({
    r: EARTH_RADIUS + HEIGHT_ISS, // default at ISS orbit (408 km)
    latitudeDeg: 0,
    angleRad: 0,
    testMass: 50, // 50 kg test mass per HSC prompt
    useApproximation: false,
    rotationMultiplier: 1.0,
    isRunning: false, // PAUSED initially so student has full explicit Play/Pause control
    motionType: 'orbit',
    orbitSpeedMultiplier: 1.0,
    viewScaleMode: 'leo',
    isDragging: false,
    selectedPreset: 'iss'
  });

  // 2. Tunnel State (Starts PAUSED)
  const [tunnelState, setTunnelState] = useState<TunnelState>({
    position: EARTH_RADIUS, // North Pole (+1.0 R)
    velocity: 0,
    acceleration: -STANDARD_G,
    releaseHeight: 1.0,
    densityMultiplier: 1.0,
    mass: 50,
    isRunning: false,
    elapsedSeconds: 0,
    halfTransitDetected: false,
    firstCrossingTime: null,
    timeSpeed: 300,
    trail: []
  });

  // 3. Rotation State (Starts PAUSED)
  const [rotationState, setRotationState] = useState<RotationState>({
    latitudeDeg: 0, // Equator
    rotationMultiplier: 1.0, // 1x
    humanMass: 70,
    globeAngle: 0,
    isFloating: false,
    isRunning: false
  });

  // Vector Display Options
  const [vectorOptions, setVectorOptions] = useState<VectorDisplayOptions>({
    showTrueGravity: true,
    showVelocity: true,
    showCentrifugal: true,
    showEffectiveGravity: true,
    showTrajectory: true,
    showLatitudeLines: true,
    showApproximation: true,
    showGridView: true,
    showFieldMesh: true,
    showEquipotential: true,
    showGaussMass: true,
    showProofCones: true
  });

  // Fullscreen support
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const toggleFullscreen = useCallback(() => {
    soundFx.playClick();
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else if ((containerRef.current as any)?.webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  const toggleVector = (key: keyof VectorDisplayOptions) => {
    setVectorOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateExplorer = (patch: Partial<ExplorerState>) => {
    setExplorerState(prev => ({ ...prev, ...patch }));
  };

  const resetExplorer = useCallback(() => {
    setExplorerState(prev => ({
      ...prev,
      r: EARTH_RADIUS,
      latitudeDeg: 0,
      angleRad: 0,
      isRunning: false,
      selectedPreset: 'equator'
    }));
  }, []);

  const updateTunnel = (patch: Partial<TunnelState>) => {
    setTunnelState(prev => ({ ...prev, ...patch }));
  };

  const updateRotation = (patch: Partial<RotationState>) => {
    setRotationState(prev => ({ ...prev, ...patch }));
  };

  const resetTunnel = useCallback(() => {
    setTunnelState(prev => ({
      ...prev,
      position: EARTH_RADIUS,
      velocity: 0,
      acceleration: -STANDARD_G * prev.densityMultiplier,
      isRunning: false,
      elapsedSeconds: 0,
      halfTransitDetected: false,
      firstCrossingTime: null,
      trail: []
    }));
  }, []);

  // Tunnel Simulation Loop (when Tunnel tab is active)
  useEffect(() => {
    if (mode !== 'tunnel' || !tunnelState.isRunning) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const realDt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const simDt = Math.min(0.06, Math.max(0.001, realDt)) * tunnelState.timeSpeed;
      const substeps = 10;
      const subDt = simDt / substeps;

      setTunnelState(prev => {
        let y = prev.position;
        let v = prev.velocity;
        let a = prev.acceleration;
        const prevY = y;

        for (let i = 0; i < substeps; i++) {
          const nextState = stepVerletTunnel(y, v, subDt, prev.densityMultiplier);
          y = nextState.nextY;
          v = nextState.nextV;
          a = nextState.nextA;
        }

        const crossedCenter = prevY * y <= 0;
        const newElapsed = prev.elapsedSeconds + simDt;

        let halfTransit = prev.halfTransitDetected;
        let firstTime = prev.firstCrossingTime;

        if (crossedCenter && !prev.firstCrossingTime) {
          firstTime = newElapsed;
        }

        if (prevY > -EARTH_RADIUS && y <= -EARTH_RADIUS) {
          halfTransit = true;
        }

        const nextTrail = [...prev.trail, { y, time: newElapsed }].slice(-100);

        return {
          ...prev,
          position: y,
          velocity: v,
          acceleration: a,
          elapsedSeconds: newElapsed,
          halfTransitDetected: halfTransit,
          firstCrossingTime: firstTime,
          trail: nextTrail
        };
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [mode, tunnelState.isRunning, tunnelState.timeSpeed, tunnelState.densityMultiplier]);

  // Rotation Simulation Loop (when Rotation tab is active)
  useEffect(() => {
    if (mode !== 'rotation' || !rotationState.isRunning) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Smooth visual rotation rate that scales nicely without strobing
      const mult = rotationState.rotationMultiplier;
      const visualRate = mult === 0 ? 0 : 0.28 * Math.min(6.5, Math.pow(Math.max(0.1, mult), 0.68));
      const spinDelta = visualRate * dt;

      setRotationState(prev => ({
        ...prev,
        globeAngle: (prev.globeAngle + spinDelta) % (Math.PI * 2)
      }));

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [mode, rotationState.isRunning, rotationState.rotationMultiplier]);

  // Current Running State
  const isCurrentRunning =
    mode === 'explorer'
      ? explorerState.isRunning
      : mode === 'tunnel'
      ? tunnelState.isRunning
      : rotationState.isRunning;

  const handleTogglePlay = () => {
    soundFx.playClick();
    if (mode === 'explorer') {
      updateExplorer({ isRunning: !explorerState.isRunning });
    } else if (mode === 'tunnel') {
      updateTunnel({ isRunning: !tunnelState.isRunning });
    } else if (mode === 'rotation') {
      updateRotation({ isRunning: !rotationState.isRunning });
    }
  };

  const handleResetCurrent = () => {
    soundFx.playClick();
    if (mode === 'explorer') {
      resetExplorer();
    } else if (mode === 'tunnel') {
      resetTunnel();
    } else if (mode === 'rotation') {
      updateRotation({ globeAngle: 0, isRunning: false });
    }
  };

  const handleStep = () => {
    soundFx.playClick();
    if (mode === 'explorer') {
      // Step angle forward
      updateExplorer({
        angleRad: (explorerState.angleRad + 0.05) % (Math.PI * 2)
      });
    } else if (mode === 'tunnel') {
      const stepDt = 10;
      const res = stepVerletTunnel(
        tunnelState.position,
        tunnelState.velocity,
        stepDt,
        tunnelState.densityMultiplier
      );
      setTunnelState(prev => ({
        ...prev,
        position: res.nextY,
        velocity: res.nextV,
        acceleration: res.nextA,
        elapsedSeconds: prev.elapsedSeconds + stepDt
      }));
    } else if (mode === 'rotation') {
      updateRotation({
        globeAngle: (rotationState.globeAngle + 0.1) % (Math.PI * 2)
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen w-screen bg-slate-100 overflow-hidden text-slate-900 font-sans selection:bg-cyan-500/20"
    >
      {/* Top Application Header */}
      <Header
        currentMode={mode}
        onSelectMode={(newMode) => setMode(newMode)}
        lang={lang}
        onToggleLang={() => setLang(prev => (prev === 'bn' ? 'en' : 'bn'))}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(prev => !prev)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Main Workspace: Sidebar & Interactive Canvas Stage */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left/Bottom Controls & Parameters HUD Panel */}
        <Sidebar
          mode={mode}
          explorerState={explorerState}
          tunnelState={tunnelState}
          rotationState={rotationState}
          vectorOptions={vectorOptions}
          lang={lang}
          onUpdateExplorer={updateExplorer}
          onUpdateTunnel={updateTunnel}
          onUpdateRotation={updateRotation}
          onToggleVector={toggleVector}
          onResetTunnel={resetTunnel}
          onResetExplorer={resetExplorer}
        />

        {/* Right/Center Main Interactive Simulation Canvas Stage */}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-200/50 p-2 sm:p-3">
          {/* Mode Switcher Pills (on smaller screens) */}
          <div className="flex lg:hidden items-center justify-center gap-1.5 pb-2">
            <button
              onClick={() => setMode('explorer')}
              className={`px-3 py-1 text-xs rounded-lg font-medium ${
                mode === 'explorer' ? 'bg-cyan-600 text-white font-bold shadow-xs' : 'bg-white text-slate-700'
              }`}
            >
              {lang === 'bn' ? 'প্রস্থচ্ছেদ ও কক্ষপথ' : 'Cross-Section & Orbit'}
            </button>
            <button
              onClick={() => setMode('tunnel')}
              className={`px-3 py-1 text-xs rounded-lg font-medium ${
                mode === 'tunnel' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'bg-white text-slate-700'
              }`}
            >
              {lang === 'bn' ? 'টানেল স্পন্দন' : 'Tunnel SHM'}
            </button>
            <button
              onClick={() => setMode('rotation')}
              className={`px-3 py-1 text-xs rounded-lg font-medium ${
                mode === 'rotation' ? 'bg-rose-600 text-white font-bold shadow-xs' : 'bg-white text-slate-700'
              }`}
            >
              {lang === 'bn' ? 'আহ্নিক গতি' : 'Rotation Lab'}
            </button>
          </div>

          {/* Canvas Outer Monitor Frame */}
          <div className="flex-1 relative w-full h-full rounded-2xl overflow-hidden border border-slate-300 shadow-md bg-white">
            {/* Primary Interactive Control Bar (Play, Pause, Step, Reset, Grid, Fullscreen) in top-right */}
            <div className="absolute top-3 right-3 z-20 pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-1.5 shadow-lg flex items-center gap-2">
              {/* Status indicator */}
              <div className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold flex items-center gap-1.5 border ${
                isCurrentRunning
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isCurrentRunning ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                <span>{isCurrentRunning ? (lang === 'bn' ? 'চলমান' : 'RUNNING') : (lang === 'bn' ? 'স্থগিত' : 'PAUSED')}</span>
              </div>

              {/* Big High-Visibility Play / Pause Button */}
              <button
                onClick={handleTogglePlay}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  isCurrentRunning
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400/40'
                }`}
                title={isCurrentRunning ? 'Click to Pause right at current location' : 'Click to Start Orbit / Drop Motion'}
              >
                {isCurrentRunning ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>{lang === 'bn' ? 'বিরতি (Pause)' : 'Pause'}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>{lang === 'bn' ? 'চালান (Play)' : 'Play'}</span>
                  </>
                )}
              </button>

              {/* Step button (active when paused) */}
              <button
                onClick={handleStep}
                disabled={isCurrentRunning}
                className={`p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 border ${
                  isCurrentRunning
                    ? 'text-slate-400 cursor-not-allowed bg-slate-100 border-slate-200'
                    : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200'
                }`}
                title={lang === 'bn' ? 'এক ধাপ সামনে যান' : 'Step forward'}
              >
                <SkipForward className="w-4 h-4" />
                <span className="hidden md:inline text-[11px] font-semibold">{lang === 'bn' ? 'ধাপ' : 'Step'}</span>
              </button>

              {/* Reset button */}
              <button
                onClick={handleResetCurrent}
                className="p-2 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                title={lang === 'bn' ? 'রিসেট করুন' : 'Reset Simulation'}
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden md:inline text-[11px] font-semibold">{lang === 'bn' ? 'রিসেট' : 'Reset'}</span>
              </button>

              {/* Grid View Quick Toggle */}
              <button
                onClick={() => toggleVector('showGridView')}
                className={`p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 border ${
                  vectorOptions.showGridView
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200'
                }`}
                title={vectorOptions.showGridView ? (lang === 'bn' ? 'গ্রিড বন্ধ করুন' : 'Hide Grid') : (lang === 'bn' ? 'গ্রিড চালু করুন' : 'Show Grid')}
              >
                <Grid3X3 className="w-4 h-4" />
                <span className="hidden md:inline text-[11px]">{lang === 'bn' ? 'গ্রিড' : 'Grid'}</span>
              </button>

              {/* Fullscreen Quick Toggle */}
              <button
                onClick={toggleFullscreen}
                className={`p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 border ${
                  isFullscreen
                    ? 'bg-cyan-50 text-cyan-800 border-cyan-300 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200'
                }`}
                title={isFullscreen ? (lang === 'bn' ? 'ফুল স্ক্রিন বন্ধ করুন' : 'Exit Full Screen') : (lang === 'bn' ? 'ফুল স্ক্রিন করুন' : 'Full Screen')}
              >
                {isFullscreen ? <Minimize className="w-4 h-4 text-cyan-700" /> : <Maximize className="w-4 h-4" />}
                <span className="hidden md:inline text-[11px]">{lang === 'bn' ? 'ফুল' : 'Full'}</span>
              </button>
            </div>

            {/* Mode-specific Interactive Canvas Stage */}
            <div className="flex-1 relative w-full h-full">
              {mode === 'explorer' && (
                <ExplorerCanvas
                  state={explorerState}
                  vectorOptions={vectorOptions}
                  lang={lang}
                  onUpdateState={updateExplorer}
                />
              )}

              {mode === 'tunnel' && (
                <TunnelCanvas
                  state={tunnelState}
                  vectorOptions={vectorOptions}
                  lang={lang}
                  onSetPosition={(pos) => updateTunnel({ position: pos, velocity: 0, trail: [] })}
                />
              )}

              {mode === 'rotation' && (
                <RotationCanvas
                  state={rotationState}
                  vectorOptions={vectorOptions}
                  lang={lang}
                  onSetLatitude={(lat) => updateRotation({ latitudeDeg: lat })}
                  onUpdateRotation={updateRotation}
                />
              )}

              {/* Synchronized Real-Time Graph Overlay */}
              <GraphOverlay
                mode={mode}
                explorerR={explorerState.r}
                tunnelY={tunnelState.position}
                latitudeDeg={rotationState.latitudeDeg}
                rotationMultiplier={rotationState.rotationMultiplier}
                densityMultiplier={tunnelState.densityMultiplier}
                lang={lang}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
