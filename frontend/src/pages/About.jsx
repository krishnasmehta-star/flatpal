import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { CtaButton } from "@/components/CtaButton";
import { canAnimate, usePageTitle, attachSafetyNet } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

const timeline = [
  { year: "2024", text: "v1 built and launched in a week. 3 matches, all by hand." },
  { year: "2024 to 2026", text: "Paused. No technical co-founder, no app." },
  { year: "2026", text: "v2 built on Emergent in a weekend. Matching is automatic." },
];

const story = [
  "Krishna and Kritika met on the Facebook group Flat & Flatmates in Bangalore. Krishna had 150+ leads and no way to screen them for compatibility, so she sent Kritika a questionnaire first. It worked.",
  "In 2024 they built and launched FlatPal v1 in a week: a form, and five hand-picked matches on WhatsApp within 2 days. They matched 3 people by hand.",
  "Then it stopped, because neither of them could code, every match took hours of manual work, and they could not find a technical co-founder willing to build the app for equity.",
  "In 2026 that blocker no longer exists. This version was built on Emergent in a weekend and automates what they did by hand.",
];

export default function About() {
  usePageTitle("FlatPal | About");
  const scope = useRef(null);

  useEffect(() => {
    const detach = attachSafetyNet(scope.current, 1500);
    if (!canAnimate()) return detach;
    const ctx = gsap.context(() => {
      gsap.from(".tl-line", {
        scaleY: 0,
        transformOrigin: "top center",
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: ".timeline", start: "top 85%", once: true },
      });
      gsap.utils.toArray(".tl-node").forEach((n, i) => {
        gsap.from(n, {
          opacity: 0,
          x: -20,
          duration: 0.6,
          delay: i * 0.15,
          ease: "power3.out",
          onComplete: () => gsap.set(n, { clearProps: "opacity,transform,visibility" }),
          scrollTrigger: { trigger: n, start: "top 95%", once: true },
        });
      });
    }, scope);
    return () => {
      detach();
      ctx.revert();
    };
  }, []);

  return (
    <div ref={scope} className="min-h-screen bg-[#FAF3DD]">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-28 sm:px-8">
        <h1 className="font-display text-4xl font-extrabold text-[#2E3340] sm:text-5xl">The story behind FlatPal</h1>

        <div className="mt-8 space-y-5 text-lg leading-relaxed text-[#2E3340]">
          {story.map((p, i) => <p key={i}>{p}</p>)}
        </div>

        <div className="timeline mt-14">
          <h2 className="font-display text-3xl font-extrabold text-[#2E3340]">Timeline</h2>
          <div className="relative mt-8 pl-8">
            <div className="tl-line absolute left-[7px] top-2 h-[calc(100%-1rem)] w-[2px] bg-[#2E3340]" />
            <div className="space-y-8">
              {timeline.map((t, i) => (
                <div key={i} data-testid={`timeline-row-${i + 1}`} className="tl-node relative">
                  <span className="absolute -left-8 top-1.5 h-4 w-4 rounded-full border-2 border-[#2E3340] bg-[#FFA69E]" />
                  <p className="font-display text-lg font-bold text-[#2E3340]">{t.year}</p>
                  <p className="mt-1 text-base text-[#2E3340]">{t.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-12 text-base text-[#2E3340]">Built by Krishna Mehta and Kritika, Bangalore.</p>

        <div className="mt-8">
          <CtaButton to="/match" data-testid="about-find-cta" className="h-[60px] w-full text-lg sm:h-[68px] sm:w-[260px]">
            Find my FlatPals
          </CtaButton>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
