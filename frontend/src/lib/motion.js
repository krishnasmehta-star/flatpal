import { gsap } from "gsap";

// Never let a laggy tab leave tweens half-finished.
gsap.ticker.lagSmoothing(0);

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Animate only when the tab is actually visible; otherwise content simply stays visible.
export const canAnimate = () =>
  !prefersReducedMotion() && typeof document !== "undefined" && document.visibilityState === "visible";

export const usePageTitle = (title) => {
  if (typeof document !== "undefined") {
    document.title = title;
  }
};

// Force everything inside root to full opacity and neutral transform.
export const safetyReveal = (root) => {
  if (!root) return;
  root.querySelectorAll("*").forEach((el) => {
    const st = el.style;
    if (st && (st.opacity !== "" || st.transform !== "" || st.visibility !== "")) {
      gsap.set(el, { clearProps: "opacity,transform,visibility" });
    }
  });
};

// Attach a page-level safety net: after `ms`, and whenever the tab becomes visible, reveal everything.
export const attachSafetyNet = (root, ms = 1500) => {
  const run = () => safetyReveal(root);
  const t = setTimeout(run, ms);
  const onVis = () => {
    if (document.visibilityState === "visible") run();
  };
  document.addEventListener("visibilitychange", onVis);
  return () => {
    clearTimeout(t);
    document.removeEventListener("visibilitychange", onVis);
  };
};
