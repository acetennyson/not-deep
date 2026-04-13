"use client";
import { useEffect, useRef } from "react";

// Drawn on a canvas that sits exactly on top of the game canvas
// pointer-events-none so it doesn't block input
export function CanvasFrame() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    let t = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    // steam wisps — positions reset dynamically in draw()
    const steamParticles = Array.from({ length: 12 }, (_, i) => ({
      x: i < 6 ? 20 : 780,
      y: 500 + Math.random() * 80,
      vy: -(0.3 + Math.random() * 0.5),
      vx: (Math.random() - 0.5) * 0.3,
      r: 4 + Math.random() * 8,
      alpha: 0.04 + Math.random() * 0.06,
      offset: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      t += 0.012;

      // eye positions computed from current W/H
      const frameEyes = [
        { x: W * 0.15, y: 6 },
        { x: W * 0.5,  y: 4 },
        { x: W * 0.82, y: 7 },
        { x: W * 0.25, y: H - 6 },
        { x: W * 0.65, y: H - 5 },
        { x: 6,        y: H * 0.3 },
        { x: 5,        y: H * 0.7 },
        { x: W - 6,    y: H * 0.45 },
        { x: W - 5,    y: H * 0.75 },
      ];

      // --- border glow ---
      const borderGrad = ctx.createLinearGradient(0, 0, W, H);
      borderGrad.addColorStop(0, "rgba(120,40,180,0.25)");
      borderGrad.addColorStop(0.5, "rgba(180,20,20,0.15)");
      borderGrad.addColorStop(1, "rgba(120,40,180,0.25)");
      ctx.strokeStyle = borderGrad;
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, W - 2, H - 2);

      // inner faint border
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      ctx.strokeRect(4, 4, W - 8, H - 8);

      // corner ornaments
      const corners = [[0,0,1,1],[W,0,-1,1],[0,H,1,-1],[W,H,-1,-1]] as const;
      corners.forEach(([cx, cy, sx, sy]) => {
        ctx.strokeStyle = "rgba(180,80,255,0.3)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx + sx * 2, cy + sy * 20);
        ctx.lineTo(cx + sx * 2, cy + sy * 2);
        ctx.lineTo(cx + sx * 20, cy + sy * 2);
        ctx.stroke();
        // corner dot
        ctx.fillStyle = "rgba(200,100,255,0.5)";
        ctx.beginPath();
        ctx.arc(cx + sx * 2, cy + sy * 2, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // --- steam particles ---
      steamParticles.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx + Math.sin(t + p.offset) * 0.2;
        p.alpha -= 0.0003;
        if (p.y < H * 0.5 || p.alpha <= 0) {
          // reset
          const side = Math.random() < 0.5;
          p.x = (side ? 0 : W) + (Math.random() - 0.5) * 60;
          p.y = H - Math.random() * 30;
          p.alpha = 0.04 + Math.random() * 0.05;
        }
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `rgba(200,180,255,${p.alpha})`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // --- peeking eyes on frame ---
      frameEyes.forEach((e, i) => {
        const blink = Math.sin(t * 0.6 + i * 1.7) > 0.93;
        const pulse = (Math.sin(t * 0.5 + i * 0.8) + 1) / 2;
        const alpha = 0.3 + pulse * 0.4;
        const irisR = 4;

        // glow
        const glow = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, 14);
        glow.addColorStop(0, `rgba(255,40,40,${alpha * 0.3})`);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(e.x, e.y, 14, 0, Math.PI * 2);
        ctx.fill();

        // iris
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.scale(1, blink ? 0.08 : 1);
        ctx.fillStyle = `rgba(220,50,50,${alpha})`;
        ctx.beginPath();
        ctx.arc(0, 0, irisR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(0,0,0,0.9)`;
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  );
}
