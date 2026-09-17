import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { CtaButton } from "@/components/CtaButton";
import { DotCanvas } from "@/components/DotCanvas";
import { Shapes, Marquee, StickerTags } from "@/components/Decor";
import { canAnimate, usePageTitle, attachSafetyNet } from "@/lib/motion";
import { ClipboardList, Calculator, MessageCircle } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  { icon: ClipboardList, title: "Fill a 2-minute form", desc: "Tell us how you actually live day to day.", bg: "#FAF3DD", chip: "#FFA69E" },
  { icon: Calculator, title: "We score you against everyone", desc: "Every person in the pool, ranked for you.", bg: "#FFFFFF", chip: "#AED9E0" },
  { icon: MessageCircle, title: "Say hi to your top 5", desc: "Message your best matches on WhatsApp.", bg: "#FAF3DD", chip: "#FFA69E" },
];

const whyCols = [
  ["Your flatmate shapes your habits.", "Your conversations, sometimes your values. The person you share a kitchen with is not a small decision."],
  ["A vibe check beats 150 unfiltered leads.", "Knowing how someone sleeps, cleans and hosts tells you more than a photo of the room ever will."],
  ["v1 in 2024 did this by hand.", "v2 does it in seconds. Same idea, no more spreadsheets and no more guesswork."],
];

const headline = ["Find", "a", "flatmate", "you'll", "actually", "like", "living", "with."];

