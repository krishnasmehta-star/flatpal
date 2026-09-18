import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { CtaButton } from "@/components/CtaButton";
import { canAnimate, usePageTitle, attachSafetyNet } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

// Every number on this page comes from Krishna's resume, the FlatPal build log of 17 Sep 2026, or Emergent's own JD.
// QA_CHECKS is the number of checks in qa/e2e.py. Update it when checks are added.
const QA_CHECKS = 97;
const REPO_URL = "https://github.com/krishnasmehta-star/flatpal";
const EMAIL = "krishna.s.mehta@gmail.com";
const PHONE_DISPLAY = "+91 98696 51116";
const PHONE_TEL = "+919869651116";
const RESUME_URL = "/krishna-mehta-resume.pdf";

const proof = [
  { n: "1 to 500+", label: "weekly signups at Whatmore.ai, SEO engine built from zero" },
  { n: "71 to 75%", label: "M1 retention at Porter, ~9 lakh monthly users" },
  { n: "54,000+", label: "monthly organic visits, 190+ pages, 1,700+ keywords" },
  { n: "12+", label: "person growth team hired and run" },
  { n: "9.64", label: "ROI on the Porter second-order experiment" },
  { n: "249", label: "rupees to ship FlatPal on Emergent, 100 credits" },
];

const jd = [
  { ask: "Own activation, engagement, NRR, expansion, LTV, revenue per cohort.", proof: "Owned M1 retention on a ~9 lakh base at Porter and moved it from 71.14% to 75.44%. Second-order conversion +3% at a 9.64 ROI. Not yet a subscription P&L; the cohort metrics that feed one, yes." },
  { ask: "Diagnose what stalls growth, onboarding to churn, and intervene.", proof: "Paid for your trial, built on it, logged every place the funnel helped or hurt. The notes and three experiments are below, each with a metric." },
  { ask: "Lay out a long-term GTM and revenue strategy.", proof: "Built Whatmore's marketing function from zero, weekly signups 1 to 500+ on organic alone. Sit with founders on pricing and growth economics at PLG Crew today." },
  { ask: "Ship experiments with Product and Marketing: activation, lifecycle, pricing, upsell, win-back.", proof: "Intercom lifecycle journeys at Whatmore. Retention and reactivation experiments at Porter with measured ROI. I ship, then report the number, good or bad." },
  { ask: "Size new opportunities: segments, packaging, expansion whitespace.", proof: "Your under-penetrated segment is non-technical builders in India who pay on UPI in one step and stall on hidden credits. I am that user. I would size it first." },
  { ask: "Run a function across Product, Engineering, Marketing, Support, Data.", proof: "Hired and ran a 12+ person team. Business generalist through Zubilant's pandemic pivot. I prototype without an engineer now: exported FlatPal, finished the last 10 percent myself." },
  { ask: "Own growth reporting to leadership.", proof: "This page is the report: credits per build, what broke, what the agent claimed, what I fixed." },
];

const builds = [
  { build: "Build 1", did: "Full FlatPal spec in one prompt. About 11 minutes.", credits: "25.88", after: "84.12" },
  { build: "Build 2", did: "Design pass with GSAP motion, plus QA fixes.", credits: "46.15", after: "37.97" },
  { build: "Build 3", did: "Animation bug, demo pool, /sample route. Ran out partway.", credits: "37.97, all that was left", after: "0" },
];

const bugs = [
  "Step 3 of the form only appeared after a scroll. Agent said \"frontend flow working as expected\". Fix: swap on click.",
  "Every page titled \"Emergent | Fullstack App\". Agent said nothing. Fix: a title hook per route.",
  "Match reasons identical on every card. Agent said the engine worked; it did, the copy did not. Fix: reasons from real overlap.",
  "Whole site stuck at opacity 0 to 0.58, GSAP tweens never completed. Agent said \"verified several aspects\". Fix: visible by default plus a 1.5 second safety net.",
  "Two hero stickers overlapped and clearProps wiped inline colours. Found by hand, not in any agent report.",
];

const funnel = [
  { head: "The credit balance is hidden", body: "No counter in the builder: Account Settings, then Credit Usage. For a credit-metered product that is the biggest anxiety driver, two clicks deep." },
  { head: "The upsell fires at peak satisfaction", body: "\"Agent is suggesting some feature enhancements\" lands the second \"Agent Finished\" appears. An expansion nudge dressed as help." },
  { head: "The pricing modal is textbook PLG", body: "Anchored against 1,649 rupees at 85 percent off. 150 bonus credits on Standard, Pro as the hero card, Intercom Fin exactly at the paywall. UPI in one step. Autopay cancelled straight after, access kept." },
  { head: "Project view does not sync across tabs", body: "A second tab said \"Agent is running\" long after the first said finished. Small, but it makes you doubt the credit count too." },
];

