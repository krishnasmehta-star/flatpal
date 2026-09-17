import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { gsap } from "gsap";
import { toast } from "sonner";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { SiteHeader } from "@/components/SiteChrome";
import { api } from "@/lib/api";
import { canAnimate, usePageTitle } from "@/lib/motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AREAS = ["HSR Layout", "Koramangala", "Indiranagar", "BTM Layout", "Bellandur", "Whitefield", "JP Nagar", "Jayanagar", "Marathahalli", "Sarjapur Road", "Electronic City", "Hebbal", "Other"];
const BUDGETS = ["under 10k", "10k to 15k", "15k to 20k", "20k to 30k", "30k+"];
const MOVE_INS = ["ASAP", "within a month", "1 to 3 months", "just exploring"];
const NON_NEG = ["No smoking indoors", "No pets", "No overnight guests", "Vegetarian kitchen", "Quiet after 11pm"];

const SLIDERS = [
  { key: "sleep", label: "Sleep schedule", low: "Early bird", high: "Night owl" },
  { key: "cleanliness", label: "Cleanliness", low: "Relaxed", high: "Spotless" },
  { key: "guests", label: "Guests and parties", low: "Rarely", high: "Often" },
  { key: "wfh", label: "Work from home", low: "Never", high: "Every day" },
  { key: "noise", label: "Noise at home", low: "Quiet", high: "Lively" },
  { key: "cooking", label: "Cooking", low: "Order in", high: "Cook daily" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const Pill = ({ active, onClick, children, testId }) => (
  <button
    type="button"
    data-testid={testId}
    onClick={onClick}
    className={`rounded-[6px] border-2 px-4 py-2 text-sm font-medium transition-colors duration-150 active:scale-95 ${
      active
        ? "border-[#2E3340] bg-[#FFA69E] text-[#2E3340] animate-[chippop_0.15s_ease]"
        : "border-[#2E3340]/40 bg-[#FAF3DD] text-[#2E3340] hover:border-[#2E3340]"
    }`}
  >
    {children}
  </button>
);

const Field = ({ label, children, required }) => (
  <div className="space-y-2">
    <Label className="text-base font-semibold text-[#2E3340]">
      {label}{required && <span className="text-[#FFA69E]"> *</span>}
    </Label>
    {children}
  </div>
);

const FlatSlider = ({ value, onChange, low, high }) => {
  const lowActive = value < 3;
  const highActive = value > 3;
  return (
    <div className="space-y-3">
      <SliderPrimitive.Root
        className="relative flex w-full touch-none select-none items-center py-2"
        value={[value]}
        min={1}
        max={5}
        step={1}
        onValueChange={(v) => onChange(v[0])}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-[#AED9E0]">
          <SliderPrimitive.Range className="absolute h-full bg-[#FFA69E]" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-7 w-7 rounded-full border-2 border-[#2E3340] bg-[#FFA69E] shadow transition-transform focus:scale-110 focus:outline-none active:scale-110" />
      </SliderPrimitive.Root>
      <div className="flex justify-between text-xs font-medium">
        <span className={lowActive ? "text-[#2E3340]" : "text-[#2E3340]/60"}>{low}</span>
        <span className={highActive ? "text-[#2E3340]" : "text-[#2E3340]/60"}>{high}</span>
      </div>
    </div>
  );
};

export default function Match() {
  usePageTitle("FlatPal | Find my FlatPals");
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [poolN, setPoolN] = useState(null);
  const [form, setForm] = useState({
    first_name: "", age: "", gender: "", whatsapp: "", email: "", bio: "",
    areas: [], budget: "", move_in: "", flatmate_gender_pref: "",
    lifestyle: { sleep: 3, cleanliness: 3, guests: 3, wfh: 3, noise: 3, cooking: 3 },
    smoking: "", pets: "", non_negotiables: [],
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (k, v) =>
    setForm((f) => ({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] }));
  const setSlider = (k, v) => setForm((f) => ({ ...f, lifestyle: { ...f.lifestyle, [k]: v } }));

  // Entrance animation runs AFTER the (already correct) content is rendered for the new step.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    if (!canAnimate() || !cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power3.out", clearProps: "opacity,transform" }
    );
    const fields = cardRef.current.querySelectorAll("[data-anim-field]");
    gsap.fromTo(
      fields,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power3.out", clearProps: "opacity,transform" }
    );
  }, [step]);

  const validateStep0 = () => {
    if (!form.first_name.trim()) return "Add your first name.";
    const age = Number(form.age);
    if (!age || age < 18 || age > 45) return "Age must be between 18 and 45.";
    if (!form.gender) return "Pick a gender.";
    const digits = form.whatsapp.replace(/\D/g, "").replace(/^91/, "");
    if (!/^[6-9]\d{9}$/.test(digits)) return "Enter a valid 10 digit Indian mobile number.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return "Enter a valid email.";
    return null;
  };
  const validateStep1 = () => {
    if (form.areas.length < 1) return "Pick at least one preferred area.";
    if (!form.budget) return "Pick a budget range.";
    if (!form.move_in) return "Pick your move-in timing.";
    if (!form.flatmate_gender_pref) return "Pick a flatmate gender preference.";
    return null;
  };
  const validateStep2 = () => {
    if (!form.smoking) return "Pick your smoking preference.";
    if (!form.pets) return "Pick your pets preference.";
    return null;
  };

  const next = () => {
    const err = step === 0 ? validateStep0() : step === 1 ? validateStep1() : null;
    if (err) return toast.error(err);
    setStep((s) => s + 1);
  };
  const back = () => setStep((s) => s - 1);

  const submit = async () => {
    const err = validateStep2();
    if (err) return toast.error(err);
    setSubmitting(true);
    const start = Date.now();
    try {
      const payload = { ...form, age: Number(form.age) };
      const res = await api.post("/profiles", payload);
      const id = res.data.profile_id;
      const m = await api.get(`/matches/${id}`);
      setPoolN(m.data.pool_size);
      const elapsed = Date.now() - start;
      if (elapsed < 900) await sleep(900 - elapsed);
      navigate(`/results/${id}`);
    } catch (e) {
      const msg = e?.response?.data?.detail || "Something went wrong. Try again.";
      toast.error(typeof msg === "string" ? msg : "Please check your details and try again.");
      setSubmitting(false);
    }
  };

  const stepTitles = ["About you", "The flat", "How you live"];

  return (
    <div className="min-h-screen bg-[#FAF3DD]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-28 sm:px-8">
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-display text-lg font-bold text-[#2E3340]">Step {step + 1} of 3</span>
            <span className="text-sm font-medium text-[#2E3340]">{stepTitles[step]}</span>
          </div>
          <div className="grid grid-cols-3 gap-2" data-testid="form-progress-bar">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-2 overflow-hidden rounded-full bg-[#AED9E0]">
                <div
                  className="h-full rounded-full bg-[#FFA69E] transition-all duration-500"
                  style={{ width: i <= step ? "100%" : "0%" }}
                />
              </div>
            ))}
          </div>
        </div>

        <div ref={cardRef} className="space-y-6 rounded-2xl border hard bg-white p-6 sm:p-8">
          {step === 0 && (
            <>
              <div className="flex items-start justify-between gap-3">
                <h2 className="flex-1 rounded-xl bg-[#B8F2E6] px-4 py-3 font-display text-2xl font-bold text-[#2E3340]">About you</h2>
                <Link to="/sample" data-testid="match-sample-link" className="mt-1 shrink-0 text-sm font-medium text-[#2E3340] underline underline-offset-4 transition-opacity hover:opacity-70">
                  Just browsing? See a sample result
                </Link>
              </div>
              <Field label="First name" required><div data-anim-field><Input data-testid="input-first-name" value={form.first_name} onChange={(e) => set("first_name", e.target.value)} placeholder="Your first name" className="h-12 rounded-xl" /></div></Field>
              <Field label="Age" required><div data-anim-field><Input data-testid="input-age" type="number" min={18} max={45} value={form.age} onChange={(e) => set("age", e.target.value)} placeholder="18 to 45" className="h-12 rounded-xl" /></div></Field>
              <Field label="Gender" required>
                <div data-anim-field>
                  <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                    <SelectTrigger data-testid="select-gender" className="h-12 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{["Woman", "Man", "Non-binary", "Prefer not to say"].map((g) => <SelectItem key={g} value={g} data-testid={`gender-opt-${g}`}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </Field>
              <Field label="WhatsApp number" required><div data-anim-field><Input data-testid="input-whatsapp" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="10 digit mobile" className="h-12 rounded-xl" /></div></Field>
              <Field label="Email" required><div data-anim-field><Input data-testid="input-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com" className="h-12 rounded-xl" /></div></Field>
              <Field label="One line about you">
                <div data-anim-field>
                  <Input data-testid="input-bio" maxLength={120} value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Optional, max 120 characters" className="h-12 rounded-xl" />
                  <p className="mt-1 text-xs text-[#2E3340]">{form.bio.length}/120</p>
                </div>
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="rounded-xl bg-[#B8F2E6] px-4 py-3 font-display text-2xl font-bold text-[#2E3340]">The flat</h2>
              <Field label="Preferred areas" required>
                <div data-anim-field className="flex flex-wrap gap-2">
                  {AREAS.map((a) => <Pill key={a} testId={`area-${a}`} active={form.areas.includes(a)} onClick={() => toggle("areas", a)}>{a}</Pill>)}
                </div>
              </Field>
              <Field label="Monthly budget for your share of rent" required>
                <div data-anim-field>
                  <Select value={form.budget} onValueChange={(v) => set("budget", v)}>
                    <SelectTrigger data-testid="select-budget" className="h-12 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{BUDGETS.map((b) => <SelectItem key={b} value={b} data-testid={`budget-opt-${b}`}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </Field>
              <Field label="Move-in timing" required>
                <div data-anim-field>
                  <Select value={form.move_in} onValueChange={(v) => set("move_in", v)}>
                    <SelectTrigger data-testid="select-movein" className="h-12 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{MOVE_INS.map((m) => <SelectItem key={m} value={m} data-testid={`movein-opt-${m}`}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </Field>
              <Field label="Flatmate gender preference" required>
                <div data-anim-field>
                  <Select value={form.flatmate_gender_pref} onValueChange={(v) => set("flatmate_gender_pref", v)}>
                    <SelectTrigger data-testid="select-genderpref" className="h-12 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{["Women only", "Men only", "Any"].map((g) => <SelectItem key={g} value={g} data-testid={`genderpref-opt-${g}`}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="rounded-xl bg-[#B8F2E6] px-4 py-3 font-display text-2xl font-bold text-[#2E3340]">How you live</h2>
              {SLIDERS.map((s) => (
                <div key={s.key} data-anim-field className="space-y-2">
                  <Label className="text-base font-semibold text-[#2E3340]">{s.label}</Label>
                  <div data-testid={`slider-${s.key}`}>
                    <FlatSlider value={form.lifestyle[s.key]} onChange={(v) => setSlider(s.key, v)} low={s.low} high={s.high} />
                  </div>
                </div>
              ))}
              <Field label="Smoking" required>
                <div data-anim-field className="flex flex-wrap gap-2">
                  {["No", "Outside only", "Yes"].map((v) => <Pill key={v} testId={`smoking-${v}`} active={form.smoking === v} onClick={() => set("smoking", v)}>{v}</Pill>)}
                </div>
              </Field>
              <Field label="Pets" required>
                <div data-anim-field className="flex flex-wrap gap-2">
                  {["Love them", "Fine with them", "No pets please"].map((v) => <Pill key={v} testId={`pets-${v}`} active={form.pets === v} onClick={() => set("pets", v)}>{v}</Pill>)}
                </div>
              </Field>
              <Field label="Non-negotiables">
                <div data-anim-field className="flex flex-wrap gap-2">
                  {NON_NEG.map((v) => <Pill key={v} testId={`nonneg-${v}`} active={form.non_negotiables.includes(v)} onClick={() => toggle("non_negotiables", v)}>{v}</Pill>)}
                </div>
              </Field>
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          {step > 0 ? (
            <button data-testid="back-btn" onClick={back} className="h-[60px] rounded-[6px] border-2 border-[#2E3340] bg-transparent px-6 font-semibold text-[#2E3340] transition-colors hover:bg-[#AED9E0]">
              Back
            </button>
          ) : <span />}
          {step < 2 ? (
            <button data-testid="next-btn" onClick={next} className="h-[60px] rounded-[6px] border-2 border-[#2E3340] bg-[#FFA69E] px-8 font-semibold text-[#2E3340] transition-transform duration-150 active:translate-y-[2px]" style={{ boxShadow: "4px 4px 0 #2E3340" }}>
              Next
            </button>
          ) : (
            <button
              data-testid="submit-btn"
              onClick={submit}
              disabled={submitting}
              className="relative h-[60px] overflow-hidden rounded-[6px] border-2 border-[#2E3340] bg-[#FFA69E] px-8 font-semibold text-[#2E3340] disabled:opacity-90"
              style={{ boxShadow: submitting ? "0 0 0 #2E3340" : "4px 4px 0 #2E3340" }}
            >
              {submitting && (
                <span className="absolute inset-0 -skew-x-12 bg-white/40 animate-[sweep_1s_linear_infinite]" />
              )}
              <span className="relative">
                {submitting ? `Scoring you against ${poolN ?? "the"} people\u2026` : "Show my top 5"}
              </span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
