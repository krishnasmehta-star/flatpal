import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { prefersReducedMotion } from "@/lib/motion";

// variant: primary (Blush fill), secondary (transparent, Ink border), light (transparent, Eggshell border, for dark sections)
export const CtaButton = ({ variant = "primary", to, href, children, className = "", magnetic = true, style = {}, ...props }) => {
  const ref = useRef(null);
  const [pressed, setPressed] = useState(false);
  const [t, setT] = useState({ x: 0, y: 0 });

  const onMove = (e) => {
    if (!magnetic || prefersReducedMotion() || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const mx = e.clientX - (r.left + r.width / 2);
    const my = e.clientY - (r.top + r.height / 2);
    setT({ x: Math.max(-6, Math.min(6, mx * 0.2)), y: Math.max(-6, Math.min(6, my * 0.2)) });
  };

  const palette = {
    primary: { bg: "#FFA69E", fg: "#2E3340", border: "#2E3340", shadow: "#2E3340" },
    secondary: { bg: "transparent", fg: "#2E3340", border: "#2E3340", shadow: "#2E3340" },
    light: { bg: "transparent", fg: "#FAF3DD", border: "#FAF3DD", shadow: "#FAF3DD" },
  }[variant] || {};

  const cls = `inline-flex items-center justify-center gap-2 rounded-[6px] border-2 font-semibold transition-[transform,box-shadow] duration-150 select-none ${className}`;
  const st = {
    backgroundColor: palette.bg,
    color: palette.fg,
    borderColor: palette.border,
    transform: `translate(${pressed ? 0 : t.x}px, ${pressed ? 2 : t.y}px)`,
    boxShadow: pressed ? `0 0 0 ${palette.shadow}` : `4px 4px 0 ${palette.shadow}`,
    ...style,
  };

  const handlers = {
    ref,
    className: cls,
    style: st,
    onMouseMove: onMove,
    onMouseLeave: () => { setT({ x: 0, y: 0 }); setPressed(false); },
    onMouseDown: () => setPressed(true),
    onMouseUp: () => setPressed(false),
    ...props,
  };

  if (to) return <Link to={to} {...handlers}>{children}</Link>;
  if (href) return <a href={href} {...handlers}>{children}</a>;
  return <button {...handlers}>{children}</button>;
};
