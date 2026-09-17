import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { CtaButton } from "@/components/CtaButton";
import { canAnimate, usePageTitle, attachSafetyNet } from "@/lib/motion";
import { ArrowUpRight, Mail, Phone, MapPin } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const V1_URL = "https://flatpal.godaddysites.com/";
const NOTION_URL = "https://scratch-spoon-37e.notion.site/Meet-Krishna-Kritika-a0fd03d75c4e45989a0708fd6654ea9e";
const EMAIL = "krishna.s.mehta@gmail.com";
const PHONE_DISPLAY = "+91 98696 51116";
const PHONE_TEL = "+919869651116";

const timeline = [
  { year: "2023", text: "Met Kritika on Flat & Flatmates. 25+ leads, one questionnaire, 4 replies, one flatmate who stuck." },
  { year: "2024", text: "FlatPal v1 in a week: GoDaddy site, Google Form, WhatsApp. Three people matched by hand." },
  { year: "2024 to 2026", text: "Paused. Every match took hours and no technical co-founder wanted to build the app for equity." },
  { year: "Sep 2026", text: "v2 built on Emergent in a weekend, exported, finished by hand, live. Matching is automatic." },
];

const proof = [
  { k: "1 to 500+", v: "weekly signups at Whatmore.ai, SEO engine built from zero" },
  { k: "54,000+", v: "monthly organic visits, 190+ SEO pages, 1,700+ ranking keywords" },
  { k: "71 to 75%", v: "M1 retention at Porter across ~9 lakh monthly users" },
  { k: "12+", v: "person growth team hired and run" },
];

const Frame = ({ src, alt, href, caption, className = "", imgClass = "" }) => (
  <figure className={`hard overflow-hidden rounded-2xl bg-white ${className}`}>
    {href ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        <img src={src} alt={alt} loading="lazy" className={`block w-full ${imgClass}`} />
      </a>
    ) : (
      <img src={src} alt={alt} loading="lazy" className={`block w-full ${imgClass}`} />
    )}
    {caption && (
      <figcaption className="flex items-center justify-between gap-2 border-t-2 border-[#2E3340] bg-[#FAF3DD] px-4 py-2 text-sm font-medium text-[#2E3340]">
        <span>{caption}</span>
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 underline underline-offset-4">
            Open <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        )}
      </figcaption>
    )}
  </figure>
);

