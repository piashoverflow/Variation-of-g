import React, { useRef, useEffect } from 'react';
import { ShellState, VectorDisplayOptions, Language } from '../types';
import { EARTH_RADIUS } from '../physics/constants';
import { evaluateHollowShell } from '../physics/engine';

interface ShellCanvasProps {
  state: ShellState;
  vectorOptions: VectorDisplayOptions;
  lang: Language;
  onUpdatePosition: (x: number, y: number) => void;
  onSetDragging: (dragging: boolean) => void;
}

export const ShellCanvas: React.FC<ShellCanvasProps> = ({
  state,
  vectorOptions,
  lang,
  onUpdatePosition,
  onSetDragging
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const cx = width / 2;
    const cy = height / 2;
    const R_px = Math.min(width, height) * 0.36;

    // Convert pixel to physical meters
    const physX = ((clickX - cx) / R_px) * EARTH_RADIUS;
    const physY = -((clickY - cy) / R_px) * EARTH_RADIUS; // +y is upward

    isDraggingRef.current = true;
    onSetDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    onUpdatePosition(physX, physY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const cx = width / 2;
    const cy = height / 2;
    const R_px = Math.min(width, height) * 0.36;

    const physX = ((clickX - cx) / R_px) * EARTH_RADIUS;
    const physY = -((clickY - cy) / R_px) * EARTH_RADIUS;
    onUpdatePosition(physX, physY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      onSetDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Handled
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
      const R_px = Math.min(width, height) * 0.36;

      // 1. Clean Light Scientific Laboratory Background
      const bgGrad = ctx.createRadialGradient(cx, cy, R_px * 0.2, cx, cy, Math.max(width, height) * 0.7);
      bgGrad.addColorStop(0, '#f8fafc');
      bgGrad.addColorStop(0.6, '#f1f5f9');
      bgGrad.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // High-Precision Grid View around Shell (User Request)
      if (vectorOptions.showGridView) {
        ctx.save();
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

        const distanceMultipliers = [
          { mult: 0.5, label: '0.5 R' },
          { mult: 1.0, label: '1.0 R (Shell)' },
          { mult: 1.5, label: '1.5 R' },
          { mult: 2.0, label: '2.0 R' }
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
        });
        ctx.restore();
      }

      // 2. Equipotential Surfaces
      if (vectorOptions.showEquipotential) {
        // Outside equipotentials: concentric rings with V ~ -1/r
        const numRings = 5;
        for (let i = 1; i <= numRings; i++) {
          const ringR = R_px * (1 + i * 0.22);
          ctx.beginPath();
          ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(147, 51, 234, ${0.45 - i * 0.05})`;
          ctx.lineWidth = 1.2;
          ctx.setLineDash([3, 4]);
          ctx.stroke();

          // Ring potential value label
          ctx.fillStyle = '#7e22ce';
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.fillText(`V = -${(62.5 / (1 + i * 0.22)).toFixed(1)} MJ/kg`, cx + ringR - 18, cy - 4);
        }

        // Inside equipotential: uniform potential wash!
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, R_px, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(147, 51, 234, 0.06)';
        ctx.fill();
        ctx.restore();
      }

      // 3. Gravitational Field Vector Mesh
      if (vectorOptions.showFieldMesh) {
        const gridSize = 32;
        const cols = Math.floor(width / gridSize);
        const rows = Math.floor(height / gridSize);

        for (let ix = 0; ix <= cols; ix++) {
          for (let iy = 0; iy <= rows; iy++) {
            const px = ix * gridSize;
            const py = iy * gridSize;
            const dx = px - cx;
            const dy = py - cy;
            const distPx = Math.hypot(dx, dy);

            // Inside shell: strictly zero field!
            if (distPx < R_px * 0.98) {
              // Draw a tiny green zero indicator dot
              ctx.fillStyle = 'rgba(22, 163, 74, 0.4)';
              ctx.beginPath();
              ctx.arc(px, py, 1.5, 0, Math.PI * 2);
              ctx.fill();
            } else if (distPx > R_px * 1.04) {
              // Outside: vector pointing directly inward toward center
              const angle = Math.atan2(cy - py, cx - px);
              const fieldStrength = Math.min(12, 16000 / (distPx * distPx));
              const arrowLen = Math.max(4, fieldStrength);

              ctx.save();
              ctx.translate(px, py);
              ctx.rotate(angle);
              ctx.strokeStyle = 'rgba(2, 132, 199, 0.35)';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(arrowLen, 0);
              ctx.stroke();

              // Tiny arrowhead
              ctx.fillStyle = 'rgba(2, 132, 199, 0.5)';
              ctx.beginPath();
              ctx.moveTo(arrowLen, 0);
              ctx.lineTo(arrowLen - 2.5, -2);
              ctx.lineTo(arrowLen - 2.5, 2);
              ctx.closePath();
              ctx.fill();
              ctx.restore();
            }
          }
        }
      }

      // 4. Draw Hollow Spherical Shell
      // Shell inner glow
      const shellGlow = ctx.createRadialGradient(cx, cy, R_px * 0.95, cx, cy, R_px * 1.08);
      shellGlow.addColorStop(0, 'rgba(2, 132, 199, 0.25)');
      shellGlow.addColorStop(0.5, 'rgba(14, 165, 233, 0.12)');
      shellGlow.addColorStop(1, 'rgba(14, 165, 233, 0)');
      ctx.fillStyle = shellGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, R_px * 1.08, 0, Math.PI * 2);
      ctx.fill();

      // Hollow Shell Wall Interior
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R_px, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(2, 132, 199, 0.04)';
      ctx.fill();
      ctx.restore();

      // Metallic Shell Ring
      ctx.beginPath();
      ctx.arc(cx, cy, R_px, 0, Math.PI * 2);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 5;
      ctx.setLineDash([]);
      ctx.stroke();

      // Inner boundary highlight
      ctx.beginPath();
      ctx.arc(cx, cy, R_px - 2.5, 0, Math.PI * 2);
      ctx.strokeStyle = '#0369a1';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Shell Label
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        lang === 'bn' ? 'ফাঁপা মহাকর্ষীয় গোলক (Hollow Shell R)' : 'Thin Hollow Spherical Shell (Radius R)',
        cx,
        cy - R_px - 14
      );

      // 5. Test Particle Position
      const particlePxX = cx + (state.x / EARTH_RADIUS) * R_px;
      const particlePxY = cy - (state.y / EARTH_RADIUS) * R_px; // note invert Y
      const distFromCenter = Math.hypot(particlePxX - cx, particlePxY - cy);
      const isInside = distFromCenter < R_px;

      // 6. Geometric Solid Angle Cone Cancellation Proof (for interior point)
      if (vectorOptions.showProofCones && isInside && distFromCenter > 5) {
        const dx = particlePxX - cx;
        const dy = particlePxY - cy;
        const angleToParticle = Math.atan2(dy, dx);

        const coneAngles = [angleToParticle, angleToParticle + 0.25, angleToParticle - 0.25];

        ctx.save();
        coneAngles.forEach((theta, idx) => {
          const cosT = Math.cos(theta);
          const sinT = Math.sin(theta);
          const b = 2 * (dx * cosT + dy * sinT);
          const c = dx * dx + dy * dy - R_px * R_px;
          const disc = b * b - 4 * c;
          if (disc >= 0) {
            const t1 = (-b + Math.sqrt(disc)) / 2;
            const t2 = (-b - Math.sqrt(disc)) / 2;

            const p1x = particlePxX + t1 * cosT;
            const p1y = particlePxY + t1 * sinT;
            const p2x = particlePxX + t2 * cosT;
            const p2y = particlePxY + t2 * sinT;

            ctx.strokeStyle = idx === 0 ? '#d97706' : 'rgba(217, 119, 6, 0.4)';
            ctx.lineWidth = idx === 0 ? 2 : 1;
            ctx.setLineDash(idx === 0 ? [] : [2, 2]);
            ctx.beginPath();
            ctx.moveTo(p1x, p1y);
            ctx.lineTo(p2x, p2y);
            ctx.stroke();

            // Patch markers on shell
            ctx.fillStyle = '#b45309';
            ctx.beginPath();
            ctx.arc(p1x, p1y, 3.5, 0, Math.PI * 2);
            ctx.arc(p2x, p2y, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // Geometric explanation annotation
        ctx.fillStyle = '#92400e';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          lang === 'bn' ? 'dM₁/r₁² = dM₂/r₂² ⟹ মোট বল = ০' : 'dM₁/r₁² = dM₂/r₂² ⟹ Net Force ΣF = 0',
          particlePxX,
          particlePxY - 26
        );
        ctx.restore();
      }

      // 7. Render Test Mass Particle
      const evalResult = evaluateHollowShell(state.x, state.y, EARTH_RADIUS, state.shellMass);

      // Particle Glow
      const pGlow = ctx.createRadialGradient(particlePxX, particlePxY, 2, particlePxX, particlePxY, 20);
      pGlow.addColorStop(0, isInside ? 'rgba(22, 163, 74, 0.5)' : 'rgba(225, 29, 72, 0.5)');
      pGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = pGlow;
      ctx.beginPath();
      ctx.arc(particlePxX, particlePxY, 20, 0, Math.PI * 2);
      ctx.fill();

      // Particle Core
      ctx.fillStyle = isInside ? '#16a34a' : '#dc2626';
      ctx.beginPath();
      ctx.arc(particlePxX, particlePxY, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Field vector arrow on particle
      if (vectorOptions.showTrueGravity) {
        if (isInside) {
          ctx.fillStyle = '#15803d';
          ctx.font = 'bold 11px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(lang === 'bn' ? 'E = ০.০০ N/kg (শিল্ডিং)' : 'E = 0.00 N/kg (Shielded)', particlePxX, particlePxY + 22);
        } else {
          const angleToCenter = Math.atan2(cy - particlePxY, cx - particlePxX);
          const arrowLen = Math.min(50, (evalResult.fieldMagnitude / 9.8) * 35);

          ctx.save();
          ctx.translate(particlePxX, particlePxY);
          ctx.rotate(angleToCenter);
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(arrowLen, 0);
          ctx.stroke();

          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.moveTo(arrowLen, 0);
          ctx.lineTo(arrowLen - 6, -4);
          ctx.lineTo(arrowLen - 6, 4);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          ctx.fillStyle = '#b91c1c';
          ctx.font = 'bold 10px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`E = ${evalResult.fieldMagnitude.toFixed(2)} N/kg`, particlePxX, particlePxY + 22);
        }
      }

      // Status indicator on top
      ctx.fillStyle = isInside ? '#15803d' : '#0284c7';
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      const statusText = isInside
        ? (lang === 'bn' ? 'ফাঁপা গোলকের অভ্যন্তর: মহাকর্ষীয় প্রাবল্য E ≡ ০ N/kg' : 'Inside Hollow Shell: Gravitational Field E ≡ 0 N/kg')
        : (lang === 'bn' ? 'ফাঁপা গোলকের বহিস্থ বিন্দু: কেন্দ্রস্থ বিন্দু-ভরের মতো আচরণ' : 'Outside Hollow Shell: Behaves as Point Mass at Center');
      ctx.fillText(statusText, cx, 32);

      // Drag Hint
      ctx.fillStyle = '#64748b';
      ctx.font = '11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        lang === 'bn' ? 'টেস্ট কণাটি ক্লিক করে ভেতরে বা বাইরে যেকোনো অবস্থানে ড্র্যাগ করুন' : 'Click & drag the test particle anywhere inside or outside',
        cx,
        height - 14
      );

      ctx.restore();
    };

    render();
    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [state, vectorOptions, lang]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none block"
      />
    </div>
  );
};
