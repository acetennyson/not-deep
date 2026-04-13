"use client";
import { useEffect, useRef } from "react";

export function GameAmbience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // floating wisps
    const wisps = Array.from({ length: 8 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: 20 + Math.random() * 40,
      speed: 0.2 + Math.random() * 0.3,
      offset: Math.random() * Math.PI * 2,
      opacity: 0.03 + Math.random() * 0.05,
    }));

    // eye pairs that peek from edges
    const eyes = [
      { edge: "left",   y: 0.25 },
      { edge: "left",   y: 0.72 },
      { edge: "right",  y: 0.4  },
      { edge: "right",  y: 0.8  },
      { edge: "bottom", x: 0.2  },
      { edge: "bottom", x: 0.75 },
    ];

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      t += 0.008;

      // wisps
      wisps.forEach((w) => {
        w.y -= w.speed * 0.4;
        w.x += Math.sin(t + w.offset) * 0.3;
        if (w.y < -w.r * 2) { w.y = H + w.r; w.x = Math.random() * W; }
        const grad = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, w.r);
        grad.addColorStop(0, `rgba(180,120,255,${w.opacity})`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // peeking eyes
      eyes.forEach((e, i) => {
        const blink = Math.sin(t * 0.7 + i * 1.3);
        const peek = (Math.sin(t * 0.4 + i * 0.9) + 1) / 2; // 0–1 how far peeked in
        const eyeGap = 14;
        const irisR = 5;
        const pupilR = 2.5;
        const glowR = 18;
        const alpha = 0.15 + peek * 0.25;

        let cx = 0, cy = 0;
        if (e.edge === "left")   { cx = peek * 28 - 10;  cy = (e.y ?? 0.5) * H; }
        if (e.edge === "right")  { cx = W - peek * 28 + 10; cy = (e.y ?? 0.5) * H; }
        if (e.edge === "bottom") { cx = (e.x ?? 0.5) * W; cy = H - peek * 28 + 10; }

        const eyePositions = [
          { x: cx - eyeGap / 2, y: cy },
          { x: cx + eyeGap / 2, y: cy },
        ];

        eyePositions.forEach(({ x, y }) => {
          // glow
          const glow = ctx.createRadialGradient(x, y, 0, x, y, glowR);
          glow.addColorStop(0, `rgba(255,60,60,${alpha * 0.4})`);
          glow.addColorStop(1, "transparent");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(x, y, glowR, 0, Math.PI * 2);
          ctx.fill();

          // iris
          const scaleY = blink > 0.92 ? 0.05 : 1; // blink
          ctx.save();
          ctx.translate(x, y);
          ctx.scale(1, scaleY);
          ctx.fillStyle = `rgba(200,40,40,${alpha + 0.1})`;
          ctx.beginPath();
          ctx.arc(0, 0, irisR, 0, Math.PI * 2);
          ctx.fill();
          // pupil
          ctx.fillStyle = `rgba(0,0,0,${alpha + 0.3})`;
          ctx.beginPath();
          ctx.arc(0, 0, pupilR, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      });

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}