export default function About() {
  usePageTitle("FlatPal | About Krishna");
  const scope = useRef(null);
  const { hash } = useLocation();

  // Footer band on every page links to /about#why-emergent; scroll there once the page has painted.
  useEffect(() => {
    if (!hash) return;
    const el = document.querySelector(hash);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: canAnimate() ? "smooth" : "auto", block: "start" }), 150);
  }, [hash]);

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
          delay: i * 0.12,
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

      {/* HERO */}
      <section className="border-b-2 border-[#2E3340] bg-[#2E3340] px-4 pb-16 pt-28 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <span className="inline-block rounded-[4px] bg-[#B8F2E6] px-2.5 py-1 font-display text-xs font-bold uppercase tracking-[0.18em] text-[#2E3340]">
            About the builder
          </span>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-[1.02] text-[#FAF3DD] sm:text-6xl">
            Hi, I'm Krishna. I built FlatPal twice. <span className="text-[#FFA69E]">This is the version that works.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[#FAF3DD] sm:text-xl">
            Growth and marketing operator in Bangalore, 6+ years across startups and unicorns, zero engineering background. FlatPal is the side project I could not finish in 2024 and finished on Emergent in a weekend in 2026.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <CtaButton to="/sample" data-testid="about-sample-cta" className="h-[60px] w-full text-base sm:h-[64px] sm:w-auto sm:px-6">
              Skip the form, see a sample match
            </CtaButton>
            <CtaButton to="/built-on-emergent" variant="light" className="h-[60px] w-full text-base sm:h-[64px] sm:w-auto sm:px-6">
              Read the build notes
            </CtaButton>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 pb-16 sm:px-8">
        {/* THE STORY */}
        <section className="pt-16">
          <h2 className="font-display text-3xl font-extrabold text-[#2E3340] sm:text-4xl">How FlatPal started</h2>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-start">
            <div className="space-y-5 text-lg leading-relaxed text-[#2E3340]">
              <p>
                I met Kritika on the Facebook group Flat &amp; Flatmates in Bangalore. I had 25+ leads and I wanted a flatmate for the long haul, not a stopgap, so before meeting anyone I sent everyone a questionnaire. Only 4 people filled it in. That is when it clicked: the questionnaire was not admin, it was the filter. Kritika was one of the 4. We have been flatmates since, and her name is on the v1 story because she lived it with me.
              </p>
              <p>
                That questionnaire was the product. In 2024 we turned it into FlatPal v1 in a week: a GoDaddy site, a form, and a promise of five compatible flatmates on WhatsApp within two days. We matched three people, every one of them by hand.
              </p>
              <p>
                Then it stopped. Neither of us could code, each match took hours, and no technical co-founder wanted to build the app for equity. The idea sat in a Notion page for two years.
              </p>
            </div>
            <Frame src="/story/krishna-kritika.webp" alt="Krishna and Kritika laughing by a lake" caption="Krishna and Kritika, the first FlatPal match" href={NOTION_URL} />
          </div>
        </section>

        {/* V1 EVIDENCE */}
        <section className="mt-16">
          <h2 className="font-display text-3xl font-extrabold text-[#2E3340] sm:text-4xl">The 2024 version, still online</h2>
          <p className="mt-3 max-w-2xl text-lg text-[#2E3340]">
            Both originals are live. The site is what a growth person ships when they cannot code. The Notion page is the story we wrote to get people to fill the form.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2 md:items-start">
            <Frame src="/story/v1-site.webp" alt="FlatPal v1 GoDaddy site" caption="v1 site on GoDaddy, 2024" href={V1_URL} />
            <Frame src="/story/notion-page.webp" alt="Meet Krishna and Kritika Notion page" caption="The v1 story page on Notion" href={NOTION_URL} />
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <Frame src="/story/krishika.webp" alt="Krishna and Kritika holding a Krishika sign" imgClass="aspect-[4/5] object-cover" />
            <Frame src="/story/elevator.webp" alt="Friends in a lift" imgClass="aspect-[4/5] object-cover" />
            <Frame src="/story/cat-2.webp" alt="Two cats sleeping" imgClass="aspect-[4/5] object-cover" />
          </div>
        </section>

        {/* THE 2026 REBUILD */}
        <section className="mt-16 rounded-2xl border-2 border-[#2E3340] bg-[#B8F2E6] p-6 sm:p-10">
          <h2 className="font-display text-3xl font-extrabold text-[#2E3340] sm:text-4xl">What changed in 2026</h2>
          <div className="mt-6 space-y-5 text-lg leading-relaxed text-[#2E3340]">
            <p>
              I read Sai Ganesh's post about joining Emergent and looking for slightly obsessive people who build in public. I had a real product with a real blocker and Emergent's whole pitch is that the blocker is gone. So I tested it on the only idea I could not let go of.
            </p>
            <p>
              One trial plan, 249 rupees, 100 credits, one weekend. Build 1 got the matching engine, the seed data and the API right first time. Build 2 was the design pass. Build 3 ran out of credits mid-fix, so I exported the code and finished the last 10 percent by hand, which is exactly the kind of thing I would not have attempted two years ago.
            </p>
            <p>
              The result is this site: a weighted compatibility engine, 520 demo profiles and a stretch fallback so every combination gets five matches, a skip-the-form route so you can see it in one click, and a build-notes page with every credit spent, everything that broke, and three growth experiments I would run if I worked at Emergent.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <CtaButton to="/built-on-emergent" className="h-[56px] w-full text-base sm:w-auto sm:px-6">Credits, bugs and three experiments</CtaButton>
            <CtaButton href="https://github.com/krishnasmehta-star/flatpal" target="_blank" rel="noopener noreferrer" variant="secondary" className="h-[56px] w-full text-base sm:w-auto sm:px-6">Source on GitHub</CtaButton>
          </div>
        </section>

        {/* TIMELINE */}
        <section className="timeline mt-16">
          <h2 className="font-display text-3xl font-extrabold text-[#2E3340] sm:text-4xl">Timeline</h2>
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
        </section>

        {/* WHY EMERGENT */}
        <section id="why-emergent" className="mt-16 scroll-mt-28">
          <h2 className="font-display text-3xl font-extrabold text-[#2E3340] sm:text-4xl">Why I want to do growth at Emergent</h2>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-5 text-lg leading-relaxed text-[#2E3340]">
              <p>
                I have spent 6+ years on the other side of products like Emergent: building marketing functions from zero, running PLG and onboarding, and getting non-technical people to their first win. FlatPal is me being your user for a weekend and taking notes the whole way.
              </p>
              <p>
                The notes are specific. Where the credit balance hides. When the upsell card appears. Why 100 trial credits lands just short of a shipped app. I wrote those up as experiments with hypotheses, not opinions, because that is how I would run them if I were on the team.
              </p>
              <p>
                I am in Bangalore, happy to be in the office full time, and I would rather show you what I would do than tell you.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {proof.map((p) => (
                <div key={p.k} className="hard rounded-2xl bg-white p-5">
                  <p className="font-display text-3xl font-extrabold text-[#2E3340]">{p.k}</p>
                  <p className="mt-2 text-sm font-medium text-[#2E3340]">{p.v}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section className="mt-16 rounded-2xl border-2 border-[#2E3340] bg-[#FFA69E] p-6 sm:p-10" data-testid="about-contact">
          <h2 className="font-display text-3xl font-extrabold text-[#2E3340] sm:text-4xl">Talk to me</h2>
          <p className="mt-3 max-w-xl text-lg text-[#2E3340]">Krishna Mehta. Growth and marketing. Bangalore.</p>
          <div className="mt-6 flex flex-col gap-3 text-lg font-semibold text-[#2E3340] sm:flex-row sm:flex-wrap sm:gap-6">
            <a href={`mailto:${EMAIL}`} className="inline-flex items-center gap-2 underline underline-offset-4"><Mail className="h-5 w-5" /> {EMAIL}</a>
            <a href={`tel:${PHONE_TEL}`} className="inline-flex items-center gap-2 underline underline-offset-4"><Phone className="h-5 w-5" /> {PHONE_DISPLAY}</a>
            <span className="inline-flex items-center gap-2"><MapPin className="h-5 w-5" /> Bangalore, India</span>
          </div>
          <div className="mt-8">
            <CtaButton to="/sample" data-testid="about-find-cta" className="h-[60px] w-full text-lg sm:h-[64px] sm:w-auto sm:px-8" style={{ backgroundColor: "#2E3340", color: "#FAF3DD", borderColor: "#2E3340", boxShadow: "4px 4px 0 #FAF3DD" }}>
              See a sample match
            </CtaButton>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
