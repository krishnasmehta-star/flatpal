import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

export const DotCanvas = ({ variant = "hero" }) => {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const isHero = variant === "hero";
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mobile = window.innerWidth < 640;
    const spacing = mobile ? 44 : 28;
    const colors = isHero ? ["#FFA69E", "#B8F2E6"] : ["#5E6472"];
    const baseOpacity = isHero ? 0.95 : 0.18;
    const waveDur = isHero ? 8000 : 14000;
    const useCursor = isHero && !mobile;

    let width = 0;
    let height = 0;
    let points = [];
    const cursor = { x: -9999, y: -9999 };
    const target = { x: -9999, y: -9999 };

    const build = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      points = [];
      let row = 0;
      for (let y = spacing / 2; y < height; y += spacing) {
        let col = 0;
        for (let x = spacing / 2; x < width; x += spacing) {
          points.push({ x, y, c: colors[(row + col) % colors.length] });
          col++;
        }
        row++;
      }
    };
    build();

    let raf = 0;
    let last = 0;
    let hidden = false;

    const onResize = () => build();
    const onMove = useCursor
      ? (e) => {
          const r = canvas.getBoundingClientRect();
          target.x = e.clientX - r.left;
          target.y = e.clientY - r.top;
        }
      : null;
    const onVis = () => {
      hidden = document.hidden;
    };

    const paint = (staticDots) => {
      const t = staticDots ? 0 : performance.now();
      const phase = (t % waveDur) / waveDur * Math.PI * 2;
      ctx.clearRect(0, 0, width, height);
      for (const p of points) {
        let size = staticDots
          ? 5
          : 2 + 8 * (0.5 + 0.5 * Math.sin(phase - p.x / 110 + p.y / 260));
        if (onMove && !staticDots) {
          const dx = p.x - cursor.x;
          const dy = p.y - cursor.y;
          const d = Math.hypot(dx, dy);
          if (d < 120) size += ((120 - d) / 120) * 6;
        }
        size = Math.max(1.5, Math.min(14, size));
        // Dots stay faint under the headline (left 58% of the hero) and go bold on the right.
        const fade = isHero ? Math.min(1, Math.max(0.08, (p.x / width - 0.5) / 0.22)) : 1;
        ctx.globalAlpha = baseOpacity * fade;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    if (prefersReducedMotion()) {
      paint(true);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    const draw = (t) => {
      raf = requestAnimationFrame(draw);
      if (hidden) return;
      if (t - last < 33) return;
      last = t;
      cursor.x += (target.x - cursor.x) * 0.15;
      cursor.y += (target.y - cursor.y) * 0.15;
      paint(false);
    };

    window.addEventListener("resize", onResize);
    if (onMove) window.addEventListener("mousemove", onMove);
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      if (onMove) window.removeEventListener("mousemove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [variant]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" style={{ pointerEvents: "none" }} />;
};
