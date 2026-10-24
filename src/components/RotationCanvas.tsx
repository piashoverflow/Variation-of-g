import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RotationState, VectorDisplayOptions, Language } from '../types';
import { evaluateRotationAtLatitude } from '../physics/engine';
import { EARTH_RADIUS, STANDARD_G } from '../physics/constants';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Zap,
  Layers,
  Sparkles
} from 'lucide-react';

interface RotationCanvasProps {
  state: RotationState;
  vectorOptions: VectorDisplayOptions;
  lang: Language;
  onSetLatitude: (lat: number) => void;
  onUpdateRotation?: (patch: Partial<RotationState>) => void;
}

export const RotationCanvas: React.FC<RotationCanvasProps> = ({
  state,
  vectorOptions,
  lang,
  onSetLatitude,
  onUpdateRotation
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const [zoom, setZoom] = useState<number>(1.05);
  const [showCoreDepth, setShowCoreDepth] = useState<boolean>(false);

  const handleZoom = useCallback((factor: number) => {
    setZoom(prev => Math.max(0.5, Math.min(3.0, prev * factor)));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1.05);
  }, []);

  // Update latitude and notify parent
  const updateLat = useCallback((newLat: number) => {
    const clamped = Math.max(-90, Math.min(90, Math.round(newLat)));
    onSetLatitude(clamped);
    if (onUpdateRotation) {
      onUpdateRotation({ latitudeDeg: clamped });
    }
  }, [onSetLatitude, onUpdateRotation]);

  // Wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0018);
      setZoom(prev => Math.max(0.5, Math.min(3.0, prev * factor)));
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  // Calculate latitude from pointer coordinates
  const computeLatitudeFromPointer = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return state.latitudeDeg;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const cy = canvas.clientHeight / 2;
    const cx = canvas.clientWidth / 2;

    const dy = -(y - cy); // upward positive
    const dx = x - cx;

    const angleRad = Math.atan2(dy, Math.max(0.01, Math.abs(dx)));
    return Math.max(-90, Math.min(90, Math.round((angleRad * 180) / Math.PI)));
  };

  // Pointer Down Event
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const newLat = computeLatitudeFromPointer(e.clientX, e.clientY);
    updateLat(newLat);
  };

  // Pointer Move Event (Continuous live dragging)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const newLat = computeLatitudeFromPointer(e.clientX, e.clientY);
    updateLat(newLat);
  };

  // Pointer Up Event
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Handled
      }
    }
  };

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Clean Light Stage
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const R_px = Math.min(width, height) * 0.35 * zoom;

      // Evaluation at current latitude and rotation speed
      const evalRot = evaluateRotationAtLatitude(
        state.latitudeDeg,
        state.rotationMultiplier,
        state.humanMass
      );

      // Coordinate Grid Lines
      if (vectorOptions.showGridView) {
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        const spacing = 40 * zoom;
        for (let x = cx % spacing; x < width; x += spacing) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = cy % spacing; y < height; y += spacing) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // --- 1. 3D SPHERICAL EARTH WITH NATURAL ROTATION ---
      // Atmosphere Glow
      const atmoGrad = ctx.createRadialGradient(cx, cy, R_px * 0.95, cx, cy, R_px * 1.12);
      atmoGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      atmoGrad.addColorStop(0.5, 'rgba(186, 230, 253, 0.2)');
      atmoGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = atmoGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R_px * 1.12, 0, Math.PI * 2);
      ctx.fill();

      // Earth Globe Drop Shadow
      ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + R_px + 28, R_px * 0.85, 16 * zoom, 0, 0, Math.PI * 2);
      ctx.fill();

      // Clip inside Earth Sphere
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R_px, 0, Math.PI * 2);
      ctx.clip();

      // Deep 3D Spherical Ocean Lighting
      const globeGrad = ctx.createRadialGradient(
        cx - R_px * 0.35,
        cy - R_px * 0.35,
        R_px * 0.05,
        cx,
        cy,
        R_px
      );
      globeGrad.addColorStop(0, '#7dd3fc'); // illuminated highlight
      globeGrad.addColorStop(0.35, '#0284c7');
      globeGrad.addColorStop(0.75, '#0369a1');
      globeGrad.addColorStop(1, '#082f49'); // deep limb shadow
      ctx.fillStyle = globeGrad;
      ctx.fillRect(cx - R_px, cy - R_px, R_px * 2, R_px * 2);

      // Optional X-Ray 3D Core View
      if (showCoreDepth) {
        // Mantle
        ctx.fillStyle = 'rgba(194, 65, 12, 0.25)';
        ctx.beginPath();
        ctx.arc(cx, cy, R_px * 0.95, 0, Math.PI * 2);
        ctx.fill();

        // Outer Core
        ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.beginPath();
        ctx.arc(cx, cy, R_px * 0.54, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Inner Core
        ctx.fillStyle = 'rgba(254, 240, 138, 0.7)';
        ctx.beginPath();
        ctx.arc(cx, cy, R_px * 0.19, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.fillStyle = '#78350f';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Core (r=1,220 km)', cx, cy + 3);
      }

      // --- NATURAL 3D CONTINUOUS EASTWARD ROTATION ---
      // We render natural meridians and continent patches that sweep continuously West-to-East
      const spinOffset = state.globeAngle; // 0 to 2π

      // Draw 3D curved meridians (every 30 degrees = 12 meridians around the globe)
      ctx.lineWidth = 1.2;
      for (let m = 0; m < 12; m++) {
        const meridianLong = (m * (Math.PI / 6) + spinOffset) % (Math.PI * 2);
        // Longitudinal angle relative to central meridian (facing viewer)
        // If cos(meridianLong) > 0, it's on the visible front hemisphere!
        if (Math.cos(meridianLong) > -0.05) {
          const xFactor = Math.sin(meridianLong); // -1 (West limb) to +1 (East limb)
          const alpha = Math.max(0.05, Math.cos(meridianLong) * 0.35);

          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
          ctx.beginPath();
          // Draw orthographic projected meridian ellipse
          ctx.ellipse(cx, cy, Math.max(0.5, Math.abs(xFactor) * R_px), R_px, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Draw 3D Rotating Continents (realistic landmass patches)
      // Defined at fixed spherical latitudes & longitudes
      const continents = [
        { lat: 25, long: 0, w: 0.35, h: 0.25, name: 'Africa/Europe' },
        { lat: 40, long: 1.2, w: 0.45, h: 0.3, name: 'Asia' },
        { lat: -25, long: 2.2, w: 0.28, h: 0.2, name: 'Australia' },
        { lat: 35, long: 3.4, w: 0.38, h: 0.35, name: 'North America' },
        { lat: -15, long: 3.8, w: 0.3, h: 0.35, name: 'South America' },
        { lat: -75, long: 0, w: 0.7, h: 0.15, name: 'Antarctica' }
      ];

      continents.forEach(cont => {
        const contLong = (cont.long + spinOffset) % (Math.PI * 2);
        // Only draw when on front visible hemisphere
        if (Math.cos(contLong) > -0.15) {
          const latRadC = (cont.lat * Math.PI) / 180;
          const rParallel = Math.cos(latRadC) * R_px;
          const contX = cx + Math.sin(contLong) * rParallel;
          const contY = cy - Math.sin(latRadC) * R_px;

          const visAlpha = Math.max(0.1, Math.cos(contLong) * 0.4);
          ctx.fillStyle = `rgba(34, 197, 94, ${visAlpha.toFixed(2)})`; // lush continent green

          ctx.beginPath();
          ctx.ellipse(
            contX,
            contY,
            Math.max(2, cont.w * R_px * Math.cos(contLong)),
            cont.h * R_px,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      });

      // Specular Sunlight Glare on Upper-Left Ocean
      const specGrad = ctx.createRadialGradient(
        cx - R_px * 0.35,
        cy - R_px * 0.35,
        0,
        cx - R_px * 0.35,
        cy - R_px * 0.35,
        R_px * 0.45
      );
      specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      specGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
      specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = specGrad;
      ctx.fillRect(cx - R_px, cy - R_px, R_px * 2, R_px * 2);

      ctx.restore(); // end globe clip

      // Globe Outer Rim
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(cx, cy, R_px, 0, Math.PI * 2);
      ctx.stroke();

      // --- 2. UPRIGHT VERTICAL ROTATION AXIS ---
      const axisLen = R_px * 1.25;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy - axisLen);
      ctx.lineTo(cx, cy + axisLen);
      ctx.stroke();

      // North Pole Indicator
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(cx, cy - axisLen - 8);
      ctx.lineTo(cx - 5, cy - axisLen);
      ctx.lineTo(cx + 5, cy - axisLen);
      ctx.closePath();
      ctx.fill();

      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(lang === 'bn' ? 'উত্তর মেরু (λ = 90°)' : 'North Pole (λ = 90°)', cx, cy - axisLen - 14);

      // South Pole Indicator
      ctx.fillText(lang === 'bn' ? 'দক্ষিণ মেরু (-90°)' : 'South Pole (-90°)', cx, cy + axisLen + 18);

      // --- 3. HORIZONTAL EQUATOR PLANE (λ = 0°) ---
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cx - R_px * 1.15, cy);
      ctx.lineTo(cx + R_px * 1.15, cy);
      ctx.stroke();

      ctx.fillStyle = '#b45309';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(lang === 'bn' ? 'বিষুবরেখা সমতল (0°)' : 'Equator Plane (0°)', cx - R_px * 1.18, cy + 4);

      // --- 4. 3D LATITUDE SLICE DISK & GEOMETRY ---
      const latRad = (state.latitudeDeg * Math.PI) / 180;
      const cosLat = Math.cos(latRad);
      const sinLat = Math.sin(latRad);

      const surfaceX = cx + cosLat * R_px;
      const surfaceY = cy - sinLat * R_px;
      const parallelR = cosLat * R_px;

      // 3D Slicing Disk at Height y (Shows true 3D cylinder slice!)
      if (Math.abs(cosLat) > 0.05) {
        ctx.fillStyle = 'rgba(2, 132, 199, 0.08)';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(cx, surfaceY, parallelR, parallelR * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Radius line of the parallel: r = R cos(λ)
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, surfaceY);
      ctx.lineTo(surfaceX, surfaceY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#0369a1';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`r = R cosλ = ${(evalRot.radiusOfParallel / 1000).toFixed(0)} km`, cx + parallelR * 0.5, surfaceY - 6);

      // Central Ray R from Earth Center to Surface Point
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(surfaceX, surfaceY);
      ctx.stroke();

      // Latitude Angle Arc λ from Equator Plane
      const arcR = 45;
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      if (latRad >= 0) {
        ctx.arc(cx, cy, arcR, -latRad, 0);
      } else {
        ctx.arc(cx, cy, arcR, 0, -latRad);
      }
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`λ = ${state.latitudeDeg}°`, cx + arcR + 8, cy - sinLat * arcR * 0.5 + 4);

      // --- 5. SPRING BALANCE & OBJECT (WITH AUTHENTIC LIFT-OFF FLOATING) ---
      const isFloating = evalRot.isWeightless;
      const floatElevation = isFloating
        ? (state.isRunning ? 32 + Math.sin(Date.now() * 0.005) * 6 : 30)
        : 0;

      const objX = surfaceX + cosLat * floatElevation;
      const objY = surfaceY - sinLat * floatElevation;

      // Spring Scale Platform on Surface
      ctx.save();
      ctx.translate(surfaceX, surfaceY);
      ctx.rotate(-latRad + Math.PI / 2);

      // Scale base plate
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-15, -3, 30, 6);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.strokeRect(-15, -3, 30, 6);

      // Compression Spring
      const springH = isFloating ? 8 : Math.max(2, 8 * (evalRot.apparentWeight / (state.humanMass * STANDARD_G)));
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, -3);
      ctx.lineTo(-4, -3 - springH * 0.35);
      ctx.lineTo(4, -3 - springH * 0.7);
      ctx.lineTo(0, -3 - springH);
      ctx.stroke();

      ctx.restore();

      // Floating Aura Sparkles when Airborne
      if (isFloating) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
        ctx.beginPath();
        ctx.arc(objX, objY, 26, 0, Math.PI * 2);
        ctx.fill();

        // Animated zero-g sparkles
        const tSpark = Date.now() * 0.004;
        for (let i = 0; i < 4; i++) {
          const spX = objX + Math.cos(tSpark + i * 1.57) * 20;
          const spY = objY + Math.sin(tSpark + i * 1.57) * 20;
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(spX, spY, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Drag Beacon Handle around Astronaut
      ctx.strokeStyle = isDraggingRef.current
        ? '#0284c7'
        : (isFloating ? '#10b981' : 'rgba(2, 132, 199, 0.8)');
      ctx.lineWidth = 2.2;
      ctx.setLineDash(isDraggingRef.current ? [] : [3, 3]);
      ctx.beginPath();
      ctx.arc(objX, objY, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Test Object (Astronaut with arms & visor)
      ctx.save();
      ctx.translate(objX, objY);
      ctx.rotate(-latRad + Math.PI / 2);

      // Astronaut Body
      ctx.fillStyle = isFloating ? '#38bdf8' : '#ffffff';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-7, -18, 14, 18, 3);
      ctx.fill();
      ctx.stroke();

      // Helmet
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, -25, 7, 0, Math.PI * 2);
      ctx.fill();

      // Visor
      ctx.fillStyle = isFloating ? '#10b981' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(2, -25, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Spreading arms when floating
      if (isFloating) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-7, -14);
        ctx.lineTo(-14, -20);
        ctx.moveTo(7, -14);
        ctx.lineTo(14, -20);
        ctx.stroke();
      }

      ctx.restore();

      // --- 6. DYNAMIC VECTORS ---
      // True Gravity g₀ (Crimson toward center)
      if (vectorOptions.showTrueGravity) {
        const gLen = 50;
        const toCx = cx - objX;
        const toCy = cy - objY;
        const dTot = Math.hypot(toCx, toCy) || 1;
        const endGx = objX + (toCx / dTot) * gLen;
        const endGy = objY + (toCy / dTot) * gLen;

        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(objX, objY);
        ctx.lineTo(endGx, endGy);
        ctx.stroke();

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(endGx, endGy, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#991b1b';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText('g₀=9.80', endGx - 4, endGy + 3);
      }

      // Centrifugal Acceleration a_c (Amber outward from axis)
      if (vectorOptions.showCentrifugal && evalRot.centrifugalAccel > 0.05) {
        const cLen = Math.min(80, (evalRot.centrifugalAccel / 9.8) * 45);
        const endCx = objX + cLen;
        const endCy = objY;

        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(objX, objY);
        ctx.lineTo(endCx, endCy);
        ctx.stroke();

        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.moveTo(endCx, endCy);
        ctx.lineTo(endCx - 7, endCy - 4);
        ctx.lineTo(endCx - 7, endCy + 4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#92400e';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`a_c=${evalRot.centrifugalAccel.toFixed(2)}`, endCx + 5, endCy - 3);
      }

      // Effective Gravity g' (Cyan net radial downward pull)
      if (vectorOptions.showEffectiveGravity && evalRot.effectiveG > 0.05) {
        const effLen = Math.min(65, (evalRot.effectiveG / 9.8) * 45);
        const endEffX = objX - cosLat * effLen;
        const endEffY = objY + sinLat * effLen;

        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(objX, objY);
        ctx.lineTo(endEffX, endEffY);
        ctx.stroke();

        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(endEffX, endEffY, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0369a1';
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`g'=${evalRot.effectiveG.toFixed(4)}`, endEffX + 6, endEffY + 4);
      }

      // Live Tag above Astronaut
      ctx.fillStyle = isFloating ? '#059669' : 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(objX - 65, objY - 48, 130, 22, 5);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        isFloating
          ? (lang === 'bn' ? '🎉 বস্তুটি শূন্যে ভাসছে!' : '🎉 Object is Floating!')
          : (lang === 'bn' ? `λ = ${state.latitudeDeg}° (ড্র্যাগ করুন)` : `λ = ${state.latitudeDeg}° (Drag)`),
        objX,
        objY - 33
      );

      ctx.restore();
    };

    render();
    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [state, vectorOptions, zoom, showCoreDepth, lang]);

  // Current physics evaluation for HUD
  const evalRot = evaluateRotationAtLatitude(
    state.latitudeDeg,
    state.rotationMultiplier,
    state.humanMass
  );

  return (
    <div className="relative w-full h-full select-none overflow-hidden touch-none">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Floating Threshold Speed & Float Progress HUD Bar (Top-Left) */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none max-w-sm sm:max-w-md">
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-3.5 shadow-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>{lang === 'bn' ? 'ভাসমান বেগ পরীক্ষক (Float Velocity Discovery)' : 'Floating Velocity Discovery'}</span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
              evalRot.isWeightless
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse'
                : 'bg-slate-100 text-slate-700'
            }`}>
              {evalRot.isWeightless
                ? (lang === 'bn' ? 'বাতাসে ভাসমান!' : 'AIRBORNE!')
                : (lang === 'bn' ? 'পৃষ্ঠে সংযুক্ত' : 'GROUNDED')}
            </span>
          </div>

          {/* Progress Bar towards reaching weightlessness at this latitude */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-500">
                {lang === 'bn' ? 'ভাসার প্রয়োজনীয় বেগ অনুপাত:' : 'Progress to Floating:'}
              </span>
              <span className={`font-bold ${evalRot.percentToFloat >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {evalRot.percentToFloat.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className={`h-full transition-all duration-150 ${
                  evalRot.percentToFloat >= 100
                    ? 'bg-emerald-500 shadow-xs'
                    : 'bg-gradient-to-r from-amber-400 to-rose-500'
                }`}
                style={{ width: `${Math.min(100, evalRot.percentToFloat)}%` }}
              />
            </div>
          </div>

          {/* Live Speed vs Required Threshold Speed */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 block">
                {lang === 'bn' ? 'বর্তমান রৈখিক বেগ (v):' : 'Current Linear Speed (v):'}
              </span>
              <span className="font-mono font-bold text-slate-800">
                {evalRot.linearSpeedKmS.toFixed(2)} km/s
              </span>
            </div>

            <div className="bg-amber-50/70 p-2 rounded-lg border border-amber-200">
              <span className="text-[10px] text-amber-800 block">
                {lang === 'bn' ? 'ভাসতে প্রয়োজনীয় বেগ (v_crit):' : 'Required Float Speed:'}
              </span>
              <span className="font-mono font-bold text-amber-900">
                {isFinite(evalRot.criticalLinearSpeedKmS)
                  ? `${evalRot.criticalLinearSpeedKmS.toFixed(2)} km/s`
                  : (lang === 'bn' ? 'অসীম (মেরু)' : 'Infinity (Pole)')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Camera Controls Deck (Bottom-Right) */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-none">
        {/* Toggle 3D Core View */}
        <button
          onClick={() => setShowCoreDepth(!showCoreDepth)}
          className={`pointer-events-auto px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-md transition-colors cursor-pointer flex items-center gap-1.5 ${
            showCoreDepth
              ? 'bg-amber-500 text-white border-amber-400 shadow-amber-500/20'
              : 'bg-white/95 backdrop-blur-md text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
          title="Toggle 3D Internal Core & Mantle Layers"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? (showCoreDepth ? 'মূল স্তর লুকান' : '3D অভ্যন্তর স্তর') : (showCoreDepth ? 'Hide Core' : '3D Core Layers')}</span>
        </button>

        <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-1.5 shadow-md flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-slate-600 px-2 font-semibold">
            {zoom.toFixed(2)}×
          </span>

          <button
            onClick={() => handleZoom(1.2)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleZoom(0.833)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
