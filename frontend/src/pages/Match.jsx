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
const FOODS = ["Vegetarian", "Eggetarian", "Non-vegetarian", "Vegetarian, fine with non-veg at home"];
const HABITS = ["Drinking", "420 friendly"];
const OKAY_WITH = ["Smoking", "Drinking", "420 friendly"];
const HAS_PET = ["None", "Cat", "Dog", "Other"];

// Client-side resize so a phone photo becomes a ~20KB square JPEG before it leaves the browser.
async function shrinkPhoto(file, size = 320) {
  const bmp = await createImageBitmap(file);
  const s = Math.min(bmp.width, bmp.height);
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const x = c.getContext("2d");
  x.imageSmoothingQuality = "high";
  x.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, size, size);
  return c.toDataURL("image/jpeg", 0.82);
}

const SLIDERS = [
  { key: "sleep", label: "Sleep schedule", low: "Early bird", high: "Night owl" },
  { key: "cleanliness", label: "Cleanliness", low: "Relaxed", high: "Spotless" },
  { key: "guests", label: "Guests and parties", low: "Rarely", high: "Often" },
  { key: "wfh", label: "Work from home", low: "Never", high: "Every day" },
  { key: "noise", label: "Noise at home", low: "Quiet", high: "Lively" },
  { key: "cooking", label: "Cooking", low: "Order in", high: "Cook daily" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DRAFT_KEY = "flatpal.form.v1";
const EMPTY_FORM = {
  first_name: "", age: "", gender: "", whatsapp: "", email: "", bio: "",
  areas: [], budget: "", move_in: "", flatmate_gender_pref: "",
  lifestyle: { sleep: 3, cleanliness: 3, guests: 3, wfh: 3, noise: 3, cooking: 3 },
  smoking: "", pets: "", non_negotiables: [],
  food: "", habits: [], okay_with: ["Drinking"], has_pet: "None", hometown: "", work: "", deal_breakers: "", photo: null,
};
const loadDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return { ...EMPTY_FORM, ...d, lifestyle: { ...EMPTY_FORM.lifestyle, ...(d.lifestyle || {}) } };
  } catch {
    return null;
  }
};
const saveDraft = (f) => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(f)); } catch {} };
const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch {} };

