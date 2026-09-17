// Port of backend/matching.py. Used only by the backend-free preview build. Keep in sync.
const BUDGETS = ["under 10k", "10k to 15k", "15k to 20k", "20k to 30k", "30k+"];
const MOVE_INS = ["ASAP", "within a month", "1 to 3 months", "just exploring"];
const PETS = ["Love them", "Fine with them", "No pets please"];
const KEYS = ["sleep", "cleanliness", "guests", "wfh", "noise", "cooking"];
const WEIGHTS = { cleanliness: 0.25, sleep: 0.2, guests: 0.15, noise: 0.15, wfh: 0.15, cooking: 0.1 };
const SMOKE = { "No|No": 1, "Outside only|Outside only": 1, "Yes|Yes": 1, "No|Outside only": 0.6, "No|Yes": 0.2, "Outside only|Yes": 0.7 };
const FOOD = {
  "Vegetarian|Non-vegetarian": 0.15, "Vegetarian|Eggetarian": 0.6, "Vegetarian|Vegetarian, fine with non-veg at home": 0.9,
  "Eggetarian|Non-vegetarian": 0.8, "Eggetarian|Vegetarian, fine with non-veg at home": 0.85, "Non-vegetarian|Vegetarian, fine with non-veg at home": 0.8,
};
const ALL_OKAY = ["Smoking", "Drinking", "420 friendly"];
const foodOf = (p) => p.food || null;
const habitsOf = (p) => p.habits || [];
const okayOf = (p) => (p.okay_with == null ? ALL_OKAY : p.okay_with);
const petOf = (p) => p.has_pet || "None";
const foodScore = (a, b) => (!a || !b ? 0.7 : a === b ? 1 : FOOD[`${a}|${b}`] ?? FOOD[`${b}|${a}`] ?? 0.5);

const smokeScore = (a, b) => SMOKE[`${a}|${b}`] ?? SMOKE[`${b}|${a}`] ?? 0.5;
const wants = (pref, gender) => (pref === "Women only" ? gender === "Woman" : pref === "Men only" ? gender === "Man" : true);
const genderOk = (u, c) => wants(u.flatmate_gender_pref, c.gender) && wants(c.flatmate_gender_pref, u.gender);
const budgetOk = (a, b) => Math.abs(BUDGETS.indexOf(a) - BUDGETS.indexOf(b)) <= 1;
const nnCheck = (holder, other) => {
  const nn = holder.non_negotiables || [];
  if (nn.includes("No smoking indoors") && other.smoking === "Yes") return false;
  if (nn.includes("No pets") && (other.pets === "Love them" || petOf(other) !== "None")) return false;
  if (nn.includes("Vegetarian kitchen") && foodOf(other) === "Non-vegetarian") return false;
  return true;
};
const habitCheck = (doer, other) => {
  const ok = okayOf(other);
  if (doer.smoking === "Yes" && !ok.includes("Smoking")) return false;
  for (const h of habitsOf(doer)) if (!ok.includes(h)) return false;
  if (petOf(doer) !== "None" && other.pets === "No pets please") return false;
  return true;
};
const passes = (u, c, relax = null) => {
  if (c.id === u.id || !genderOk(u, c)) return false;
  if (relax !== "area" && !u.areas.some((a) => c.areas.includes(a))) return false;
  if (relax === null && !budgetOk(u.budget, c.budget)) return false;
  if (relax !== null && Math.abs(BUDGETS.indexOf(u.budget) - BUDGETS.indexOf(c.budget)) > 2) return false;
  return nnCheck(u, c) && nnCheck(c, u) && habitCheck(u, c) && habitCheck(c, u);
};

const petsScore = (a, b) => (a === b ? 1 : Math.abs(PETS.indexOf(a) - PETS.indexOf(b)) === 1 ? 0.6 : 0.1);
const moveScore = (a, b) => (a === b ? 1 : Math.abs(MOVE_INS.indexOf(a) - MOVE_INS.indexOf(b)) === 1 ? 0.7 : 0.4);

