import React, { useRef, useEffect, useState } from 'react';
import { SimulationMode, Language } from '../types';
import { EARTH_RADIUS, STANDARD_G } from '../physics/constants';
import { evaluateSolidEarthGravity, evaluateRotationAtLatitude } from '../physics/engine';
import { ChevronDown, ChevronUp, LineChart } from 'lucide-react';

interface GraphOverlayProps {
  mode: SimulationMode;
  explorerR: number;
  tunnelY: number;
  latitudeDeg: number;
  rotationMultiplier: number;
  densityMultiplier: number;
  lang: Language;
}

export const GraphOverlay: React.FC<GraphOverlayProps> = ({
  mode,
  explorerR,
  tunnelY,
  latitudeDeg,
  rotationMultiplier,
  densityMultiplier,
  lang
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    if (isCollapsed) return;
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

      // Clean light scientific canvas background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Margins
      const padLeft = 38;
      const padRight = 18;
      const padTop = 22;
      const padBottom = 26;
      const plotW = width - padLeft - padRight;
      const plotH = height - padTop - padBottom;

      // Coordinate axes
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      // Y-axis
      ctx.moveTo(padLeft, padTop);
      ctx.lineTo(padLeft, padTop + plotH);
      // X-axis
      ctx.lineTo(padLeft + plotW, padTop + plotH);
      ctx.stroke();

      // Gridlines & labels based on mode
      ctx.fillStyle = '#475569';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';

      if (mode === 'tunnel' || mode === 'explorer') {
        const maxG = STANDARD_G * Math.max(1, densityMultiplier) * 1.15;

        // Y ticks: 0, 0.5 g0, g0
        [0, 0.5, 1.0].forEach(ratio => {
          const val = STANDARD_G * ratio * densityMultiplier;
          const py = padTop + plotH - (val / maxG) * plotH;
          ctx.strokeStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.moveTo(padLeft, py);
          ctx.lineTo(padLeft + plotW, py);
          ctx.stroke();
          ctx.fillText(`${val.toFixed(1)}`, padLeft - 4, py + 3);
        });

        // X ticks: 0, R, 2R
        ctx.textAlign = 'center';
        [
          { frac: 0, label: '0' },
          { frac: 0.5, label: 'R' },
          { frac: 1.0, label: '2R' }
        ].forEach(t => {
          const px = padLeft + t.frac * plotW;
          ctx.strokeStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.moveTo(px, padTop + plotH);
          ctx.lineTo(px, padTop);
          ctx.stroke();
          ctx.fillText(t.label, px, padTop + plotH + 14);
        });

        // Axis Titles
        ctx.fillStyle = '#334155';
        ctx.font = '9px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(lang === 'bn' ? 'দূরত্ব r ⟶' : 'Radius r ⟶', padLeft + plotW / 2, padTop + plotH + 24);
        
        ctx.save();
        ctx.translate(11, padTop + plotH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('g (m/s²)', 0, 0);
        ctx.restore();

        // Draw Theoretical Curve
        ctx.beginPath();
        const steps = 100;

        for (let i = 0; i <= steps; i++) {
          const frac = i / steps; // 0 to 1 -> represents 0 to 2R
          const rMeters = frac * 2.0 * EARTH_RADIUS;
          const gVal = evaluateSolidEarthGravity(rMeters, densityMultiplier).g;

          const px = padLeft + frac * plotW;
          const py = padTop + plotH - (gVal / maxG) * plotH;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }

        ctx.strokeStyle = '#0284c7'; // Clean azure curve
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Shading under curve inside the earth (0 to R)
        ctx.fillStyle = 'rgba(2, 132, 199, 0.08)';
        ctx.beginPath();
        const rSteps = 50;
        ctx.moveTo(padLeft, padTop + plotH);
        for (let i = 0; i <= rSteps; i++) {
          const frac = (i / rSteps) * 0.5;
          const rMeters = frac * 2.0 * EARTH_RADIUS;
          const gVal = evaluateSolidEarthGravity(rMeters, densityMultiplier).g;
          const px = padLeft + frac * plotW;
          const py = padTop + plotH - (gVal / maxG) * plotH;
          ctx.lineTo(px, py);
        }
        ctx.lineTo(padLeft + 0.5 * plotW, padTop + plotH);
        ctx.closePath();
        ctx.fill();

        // Live Tracer Point
        const currentR = mode === 'explorer' ? explorerR : Math.abs(tunnelY);
        const currentFrac = Math.min(1.0, currentR / (2.0 * EARTH_RADIUS));
        const currentG = evaluateSolidEarthGravity(currentR, densityMultiplier).g;

        const curPx = padLeft + currentFrac * plotW;
        const curPy = padTop + plotH - (currentG / maxG) * plotH;

        // Glowing tracer dot
        ctx.fillStyle = '#e11d48';
        ctx.beginPath();
        ctx.arc(curPx, curPy, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Value tooltip tag
        ctx.fillStyle = '#be123c';
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`(${currentG.toFixed(1)} m/s²)`, Math.min(plotW - 10, curPx + 6), curPy - 4);

        // Formula Annotation
        ctx.fillStyle = '#0369a1';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText('g ∝ r (r < R) | g ∝ 1/r² (r ≥ R)', width - padRight, padTop + 10);
      } else {
        // Rotation mode: g' vs Latitude λ (0° to 90°)
        ctx.textAlign = 'right';
        [0, 5, 9.8].forEach(val => {
          const py = padTop + plotH - (val / 11) * plotH;
          ctx.strokeStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.moveTo(padLeft, py);
          ctx.lineTo(padLeft + plotW, py);
          ctx.stroke();
          ctx.fillText(`${val}`, padLeft - 4, py + 3);
        });

        // X ticks: 0° (Equator), 45°, 90° (Pole)
        ctx.textAlign = 'center';
        [
          { deg: 0, label: '0°' },
          { deg: 45, label: '45°' },
          { deg: 90, label: '90°' }
        ].forEach(t => {
          const px = padLeft + (t.deg / 90) * plotW;
          ctx.strokeStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.moveTo(px, padTop + plotH);
          ctx.lineTo(px, padTop);
          ctx.stroke();
          ctx.fillText(t.label, px, padTop + plotH + 14);
        });

        // Axis Titles
        ctx.fillStyle = '#334155';
        ctx.font = '9px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(lang === 'bn' ? 'অক্ষাংশ λ ⟶' : 'Latitude λ ⟶', padLeft + plotW / 2, padTop + plotH + 24);

        ctx.save();
        ctx.translate(11, padTop + plotH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("g' (m/s²)", 0, 0);
        ctx.restore();

        // Draw g'(lambda) curve
        ctx.beginPath();
        const steps = 90;
        for (let deg = 0; deg <= steps; deg++) {
          const evalRes = evaluateRotationAtLatitude(deg, rotationMultiplier);
          const px = padLeft + (deg / 90) * plotW;
          const py = padTop + plotH - (evalRes.effectiveG / 11) * plotH;
          if (deg === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Live Tracer Point for current latitude
        const curEval = evaluateRotationAtLatitude(latitudeDeg, rotationMultiplier);
        const curPx = padLeft + (latitudeDeg / 90) * plotW;
        const curPy = padTop + plotH - (curEval.effectiveG / 11) * plotH;

        ctx.fillStyle = curEval.isWeightless ? '#e11d48' : '#d97706';
        ctx.beginPath();
        ctx.arc(curPx, curPy, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Formula label
        ctx.fillStyle = '#0369a1';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText("g' = g₀ - ω²R cos²λ", width - padRight, padTop + 10);
      }

      ctx.restore();
    };

    render();
    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [mode, explorerR, tunnelY, latitudeDeg, rotationMultiplier, densityMultiplier, lang, isCollapsed]);

  return (
    <div className="absolute bottom-4 right-4 z-20 transition-all duration-200">
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl overflow-hidden w-80 md:w-96">
        {/* Header Bar */}
        <div
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors select-none"
        >
          <div className="flex items-center gap-2">
            <LineChart className="w-3.5 h-3.5 text-cyan-600" />
            <span className="text-xs font-bold text-slate-800 tracking-wide">
              {lang === 'bn' ? 'রিয়েল-টাইম গ্রাফ ওভারলে' : 'Real-Time Graph Overlay'}
            </span>
          </div>
          <button className="text-slate-500 hover:text-slate-800 p-0.5 rounded cursor-pointer">
            {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Canvas Body */}
        {!isCollapsed && (
          <div className="p-2 bg-slate-50">
            <canvas
              ref={canvasRef}
              className="w-full h-44 rounded-lg block border border-slate-200"
            />
          </div>
        )}
      </div>
    </div>
  );
};
