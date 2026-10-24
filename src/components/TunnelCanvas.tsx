import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TunnelState, VectorDisplayOptions, Language } from '../types';
import { EARTH_RADIUS } from '../physics/constants';
import { ZoomIn, ZoomOut, RotateCcw, Compass } from 'lucide-react';

interface TunnelCanvasProps {
  state: TunnelState;
  vectorOptions: VectorDisplayOptions;
  lang: Language;
  onSetPosition: (pos: number) => void;
}

export const TunnelCanvas: React.FC<TunnelCanvasProps> = ({
  state,
  vectorOptions,
  lang,
  onSetPosition
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const [zoom, setZoom] = useState<number>(1.05);

  const handleZoom = useCallback((factor: number) => {
    setZoom(prev => Math.max(0.4, Math.min(3.5, prev * factor)));
  }, []);

  // Wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = Math.exp(-e.deltaY * 0.0018);
      setZoom(prev => Math.max(0.4, Math.min(3.5, prev * zoomFactor)));
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  // Converts physical coordinate y in meters to canvas pixels
  const getCanvasCoords = useCallback((yMeters: number, width: number, height: number, earthPixelRadius: number) => {
    const cx = width / 2;
    const cy = height / 2;
    const py = cy - (yMeters / EARTH_RADIUS) * earthPixelRadius;
    return { cx, py };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const height = canvas.clientHeight;
    const earthPixelRadius = Math.min(canvas.clientWidth, canvas.clientHeight) * 0.36 * zoom;
    const cy = height / 2;

    const normalizedY = -(clickY - cy) / earthPixelRadius; // in units of R
    const clampedY = Math.max(-2.0, Math.min(2.0, normalizedY)) * EARTH_RADIUS;
    
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    onSetPosition(clampedY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const height = canvas.clientHeight;
    const earthPixelRadius = Math.min(canvas.clientWidth, canvas.clientHeight) * 0.36 * zoom;
    const cy = height / 2;

    const normalizedY = -(clickY - cy) / earthPixelRadius;
    const clampedY = Math.max(-2.0, Math.min(2.0, normalizedY)) * EARTH_RADIUS;
    onSetPosition(clampedY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // pointer capture already released
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const width = displayWidth;
      const height = displayHeight;
      const cx = width / 2;
      const cy = height / 2;
      const R_px = Math.min(width, height) * 0.36 * zoom;

      // 1. Beautiful Light Scientific Laboratory Blueprint Background
      const bgGrad = ctx.createRadialGradient(cx, cy, R_px * 0.2, cx, cy, Math.max(width, height) * 0.75);
      bgGrad.addColorStop(0, '#ffffff'); // pure bright white center
      bgGrad.addColorStop(0.5, '#f8fafc'); // clean off-white
      bgGrad.addColorStop(0.85, '#f1f5f9'); // soft slate-100
      bgGrad.addColorStop(1, '#e2e8f0'); // refined slate-200 border
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. High-Precision Scientific Grid View around Earth (User Request)
      if (vectorOptions.showGridView) {
        ctx.save();
        
        // A. Cartesian Background Grid
        const gridStep = 40;
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([2, 4]);

        for (let x = (cx % gridStep); x < width; x += gridStep) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = (cy % gridStep); y < height; y += gridStep) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        ctx.setLineDash([]);

        // B. Polar Radial Distance Rings around Earth (0.5R, 1.0R Surface, 1.5R, 2.0R)
        const distanceMultipliers = [
          { mult: 0.5, label: '0.5 R (3,185 km)' },
          { mult: 1.0, label: '1.0 R (6,371 km - Surface)' },
          { mult: 1.5, label: '1.5 R (9,556 km)' },
          { mult: 2.0, label: '2.0 R (12,742 km)' }
        ];

        distanceMultipliers.forEach(d => {
          const ringRadius = R_px * d.mult;
          const isSurface = d.mult === 1.0;

          ctx.beginPath();
          ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = isSurface ? 'rgba(2, 132, 199, 0.75)' : 'rgba(100, 116, 139, 0.35)';
          ctx.lineWidth = isSurface ? 1.8 : 1.0;
          ctx.setLineDash(isSurface ? [6, 4] : [3, 4]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Ring Measurement Badge
          if (ringRadius < Math.min(width, height) * 0.48) {
            ctx.save();
            ctx.font = isSurface ? 'bold 9px "JetBrains Mono", monospace' : '8.5px "JetBrains Mono", monospace';
            const badgeW = ctx.measureText(d.label).width;
            const badgeX = cx + ringRadius * Math.cos(-Math.PI * 0.22);
            const badgeY = cy + ringRadius * Math.sin(-Math.PI * 0.22);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.strokeStyle = isSurface ? '#0284c7' : '#94a3b8';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(badgeX - 4, badgeY - 8, badgeW + 8, 16, 3);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = isSurface ? '#0369a1' : '#475569';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(d.label, badgeX, badgeY);
            ctx.restore();
          }
        });

        // C. Angular Radial Degree Rays
        const anglesDeg = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);

        anglesDeg.forEach(deg => {
          const rad = (deg * Math.PI) / 180;
          const endX = cx + Math.cos(rad) * (R_px * 2.2);
          const endY = cy + Math.sin(rad) * (R_px * 2.2);

          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          // Angle tick label
          if (R_px * 2.25 < Math.min(width, height) * 0.48) {
            ctx.fillStyle = '#64748b';
            ctx.font = '8px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${deg}°`, cx + Math.cos(rad) * (R_px * 2.26), cy + Math.sin(rad) * (R_px * 2.26));
          }
        });
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Subtle Equator crosshair
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.beginPath();
      ctx.moveTo(cx - R_px * 2.2, cy);
      ctx.lineTo(cx + R_px * 2.2, cy);
      ctx.stroke();

      // Atmospheric Azure Glow around Earth
      const atmoGrad = ctx.createRadialGradient(cx, cy, R_px * 0.95, cx, cy, R_px * 1.2);
      atmoGrad.addColorStop(0, 'rgba(14, 165, 233, 0.4)');
      atmoGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.18)');
      atmoGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = atmoGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R_px * 1.2, 0, Math.PI * 2);
      ctx.fill();

      // 2. Earth Cross-Section Geological Layers (Enhanced Light-Aesthetic Palette)
      // Mantle (Rich silicate convective magma)
      const mantleGrad = ctx.createRadialGradient(cx, cy, R_px * 0.3, cx, cy, R_px);
      mantleGrad.addColorStop(0, '#ea580c'); // rich warm convective magma
      mantleGrad.addColorStop(0.7, '#f97316'); // upper silicate mantle
      mantleGrad.addColorStop(0.92, '#0369a1'); // lithosphere base
      mantleGrad.addColorStop(1, '#0284c7'); // surface ocean
      ctx.fillStyle = mantleGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R_px, 0, Math.PI * 2);
      ctx.fill();

      // Continental patches along the circumference rim
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R_px, 0, Math.PI * 2);
      ctx.clip();
      // Green crust accents
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 6;
      [0.2, 0.8, 1.4, 2.1, 2.7, 3.4, 4.2, 5.1].forEach(angle => {
        ctx.beginPath();
        ctx.arc(cx, cy, R_px - 1, angle, angle + 0.35);
        ctx.stroke();
      });
      ctx.restore();

      // Surface Crust Outer Rim
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, R_px, 0, Math.PI * 2);
      ctx.stroke();

      // Outer Core (molten liquid iron-nickel)
      const outerCoreGrad = ctx.createRadialGradient(cx, cy, R_px * 0.18, cx, cy, R_px * 0.55);
      outerCoreGrad.addColorStop(0, '#f59e0b'); // liquid golden iron
      outerCoreGrad.addColorStop(0.7, '#ea580c');
      outerCoreGrad.addColorStop(1, '#c2410c');
      ctx.fillStyle = outerCoreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R_px * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // Inner Core (solid incandescent radiant crystal core)
      const innerCoreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R_px * 0.22);
      innerCoreGrad.addColorStop(0, '#ffffff'); // bright incandescent center
      innerCoreGrad.addColorStop(0.4, '#fef08a'); // radiant gold
      innerCoreGrad.addColorStop(0.8, '#facc15');
      innerCoreGrad.addColorStop(1, '#eab308');
      ctx.fillStyle = innerCoreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R_px * 0.22, 0, Math.PI * 2);
      ctx.fill();

      // Geological boundary rings
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, R_px * 0.55, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, R_px * 0.22, 0, Math.PI * 2);
      ctx.stroke();

      // Geological Callout Annotations on Western Hemisphere
      const drawLayerLabel = (nameBn: string, nameEn: string, radiusFraction: number) => {
        const angle = Math.PI * 0.78; // 140° pointing to top-left
        const lx = cx + Math.cos(angle) * (R_px * radiusFraction);
        const ly = cy + Math.sin(angle) * (R_px * radiusFraction);
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      };
      drawLayerLabel('ভূত্বক', 'Crust', 0.95);
      drawLayerLabel('ম্যান্টল', 'Mantle', 0.72);
      drawLayerLabel('বহিঃকেন্দ্র', 'Outer Core', 0.38);
      drawLayerLabel('অন্তঃকেন্দ্র', 'Inner Core', 0.1);

      // 3. Gauss Enclosed Mass Sphere (Dynamically shrinking/expanding with r)
      const currentR_m = Math.abs(state.position);
      const currentR_ratio = currentR_m / EARTH_RADIUS;

      if (vectorOptions.showGaussMass && currentR_ratio <= 1.0) {
        const gaussRadius_px = currentR_ratio * R_px;

        // Outer inactive shell overlay (Frosted shield: Zero net attraction)
        if (currentR_ratio < 0.98) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, R_px, 0, Math.PI * 2);
          ctx.arc(cx, cy, Math.max(1, gaussRadius_px), 0, Math.PI * 2, true);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.fill();
          ctx.restore();
        }

        // Active contributing inner sphere
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(2, gaussRadius_px), 0, Math.PI * 2);
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();

        ctx.fillStyle = 'rgba(2, 132, 199, 0.16)';
        ctx.fill();
        ctx.restore();

        // Enclosed mass label badge
        if (gaussRadius_px > 24) {
          const massPct = (Math.pow(currentR_ratio, 3) * 100).toFixed(1);
          const badgeText = `M_enc = ${massPct}% M`;
          ctx.font = 'bold 10px "JetBrains Mono", monospace';
          const txtW = ctx.measureText(badgeText).width;

          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(cx + gaussRadius_px * 0.5 - 4, cy - 18, txtW + 8, 16, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#0369a1';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(badgeText, cx + gaussRadius_px * 0.5, cy - 10);
        }
      }

      // 4. Central Gravity Tunnel (Through North & South Pole)
      const tunnelWidth = 14;
      const tunnelHalf = tunnelWidth / 2;

      // Clean Light Vacuum Tunnel Shaft
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - tunnelHalf, cy - R_px * 1.8, tunnelWidth, R_px * 3.6);

      // Tunnel border laser lines
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - tunnelHalf, cy - R_px * 1.8);
      ctx.lineTo(cx - tunnelHalf, cy + R_px * 1.8);
      ctx.moveTo(cx + tunnelHalf, cy - R_px * 1.8);
      ctx.lineTo(cx + tunnelHalf, cy + R_px * 1.8);
      ctx.stroke();

      // Measurement tick marks along the shaft
      const ticks = [
        { yRel: 1.5, label: '+1.5R' },
        { yRel: 1.0, label: lang === 'bn' ? 'উত্তর মেরু (+R)' : 'North Pole (+R)' },
        { yRel: 0.5, label: '+0.5R' },
        { yRel: 0.0, label: lang === 'bn' ? 'কেন্দ্র (r=0)' : 'Center (r=0)' },
        { yRel: -0.5, label: '-0.5R' },
        { yRel: -1.0, label: lang === 'bn' ? 'দক্ষিণ মেরু (-R)' : 'South Pole (-R)' },
        { yRel: -1.5, label: '-1.5R' },
      ];

      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      ticks.forEach(t => {
        const tickY = cy - t.yRel * R_px;
        ctx.strokeStyle = t.yRel === 0 ? '#dc2626' : '#64748b';
        ctx.lineWidth = t.yRel === 0 ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(cx - tunnelHalf - 6, tickY);
        ctx.lineTo(cx + tunnelHalf + 6, tickY);
        ctx.stroke();

        ctx.fillStyle = t.yRel === 0 ? '#b91c1c' : '#334155';
        ctx.font = t.yRel === 0 ? 'bold 10px "JetBrains Mono", monospace' : '9px "JetBrains Mono", monospace';
        ctx.fillText(t.label, cx + tunnelHalf + 10, tickY);
      });

      // 5. Test Capsule Position & Trail
      const capsuleY_px = cy - (state.position / EARTH_RADIUS) * R_px;

      // Draw particle trail
      if (state.trail.length > 1) {
        ctx.beginPath();
        state.trail.forEach((p, idx) => {
          const py = cy - (p.y / EARTH_RADIUS) * R_px;
          if (idx === 0) ctx.moveTo(cx, py);
          else ctx.lineTo(cx, py);
        });
        ctx.strokeStyle = 'rgba(2, 132, 199, 0.45)';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // Draw Test Pod
      const podHeight = 18;
      const podWidth = 11;
      
      // Pod glow
      const podGlow = ctx.createRadialGradient(cx, capsuleY_px, 2, cx, capsuleY_px, 18);
      podGlow.addColorStop(0, 'rgba(2, 132, 199, 0.5)');
      podGlow.addColorStop(1, 'rgba(2, 132, 199, 0)');
      ctx.fillStyle = podGlow;
      ctx.beginPath();
      ctx.arc(cx, capsuleY_px, 18, 0, Math.PI * 2);
      ctx.fill();

      // Capsule body (dark titanium pill so it is ultra-crisp against white tunnel)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(cx - podWidth / 2, capsuleY_px - podHeight / 2, podWidth, podHeight, 5);
      ctx.fill();

      // Capsule center core glow
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx, capsuleY_px, 3, 0, Math.PI * 2);
      ctx.fill();

      // 6. Dynamic Vectors
      // A. Gravity Vector (Crimson, points toward Earth center cy)
      if (vectorOptions.showTrueGravity && state.acceleration !== 0) {
        const dir = state.position > 0 ? 1 : -1;
        const arrowLen = Math.min(65, (Math.abs(state.acceleration) / 9.8) * 45);
        const startY = capsuleY_px;
        const endY = capsuleY_px + dir * arrowLen;

        ctx.strokeStyle = '#dc2626'; // Crimson
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx - 16, startY);
        ctx.lineTo(cx - 16, endY);
        ctx.stroke();

        // Arrowhead
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(cx - 16, endY);
        ctx.lineTo(cx - 20, endY - dir * 6);
        ctx.lineTo(cx - 12, endY - dir * 6);
        ctx.closePath();
        ctx.fill();

        // Vector Label
        ctx.fillStyle = '#991b1b';
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`g=${Math.abs(state.acceleration).toFixed(2)} m/s²`, cx - 22, (startY + endY) / 2);
      }

      // B. Velocity Vector (Cyan/Blue, direction of motion)
      if (vectorOptions.showVelocity && Math.abs(state.velocity) > 50) {
        const velDir = state.velocity > 0 ? -1 : 1;
        const arrowLen = Math.min(65, (Math.abs(state.velocity) / 7900) * 50);
        const startY = capsuleY_px;
        const endY = capsuleY_px + velDir * arrowLen;

        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx + 16, startY);
        ctx.lineTo(cx + 16, endY);
        ctx.stroke();

        // Arrowhead
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.moveTo(cx + 16, endY);
        ctx.lineTo(cx + 12, endY - velDir * 6);
        ctx.lineTo(cx + 20, endY - velDir * 6);
        ctx.closePath();
        ctx.fill();

        // Vector label
        ctx.fillStyle = '#0369a1';
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`v=${(state.velocity / 1000).toFixed(2)} km/s`, cx + 24, (startY + endY) / 2);
      }

      // State & Drag Hint overlay
      const statusText = state.isRunning
        ? (lang === 'bn' ? '▶️ চলমান: পজ বাটনে চাপলে ঠিক এই অবস্থানেই থেমে যাবে' : '▶️ RUNNING: Click Pause to freeze right at this position')
        : (lang === 'bn' ? '⏸️ স্থগিত (PAUSED): প্লে বাটনে চাপলে এখান থেকেই চলবে' : '⏸️ PAUSED: Click Play to start motion from here');
      
      ctx.fillStyle = state.isRunning ? '#0284c7' : '#d97706';
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(statusText, cx, height - 32);

      ctx.fillStyle = '#64748b';
      ctx.font = '11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        lang === 'bn' ? 'ক্লিক বা ড্র্যাগ করে ক্যাপসুলের অবস্থান পরিবর্তন করুন' : 'Click & drag vertically along tunnel to reposition capsule',
        cx,
        height - 14
      );

      ctx.restore();
    };

    render();
    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [state, vectorOptions, lang, zoom, getCanvasCoords]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full cursor-ns-resize touch-none block"
      />

      {/* Floating Camera Controls Deck */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-none">
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl px-3 py-1.5 shadow-md flex items-center gap-2 text-[11px] font-mono text-slate-700">
          <Compass className="w-3.5 h-3.5 text-cyan-600" />
          <span>Zoom:</span>
          <span className="font-bold text-cyan-700">{zoom.toFixed(2)}×</span>
        </div>

        <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-1.5 shadow-md flex items-center gap-1.5">
          <button
            onClick={() => handleZoom(1.2)}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleZoom(0.833)}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={() => setZoom(1.05)}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