function softScore(u, c) {
  const sims = {};
  KEYS.forEach((k) => (sims[k] = 1 - Math.abs(u.lifestyle[k] - c.lifestyle[k]) / 4));
  const lifestyle = KEYS.reduce((s, k) => s + WEIGHTS[k] * sims[k], 0);
  let smoke = smokeScore(u.smoking, c.smoking);
  if (u.smoking === "Outside only" && !okayOf(c).includes("Smoking")) smoke = Math.min(smoke, 0.4);
  if (c.smoking === "Outside only" && !okayOf(u).includes("Smoking")) smoke = Math.min(smoke, 0.4);
  const final = 100 * (0.65 * lifestyle + 0.1 * smoke + 0.1 * petsScore(u.pets, c.pets) + 0.05 * moveScore(u.move_in, c.move_in) + 0.1 * foodScore(foodOf(u), foodOf(c)));
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
  const fu = foodOf(u), fc = foodOf(c);
  if (fu && fu === fc) cands.push([0.88, { Vegetarian: "Both vegetarian", Eggetarian: "Both eggetarian", "Non-vegetarian": "Both non-vegetarian", "Vegetarian, fine with non-veg at home": "Both veg, both easy about the kitchen" }[fu]]);
  const hu = habitsOf(u), hc = habitsOf(c);
  if (hu.includes("Drinking") && hc.includes("Drinking")) cands.push([0.7, "Both enjoy a drink"]);
  if (hu.includes("420 friendly") && hc.includes("420 friendly")) cands.push([0.72, "Both 420 friendly"]);
  if (petOf(c) !== "None" && u.pets === "Love them") cands.push([0.82, `They have a ${petOf(c).toLowerCase()} and you love pets`]);
  if (petOf(u) !== "None" && c.pets === "Love them") cands.push([0.82, `They would love your ${petOf(u).toLowerCase()}`]);
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
  const fu = foodOf(u), fc = foodOf(c);
  const pair = new Set([fu, fc]);
  if (pair.size === 2 && pair.has("Vegetarian") && pair.has("Non-vegetarian")) return "Heads up: one of you is vegetarian, the other is not. Talk kitchen rules early";
  if (pair.size === 2 && pair.has("Vegetarian") && pair.has("Eggetarian")) return "Heads up: one of you is vegetarian, the other eats eggs";
  if ((fu === "Vegetarian, fine with non-veg at home" && fc === "Non-vegetarian") || (fc === "Vegetarian, fine with non-veg at home" && fu === "Non-vegetarian")) return "Heads up: mixed kitchen, veg and non-veg";
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
  const ov = u.areas.find((a) => c.areas.includes(a));
  if (ov) e.push(`Both want ${ov}`);
  e.push("Similar lifestyle overall");
  return e;
}

export function rankMatches(user, pool, limit = 5) {
  const candidates = pool.filter((c) => !c.is_sample);
  const passing = candidates.filter((c) => passes(user, c));
  const stretch = {};
  const ids = new Set(passing.map((c) => c.id));
  if (passing.length < limit) for (const c of candidates) if (!ids.has(c.id) && passes(user, c, "budget")) { passing.push(c); ids.add(c.id); stretch[c.id] = "budget"; }
  if (passing.length < limit) for (const c of candidates) if (!ids.has(c.id) && passes(user, c, "area")) { passing.push(c); ids.add(c.id); stretch[c.id] = "area"; }
  const exactPassing = passing.filter((c) => !stretch[c.id]).length;
  const scored = passing.map((c) => {
    const [score, sims] = softScore(user, c);
    const overlap = user.areas.filter((a) => c.areas.includes(a));
    const tier = !stretch[c.id] ? 0 : stretch[c.id] === "budget" ? 1 : 2;
    return { tier, score, n: overlap.length, c, sims, overlap };
  });
  scored.sort((a, b) => a.tier - b.tier || b.score - a.score || b.n - a.n || (a.c.first_name < b.c.first_name ? -1 : a.c.first_name > b.c.first_name ? 1 : 0));
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
      budget: c.budget, move_in: c.move_in, bio: c.bio || "", hometown: c.hometown || "", work: c.work || "",
      food: foodOf(c), habits: [...habitsOf(c)].sort(), has_pet: petOf(c), deal_breakers: c.deal_breakers || "", photo: c.photo || null,
      is_demo: !!c.is_demo, whatsapp: c.is_demo ? null : c.whatsapp, score, reasons, friction: buildFriction(user, c), stretch: stretch[c.id] || null,
    };
  });
  return [matches, exactPassing];
}
