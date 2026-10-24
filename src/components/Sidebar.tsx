import React from 'react';
import {
  SimulationMode,
  ExplorerState,
  TunnelState,
  RotationState,
  VectorDisplayOptions,
  Language
} from '../types';
import { getTranslation } from '../utils/i18n';
import {
  EARTH_RADIUS,
  STANDARD_G,
  EARTH_OMEGA_0,
  HEIGHT_EVEREST,
  DEPTH_BOREHOLE,
  HEIGHT_ISS,
  HEIGHT_GEO,
  LATITUDE_DHAKA
} from '../physics/constants';
import {
  evaluateHscGravity,
  evaluateRotationAtLatitude
} from '../physics/engine';
import {
  Sliders,
  Eye,
  MapPin,
  Orbit,
  AlertTriangle
} from 'lucide-react';

interface SidebarProps {
  mode: SimulationMode;
  explorerState: ExplorerState;
  tunnelState: TunnelState;
  rotationState: RotationState;
  vectorOptions: VectorDisplayOptions;
  lang: Language;
  onUpdateExplorer: (patch: Partial<ExplorerState>) => void;
  onUpdateTunnel: (patch: Partial<TunnelState>) => void;
  onUpdateRotation: (patch: Partial<RotationState>) => void;
  onToggleVector: (key: keyof VectorDisplayOptions) => void;
  onResetTunnel: () => void;
  onResetExplorer: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mode,
  explorerState,
  tunnelState,
  rotationState,
  vectorOptions,
  lang,
  onUpdateExplorer,
  onUpdateTunnel,
  onUpdateRotation,
  onToggleVector,
  onResetTunnel,
  onResetExplorer
}) => {
  const t = getTranslation(lang);

  // 1. Explorer Evaluation (Tab 1: Pure Altitude & Depth without latitude/rotation subtraction)
  const hscEval = evaluateHscGravity(
    explorerState.r,
    0, // pure radial gravity (no latitude subtraction in Tab 1)
    explorerState.testMass,
    0, // 0 rotation for Tab 1
    EARTH_RADIUS,
    STANDARD_G
  );

  // 2. Tunnel Evaluation (Tab 2: SHM through borehole)
  const tunnelBaseG = STANDARD_G * tunnelState.densityMultiplier;
  const tunnelR = Math.abs(tunnelState.position);
  const tunnelIsInside = tunnelR <= EARTH_RADIUS;
  const tunnelGMag = tunnelIsInside
    ? tunnelBaseG * (tunnelR / EARTH_RADIUS)
    : tunnelBaseG * Math.pow(EARTH_RADIUS / Math.max(tunnelR, 1), 2);
  const tunnelTheoreticalPeriodSec = 2 * Math.PI * Math.sqrt(EARTH_RADIUS / tunnelBaseG);
  const tunnelHalfTransitSec = tunnelTheoreticalPeriodSec / 2;
  const tunnelVMax = Math.sqrt(tunnelBaseG * EARTH_RADIUS);

  // 3. Rotation Evaluation (Tab 3: Diurnal Motion & Floating Velocity at Latitude lambda)
  const rotationEval = evaluateRotationAtLatitude(
    rotationState.latitudeDeg,
    rotationState.rotationMultiplier,
    rotationState.humanMass
  );

  return (
    <aside className="w-full lg:w-96 lg:min-w-[380px] bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden shadow-xs z-10">
      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* =========================================================================
            SECTION 1: TOP TELEMETRY CARD (Strictly Mode Specific!)
           ========================================================================= */}

        {/* --- MODE 1: EXPLORER (Altitude & Depth g) --- */}
        {mode === 'explorer' && (
          <section className="space-y-3">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-xl shadow-inner relative overflow-hidden">
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <span className="text-[11px] font-mono text-cyan-300 font-medium">
                    {lang === 'bn' ? 'অভিকর্ষজ ত্বরণ (Gravitational Acceleration, g)' : 'Gravitational Acceleration (g)'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-extrabold font-mono tracking-tight text-white">
                      {hscEval.gBase.toFixed(4)}
                    </span>
                    <span className="text-sm font-bold text-cyan-300">m/s²</span>
                  </div>
                </div>

                {/* Surface comparison pill */}
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-mono block">g / g₀</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">
                    {((hscEval.gBase / STANDARD_G) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Weight & Spring Balance Reading */}
              <div className="mt-3 pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-xs relative z-10">
                <div>
                  <span className="text-[10px] text-slate-400 block">{t.effectiveWeight}</span>
                  <span className="font-mono font-bold text-amber-300">
                    {hscEval.apparentWeightN.toFixed(2)} N
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">{t.scaleReading}</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {hscEval.scaleReadingKg.toFixed(2)} kg
                  </span>
                </div>
              </div>
            </div>

            {/* Position Coordinates Bar (NO LATITUDE HERE!) */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                <span className="text-[10px] text-slate-500 block font-medium">
                  {hscEval.isInside ? t.depthD : t.altitudeH}
                </span>
                <span className="text-xs font-bold font-mono text-slate-800">
                  {hscEval.isInside ? `${hscEval.depthKm.toFixed(2)} km` : `${hscEval.altitudeKm.toFixed(2)} km`}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                <span className="text-[10px] text-slate-500 block font-medium">
                  {t.radialDistance}
                </span>
                <span className="text-xs font-bold font-mono text-slate-800">
                  {(hscEval.r / 1000).toFixed(0)} km
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                <span className="text-[10px] text-slate-500 block font-medium">
                  {lang === 'bn' ? 'অবস্থান স্তর' : 'Zone'}
                </span>
                <span className="text-xs font-bold font-mono text-indigo-700">
                  {hscEval.isOutside
                    ? (lang === 'bn' ? 'মহাকাশ/কক্ষপথ' : 'Space Orbit')
                    : hscEval.isAtSurface
                    ? (lang === 'bn' ? 'ভূপৃষ্ঠ (h=0)' : 'Surface')
                    : (lang === 'bn' ? 'ভূগর্ভ (d)' : 'Sub-surface')}
                </span>
              </div>
            </div>

            {/* Orbital Mechanics Card (When in Space / Orbit in Explorer mode) */}
            {hscEval.isOutside && (
              <div className="bg-cyan-50/70 border border-cyan-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-900">
                  <Orbit className="w-3.5 h-3.5 text-cyan-600" />
                  <span>{lang === 'bn' ? 'কক্ষপথীয় উপগ্রহের গতিবিদ্যা' : 'Orbital Mechanics & Period'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white/80 p-1.5 rounded-lg border border-cyan-100">
                    <span className="text-[9px] text-slate-500 block">{t.orbitalSpeed}</span>
                    <span className="font-mono font-bold text-cyan-800">
                      {hscEval.orbitalVelocityKmS.toFixed(2)} km/s
                    </span>
                  </div>
                  <div className="bg-white/80 p-1.5 rounded-lg border border-cyan-100">
                    <span className="text-[9px] text-slate-500 block">{t.orbitalPeriod}</span>
                    <span className="font-mono font-bold text-slate-800 text-[11px]">
                      {hscEval.orbitalPeriodFormatted.text}
                    </span>
                  </div>
                  <div className="bg-white/80 p-1.5 rounded-lg border border-cyan-100">
                    <span className="text-[9px] text-slate-500 block">{t.escapeSpeed}</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {hscEval.escapeVelocityKmS.toFixed(2)} km/s
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* --- MODE 2: TUNNEL SHM (Borehole Oscillation) --- */}
        {mode === 'tunnel' && (
          <section className="space-y-3">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-xl shadow-inner relative overflow-hidden">
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <span className="text-[11px] font-mono text-cyan-300 font-medium">
                    {lang === 'bn' ? 'সুড়ঙ্গে প্রত্যয়নী ত্বরণ (Restoring Accel, a)' : 'Restoring Acceleration (a)'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-extrabold font-mono tracking-tight text-white">
                      {Math.abs(tunnelState.acceleration).toFixed(4)}
                    </span>
                    <span className="text-sm font-bold text-cyan-300">m/s²</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {lang === 'bn' ? 'ত্বরণের দিক' : 'Direction'}
                  </span>
                  <span className="text-xs font-bold font-mono text-amber-300">
                    {Math.abs(tunnelState.position) < 50000
                      ? (lang === 'bn' ? 'কেন্দ্রে (a ≈ 0)' : 'At Center')
                      : tunnelState.position > 0
                      ? (lang === 'bn' ? '↓ কেন্দ্রমুখী' : '↓ Inward')
                      : (lang === 'bn' ? '↑ কেন্দ্রমুখী' : '↑ Inward')}
                  </span>
                </div>
              </div>

              {/* Tunnel Velocity & Max Velocity */}
              <div className="mt-3 pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-xs relative z-10">
                <div>
                  <span className="text-[10px] text-slate-400 block">
                    {lang === 'bn' ? 'বর্তমান দ্রুতি (Speed |v|)' : 'Current Speed (|v|)'}
                  </span>
                  <span className="font-mono font-bold text-cyan-300">
                    {(Math.abs(tunnelState.velocity) / 1000).toFixed(2)} km/s
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">
                    {lang === 'bn' ? 'কেন্দ্রে সর্বোচ্চ বেগ (v_max)' : 'Max Center Speed (v_max)'}
                  </span>
                  <span className="font-mono font-bold text-emerald-400">
                    {(tunnelVMax / 1000).toFixed(2)} km/s
                  </span>
                </div>
              </div>
            </div>

            {/* Position, Elapsed Time, and Full Period (NO LATITUDE HERE!) */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                <span className="text-[10px] text-slate-500 block font-medium">
                  {lang === 'bn' ? 'সুড়ঙ্গে অবস্থান (y)' : 'Shaft Position (y)'}
                </span>
                <span className="text-xs font-bold font-mono text-slate-800">
                  {(tunnelState.position / EARTH_RADIUS).toFixed(2)} R
                </span>
                <span className="text-[9px] text-slate-400 font-mono block">
                  {(tunnelState.position / 1000).toFixed(0)} km
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                <span className="text-[10px] text-slate-500 block font-medium">
                  {lang === 'bn' ? 'অতিক্রান্ত সময়' : 'Elapsed Time'}
                </span>
                <span className="text-xs font-bold font-mono text-indigo-700">
                  {Math.floor(tunnelState.elapsedSeconds / 60)}m {(tunnelState.elapsedSeconds % 60).toFixed(0)}s
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                <span className="text-[10px] text-slate-500 block font-medium">
                  {lang === 'bn' ? 'পূর্ণ পর্যায়কাল (T)' : 'Period (T)'}
                </span>
                <span className="text-xs font-bold font-mono text-emerald-700">
                  {(tunnelTheoreticalPeriodSec / 60).toFixed(1)} min
                </span>
                <span className="text-[9px] text-slate-400 font-mono block">
                  {lang === 'bn' ? 'একপাশ: 42.3m' : '1-way: 42.3m'}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* --- MODE 3: ROTATION & FLOATING (Diurnal Spin & Latitude lambda) --- */}
        {mode === 'rotation' && (
          <section className="space-y-3">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-xl shadow-inner relative overflow-hidden">
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <span className="text-[11px] font-mono text-cyan-300 font-medium">
                    {lang === 'bn' ? "কার্যকরী অভিকর্ষজ ত্বরণ (Effective g')" : "Effective Gravitational Acceleration (g')"}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-extrabold font-mono tracking-tight text-white">
                      {rotationEval.effectiveG.toFixed(4)}
                    </span>
                    <span className="text-sm font-bold text-cyan-300">m/s²</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-mono block">g / g₀</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">
                    {((rotationEval.effectiveG / STANDARD_G) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Apparent Weight & Scale Reading */}
              <div className="mt-3 pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-xs relative z-10">
                <div>
                  <span className="text-[10px] text-slate-400 block">{t.effectiveWeight}</span>
                  <span className="font-mono font-bold text-amber-300">
                    {rotationEval.apparentWeight.toFixed(2)} N
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">{t.scaleReading}</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {rotationEval.scaleReadingKg.toFixed(2)} kg
                  </span>
                </div>
              </div>

              {/* Critical Weightlessness Banner */}
              {rotationEval.isWeightless && (
                <div className="mt-2.5 bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-2 text-[11px] text-emerald-200 flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold">{t.weightlessBanner}</span>
                </div>
              )}
            </div>

            {/* Latitude Coordinates Bar (THIS IS WHERE LATITUDE BELONGS!) */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                <span className="text-[10px] text-slate-500 block font-medium">
                  {lang === 'bn' ? 'অক্ষাংশ (λ)' : 'Latitude (λ)'}
                </span>
                <span className="text-xs font-bold font-mono text-indigo-700">
                  {rotationState.latitudeDeg}°
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                <span className="text-[10px] text-slate-500 block font-medium">
                  {lang === 'bn' ? 'অক্ষবৃত্ত ব্যাসার্ধ' : 'Parallel Radius r'}
                </span>
                <span className="text-xs font-bold font-mono text-slate-800">
                  {(rotationEval.radiusOfParallel / 1000).toFixed(0)} km
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                <span className="text-[10px] text-slate-500 block font-medium">
                  {lang === 'bn' ? 'রৈখিক দ্রুতি (v)' : 'Linear Speed (v)'}
                </span>
                <span className="text-xs font-bold font-mono text-slate-800">
                  {rotationEval.linearSpeedKmS.toFixed(2)} km/s
                </span>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            SECTION 2: INTERACTIVE SLIDERS (Strictly Mode Specific!)
           ========================================================================= */}

        <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {lang === 'bn' ? 'সরাসরি স্লাইডার কন্ট্রোল' : 'Interactive Sliders'}
              </h2>
            </div>
            <span className="text-[10px] font-mono text-cyan-700 font-bold bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
              Live Control
            </span>
          </div>

          {/* --- SLIDERS FOR MODE 1: EXPLORER --- */}
          {mode === 'explorer' && (
            <div className="space-y-3">
              {/* Radial Distance Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium text-slate-700">
                    {lang === 'bn' ? 'কেন্দ্র থেকে দূরত্ব (r):' : 'Radial Distance (r):'}
                  </label>
                  <span className="font-mono font-bold text-cyan-700">
                    {(explorerState.r / 1000).toLocaleString()} km ({(explorerState.r / EARTH_RADIUS).toFixed(2)} R)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="42400000"
                  step="50000"
                  value={explorerState.r}
                  onChange={(e) => onUpdateExplorer({ r: Number(e.target.value), selectedPreset: null })}
                  className="w-full accent-cyan-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Center (0)</span>
                  <span>Surface (6,400 km)</span>
                  <span>GEO (42,000 km)</span>
                </div>
              </div>

              {/* Test Object Mass */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium text-slate-700">
                    {t.testMass}:
                  </label>
                  <span className="font-mono font-bold text-slate-800">
                    {explorerState.testMass} kg
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="500"
                  step="5"
                  value={explorerState.testMass}
                  onChange={(e) => onUpdateExplorer({ testMass: Number(e.target.value) })}
                  className="w-full accent-slate-700 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
              </div>

              {/* Orbit Animation Speed Multiplier */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium text-slate-700">
                    {lang === 'bn' ? 'কক্ষপথ পরিক্রমণ গতি:' : 'Orbit Speed Multiplier:'}
                  </label>
                  <span className="font-mono font-bold text-indigo-700">
                    {explorerState.orbitSpeedMultiplier}×
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0.5, 1.0, 2.0, 5.0].map((s) => (
                    <button
                      key={s}
                      onClick={() => onUpdateExplorer({ orbitSpeedMultiplier: s })}
                      className={`py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                        explorerState.orbitSpeedMultiplier === s
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- SLIDERS FOR MODE 2: TUNNEL SHM --- */}
          {mode === 'tunnel' && (
            <div className="space-y-3">
              {/* Drop / Release Position y */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium text-slate-700">
                    {lang === 'bn' ? 'সুড়ঙ্গে বস্তুর অবস্থান (y):' : 'Borehole Position (y):'}
                  </label>
                  <span className="font-mono font-bold text-cyan-700">
                    {(tunnelState.position / EARTH_RADIUS).toFixed(2)} R ({(tunnelState.position / 1000).toFixed(0)} km)
                  </span>
                </div>
                <input
                  type="range"
                  min={-EARTH_RADIUS}
                  max={EARTH_RADIUS}
                  step={50000}
                  value={tunnelState.position}
                  onChange={(e) => onUpdateTunnel({ position: Number(e.target.value), velocity: 0, trail: [] })}
                  className="w-full accent-cyan-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>দক্ষিণ (-R)</span>
                  <span>কেন্দ্র (0)</span>
                  <span>উত্তর (+R)</span>
                </div>
              </div>

              {/* Simulation Time Speed Multiplier */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium text-slate-700">
                    {lang === 'bn' ? 'সিমুলেশন গতি গুণক:' : 'Time Speed Multiplier:'}
                  </label>
                  <span className="font-mono font-bold text-amber-700">
                    {tunnelState.timeSpeed}×
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[100, 300, 600, 1200].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => onUpdateTunnel({ timeSpeed: spd })}
                      className={`py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                        tunnelState.timeSpeed === spd
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {spd}×
                    </button>
                  ))}
                </div>
              </div>

              {/* Earth Density Multiplier */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium text-slate-700">
                    {lang === 'bn' ? 'পৃথিবীর গড় ঘনত্ব গুণক (ρ / ρ₀):' : 'Earth Density Multiplier (ρ / ρ₀):'}
                  </label>
                  <span className="font-mono font-bold text-slate-800">
                    {tunnelState.densityMultiplier.toFixed(1)}×
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={tunnelState.densityMultiplier}
                  onChange={(e) => onUpdateTunnel({ densityMultiplier: Number(e.target.value) })}
                  className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
              </div>

              {/* Object Mass */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium text-slate-700">
                    {t.testMass}:
                  </label>
                  <span className="font-mono font-bold text-slate-800">
                    {tunnelState.mass} kg
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="500"
                  step="5"
                  value={tunnelState.mass}
                  onChange={(e) => onUpdateTunnel({ mass: Number(e.target.value) })}
                  className="w-full accent-slate-700 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* --- SLIDERS FOR MODE 3: ROTATION & FLOATING (ONLY TAB 3 HAS LAMBDA!) --- */}
          {mode === 'rotation' && (
            <div className="space-y-4">
              {/* Latitude Slider (0° Equator to 90° Pole) */}
              <div className="space-y-1.5 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-indigo-900">
                    {lang === 'bn' ? 'অক্ষাংশ (λ Latitude):' : 'Latitude (λ):'}
                  </label>
                  <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200 shadow-2xs">
                    {rotationState.latitudeDeg}°
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="1"
                  value={rotationState.latitudeDeg}
                  onChange={(e) => onUpdateRotation({ latitudeDeg: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer h-2 bg-indigo-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-indigo-600 font-mono font-medium">
                  <span>0° (Equator)</span>
                  <span>23.8° (Dhaka)</span>
                  <span>90° (North Pole)</span>
                </div>
              </div>

              {/* Earth's Diurnal Rotation Multiplier (Discovery Speed Regulator) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium text-slate-700">
                    {t.spinSpeed}:
                  </label>
                  <span className="font-mono font-bold text-amber-700">
                    {rotationState.rotationMultiplier}× ({((rotationState.rotationMultiplier * EARTH_OMEGA_0) * 1e5).toFixed(2)}×10⁻⁵ rad/s)
                  </span>
                </div>

                {/* Quick Speed Test Presets */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { mult: 0, label: '0×' },
                    { mult: 1, label: '1×' },
                    { mult: 8, label: '8×' },
                    { mult: 17, label: '17× (Float)' }
                  ].map(({ mult, label }) => (
                    <button
                      key={mult}
                      onClick={() => onUpdateRotation({ rotationMultiplier: mult })}
                      className={`py-1.5 px-1 text-center rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        rotationState.rotationMultiplier === mult
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Multiplier Slider (0 to 25x) */}
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="0.2"
                  value={rotationState.rotationMultiplier}
                  onChange={(e) => onUpdateRotation({ rotationMultiplier: Number(e.target.value) })}
                  className="w-full accent-amber-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />

                {/* Live Floating Discovery Progress Bar */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">
                      {lang === 'bn' ? 'ভাসার অগ্রগতি (Float Status):' : 'Float Threshold:'}
                    </span>
                    <span className={`font-mono font-bold ${rotationEval.isWeightless ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {rotationEval.isWeightless
                        ? (lang === 'bn' ? '🎉 শূন্যে ভাসছে!' : 'AIRBORNE!')
                        : `${rotationEval.percentToFloat.toFixed(1)}%`}
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-150 ${
                        rotationEval.isWeightless
                          ? 'bg-emerald-500'
                          : 'bg-gradient-to-r from-amber-400 to-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, rotationEval.percentToFloat)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-0.5">
                    <span>{t.currentSpeed}: {rotationEval.linearSpeedKmS.toFixed(2)} km/s</span>
                    <span>{t.requiredSpeedToFloat}: {isFinite(rotationEval.criticalLinearSpeedKmS) ? `${rotationEval.criticalLinearSpeedKmS.toFixed(2)} km/s` : '7.92 km/s'}</span>
                  </div>
                </div>
              </div>

              {/* Human / Object Mass */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium text-slate-700">
                    {t.testMass}:
                  </label>
                  <span className="font-mono font-bold text-slate-800">
                    {rotationState.humanMass} kg
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="200"
                  step="1"
                  value={rotationState.humanMass}
                  onChange={(e) => onUpdateRotation({ humanMass: Number(e.target.value) })}
                  className="w-full accent-slate-700 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
              </div>
            </div>
          )}
        </section>



        {/* =========================================================================
            SECTION 4: VECTOR OVERLAYS TOGGLES
           ========================================================================= */}

        <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {t.vectorsTitle}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => onToggleVector('showTrueGravity')}
              className={`p-2 rounded-xl border text-left font-medium transition-all cursor-pointer flex items-center justify-between ${
                vectorOptions.showTrueGravity
                  ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              <span>{t.trueGravityVec}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
            </button>

            {mode === 'rotation' && (
              <button
                onClick={() => onToggleVector('showCentrifugal')}
                className={`p-2 rounded-xl border text-left font-medium transition-all cursor-pointer flex items-center justify-between ${
                  vectorOptions.showCentrifugal
                    ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                <span>{t.centrifugalVec}</span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
              </button>
            )}

            <button
              onClick={() => onToggleVector('showVelocity')}
              className={`p-2 rounded-xl border text-left font-medium transition-all cursor-pointer flex items-center justify-between ${
                vectorOptions.showVelocity
                  ? 'bg-cyan-50 border-cyan-300 text-cyan-800 font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              <span>{t.velocityVec}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-600"></span>
            </button>

            <button
              onClick={() => onToggleVector('showGridView')}
              className={`p-2 rounded-xl border text-left font-medium transition-all cursor-pointer flex items-center justify-between ${
                vectorOptions.showGridView
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-800 font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              <span>{t.gridViewVec}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            </button>
          </div>
        </section>

        {/* =========================================================================
            SECTION 5: HSC EXAM PRESETS (Mode Specific!)
           ========================================================================= */}

        <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {t.presetsTitle}
              </h2>
            </div>
          </div>

          {/* Mode 1 Presets: Altitude & Depth */}
          {mode === 'explorer' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateExplorer({ r: EARTH_RADIUS, selectedPreset: 'surface' })}
                className="p-2 rounded-xl text-left border bg-slate-50 hover:bg-slate-100 border-slate-200 cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-800">ভূপৃষ্ঠ (Surface)</div>
                <div className="text-[10px] text-slate-500 font-mono">h = 0, g = 9.80 m/s²</div>
              </button>

              <button
                onClick={() => onUpdateExplorer({ r: EARTH_RADIUS + HEIGHT_EVEREST, selectedPreset: 'everest' })}
                className="p-2 rounded-xl text-left border bg-slate-50 hover:bg-slate-100 border-slate-200 cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-800">{t.presetEverest}</div>
                <div className="text-[10px] text-slate-500 font-mono">h = 8.848 km</div>
              </button>

              <button
                onClick={() => onUpdateExplorer({ r: EARTH_RADIUS + HEIGHT_ISS, selectedPreset: 'iss' })}
                className="p-2 rounded-xl text-left border bg-slate-50 hover:bg-slate-100 border-slate-200 cursor-pointer"
              >
                <div className="text-xs font-bold text-cyan-800">{t.presetISS}</div>
                <div className="text-[10px] text-slate-500 font-mono">h ≈ 408 km, v ≈ 7.67 km/s</div>
              </button>

              <button
                onClick={() => onUpdateExplorer({ r: EARTH_RADIUS + HEIGHT_GEO, selectedPreset: 'geo' })}
                className="p-2 rounded-xl text-left border bg-slate-50 hover:bg-slate-100 border-slate-200 cursor-pointer"
              >
                <div className="text-xs font-bold text-purple-800">{t.presetGEO}</div>
                <div className="text-[10px] text-slate-500 font-mono">T = 24h, h = 35,786 km</div>
              </button>

              <button
                onClick={() => onUpdateExplorer({ r: EARTH_RADIUS - DEPTH_BOREHOLE, selectedPreset: 'borehole' })}
                className="p-2 rounded-xl text-left border bg-slate-50 hover:bg-slate-100 border-slate-200 cursor-pointer"
              >
                <div className="text-xs font-bold text-rose-800">{t.presetBorehole}</div>
                <div className="text-[10px] text-slate-500 font-mono">d = 12 km (Kola Deep)</div>
              </button>

              <button
                onClick={() => onUpdateExplorer({ r: 0, selectedPreset: 'center' })}
                className="p-2 rounded-xl text-left border bg-slate-50 hover:bg-slate-100 border-slate-200 cursor-pointer"
              >
                <div className="text-xs font-bold text-amber-900">{t.presetCenter}</div>
                <div className="text-[10px] text-slate-500 font-mono">d = R, g = 0.0000</div>
              </button>
            </div>
          )}

          {/* Mode 2 Presets: Tunnel SHM */}
          {mode === 'tunnel' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateTunnel({ position: EARTH_RADIUS, velocity: 0, trail: [] })}
                className="p-2 rounded-xl text-left border bg-slate-50 hover:bg-slate-100 border-slate-200 cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-800">উত্তর মেরু অবমুক্তি</div>
                <div className="text-[10px] text-slate-500 font-mono">y = +1.0 R (Surface)</div>
              </button>

              <button
                onClick={() => onUpdateTunnel({ position: -EARTH_RADIUS, velocity: 0, trail: [] })}
                className="p-2 rounded-xl text-left border bg-slate-50 hover:bg-slate-100 border-slate-200 cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-800">দক্ষিণ মেরু অবমুক্তি</div>
                <div className="text-[10px] text-slate-500 font-mono">y = -1.0 R (Surface)</div>
              </button>

              <button
                onClick={() => onUpdateTunnel({ position: EARTH_RADIUS * 0.5, velocity: 0, trail: [] })}
                className="p-2 rounded-xl text-left border bg-slate-50 hover:bg-slate-100 border-slate-200 cursor-pointer"
              >
                <div className="text-xs font-bold text-cyan-800">অর্ধেক গভীরতা</div>
                <div className="text-[10px] text-slate-500 font-mono">y = +0.5 R (3,185 km)</div>
              </button>

              <button
                onClick={() => onUpdateTunnel({ position: 0, velocity: 0, trail: [] })}
                className="p-2 rounded-xl text-left border bg-slate-50 hover:bg-slate-100 border-slate-200 cursor-pointer"
              >
                <div className="text-xs font-bold text-amber-800">পৃথিবীর কেন্দ্র</div>
                <div className="text-[10px] text-slate-500 font-mono">y = 0, a = 0 m/s²</div>
              </button>
            </div>
          )}

          {/* Mode 3 Presets: Rotation & Latitude lambda */}
          {mode === 'rotation' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateRotation({ latitudeDeg: 0 })}
                className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                  rotationState.latitudeDeg === 0
                    ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/30'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <div className="text-xs font-bold text-slate-800">{t.presetEquator}</div>
                <div className="text-[10px] text-slate-500 font-mono">λ = 0°, Max spin loss</div>
              </button>

              <button
                onClick={() => onUpdateRotation({ latitudeDeg: 23.8 })}
                className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                  Math.abs(rotationState.latitudeDeg - 23.8) < 1
                    ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/30'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <div className="text-xs font-bold text-emerald-800">{t.presetDhaka}</div>
                <div className="text-[10px] text-slate-500 font-mono">λ ≈ 23.8° (কর্কটক্রান্তি)</div>
              </button>

              <button
                onClick={() => onUpdateRotation({ latitudeDeg: 90 })}
                className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                  rotationState.latitudeDeg === 90
                    ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400/30'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <div className="text-xs font-bold text-blue-800">{t.presetPoles}</div>
                <div className="text-[10px] text-slate-500 font-mono">λ = 90°, cosλ = 0, Δg = 0</div>
              </button>

              <button
                onClick={() => onUpdateRotation({ latitudeDeg: 0, rotationMultiplier: 17 })}
                className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                  rotationState.latitudeDeg === 0 && rotationState.rotationMultiplier === 17
                    ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/30'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <div className="text-xs font-bold text-rose-800">ভাসমান বেগ (17×)</div>
                <div className="text-[10px] text-slate-500 font-mono">v ≈ 7.91 km/s, g&apos; = 0</div>
              </button>
            </div>
          )}
        </section>

      </div>
    </aside>
  );
};