const plan = [
  { window: "Days 1 to 30", title: "Instrument, then listen", body: "Build the cohort view the JD names: activation, engagement, NRR, expansion, LTV by plan and country. Read a quarter of churn tickets. Walk the funnel in three more countries.", metric: "One agreed growth model, a number attached to every experiment." },
  { window: "Days 31 to 60", title: "Run the three experiments below", body: "Small, metric-attached, all from paying for the product.", metric: "Second-prompt rate, trial-to-paid, 7-day retention." },
  { window: "Days 61 to 90", title: "Size the whitespace, set the year", body: "Pricing and packaging by country and segment. Win-back for users whose app is still live. Evidence to leadership as a 12-month plan, not a slide of ideas.", metric: "A sized opportunity list and a revenue plan I own." },
];

const experiments = [
  {
    change: "Persistent credit meter in the builder header, with a \"this message cost X credits\" receipt under each agent turn.",
    hypothesis: "Reduces trial abandonment driven by credit anxiety and raises the second-prompt rate.",
    metric: "Second-prompt rate, trial-to-paid conversion.",
  },
  {
    change: "Move the \"feature enhancements\" card from post-build to after the user has deployed and shared. Reframe it as \"what builders of apps like yours added next\".",
    hypothesis: "Higher click-through with lower trust cost.",
    metric: "Card CTR, 7-day retention of users who saw it.",
  },
  {
    change: "Replace the calendar-based day-12 renewal nudge with a usage-triggered offer: \"you have used 80 of 100 credits and your app is live\", carrying the 150 bonus credits.",
    hypothesis: "Converts on intent rather than on the calendar.",
    metric: "Trial-to-Standard conversion.",
  },
];

const gaps = [
  {
    gap: "No management consulting background.",
    cover: "I learned growth by owning numbers, not by advising on them. Every figure on this page is one I was accountable for.",
  },
  {
    gap: "I have not owned subscription revenue end to end.",
    cover: "I have owned the metrics that make it up: retention on a 9 lakh base, activation and lifecycle at Whatmore, pricing and positioning with founders at PLG Crew. The P&L is the next step, and I want to take it here.",
  },
  {
    gap: "Six years, at the bottom of your range.",
    cover: "Six years across startups, a unicorn and founder-led ventures, with a team of 12 under me at the last one. Judge the work, then the years.",
  },
];

const H2 = ({ children }) => (
  <h2 className="font-display text-2xl font-extrabold text-[#2E3340] sm:text-3xl">{children}</h2>
);

const Label = ({ children }) => (
  <span className="font-display text-xs font-bold uppercase tracking-[0.18em] text-[#2E3340]">{children}</span>
);

const Intro = ({ children }) => (
  <p className="mt-3 text-base leading-relaxed text-[#2E3340] sm:text-lg">{children}</p>
);