export const normalisePhone = (v) => {
  let d = String(v || "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
};
export const phoneError = (v) => {
  const d = normalisePhone(v);
  if (!d) return "Add your WhatsApp number.";
  if (d.length !== 10) return `Needs 10 digits, you have ${d.length}.`;
  if (!/^[6-9]/.test(d)) return "Indian mobile numbers start with 6, 7, 8 or 9.";
  if (/^(\d)\1{9}$/.test(d)) return "That does not look like a real number.";
  return null;
};
export const emailError = (v) => {
  const e = String(v || "").trim();
  if (!e) return "Add your email.";
  if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(e)) return "That email does not look right.";
  const typo = { "gmail.co": "gmail.com", "gmial.com": "gmail.com", "gmail.cm": "gmail.com", "yahoo.co": "yahoo.com", "hotmail.co": "hotmail.com" };
  const dom = e.split("@")[1].toLowerCase();
  if (typo[dom]) return `Did you mean ${e.split("@")[0]}@${typo[dom]}?`;
  return null;
};
const FieldError = ({ msg, id }) => msg ? <p id={id} data-testid={id} className="mt-1 text-sm font-medium text-[#B23A48]">{msg}</p> : null;

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
  const [form, setForm] = useState(() => loadDraft() || EMPTY_FORM);
  const [hadDraft] = useState(() => !!loadDraft());
  const [touched, setTouched] = useState({});
  const markTouched = (k) => setTouched((t) => ({ ...t, [k]: true }));
  const startFresh = () => { clearDraft(); setForm(EMPTY_FORM); setTouched({}); setStep(0); toast("Cleared. Starting fresh."); };

  useEffect(() => { saveDraft(form); }, [form]);

  const fieldErrors = {
    first_name: form.first_name.trim() ? null : "Add your first name.",
    age: (() => { const a = Number(form.age); if (!form.age) return "Add your age."; if (!Number.isInteger(a) || a < 18 || a > 45) return "FlatPal is for 18 to 45 right now."; return null; })(),
    gender: form.gender ? null : "Pick a gender.",
    whatsapp: phoneError(form.whatsapp),
    email: emailError(form.email),
  };
  const showErr = (k) => (touched[k] ? fieldErrors[k] : null);

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
    const order = ["first_name", "age", "gender", "whatsapp", "email"];
    const bad = order.find((k) => fieldErrors[k]);
    if (bad) {
      setTouched((t) => ({ ...t, first_name: true, age: true, gender: true, whatsapp: true, email: true }));
      return fieldErrors[bad];
    }
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
    if (!form.food) return "Pick your food preference.";
    if (!form.smoking) return "Pick your smoking preference.";
    if (!form.pets) return "Pick your pets preference.";
    if (form.has_pet !== "None" && form.pets === "No pets please") return "You have a pet but chose no pets. Pick one.";
    return null;
  };
  const [photoBusy, setPhotoBusy] = useState(false);
  const onPhoto = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("That is not an image.");
    if (f.size > 12 * 1024 * 1024) return toast.error("Photo is over 12MB. Pick a smaller one.");
    setPhotoBusy(true);
    try {
      const dataUrl = await shrinkPhoto(f);
      set("photo", dataUrl);
    } catch {
      toast.error("Could not read that photo. Try another.");
    } finally {
      setPhotoBusy(false);
      e.target.value = "";
    }
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
      const okay = [...form.okay_with];
      for (const h of form.habits) if (!okay.includes(h)) okay.push(h);
      if (form.smoking !== "No" && !okay.includes("Smoking")) okay.push("Smoking");
      // Non-negotiables are derived, not asked: strict veg means a veg kitchen, no-pets means no pets, not okay with smoke means no smoking indoors.
      const nonneg = [];
      if (form.food === "Vegetarian") nonneg.push("Vegetarian kitchen");
      if (form.pets === "No pets please") nonneg.push("No pets");
      if (!okay.includes("Smoking")) nonneg.push("No smoking indoors");
      const payload = { ...form, okay_with: okay, non_negotiables: nonneg, bio: form.bio || "", age: Number(form.age), whatsapp: normalisePhone(form.whatsapp), email: form.email.trim().toLowerCase() };
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

        {hadDraft && step === 0 && (
          <div className="mb-4 flex flex-col gap-2 rounded-xl border-2 border-[#2E3340] bg-[#B8F2E6] px-4 py-3 text-sm text-[#2E3340] sm:flex-row sm:items-center sm:justify-between" data-testid="draft-banner">
            <span className="font-semibold">Welcome back. We kept your answers from last time.</span>
            <button type="button" onClick={startFresh} data-testid="start-fresh" className="text-left font-semibold underline underline-offset-4">Start fresh</button>
          </div>
        )}
        <div ref={cardRef} className="space-y-6 rounded-2xl border hard bg-white p-6 sm:p-8">
          {step === 0 && (
            <>
              <div className="flex items-start justify-between gap-3">
                <h2 className="flex-1 rounded-xl bg-[#B8F2E6] px-4 py-3 font-display text-2xl font-bold text-[#2E3340]">About you</h2>
                <Link to="/sample" data-testid="match-sample-link" className="mt-1 shrink-0 text-sm font-medium text-[#2E3340] underline underline-offset-4 transition-opacity hover:opacity-70">
                  Just browsing? See a sample result
                </Link>
              </div>
              <Field label="First name" required><div data-anim-field><Input data-testid="input-first-name" value={form.first_name} onBlur={() => markTouched("first_name")} onChange={(e) => set("first_name", e.target.value)} placeholder="Your first name" className="h-12 rounded-xl" aria-invalid={!!showErr("first_name")} /><FieldError id="err-first-name" msg={showErr("first_name")} /></div></Field>
              <Field label="Age" required><div data-anim-field><Input data-testid="input-age" type="number" inputMode="numeric" min={18} max={45} value={form.age} onBlur={() => markTouched("age")} onChange={(e) => set("age", e.target.value)} placeholder="18 to 45" className="h-12 rounded-xl" aria-invalid={!!showErr("age")} /><FieldError id="err-age" msg={showErr("age")} /></div></Field>
              <Field label="Gender" required>
                <div data-anim-field>
                  <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                    <SelectTrigger data-testid="select-gender" className="h-12 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{["Woman", "Man", "Non-binary", "Prefer not to say"].map((g) => <SelectItem key={g} value={g} data-testid={`gender-opt-${g}`}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                  <FieldError id="err-gender" msg={showErr("gender")} />
                </div>
              </Field>
              <Field label="WhatsApp number" required>
                <div data-anim-field>
                  <div className="flex items-stretch">
                    <span className="flex items-center rounded-l-xl border-2 border-r-0 border-[#2E3340]/40 bg-[#FAF3DD] px-3 text-sm font-semibold text-[#2E3340]">+91</span>
                    <Input data-testid="input-whatsapp" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={16} value={form.whatsapp} onBlur={() => markTouched("whatsapp")} onChange={(e) => set("whatsapp", e.target.value.replace(/[^\d\s+-]/g, ""))} placeholder="10 digit mobile" className="h-12 rounded-l-none rounded-r-xl" aria-invalid={!!showErr("whatsapp")} />
                  </div>
                  <FieldError id="err-whatsapp" msg={showErr("whatsapp")} />
                  {!showErr("whatsapp") && <p className="mt-1 text-xs text-[#2E3340]/70">Only shared with your top matches, never shown publicly.</p>}
                </div>
              </Field>
              <Field label="Email" required><div data-anim-field><Input data-testid="input-email" type="email" inputMode="email" autoComplete="email" value={form.email} onBlur={() => markTouched("email")} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com" className="h-12 rounded-xl" aria-invalid={!!showErr("email")} /><FieldError id="err-email" msg={showErr("email")} /></div></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Hometown"><div data-anim-field><Input data-testid="input-hometown" maxLength={40} value={form.hometown} onChange={(e) => set("hometown", e.target.value)} placeholder="Optional" className="h-12 rounded-xl" /></div></Field>
                <Field label="What do you do"><div data-anim-field><Input data-testid="input-work" maxLength={60} value={form.work} onChange={(e) => set("work", e.target.value)} placeholder="Optional, e.g. Product designer at a startup" className="h-12 rounded-xl" /></div></Field>
              </div>
              <Field label="A photo of you">
                <div data-anim-field className="flex items-center gap-4">
                  {form.photo ? (
                    <img src={form.photo} alt="Your photo" data-testid="photo-preview" className="h-16 w-16 rounded-xl border-2 border-[#2E3340] object-cover" />
                  ) : (
                    <span className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-[#2E3340]/40 text-xs text-[#2E3340]/60">No photo</span>
                  )}
                  <div className="flex flex-col gap-1">
                    <label className="inline-flex w-fit cursor-pointer items-center rounded-[6px] border-2 border-[#2E3340] bg-[#FAF3DD] px-4 py-2 text-sm font-semibold text-[#2E3340] hover:bg-[#B8F2E6]">
                      {photoBusy ? "Resizing..." : form.photo ? "Change photo" : "Add a photo"}
                      <input type="file" accept="image/*" data-testid="input-photo" className="hidden" onChange={onPhoto} />
                    </label>
                    {form.photo && <button type="button" data-testid="remove-photo" onClick={() => set("photo", null)} className="w-fit text-xs font-medium underline underline-offset-4">Remove</button>}
                    <p className="text-xs text-[#2E3340]/70">Optional. Shown only to your top matches, never public. Profiles with a photo get replied to more.</p>
                  </div>
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
              <p className="text-sm text-[#2E3340]/70">Six sliders, then a few taps. Leave a slider in the middle if you are unsure, middle is neutral.</p>
              {SLIDERS.map((s) => (
                <div key={s.key} data-anim-field className="space-y-2">
                  <Label className="text-base font-semibold text-[#2E3340]">{s.label}</Label>
                  <div data-testid={`slider-${s.key}`}>
                    <FlatSlider value={form.lifestyle[s.key]} onChange={(v) => setSlider(s.key, v)} low={s.low} high={s.high} />
                  </div>
                </div>
              ))}
              <Field label="Food" required>
                <div data-anim-field className="flex flex-wrap gap-2">
                  {FOODS.map((v) => <Pill key={v} testId={`food-${v}`} active={form.food === v} onClick={() => set("food", v)}>{v}</Pill>)}
                </div>
              </Field>
              <Field label="Smoking" required>
                <div data-anim-field className="flex flex-wrap gap-2">
                  {["No", "Outside only", "Yes"].map((v) => <Pill key={v} testId={`smoking-${v}`} active={form.smoking === v} onClick={() => set("smoking", v)}>{v}</Pill>)}
                </div>
              </Field>
              <Field label="You (tick what applies)">
                <div data-anim-field className="flex flex-wrap gap-2">
                  {HABITS.map((v) => <Pill key={v} testId={`habit-${v}`} active={form.habits.includes(v)} onClick={() => toggle("habits", v)}>{v === "Drinking" ? "I drink" : "I am 420 friendly"}</Pill>)}
                </div>
              </Field>
              <Field label="Okay with flatmates who">
                <div data-anim-field>
                  <div className="flex flex-wrap gap-2">
                    {OKAY_WITH.map((v) => <Pill key={v} testId={`okay-${v}`} active={form.okay_with.includes(v)} onClick={() => toggle("okay_with", v)}>{{ Smoking: "Smoke", Drinking: "Drink", "420 friendly": "Are 420 friendly" }[v]}</Pill>)}
                  </div>
                  <p className="mt-1 text-xs text-[#2E3340]/70">Untick anything that is a no for you. We only match you with people whose habits you are okay with, and the other way round.</p>
                </div>
              </Field>
              <Field label="Pets" required>
                <div data-anim-field className="flex flex-wrap gap-2">
                  {["Love them", "Fine with them", "No pets please"].map((v) => <Pill key={v} testId={`pets-${v}`} active={form.pets === v} onClick={() => set("pets", v)}>{v}</Pill>)}
                </div>
              </Field>
              <Field label="Do you have a pet">
                <div data-anim-field className="flex flex-wrap gap-2">
                  {HAS_PET.map((v) => <Pill key={v} testId={`haspet-${v}`} active={form.has_pet === v} onClick={() => set("has_pet", v)}>{v === "None" ? "No pet" : v}</Pill>)}
                </div>
              </Field>
              <Field label="Deal breakers, pet peeves, anything a flatmate should know">
                <div data-anim-field>
                  <textarea data-testid="input-dealbreakers" maxLength={240} rows={3} value={form.deal_breakers} onChange={(e) => set("deal_breakers", e.target.value)} placeholder="Optional. e.g. Dishes done same day. No loud calls after 11. Someone who says hi in the mornings." className="w-full rounded-xl border-2 border-[#2E3340]/40 bg-white px-3 py-2 text-base text-[#2E3340] focus:border-[#2E3340] focus:outline-none" />
                  <p className="mt-1 text-xs text-[#2E3340]">{form.deal_breakers.length}/240</p>
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
