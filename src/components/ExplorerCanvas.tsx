import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ExplorerState, VectorDisplayOptions, Language } from '../types';
import {
  EARTH_RADIUS,
  STANDARD_G,
  HEIGHT_ISS,
  HEIGHT_GEO,
  LATITUDE_DHAKA
} from '../physics/constants';
import { evaluateHscGravity } from '../physics/engine';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Compass,
  Layers,
  Sparkles
} from 'lucide-react';

interface ExplorerCanvasProps {
  state: ExplorerState;
  vectorOptions: VectorDisplayOptions;
  lang: Language;
  onUpdateState: (patch: Partial<ExplorerState>) => void;
}

export const ExplorerCanvas: React.FC<ExplorerCanvasProps> = ({
  state,
  vectorOptions,
  lang,
  onUpdateState
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 2D Camera state: zoom and pan
  const [camera, setCamera] = useState({
    zoom: 1.0,
    panX: 0,
    panY: 0
  });

  const isDraggingProbeRef = useRef<boolean>(false);
  const isPanningRef = useRef<boolean>(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });

  // Handle Zoom In/Out
  const handleZoom = useCallback((factor: number) => {
    setCamera(prev => ({
      ...prev,
      zoom: Math.max(0.2, Math.min(8.0, prev.zoom * factor))
    }));
  }, []);

  const handleResetCamera = useCallback(() => {
    setCamera({ zoom: 1.0, panX: 0, panY: 0 });
  }, []);

  // Quick scale presets
  const handleScalePreset = (mode: 'geo' | 'leo' | 'surface' | 'core') => {
    onUpdateState({ viewScaleMode: mode });
    if (mode === 'geo') {
      setCamera({ zoom: 0.35, panX: 0, panY: 0 }); // see 36,000 km GEO ring
    } else if (mode === 'leo') {
      setCamera({ zoom: 1.1, panX: 0, panY: 0 });  // see ISS 408 km
    } else if (mode === 'surface') {
      setCamera({ zoom: 2.2, panX: 0, panY: 0 });  // see Everest 8.8 km & Borehole
    } else if (mode === 'core') {
      setCamera({ zoom: 1.4, panX: 0, panY: 0 });  // see inner layers
    }
  };

  // Wheel Zoom Listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = Math.exp(-e.deltaY * 0.0015);
      setCamera(prev => ({
        ...prev,
        zoom: Math.max(0.2, Math.min(8.0, prev.zoom * zoomFactor))
      }));
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  // Pointer Down (Drag Probe vs Pan Canvas)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const cx = width / 2 + camera.panX;
    const cy = height / 2 + camera.panY;
    const baseR_px = Math.min(width, height) * 0.28 * camera.zoom;

    // Current probe coordinates
    const probeDistPx = (state.r / EARTH_RADIUS) * baseR_px;
    const probeScreenX = cx + probeDistPx * Math.cos(state.angleRad);
    const probeScreenY = cy - probeDistPx * Math.sin(state.angleRad);

    const distToProbe = Math.hypot(clientX - probeScreenX, clientY - probeScreenY);

    if (distToProbe < 36) {
      // Clicked on probe -> Drag probe
      isDraggingProbeRef.current = true;
      onUpdateState({ isDragging: true });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } else {
      // Clicked on background -> Pan camera
      isPanningRef.current = true;
      lastPointerRef.current = { x: clientX, y: clientY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  // Pointer Move (Update Probe Position or Pan Camera)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const cx = width / 2 + camera.panX;
    const cy = height / 2 + camera.panY;
    const baseR_px = Math.min(width, height) * 0.28 * camera.zoom;

    if (isDraggingProbeRef.current) {
      // Calculate new r and angle from center (cx, cy)
      const dx = clientX - cx;
      const dy = -(clientY - cy); // invert y for standard Cartesian

      const distancePx = Math.hypot(dx, dy);
      let newR = (distancePx / baseR_px) * EARTH_RADIUS;

      // Limit max distance to 42,400 km (beyond GEO)
      newR = Math.max(0, Math.min(42.4e6, newR));

      // Calculate polar angle in radians (-π to +π)
      let newAngle = Math.atan2(dy, dx);
      // Derive latitude in degrees (-90 to +90)
      const latDeg = Math.round((newAngle * 180) / Math.PI);

      onUpdateState({
        r: newR,
        angleRad: newAngle,
        latitudeDeg: latDeg,
        selectedPreset: null
      });
    } else if (isPanningRef.current) {
      const deltaX = clientX - lastPointerRef.current.x;
      const deltaY = clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: clientX, y: clientY };

      setCamera(prev => ({
        ...prev,
        panX: prev.panX + deltaX,
        panY: prev.panY + deltaY
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingProbeRef.current = false;
    isPanningRef.current = false;
    onUpdateState({ isDragging: false });
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Animation Loop (Orbit motion outside, or SHM inside)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (state.isRunning && !state.isDragging) {
        if (state.r >= EARTH_RADIUS) {
          // Circular Keplerian orbital motion: v_o = sqrt(GM / r), omega_orb = v_o / r
          const evalRes = evaluateHscGravity(state.r, state.latitudeDeg, state.testMass, state.rotationMultiplier);
          const omegaOrb = evalRes.orbitalVelocity / state.r; // rad/s
          // Scale visual speed by orbitSpeedMultiplier (0.5x, 1x, 2x, 5x)
          const visualOmega = omegaOrb * 120 * state.orbitSpeedMultiplier;
          const nextAngle = state.angleRad + visualOmega * dt;
          const nextLat = Math.round((Math.atan2(Math.sin(nextAngle), Math.cos(nextAngle)) * 180) / Math.PI);

          onUpdateState({
            angleRad: nextAngle % (Math.PI * 2),
            latitudeDeg: nextLat
          });
        } else {
          // Inside Earth: drop toward center / harmonic oscillation
          const gAtR = STANDARD_G * (state.r / EARTH_RADIUS);
          const visualSpeed = gAtR * 50000 * state.orbitSpeedMultiplier;
          let nextR = state.r - visualSpeed * dt;
          if (nextR <= 0) nextR = 0; // stop at core center
          onUpdateState({ r: nextR });
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [state.isRunning, state.isDragging, state.r, state.angleRad, state.latitudeDeg, state.orbitSpeedMultiplier, state.testMass, state.rotationMultiplier, onUpdateState]);

  // Main Canvas Render
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

      // Clean Light Scientific Background
      ctx.fillStyle = '#f8fafc'; // slate-50
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2 + camera.panX;
      const cy = height / 2 + camera.panY;
      const baseR_px = Math.min(width, height) * 0.28 * camera.zoom;

      // 1. Grid Lines (Coordinate Grid)
      if (vectorOptions.showGridView) {
        ctx.strokeStyle = '#e2e8f0'; // slate-200
        ctx.lineWidth = 1;
        const gridSpacing = 50 * camera.zoom;
        const startX = cx % gridSpacing;
        const startY = cy % gridSpacing;

        ctx.beginPath();
        for (let x = startX; x < width; x += gridSpacing) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        for (let y = startY; y < height; y += gridSpacing) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        ctx.stroke();

        // Origin Crosshairs
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, height);
        ctx.moveTo(0, cy);
        ctx.lineTo(width, cy);
        ctx.stroke();
      }

      // 2. Concentric Orbit Altitude Rings (GEO, GPS, ISS)
      // Geostationary Orbit (r = 42,186 km ≈ 6.6 R)
      const geoR_px = (HEIGHT_GEO + EARTH_RADIUS) / EARTH_RADIUS * baseR_px;
      if (geoR_px > 0 && geoR_px < Math.max(width, height) * 2) {
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, geoR_px, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#64748b';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText('GEO: 35,786 km', cx + geoR_px - 8, cy - 6);
      }

      // ISS / Low Earth Orbit (r = 6,808 km ≈ 1.064 R)
      const issR_px = (HEIGHT_ISS + EARTH_RADIUS) / EARTH_RADIUS * baseR_px;
      if (issR_px > 0) {
        ctx.strokeStyle = '#93c5fd'; // blue-300
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(cx, cy, issR_px, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        if (camera.zoom > 0.6) {
          ctx.fillStyle = '#2563eb';
          ctx.font = '9px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText('ISS: 408 km', cx + issR_px + 6, cy - 6);
        }
      }

      // 3. Earth Atmosphere Glow
      const atmosphereR_px = baseR_px * 1.08;
      const atmoGrad = ctx.createRadialGradient(cx, cy, baseR_px * 0.98, cx, cy, atmosphereR_px);
      atmoGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
      atmoGrad.addColorStop(0.7, 'rgba(186, 230, 253, 0.15)');
      atmoGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = atmoGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, atmosphereR_px, 0, Math.PI * 2);
      ctx.fill();

      // 4. Earth Internal Cross-Section Layers
      // Mantle (Outer layer down to outer core)
      const mantleGrad = ctx.createRadialGradient(cx, cy, baseR_px * 0.55, cx, cy, baseR_px);
      mantleGrad.addColorStop(0, '#c2410c'); // deep mantle magma
      mantleGrad.addColorStop(0.7, '#ea580c');
      mantleGrad.addColorStop(0.95, '#b45309');
      mantleGrad.addColorStop(1, '#0284c7'); // ocean crust
      ctx.fillStyle = mantleGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseR_px, 0, Math.PI * 2);
      ctx.fill();

      // Outer Core (Molten iron-nickel, r ≈ 3,480 km ≈ 0.54 R)
      const outerCoreR_px = baseR_px * 0.54;
      const outerCoreGrad = ctx.createRadialGradient(cx, cy, baseR_px * 0.2, cx, cy, outerCoreR_px);
      outerCoreGrad.addColorStop(0, '#fbbf24');
      outerCoreGrad.addColorStop(0.6, '#f59e0b');
      outerCoreGrad.addColorStop(1, '#d97706');
      ctx.fillStyle = outerCoreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, outerCoreR_px, 0, Math.PI * 2);
      ctx.fill();

      // Inner Core (Solid crystalline iron, r ≈ 1,220 km ≈ 0.19 R)
      const innerCoreR_px = baseR_px * 0.19;
      const innerCoreGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, innerCoreR_px);
      innerCoreGrad.addColorStop(0, '#ffffff');
      innerCoreGrad.addColorStop(0.4, '#fef08a');
      innerCoreGrad.addColorStop(1, '#eab308');
      ctx.fillStyle = innerCoreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, innerCoreR_px, 0, Math.PI * 2);
      ctx.fill();

      // Earth Surface Crust Border Rim (R = 6,400 km)
      ctx.strokeStyle = '#0284c7'; // ocean blue
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, baseR_px, 0, Math.PI * 2);
      ctx.stroke();

      // Core Label
      if (camera.zoom > 0.5) {
        ctx.fillStyle = '#78350f';
        ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(lang === 'bn' ? 'অন্তর কেন্দ্র' : 'Inner Core', cx, cy + 3);
      }

      // 5. Latitude Lines & Dhaka Arc
      if (vectorOptions.showLatitudeLines) {
        // Equator Line (λ = 0°)
        ctx.strokeStyle = '#f59e0b'; // amber-500
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(cx - baseR_px * 1.15, cy);
        ctx.lineTo(cx + baseR_px * 1.15, cy);
        ctx.stroke();

        ctx.fillStyle = '#b45309';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(lang === 'bn' ? 'বিষুবরেখা (λ = 0°)' : 'Equator (λ = 0°)', cx - baseR_px * 1.18, cy + 3);

        // North Pole Axis (λ = 90°)
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(cx, cy - baseR_px * 1.15);
        ctx.lineTo(cx, cy + baseR_px * 1.15);
        ctx.stroke();

        ctx.fillStyle = '#0369a1';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(lang === 'bn' ? 'উত্তর মেরু (90°)' : 'North Pole (90°)', cx, cy - baseR_px * 1.18);

        // Dhaka Latitude Line (λ = 23.8°)
        const dhakaRad = (LATITUDE_DHAKA * Math.PI) / 180;
        const dhakaX = cx + baseR_px * Math.cos(dhakaRad);
        const dhakaY = cy - baseR_px * Math.sin(dhakaRad);

        ctx.strokeStyle = '#10b981'; // emerald
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(dhakaX, dhakaY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Angle Arc for Dhaka
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(cx, cy, 32, -dhakaRad, 0);
        ctx.stroke();

        ctx.fillStyle = '#047857';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('Dhaka λ≈23.8°', dhakaX + 6, dhakaY - 4);
      }

      // 6. Test Probe / Satellite
      const probeDistPx = (state.r / EARTH_RADIUS) * baseR_px;
      const probeX = cx + probeDistPx * Math.cos(state.angleRad);
      const probeY = cy - probeDistPx * Math.sin(state.angleRad);

      // Trajectory / Orbit circle path
      if (vectorOptions.showTrajectory && probeDistPx > 2) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)'; // cyan-500
        ctx.lineWidth = 1.8;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(cx, cy, probeDistPx, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Radial position ray from center to probe
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(probeX, probeY);
      ctx.stroke();
      ctx.setLineDash([]);

      // HSC Evaluation at current position
      const evalRes = evaluateHscGravity(
        state.r,
        state.latitudeDeg,
        state.testMass,
        state.rotationMultiplier
      );

      // 7. Dynamic Vector Overlays on Probe
      // A. Gravitational Acceleration Vector g (Crimson, points directly to Earth center cx, cy)
      if (vectorOptions.showTrueGravity && evalRes.effectiveG > 0) {
        const gLen = Math.min(85, (evalRes.effectiveG / 9.8) * 45);
        const unitToCenterX = cx - probeX;
        const unitToCenterY = cy - probeY;
        const distCenter = Math.hypot(unitToCenterX, unitToCenterY) || 1;
        const dirX = unitToCenterX / distCenter;
        const dirY = unitToCenterY / distCenter;

        const endX = probeX + dirX * gLen;
        const endY = probeY + dirY * gLen;

        ctx.strokeStyle = '#dc2626'; // crimson-600
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(probeX, probeY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Arrow head
        const headLen = 8;
        const angle = Math.atan2(dirY, dirX);
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - headLen * Math.cos(angle - Math.PI / 6),
          endY - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          endX - headLen * Math.cos(angle + Math.PI / 6),
          endY - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();

        // Label
        ctx.fillStyle = '#991b1b';
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`g=${evalRes.effectiveG.toFixed(2)}`, endX + 6, endY + 4);
      }

      // B. Tangential Velocity Vector v (Emerald, perpendicular to radius)
      if (vectorOptions.showVelocity && state.r >= EARTH_RADIUS) {
        const vLen = Math.min(80, (evalRes.orbitalVelocity / 7900) * 42);
        // Tangential unit vector: rotated 90 deg counterclockwise
        const tanAngle = state.angleRad + Math.PI / 2;
        const endVx = probeX + Math.cos(tanAngle) * vLen;
        const endVy = probeY - Math.sin(tanAngle) * vLen;

        ctx.strokeStyle = '#059669'; // emerald-600
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(probeX, probeY);
        ctx.lineTo(endVx, endVy);
        ctx.stroke();

        // Arrow head
        const headLen = 7;
        const arrowAngle = Math.atan2(endVy - probeY, endVx - probeX);
        ctx.fillStyle = '#059669';
        ctx.beginPath();
        ctx.moveTo(endVx, endVy);
        ctx.lineTo(
          endVx - headLen * Math.cos(arrowAngle - Math.PI / 6),
          endVy - headLen * Math.sin(arrowAngle - Math.PI / 6)
        );
        ctx.lineTo(
          endVx - headLen * Math.cos(arrowAngle + Math.PI / 6),
          endVy - headLen * Math.sin(arrowAngle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();

        // Label
        ctx.fillStyle = '#065f46';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`v=${evalRes.orbitalVelocityKmS.toFixed(2)} km/s`, endVx + 5, endVy - 4);
      }

      // C. Centrifugal Acceleration Vector a_c (Amber, outward horizontal from rotation axis)
      if (vectorOptions.showCentrifugal && evalRes.centrifugalAccel > 0.05) {
        const cLen = Math.min(65, (evalRes.centrifugalAccel / 9.8) * 45);
        // Directed perpendicular to Earth's vertical axis (along positive X)
        const dirSign = probeX >= cx ? 1 : -1;
        const endCx = probeX + dirSign * cLen;
        const endCy = probeY;

        ctx.strokeStyle = '#d97706'; // amber-600
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(probeX, probeY);
        ctx.lineTo(endCx, endCy);
        ctx.stroke();

        // Arrow head
        const headLen = 6;
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.moveTo(endCx, endCy);
        ctx.lineTo(endCx - dirSign * headLen, endCy - headLen * 0.6);
        ctx.lineTo(endCx - dirSign * headLen, endCy + headLen * 0.6);
        ctx.closePath();
        ctx.fill();

        // Label
        ctx.fillStyle = '#92400e';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = dirSign > 0 ? 'left' : 'right';
        ctx.fillText(`a_c=${evalRes.centrifugalAccel.toFixed(2)}`, endCx + dirSign * 5, endCy - 4);
      }

      // Probe Body (Detailed Satellite rendering with solar panels)
      ctx.save();
      ctx.translate(probeX, probeY);
      ctx.rotate(-state.angleRad);

      // Glow halo
      ctx.fillStyle = state.isDragging ? 'rgba(56, 189, 248, 0.45)' : 'rgba(14, 165, 233, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();

      // Solar Panels
      ctx.fillStyle = '#0284c7';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      // Left panel
      ctx.fillRect(-18, -4, 9, 8);
      ctx.strokeRect(-18, -4, 9, 8);
      // Right panel
      ctx.fillRect(9, -4, 9, 8);
      ctx.strokeRect(9, -4, 9, 8);

      // Satellite Central Bus
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.fillRect(-6, -6, 12, 12);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-6, -6, 12, 12);

      // Core Indicator LED
      ctx.fillStyle = evalRes.isWeightless ? '#ef4444' : '#10b981';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Probe Coordinate Tag (Altitude / Depth and Latitude)
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';

      let posText = '';
      if (evalRes.isInside) {
        posText = `d = ${evalRes.depthKm.toFixed(1)} km`;
      } else if (evalRes.altitudeKm > 0) {
        posText = `h = ${evalRes.altitudeKm.toFixed(1)} km`;
      } else {
        posText = 'Surface (h = 0)';
      }

      ctx.fillText(posText, probeX, probeY - 20);

      ctx.restore();
    };

    render();
    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [state, vectorOptions, camera, lang]);

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

      {/* Floating 2D Camera Controls & Scale Presets */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-none">
        {/* Scale Presets (GEO, LEO, Surface, Core) */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-1.5 shadow-md flex items-center gap-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5 flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-600" />
            {lang === 'bn' ? 'স্কেল:' : 'Scale:'}
          </span>
          <button
            onClick={() => handleScalePreset('geo')}
            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
              state.viewScaleMode === 'geo'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Geostationary 36,000 km view"
          >
            GEO
          </button>
          <button
            onClick={() => handleScalePreset('leo')}
            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
              state.viewScaleMode === 'leo'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Low Earth Orbit / ISS view"
          >
            LEO
          </button>
          <button
            onClick={() => handleScalePreset('surface')}
            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
              state.viewScaleMode === 'surface'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Surface close-up (Everest, Borehole)"
          >
            {lang === 'bn' ? 'পৃষ্ঠ' : 'Surface'}
          </button>
          <button
            onClick={() => handleScalePreset('core')}
            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
              state.viewScaleMode === 'core'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Interior Core view"
          >
            {lang === 'bn' ? 'অভ্যন্তর' : 'Core'}
          </button>
        </div>

        {/* Zoom In, Zoom Out, Reset Camera Buttons */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-1.5 shadow-md flex items-center gap-1.5">
          <div className="px-2 text-[10px] font-mono text-slate-600 font-semibold flex items-center gap-1">
            <Compass className="w-3 h-3 text-cyan-600" />
            <span>{camera.zoom.toFixed(2)}×</span>
          </div>

          <button
            onClick={() => handleZoom(1.25)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Zoom In (Scroll Up)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleZoom(0.8)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Zoom Out (Scroll Down)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetCamera}
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
