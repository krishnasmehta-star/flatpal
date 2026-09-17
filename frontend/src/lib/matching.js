// Port of backend/matching.py. Used only by the backend-free preview build. Keep in sync.
const BUDGETS = ["under 10k", "10k to 15k", "15k to 20k", "20k to 30k", "30k+"];
const MOVE_INS = ["ASAP", "within a month", "1 to 3 months", "just exploring"];
const PETS = ["Love them", "Fine with them", "No pets please"];
const KEYS = ["sleep", "cleanliness", "guests", "wfh", "noise", "cooking"];
const WEIGHTS = { cleanliness: 0.25, sleep: 0.2, guests: 0.15, noise: 0.15, wfh: 0.15, cooking: 0.1 };
const SMOKE = { "No|No": 1, "Outside only|Outside only": 1, "Yes|Yes": 1, "No|Outside only": 0.6, "No|Yes": 0.2, "Outside only|Yes": 0.7 };

const smokeScore = (a, b) => SMOKE[`${a}|${b}`] ?? SMOKE[`${b}|${a}`] ?? 0.5;
const wants = (pref, gender) => (pref === "Women only" ? gender === "Woman" : pref === "Men only" ? gender === "Man" : true);
const genderOk = (u, c) => wants(u.flatmate_gender_pref, c.gender) && wants(c.flatmate_gender_pref, u.gender);
const budgetOk = (a, b) => Math.abs(BUDGETS.indexOf(a) - BUDGETS.indexOf(b)) <= 1;
const nnCheck = (holder, other) => {
  const nn = holder.non_negotiables || [];
  if (nn.includes("No smoking indoors") && other.smoking === "Yes") return false;
  if (nn.includes("No pets") && other.pets === "Love them") return false;
  return true;
};
const passes = (u, c) =>
  c.id !== u.id && genderOk(u, c) && u.areas.some((a) => c.areas.includes(a)) && budgetOk(u.budget, c.budget) && nnCheck(u, c) && nnCheck(c, u);

const petsScore = (a, b) => (a === b ? 1 : Math.abs(PETS.indexOf(a) - PETS.indexOf(b)) === 1 ? 0.6 : 0.1);
const moveScore = (a, b) => (a === b ? 1 : Math.abs(MOVE_INS.indexOf(a) - MOVE_INS.indexOf(b)) === 1 ? 0.7 : 0.4);

function softScore(u, c) {
  const sims = {};
  KEYS.forEach((k) => (sims[k] = 1 - Math.abs(u.lifestyle[k] - c.lifestyle[k]) / 4));
  const lifestyle = KEYS.reduce((s, k) => s + WEIGHTS[k] * sims[k], 0);
  const final = 100 * (0.7 * lifestyle + 0.1 * smokeScore(u.smoking, c.smoking) + 0.1 * petsScore(u.pets, c.pets) + 0.1 * moveScore(u.move_in, c.move_in));
  return [Math.round(final), sims];
}

const bothHigh = (a, b) => a >= 4 && b >= 4;
const bothLow = (a, b) => a <= 2 && b <= 2;
const SLIDER_REASONS = {
  sleep: [[bothHigh, "Both night owls"], [bothLow, "Both early birds"]],
  cleanliness: [[bothHigh, "Both keep it spotless"], [bothLow, "Both relaxed about mess"]],
  guests: [[bothHigh, "Both love hosting"], [bothLow, "Both prefer a quiet flat"]],
  wfh: [[bothHigh, "Both work from home most days"], [bothLow, "Both out at the office"]],
  noise: [[bothHigh, "Both like a lively home"], [bothLow, "Both like it quiet"]],
  cooking: [[bothHigh, "Both cook most days"], [bothLow, "Both order in"]],
};
const SIMILAR = { sleep: "Similar sleep schedules", cleanliness: "Similar cleanliness standards", guests: "Similar take on guests", wfh: "Similar WFH rhythm", noise: "Similar noise levels", cooking: "Similar cooking habits" };
const FRICTION = {
  sleep: ["Heads up: they sleep much later than you", "Heads up: they are up much earlier than you"],
  cleanliness: ["Heads up: they are much tidier than you", "Heads up: they are more relaxed about mess than you"],
  guests: ["Heads up: they host more often than you do", "Heads up: they host far less than you do"],
  wfh: ["Heads up: they are home a lot more than you", "Heads up: they are out a lot more than you"],
  noise: ["Heads up: they like a livelier home than you", "Heads up: they want it quieter than you"],
  cooking: ["Heads up: they cook far more than you", "Heads up: they cook far less than you"],
};

