import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { CtaButton } from "@/components/CtaButton";
import { canAnimate, usePageTitle, attachSafetyNet } from "@/lib/motion";

// Every number on this page comes from Krishna's resume, the FlatPal build log of 17 Sep 2026, or Emergent's own JD.
// QA_CHECKS is the number of checks in qa/e2e.py. Update it when checks are added.
const QA_CHECKS = 97;
const REPO_URL = "https://github.com/krishnasmehta-star/flatpal";
const EMAIL = "krishna.s.mehta@gmail.com";
const PHONE_DISPLAY = "+91 98696 51116";
const PHONE_TEL = "+919869651116";
const RESUME_URL = "/krishna-mehta-resume.pdf";

const proof = [
  { n: "1 to 500+", t: "weekly signups at Whatmore.ai, SEO engine built from zero, 54,000+ monthly organic visits." },
  { n: "71.14% to 75.44%", t: "M1 retention at Porter across ~9 lakh monthly users, through onboarding, cashback and lifecycle." },
  { n: "9.64 ROI", t: "on the Porter second-order experiment; dormant-user campaigns reactivating at 5%." },
  { n: "12+ people", t: "hired and run across SEO, design, development, content and creators." },
  { n: "190+ pages, 1,700+ keywords", t: "shipped to make organic a primary acquisition channel." },
  { n: "249 rupees", t: "to ship FlatPal on Emergent in a weekend. 100 credits, zero engineering background." },
];

const jd = [
  { ask: "Own activation, engagement, NRR, expansion, LTV, revenue per cohort.", a: "Owned M1 retention on a 9 lakh base and moved it four points. Not yet a subscription P&L; the cohort metrics that feed one, yes." },
  { ask: "Diagnose what stalls growth, onboarding to churn, and intervene.", a: "Paid for your trial, built on it, logged every place the funnel helped or hurt. Notes and experiments below." },
  { ask: "Lay out a long-term GTM and revenue strategy.", a: "Built Whatmore's marketing function from zero. Sit with founders on pricing and growth economics at PLG Crew today." },
  { ask: "Ship experiments with Product and Marketing: activation, lifecycle, pricing, upsell, win-back.", a: "Intercom lifecycle journeys at Whatmore. Retention and reactivation experiments at Porter with measured ROI." },
  { ask: "Size new opportunities: segments, packaging, expansion whitespace.", a: "Your under-penetrated segment is non-technical builders in India who pay on UPI in one step and stall on hidden credits. I am that user." },
  { ask: "Run a function across Product, Engineering, Marketing, Support, Data.", a: "Ran a 12+ person team. Business generalist through Zubilant's pandemic pivot. Prototype without an engineer now." },
  { ask: "Own growth reporting to leadership.", a: "This page is the report: credits per build, what broke, what the agent claimed, what I fixed." },
];

const builds = [
  { build: "Build 1", t: "full spec in one prompt, about 11 minutes, 25.88 credits, balance 84.12." },
  { build: "Build 2", t: "design pass plus QA fixes, 46.15 credits, balance 37.97." },
  { build: "Build 3", t: "animation bug, demo pool, /sample route, ran out at 0." },
];

const bugs = [
  "Step 3 of the form only appeared after a scroll. Agent: \"frontend flow working as expected\". Fixed: swaps on click.",
  "Every page titled \"Emergent | Fullstack App\". Agent: silent. Fixed: a title hook per route.",
  "Match reasons identical on every card. Agent: engine working. The engine was; the copy was not. Fixed: reasons from real overlap.",
  "Whole site stuck at opacity 0 to 0.58, GSAP tweens never completed. Agent: \"verified several aspects\". Fixed: visible by default plus a 1.5 second safety net.",
  "Two hero stickers overlapped; clearProps wiped inline colours. Found by hand, not in any agent report.",
];

const funnel = [
  { h: "Credit balance is hidden.", t: "No counter in the builder; Account Settings, then Credit Usage. For a credit-metered product that is the biggest anxiety driver, two clicks deep." },
  { h: "Upsell fires at peak satisfaction.", t: "\"Agent is suggesting some feature enhancements\" lands the second \"Agent Finished\" appears. Expansion nudge dressed as help." },
  { h: "Pricing modal is textbook PLG.", t: "Anchored against 1,649 rupees at 85 percent off, 150 bonus credits on Standard, Pro as hero card, Intercom Fin exactly at the paywall. UPI in one step." },
  { h: "Project view does not sync across tabs.", t: "Second tab said \"Agent is running\" long after the first said finished. Small, but it makes you doubt the credit count too." },
];

const experiments = [
  { c: "Persistent credit meter in the builder header, with a per-message credit receipt.", m: "Second-prompt rate, trial-to-paid." },
  { c: "Move the feature-enhancements card to after deploy and share, reframed as \"what builders of apps like yours added next\".", m: "Card CTR, 7-day retention." },
  { c: "Replace the day-12 calendar nudge with a usage trigger: \"80 of 100 credits used and your app is live\", carrying the 150 bonus credits.", m: "Trial-to-Standard conversion." },
];

