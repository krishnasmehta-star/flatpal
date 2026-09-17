import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { DotCanvas } from "@/components/DotCanvas";
import { CtaButton } from "@/components/CtaButton";
import { api } from "@/lib/api";
import { prefersReducedMotion, canAnimate, usePageTitle, attachSafetyNet } from "@/lib/motion";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { MessageCircle, Share2, MapPin, Wallet, CalendarClock, Check } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const avatarColors = ["#FFA69E", "#B8F2E6", "#AED9E0"];

const waLink = (m) =>
  `https://wa.me/91${m.whatsapp}?text=Hi%20${encodeURIComponent(m.first_name)}%2C%20FlatPal%20matched%20us%20at%20${m.score}%25.%20Want%20to%20chat%3F`;

function MatchCard({ m, i }) {
  const ref = useRef(null);
  const numRef = useRef(null);

  useEffect(() => {
    if (!canAnimate()) {
      if (numRef.current) numRef.current.textContent = m.score;
      return;
    }
    const detach = attachSafetyNet(ref.current, 1500);
    const ctx = gsap.context(() => {
      // Cards animate on load with a stagger, regardless of scroll position: nothing waits hidden below the fold.
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(ref.current, { clearProps: "opacity,transform,visibility" });
          gsap.set(ref.current.querySelectorAll(".reason-chip"), { clearProps: "opacity,transform,visibility" });
          if (numRef.current) numRef.current.textContent = m.score;
        },
      });
      tl.from(ref.current, { y: 40, rotate: 1, opacity: 0, duration: 0.6, ease: "power3.out", delay: i * 0.1 });
      tl.to({ v: 0 }, {
        v: m.score, duration: 1.2, ease: "power3.out",
        onUpdate: function () { if (numRef.current) numRef.current.textContent = Math.round(this.targets()[0].v); },
      }, "-=0.3");
      tl.from(ref.current.querySelectorAll(".reason-chip"), { scale: 0.8, opacity: 0, stagger: 0.06, duration: 0.4, ease: "power3.out" });
    }, ref);
    return () => {
      detach();
      ctx.revert();
    };
  }, [m.score, i]);

  const disabled = m.is_demo || !m.whatsapp;

  return (
    <div
      ref={ref}
      data-testid={`match-card-${i + 1}`}
      className="rounded-2xl border hard bg-white p-6 transition-transform duration-300 hover:-translate-y-1 sm:p-7"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-lg font-bold text-[#2E3340]" style={{ backgroundColor: avatarColors[i % avatarColors.length] }}>
            {m.first_name?.[0]?.toUpperCase()}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#2E3340]">#{i + 1}</span>
              <h3 className="font-display text-xl font-bold text-[#2E3340]">{m.first_name}, {m.age}</h3>
              {m.is_demo && (
                <span className="rounded-full bg-[#AED9E0] px-2 py-0.5 text-xs font-semibold text-[#2E3340]" data-testid={`demo-tag-${i + 1}`}>demo profile</span>
              )}
            </div>
            <p className="text-sm text-[#2E3340]">{m.gender}</p>
          </div>
        </div>
        <div className="flex items-baseline gap-1 text-right">
          <span ref={numRef} className="font-display text-[56px] font-extrabold leading-none text-[#2E3340]" data-testid={`match-score-${i + 1}`}>
            {canAnimate() ? 0 : m.score}
          </span>
          <span className="rounded-[4px] bg-[#FFA69E] px-1.5 py-0.5 font-display text-sm font-bold text-[#2E3340]">% match</span>
        </div>
      </div>

      {m.bio && <p className="mt-4 text-base italic text-[#2E3340]">"{m.bio}"</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {m.areas.map((a) => (
          <span
            key={a}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
              m.overlap_areas.includes(a) ? "bg-[#FFA69E] text-[#2E3340]" : "bg-[#AED9E0] text-[#2E3340]"
            }`}
          >
            <MapPin className="h-3 w-3" /> {a}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-[#2E3340]">
        <span className="inline-flex items-center gap-2"><Wallet className="h-4 w-4 text-[#2E3340]" /> {m.budget}</span>
        <span className="inline-flex items-center gap-2"><CalendarClock className="h-4 w-4 text-[#2E3340]" /> {m.move_in}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {m.reasons.map((r, ri) => (
          <span key={ri} className="reason-chip inline-flex items-center gap-1.5 rounded-full bg-[#B8F2E6] px-3 py-1.5 text-sm font-medium text-[#2E3340]">
            <Check className="h-4 w-4" /> {r}
          </span>
        ))}
      </div>

      {m.friction && (
        <div className="mt-3 rounded-xl bg-[#AED9E0] px-3 py-2 text-sm text-[#2E3340]" data-testid={`friction-${i + 1}`}>
          {m.friction}
        </div>
      )}

      <div className="mt-5">
        {disabled ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <button disabled data-testid={`whatsapp-btn-${i + 1}`} className="inline-flex h-[52px] cursor-not-allowed items-center gap-2 rounded-[6px] border-2 border-[#2E3340]/30 bg-[#AED9E0] px-6 font-semibold text-[#2E3340]">
                  <MessageCircle className="h-4 w-4" /> Say hi on WhatsApp
                </button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Demo profile, no real number</TooltipContent>
          </Tooltip>
        ) : (
          <CtaButton href={waLink(m)} target="_blank" rel="noopener noreferrer" data-testid={`whatsapp-btn-${i + 1}`} className="h-[52px] px-6">
            <MessageCircle className="h-4 w-4" /> Say hi on WhatsApp
          </CtaButton>
        )}
      </div>
    </div>
  );
}

export default function Results() {
  usePageTitle("FlatPal | Your top 5");
  const { profileId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const headerRef = useRef(null);

  useEffect(() => {
    api.get(`/matches/${profileId}`).then((res) => setData(res.data)).catch(() =>
      setError("We couldn't find these results. Try filling the form again.")
    );
  }, [profileId]);

  useEffect(() => {
    if (!data || !canAnimate() || !headerRef.current) return;
    gsap.from(headerRef.current, { y: 20, opacity: 0, duration: 0.6, ease: "power3.out", clearProps: "opacity,transform,visibility" });
  }, [data]);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy the link");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF3DD]">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-4 pb-16 pt-32 text-center">
          <p className="text-lg text-[#2E3340]">{error}</p>
          <div className="mt-6 flex justify-center">
            <CtaButton to="/match" className="h-[60px] px-6">Back to the form</CtaButton>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF3DD]">
        <p className="font-display text-lg text-[#2E3340]">Scoring the pool...</p>
      </div>
    );
  }

  const { first_name, pool_size, matches, total_passing, is_sample } = data;

  return (
    <div className="relative min-h-screen bg-[#FAF3DD]">
      <div className="pointer-events-none fixed inset-0"><DotCanvas variant="results" /></div>
      <div className="relative z-10">
        <SiteHeader />
        <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-28 sm:px-8">
          {is_sample && (
            <div className="hard-sm mb-6 flex flex-col gap-3 rounded-xl bg-[#AED9E0] px-4 py-3 text-[#2E3340] sm:flex-row sm:items-center sm:justify-between" data-testid="sample-banner">
              <span className="font-semibold">You're viewing a sample. Fill the 2-minute form to get your own matches.</span>
              <CtaButton to="/match" magnetic={false} className="h-11 shrink-0 px-4 text-sm" data-testid="sample-banner-cta">Get my matches</CtaButton>
            </div>
          )}
          <div ref={headerRef} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-extrabold text-[#2E3340] sm:text-4xl" data-testid="results-header">
                Hi {first_name}, here are your top {matches.length} FlatPals
              </h1>
              <p className="mt-2 text-base text-[#2E3340]">scored against {pool_size} people in the FlatPal pool</p>
            </div>
            <button
              data-testid="share-btn"
              onClick={share}
              className="inline-flex h-[52px] shrink-0 items-center gap-2 self-start rounded-[6px] border-2 border-[#2E3340] bg-transparent px-5 font-semibold text-[#2E3340] transition-colors hover:bg-[#AED9E0]"
            >
              {copied ? <><Check className="h-4 w-4" /> Copied</> : <><Share2 className="h-4 w-4" /> Share my results</>}
            </button>
          </div>

          {total_passing < 5 && (
            <div className="mt-6 rounded-xl bg-[#AED9E0] px-4 py-3 text-[#2E3340]" data-testid="few-matches-note">
              Only {total_passing} people match your hard filters right now. Widen your areas or budget to see more.
            </div>
          )}

          <TooltipProvider>
            <div className="mt-8 space-y-5">
              {matches.map((m, i) => <MatchCard key={m.id} m={m} i={i} />)}
            </div>
          </TooltipProvider>

          {!is_sample && (
            <p className="mt-8 text-center text-sm text-[#2E3340]" data-testid="pool-note">
              Your profile is now in the pool. Others may be matched with you.
            </p>
          )}
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