export default function BuiltOnEmergent() {
  usePageTitle("Built on Emergent | FlatPal");
  const scope = useRef(null);

  useEffect(() => {
    const detach = attachSafetyNet(scope.current, 1500);
    if (!canAnimate()) return detach;
    const ctx = gsap.context(() => {
      gsap.utils.toArray(".rise").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 16,
          duration: 0.5,
          ease: "power3.out",
          onComplete: () => gsap.set(el, { clearProps: "opacity,transform,visibility" }),
          scrollTrigger: { trigger: el, start: "top 95%", once: true },
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
      <main className="mx-auto max-w-[860px] px-3 pb-14 pt-24 sm:px-5">
        {/* HERO */}
        <span className="inline-block rounded-[4px] bg-[#B8F2E6] px-2.5 py-1 font-display text-xs font-bold uppercase tracking-[0.18em] text-[#2E3340]">
          Application: Growth Lead, Bengaluru
        </span>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] text-[#2E3340] sm:text-5xl">
          I want to run subscriber growth at Emergent. This is the application, live.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-[#2E3340]">
          Krishna Mehta, growth operator, Bangalore. Six years, startups to unicorn, zero engineering background. Instead of a cover letter I paid for your trial, built a real product on it in a weekend, and took notes on your funnel the whole way. The product is this site. The notes are below.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <CtaButton href={RESUME_URL} target="_blank" rel="noopener noreferrer" data-testid="emergent-resume-cta" className="h-[56px] w-full text-base sm:w-auto sm:px-6">
            Resume, PDF
          </CtaButton>
        </div>

        {/* PROOF STRIP */}
        <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-4" data-testid="emergent-stats">
          {proof.map((s) => (
            <div key={s.label} data-testid="emergent-stat" className="hard rounded-2xl bg-white p-3 sm:p-5">
              <p className="font-display text-xl font-extrabold leading-none text-[#2E3340] sm:text-4xl">{s.n}</p>
              <p className="mt-1.5 text-[11px] font-medium leading-snug text-[#2E3340] sm:mt-2 sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 space-y-10">
          {/* JD LINE BY LINE */}
          <section data-testid="emergent-section-1" className="rise">
            <H2>Your JD, line by line</H2>
            <Intro>
              What you asked for, and what I have actually done about it.
            </Intro>
            <div className="mt-4 space-y-3">
              {jd.map((row, i) => (
                <div key={i} data-testid={`emergent-jd-${i + 1}`} className="hard grid gap-2.5 rounded-2xl bg-white p-4 sm:grid-cols-[1fr_1.4fr] sm:gap-5 sm:p-5">
                  <div>
                    <Label>You asked for</Label>
                    <p className="mt-1 font-display text-base font-bold leading-snug text-[#2E3340] sm:text-lg">{row.ask}</p>
                  </div>
                  <div>
                    <Label>I have done</Label>
                    <p className="mt-1 text-sm leading-relaxed text-[#2E3340] sm:text-base">{row.proof}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CASE STUDY */}
          <section data-testid="emergent-section-2" className="rise">
            <H2>The case study: FlatPal, built on Emergent</H2>
            <Intro>
              In 2024 my flatmate Kritika and I ran FlatPal by hand. Form in, five hand-picked matches on WhatsApp within two days. We matched three people and paused: manual matching does not scale, neither of us is from tech, and no technical co-founder would work for equity alone. v2 was a test of whether that blocker is gone for a non-engineer with one weekend. Standard Trial, 249 rupees, 14 days, 100 credits. Autopay cancelled the minute the payment cleared.
            </Intro>
            <div className="hard mt-5 overflow-hidden rounded-2xl bg-white" data-testid="emergent-builds">
              <div className="hidden grid-cols-[6rem_1fr_5.5rem_6.5rem] gap-3 border-b-2 border-[#2E3340] bg-[#B8F2E6] px-5 py-2.5 sm:grid">
                <Label>Build</Label>
                <Label>What it did</Label>
                <Label>Credits</Label>
                <Label>Balance after</Label>
              </div>
              {builds.map((b, i) => (
                <div
                  key={b.build}
                  data-testid={`emergent-build-${i + 1}`}
                  className={`grid grid-cols-1 gap-1.5 px-5 py-4 sm:grid-cols-[6rem_1fr_5.5rem_6.5rem] sm:gap-3 sm:py-3 ${i > 0 ? "border-t-2 border-[#2E3340]" : ""}`}
                >
                  <p className="font-display text-base font-bold text-[#2E3340]">{b.build}</p>
                  <p className="text-sm text-[#2E3340] sm:text-base">{b.did}</p>
                  <p className="text-sm text-[#2E3340] sm:text-base">
                    <span className="sm:hidden">Credits: </span>
                    <span className="font-semibold">{b.credits}</span>
                  </p>
                  <p className="text-sm text-[#2E3340] sm:text-base">
                    <span className="sm:hidden">Balance after: </span>
                    <span className="font-semibold">{b.after}</span>
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-base font-semibold leading-relaxed text-[#2E3340] sm:text-lg" data-testid="emergent-verdict">
              100 credits got to roughly 90 percent of a shippable app. The last 10 percent I finished by hand after exporting the code, at zero cost. The live app costs nothing to run: Vercel Hobby plus MongoDB Atlas free tier in Mumbai. {QA_CHECKS} end-to-end checks run against production. All {QA_CHECKS} pass.
            </p>

            <h3 className="mt-6 font-display text-xl font-extrabold text-[#2E3340]">What broke, what the agent claimed, what I fixed</h3>
            <Intro>
              Engine, seeding, validation and API worked first time. The pattern in what did not: backend claims held, frontend claims needed a human. That gap is where a trial user decides whether to trust the product.
            </Intro>
            <ul className="hard mt-4 list-disc space-y-1.5 rounded-2xl bg-white py-4 pl-9 pr-4 text-sm leading-relaxed text-[#2E3340] sm:text-base">
              {bugs.map((b, i) => (
                <li key={i} data-testid={`emergent-bug-${i + 1}`}>{b}</li>
              ))}
            </ul>
          </section>

          {/* FUNNEL */}
          <section data-testid="emergent-section-3" className="rise">
            <H2>What I noticed about your funnel</H2>
            <Intro>As a paying trial user. Growth hat on, not complaint hat.</Intro>
            <div className="mt-4 space-y-4">
              {funnel.map((f, i) => (
                <div key={f.head} data-testid={`emergent-funnel-${i + 1}`}>
                  <h3 className="font-display text-lg font-extrabold text-[#2E3340] sm:text-xl">{f.head}</h3>
                  <p className="mt-1.5 text-base leading-relaxed text-[#2E3340] sm:text-lg">{f.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 90 DAYS */}
          <section data-testid="emergent-section-4" className="rise">
            <H2>My first 90 days in the seat</H2>
            <Intro>
              From day one to owning the numbers in your JD.
            </Intro>
            <div className="mt-4 space-y-3">
              {plan.map((p, i) => (
                <div key={p.window} data-testid={`emergent-plan-${i + 1}`} className="hard rounded-2xl bg-white p-4 sm:p-5">
                  <Label>{p.window}</Label>
                  <h3 className="mt-1 font-display text-lg font-extrabold text-[#2E3340] sm:text-xl">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#2E3340] sm:text-base">{p.body}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#2E3340] sm:text-base"><span className="font-semibold">Output: </span>{p.metric}</p>
                </div>
              ))}
            </div>

            <h3 className="mt-8 font-display text-xl font-extrabold text-[#2E3340]">The three experiments, ready for a sprint</h3>
            <ol className="mt-4 space-y-4">
              {experiments.map((e, i) => (
                <li key={i} data-testid={`emergent-experiment-${i + 1}`} className="hard rounded-2xl border-2 border-[#2E3340] bg-[#B8F2E6] p-4 sm:p-5">
                  <p className="font-display text-3xl font-extrabold leading-none text-[#2E3340]">{i + 1}</p>
                  <dl className="mt-3 space-y-2.5 text-sm leading-relaxed text-[#2E3340] sm:text-base">
                    <div><dt><Label>Change</Label></dt><dd className="mt-0.5">{e.change}</dd></div>
                    <div><dt><Label>Hypothesis</Label></dt><dd className="mt-0.5">{e.hypothesis}</dd></div>
                    <div><dt><Label>Metric</Label></dt><dd className="mt-0.5">{e.metric}</dd></div>
                  </dl>
                </li>
              ))}
            </ol>
          </section>

          {/* GAPS */}
          <section data-testid="emergent-section-5" className="rise">
            <H2>What I have not done</H2>
            <Intro>Three things your JD asks for that I cannot tick. Here is what covers each.</Intro>
            <div className="mt-4 space-y-3">
              {gaps.map((g, i) => (
                <div key={i} data-testid={`emergent-gap-${i + 1}`} className="hard rounded-2xl bg-white p-4 sm:p-5">
                  <p className="font-display text-base font-bold text-[#2E3340] sm:text-lg">{g.gap}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#2E3340] sm:text-base">{g.cover}</p>
                </div>
              ))}
            </div>
          </section>

          {/* WHY EMERGENT, CONTACT */}
          <section data-testid="emergent-section-6" className="rise rounded-2xl border-2 border-[#2E3340] bg-[#FFA69E] p-5 sm:p-6">
            <H2>Why you, why now</H2>
            <div className="mt-4 space-y-3 text-base leading-relaxed text-[#2E3340] sm:text-lg">
              <p>
                You are past $100M ARR with 10M users in 190+ countries, and the JD says the next job is subscriber revenue: activate, expand, keep. I have spent six years on that motion one layer down. I want the layer up.
              </p>
              <p>
                I am in Bangalore, happy to be in the office full time, and I would rather show you what I would do than tell you. This page is the show.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3 text-lg font-semibold text-[#2E3340] sm:flex-row sm:flex-wrap sm:gap-6">
              <span data-testid="emergent-email-text" className="select-all">{EMAIL}</span>
              <a href={`tel:${PHONE_TEL}`} className="underline underline-offset-4">{PHONE_DISPLAY}</a>
              <a href={RESUME_URL} target="_blank" rel="noopener noreferrer" data-testid="emergent-resume-link" className="underline underline-offset-4">Resume (PDF)</a>
            </div>
          </section>
        </div>

        {/* CTAS */}
        <div className="mt-12 flex flex-col gap-4 sm:flex-row" data-testid="emergent-ctas">
          <CtaButton to="/sample" data-testid="emergent-sample-cta" className="h-[60px] w-full text-lg sm:h-[68px] sm:w-auto sm:px-6">See a sample match</CtaButton>
          <CtaButton to="/about" variant="secondary" data-testid="emergent-about-cta" className="h-[60px] w-full text-lg sm:h-[68px] sm:w-auto sm:px-6">Read the FlatPal story</CtaButton>
        </div>
        <p className="mt-6 text-base text-[#2E3340]">
          Every line of this is public:{" "}
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" data-testid="emergent-repo-link" className="font-semibold underline underline-offset-4">
            source on GitHub
          </a>
          .
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