const plan = [
  { w: "Days 1 to 30", t: "Instrument. Build the cohort view the JD names (activation, engagement, NRR, expansion, LTV by plan and country). Read a quarter of churn tickets. Walk the funnel in three more countries. Ship only the dashboard." },
  { w: "Days 31 to 60", t: "Run the three experiments above. Report the number, good or bad." },
  { w: "Days 61 to 90", t: "Size pricing and packaging by country and segment. Win-back for users whose app is still live. Take the evidence to leadership as a 12-month plan I own." },
];

const gaps = [
  { g: "No consulting background.", t: "I learned growth by owning numbers, not advising on them." },
  { g: "Have not owned subscription revenue end to end.", t: "Have owned retention, activation and lifecycle that make it up. The P&L is the next step; I want to take it here." },
  { g: "Six years, the bottom of your range.", t: "With a team of 12 under me at the last one. Judge the work, then the years." },
];

const experience = [
  { r: "PLG Crew, growth lab for SaaS and Shopify brands", d: "Nov 2025 to present", t: "Positioning, pricing, acquisition systems and programmatic SEO with founders. Designed, wrote and coded zubilant.co.in end to end with AI." },
  { r: "Whatmore.ai, built the marketing function", d: "Sep 2023 to Nov 2025", t: "Brand, website, acquisition, product marketing. 12+ team. Signups 1 to 500+ weekly, 54,000+ organic visits, 15+ creator campaigns, Intercom lifecycle." },
  { r: "Porter.in, growth and retention", d: "Jan 2022 to Aug 2023", t: "M1 retention 71.14% to 75.44% on ~9 lakh users. Second-order conversion +3% at 9.64 ROI. GTM for new vehicle categories in 5+ cities." },
  { r: "Zubilant, business generalist", d: "Dec 2020 to Dec 2021", t: "Led the pandemic pivot from travel to experiences: brand refresh, new offerings, GTM and partnerships." },
];

const Section = ({ id, title, children }) => (
  <section data-testid={id} className="mt-7">
    <h2 className="border-b-2 border-[#2E3340] pb-1.5 font-display text-xs font-bold uppercase tracking-[0.2em] text-[#2E3340]">{title}</h2>
    <div className="mt-3">{children}</div>
  </section>
);

const Bullets = ({ children }) => <ul className="list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-[#2E3340] sm:text-base">{children}</ul>;