function buildReasons(u, c, sims, overlap) {
  const cands = [];
  const keys = [...KEYS].sort((a, b) => WEIGHTS[b] * sims[b] - WEIGHTS[a] * sims[a]);
  for (const k of keys) {
    for (const [pred, text] of SLIDER_REASONS[k]) {
      if (pred(u.lifestyle[k], c.lifestyle[k])) { cands.push([WEIGHTS[k] * sims[k] + 1, text]); break; }
    }
  }
  if (overlap.length) cands.push(overlap.length === 1 ? [0.95, `Both want ${overlap[0]}`] : [0.98, `Both want ${overlap[0]} or ${overlap[1]}`]);
  if (u.budget === c.budget) cands.push([0.9, "Same budget range"]);
  if (u.move_in === c.move_in) cands.push([0.85, "Same move-in timing"]);
  if (u.smoking === "No" && c.smoking === "No") cands.push([0.8, "Neither of you smokes"]);
  if (u.pets === c.pets) cands.push([0.78, { "Love them": "Both love pets", "Fine with them": "Both fine with pets", "No pets please": "Both prefer no pets" }[u.pets]]);
  if (cands.length < 3) {
    for (const k of [...KEYS].sort((a, b) => sims[b] - sims[a])) {
      const used = cands.some(([, t]) => SLIDER_REASONS[k].some(([, tt]) => tt === t));
      if (sims[k] >= 0.75 && !used) cands.push([0.5 + sims[k] * 0.1, SIMILAR[k]]);
    }
  }
  cands.sort((a, b) => b[0] - a[0]);
  const out = [];
  for (const [, t] of cands) { if (!out.includes(t)) out.push(t); if (out.length === 3) break; }
  return out;
}

function buildFriction(u, c) {
  let worst = null, gap = 0;
  for (const k of KEYS) {
    const g = c.lifestyle[k] - u.lifestyle[k];
    if (Math.abs(g) >= 3 && Math.abs(g) > Math.abs(gap)) { worst = k; gap = g; }
  }
  if (!worst) return null;
  return gap > 0 ? FRICTION[worst][0] : FRICTION[worst][1];
}

function extraReasons(u, c) {
  const e = [];
  if (u.move_in === c.move_in) e.push("Same move-in timing");
  if (u.smoking === c.smoking) e.push({ No: "Neither of you smokes", "Outside only": "Both smoke outside only", Yes: "Both smokers" }[u.smoking]);
  if (u.budget === c.budget) e.push("Same budget range");
  if (Math.abs(u.age - c.age) <= 2) e.push("Around the same age");
  e.push(`Both want ${u.areas.find((a) => c.areas.includes(a))}`);
  return e;
}

export function rankMatches(user, pool, limit = 5) {
  const passing = pool.filter((c) => !c.is_sample && passes(user, c));
  const scored = passing.map((c) => {
    const [score, sims] = softScore(user, c);
    const overlap = user.areas.filter((a) => c.areas.includes(a));
    return { score, n: overlap.length, c, sims, overlap };
  });
  scored.sort((a, b) => b.score - a.score || b.n - a.n || a.c.first_name.localeCompare(b.c.first_name));
  const seen = new Map();
  const matches = scored.slice(0, limit).map(({ score, c, sims, overlap }) => {
    let reasons = buildReasons(user, c, sims, overlap);
    let key = reasons.join("|");
    if ((seen.get(key) || 0) >= 2 && reasons.length === 3) {
      const r = extraReasons(user, c).find((x) => !reasons.includes(x));
      if (r) reasons = [reasons[1], reasons[2], r];
      key = reasons.join("|");
    }
    seen.set(key, (seen.get(key) || 0) + 1);
    return {
      id: c.id, first_name: c.first_name, age: c.age, gender: c.gender, areas: c.areas, overlap_areas: overlap,
      budget: c.budget, move_in: c.move_in, bio: c.bio || "", is_demo: !!c.is_demo,
      whatsapp: c.is_demo ? null : c.whatsapp, score, reasons, friction: buildFriction(user, c),
    };
  });
  return [matches, passing.length];
}