export default function Landing() {
  usePageTitle("FlatPal | Find a flatmate you'll actually like living with");
  const scope = useRef(null);

  useEffect(() => {
    const detach = attachSafetyNet(scope.current, 1500);
    if (!canAnimate()) return detach;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => gsap.set([".hero-eyebrow", ".hero-word", ".hero-sub", ".hero-cta"], { clearProps: "opacity,transform,visibility" }),
      });
      tl.from(".hero-eyebrow", { y: 16, opacity: 0, duration: 0.5 }, 0)
        .from(".hero-word", { y: 32, opacity: 0, stagger: 0.05, duration: 0.45 }, 0.05)
        .from(".hero-sub", { y: 16, opacity: 0, duration: 0.45 }, 0.3)
        .from(".hero-cta", { y: 16, opacity: 0, duration: 0.45 }, 0.4);

      gsap.utils.toArray(".step-card").forEach((el, i) => {
        gsap.from(el, {
          y: 32, opacity: 0, duration: 0.5, delay: i * 0.1, ease: "power3.out",
          onComplete: () => gsap.set(el, { clearProps: "opacity,transform,visibility" }),
          scrollTrigger: { trigger: el, start: "top 95%", once: true },
        });
      });
      gsap.utils.toArray(".why-col").forEach((el, i) => {
        gsap.from(el, {
          y: 24, opacity: 0, duration: 0.5, delay: i * 0.08, ease: "power3.out",
          onComplete: () => gsap.set(el, { clearProps: "opacity,transform,visibility" }),
          scrollTrigger: { trigger: el, start: "top 95%", once: true },
        });
      });
    }, scope);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
    return () => {
      detach();
      ctx.revert();
    };
  }, []);

  return (
    <div ref={scope} className="min-h-screen bg-[#FAF3DD]">
      <SiteHeader />

      {/* HERO: full bleed ink */}
      <section className="relative overflow-hidden border-b-2 border-[#2E3340] bg-[#2E3340]">
        <DotCanvas variant="hero" />
        <StickerTags />
        <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-6xl flex-col justify-center px-4 py-28 sm:px-8">
          <span className="hero-eyebrow inline-block w-fit rounded-[4px] bg-[#B8F2E6] px-2.5 py-1 font-display text-xs font-bold uppercase tracking-[0.18em] text-[#2E3340]">
            Flatmate matching &middot; Bangalore
          </span>
          <h1 className="hero-h1 mt-7 max-w-4xl font-display font-extrabold leading-[1.0] text-[#FAF3DD] text-[44px] sm:text-[64px] lg:text-[80px]">
            {headline.map((w, i) => (
              <span key={i}>
                <span className={`hero-word inline-block ${w === "actually" ? "text-[#FFA69E]" : ""}`}>{w}</span>
                {i < headline.length - 1 ? " " : ""}
              </span>
            ))}
          </h1>
          <p className="hero-sub mt-7 max-w-xl text-lg font-medium text-[#FAF3DD] sm:text-xl">
            Tell us how you live. Get your 5 most compatible flatmates in Bangalore, instantly. Free.
          </p>
          <div className="hero-cta mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <CtaButton to="/match" data-testid="hero-find-cta" className="h-[60px] w-full text-lg sm:h-[68px] sm:w-[260px]">
              Find my FlatPals
            </CtaButton>
            <CtaButton to="/sample" variant="light" data-testid="hero-sample-cta" className="h-[60px] w-full text-base sm:h-[68px] sm:w-auto sm:px-6">
              Skip the form, see a sample match
            </CtaButton>
          </div>
        </div>
      </section>

      {/* STEPS: full-bleed aqua band */}
      <section className="relative overflow-hidden border-b-2 border-[#2E3340] bg-[#B8F2E6] px-4 py-[72px] sm:px-8 lg:py-[112px]">
        <Shapes variant="a" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-display text-4xl font-extrabold text-[#2E3340] sm:text-5xl">Three steps. Two minutes.</h2>
            <p className="max-w-sm text-base font-medium text-[#2E3340]">No listings, no photos of rooms. Just people you would actually get along with.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {steps.map((s, i) => (
              <div
                key={s.title}
                data-testid={`step-card-${i + 1}`}
                className="step-card hard rounded-2xl p-7 transition-transform duration-300 hover:-translate-y-1"
                style={{ backgroundColor: s.bg }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#2E3340] text-[#2E3340]" style={{ backgroundColor: s.chip }}>
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="font-display text-3xl font-extrabold text-[#2E3340]">{i + 1}</span>
                </div>
                <h3 className="mt-5 font-display text-2xl font-extrabold text-[#2E3340]">{s.title}</h3>
                <p className="mt-2 text-base font-medium text-[#2E3340]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Marquee />

      {/* WHY: eggshell */}
      <section className="relative overflow-hidden bg-[#FAF3DD] px-4 py-[72px] sm:px-8 lg:py-[120px]">
        <Shapes variant="b" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <h2 className="max-w-2xl font-display text-4xl font-extrabold text-[#2E3340] sm:text-5xl">
            Why compatibility, <span className="text-[#FFA69E]">not just a room</span>
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {whyCols.map(([lead, rest], i) => (
              <div key={i} className="why-col hard rounded-2xl bg-white p-7">
                <p className="font-display text-xl font-extrabold text-[#2E3340]">{lead}</p>
                <p className="mt-3 text-base leading-relaxed text-[#2E3340]">{rest}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <CtaButton to="/match" data-testid="why-find-cta" className="h-[60px] w-full text-lg sm:h-[68px] sm:w-[260px]">
              Find my FlatPals
            </CtaButton>
            <CtaButton to="/sample" variant="secondary" data-testid="why-sample-cta" className="h-[60px] w-full text-base sm:h-[68px] sm:w-auto sm:px-6">
              See a sample match
            </CtaButton>
          </div>
        </div>
      </section>

      {/* CLOSING CTA: full-bleed blush band */}
      <section className="relative overflow-hidden border-t-2 border-[#2E3340] bg-[#FFA69E] px-4 py-[72px] sm:px-8 lg:py-[104px]">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full border-2 border-[#2E3340] bg-[#B8F2E6]" />
          <div className="absolute -left-12 -bottom-20 h-64 w-64 rounded-[48px] border-2 border-[#2E3340] bg-[#AED9E0] rotate-12" />
        </div>
        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-4xl font-extrabold leading-[1.0] text-[#2E3340] sm:text-6xl">Your next flatmate is<br />already in the pool.</h2>
            <p className="mt-4 max-w-md text-lg font-medium text-[#2E3340]">Two minutes. Five matches. Zero awkward Facebook DMs.</p>
          </div>
          <CtaButton to="/match" data-testid="bottom-find-cta" className="h-[64px] w-full text-lg sm:h-[72px] sm:w-[280px] shrink-0" style={{ backgroundColor: "#2E3340", color: "#FAF3DD", borderColor: "#2E3340", boxShadow: "4px 4px 0 #FAF3DD" }}>
            Find my FlatPals
          </CtaButton>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