export default function BuiltOnEmergent() {
  usePageTitle("Built on Emergent | FlatPal");
  const scope = useRef(null);

  useEffect(() => {
    const detach = attachSafetyNet(scope.current, 1500);
    if (!canAnimate()) return detach;
    const ctx = gsap.context(() => {
      gsap.from(".sheet", {
        opacity: 0,
        y: 14,
        duration: 0.5,
        ease: "power3.out",
        onComplete: () => gsap.set(".sheet", { clearProps: "opacity,transform,visibility" }),
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
      <main className="mx-auto max-w-[840px] px-3 pb-14 pt-24 sm:px-5">
        <div className="mb-4 flex flex-wrap justify-end gap-3">
          <CtaButton href={`mailto:${EMAIL}`} data-testid="emergent-email-cta" magnetic={false} className="h-11 px-5 text-sm">Email me</CtaButton>
          <CtaButton href={RESUME_URL} target="_blank" rel="noopener noreferrer" data-testid="emergent-resume-cta" variant="secondary" magnetic={false} className="h-11 px-5 text-sm">Resume, PDF</CtaButton>
        </div>

        <article className="sheet hard rounded-2xl bg-white p-5 sm:p-10">
          {/* HEADER */}
          <span className="inline-block rounded-[4px] bg-[#B8F2E6] px-2.5 py-1 font-display text-xs font-bold uppercase tracking-[0.18em] text-[#2E3340]">
            Application: Growth Lead, Emergent, Bengaluru
          </span>
          <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-[#2E3340] sm:text-4xl">Krishna Mehta</h1>
          <p className="mt-1 font-display text-sm font-bold uppercase tracking-[0.12em] text-[#2E3340]">Growth operator · Bangalore · six years, startups to unicorn</p>
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-[#2E3340]">
            <a href={`tel:${PHONE_TEL}`} className="underline underline-offset-4">{PHONE_DISPLAY}</a>
            <a href={`mailto:${EMAIL}`} data-testid="emergent-email-link" className="underline underline-offset-4">{EMAIL}</a>
            <a href={RESUME_URL} target="_blank" rel="noopener noreferrer" data-testid="emergent-resume-link" className="underline underline-offset-4">Resume (PDF)</a>
          </p>
          <p className="mt-5 text-[15px] leading-relaxed text-[#2E3340] sm:text-base">
            <strong>Instead of a cover letter I paid for your trial, built a real product on it in a weekend, and took notes on your funnel the whole way.</strong> The product is this site. The notes are below. Zero engineering background; six years owning acquisition, activation and retention numbers at startups, a unicorn and founder-led ventures. I want to own subscriber revenue at Emergent.
          </p>

          {/* PROOF */}
          <Section id="emergent-section-1" title="Selected proof">
            <Bullets>
              {proof.map((p) => (
                <li key={p.n} data-testid="emergent-stat"><strong>{p.n}</strong> {p.t}</li>
              ))}
            </Bullets>
          </Section>

          {/* JD */}
          <Section id="emergent-section-2" title="Your JD, my answer">
            <div className="space-y-2.5">
              {jd.map((row, i) => (
                <div key={i} data-testid={`emergent-jd-${i + 1}`} className="text-[15px] leading-relaxed text-[#2E3340] sm:text-base">
                  <p className="font-semibold">{row.ask}</p>
                  <p>{row.a}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* CASE STUDY */}
          <Section id="emergent-section-3" title="Case study: FlatPal, built on Emergent">
            <p className="text-[15px] leading-relaxed text-[#2E3340] sm:text-base">
              FlatPal v1 (2024): my flatmate Kritika and I matched people by hand, paused because it did not scale and no technical co-founder would work for equity. v2: Standard Trial, 249 rupees, 100 credits, one weekend.
            </p>
            <Bullets>
              {builds.map((b, i) => (
                <li key={b.build} data-testid={`emergent-build-${i + 1}`}><strong>{b.build}:</strong> {b.t}</li>
              ))}
            </Bullets>
            <p className="mt-3 text-[15px] font-semibold leading-relaxed text-[#2E3340] sm:text-base" data-testid="emergent-verdict">
              100 credits got to roughly 90 percent of a shippable app. The last 10 percent I finished by hand after exporting the code, at zero cost. Runs free on Vercel and MongoDB Atlas. {QA_CHECKS} end-to-end checks against production, all passing.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-[#2E3340] sm:text-base">
              What broke, and the pattern: backend claims held, frontend claims needed a human. That gap is where a trial user decides whether to trust the product.
            </p>
            <Bullets>
              {bugs.map((b, i) => (
                <li key={i} data-testid={`emergent-bug-${i + 1}`}>{b}</li>
              ))}
            </Bullets>
          </Section>

          {/* FUNNEL */}
          <Section id="emergent-section-4" title="Your funnel, as a paying user">
            <Bullets>
              {funnel.map((f, i) => (
                <li key={i} data-testid={`emergent-funnel-${i + 1}`}><strong>{f.h}</strong> {f.t}</li>
              ))}
            </Bullets>
          </Section>

          {/* EXPERIMENTS */}
          <Section id="emergent-section-5" title="Three experiments, ready for a sprint">
            <ol className="list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed text-[#2E3340] sm:text-base">
              {experiments.map((e, i) => (
                <li key={i} data-testid={`emergent-experiment-${i + 1}`}>{e.c} <span className="font-semibold">Metric:</span> {e.m}</li>
              ))}
            </ol>
          </Section>

          {/* 90 DAYS */}
          <Section id="emergent-section-6" title="First 90 days in the seat">
            <Bullets>
              {plan.map((p, i) => (
                <li key={i} data-testid={`emergent-plan-${i + 1}`}><strong>{p.w}.</strong> {p.t}</li>
              ))}
            </Bullets>
          </Section>

          {/* GAPS */}
          <Section id="emergent-section-7" title="What I have not done">
            <Bullets>
              {gaps.map((g, i) => (
                <li key={i} data-testid={`emergent-gap-${i + 1}`}><strong>{g.g}</strong> {g.t}</li>
              ))}
            </Bullets>
          </Section>

          {/* EXPERIENCE */}
          <Section id="emergent-section-8" title="Experience">
            <div className="space-y-3">
              {experience.map((x, i) => (
                <div key={i} data-testid={`emergent-exp-${i + 1}`} className="text-[15px] leading-relaxed text-[#2E3340] sm:text-base">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="font-semibold">{x.r}</p>
                    <p className="text-sm">{x.d}</p>
                  </div>
                  <p>{x.t}</p>
                </div>
              ))}
              <p className="text-sm text-[#2E3340]">Earlier: SumHR, Vasi Magazine, Jack&amp;Jones. Bachelor of Mass Media, Mumbai.</p>
            </div>
          </Section>
        </article>

        {/* CTAS */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center" data-testid="emergent-ctas">
          <CtaButton to="/sample" data-testid="emergent-sample-cta" className="h-[52px] w-full text-base sm:w-auto sm:px-6">See a sample match</CtaButton>
          <CtaButton to="/about" variant="secondary" data-testid="emergent-about-cta" className="h-[52px] w-full text-base sm:w-auto sm:px-6">Read the FlatPal story</CtaButton>
        </div>
        <p className="mt-4 text-center text-sm text-[#2E3340]">
          Every line of this is public:{" "}
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" data-testid="emergent-repo-link" className="font-semibold underline underline-offset-4">source on GitHub</a>.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
