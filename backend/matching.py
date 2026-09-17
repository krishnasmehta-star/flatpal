"""FlatPal matching engine. Pure functions, no I/O."""
import math

BUDGETS = ["under 10k", "10k to 15k", "15k to 20k", "20k to 30k", "30k+"]
MOVE_INS = ["ASAP", "within a month", "1 to 3 months", "just exploring"]
SMOKING = ["No", "Outside only", "Yes"]
PETS = ["Love them", "Fine with them", "No pets please"]
LIFESTYLE_KEYS = ["sleep", "cleanliness", "guests", "wfh", "noise", "cooking"]
WEIGHTS = {"cleanliness": 0.25, "sleep": 0.20, "guests": 0.15, "noise": 0.15, "wfh": 0.15, "cooking": 0.10}

SMOKE_SCORE = {
    ("No", "No"): 1.0, ("Outside only", "Outside only"): 1.0, ("Yes", "Yes"): 1.0,
    ("No", "Outside only"): 0.6, ("No", "Yes"): 0.2, ("Outside only", "Yes"): 0.7,
}


def _sym(table, a, b, default):
    return table.get((a, b), table.get((b, a), default))


def gender_ok(user, cand):
    """Mutual gender preference check."""
    def wants(pref, gender):
        if pref == "Women only":
            return gender == "Woman"
        if pref == "Men only":
            return gender == "Man"
        return True
    return wants(user["flatmate_gender_pref"], cand["gender"]) and wants(cand["flatmate_gender_pref"], user["gender"])


def budget_ok(a, b):
    ia, ib = BUDGETS.index(a), BUDGETS.index(b)
    return abs(ia - ib) <= 1


def nonneg_ok(user, cand):
    def check(holder, other):
        nn = holder.get("non_negotiables") or []
        if "No smoking indoors" in nn and other["smoking"] == "Yes":
            return False
        if "No pets" in nn and other["pets"] == "Love them":
            return False
        return True
    return check(user, cand) and check(cand, user)


def passes_hard_filters(user, cand):
    if cand["id"] == user["id"]:
        return False
    if not gender_ok(user, cand):
        return False
    if not set(user["areas"]) & set(cand["areas"]):
        return False
    if not budget_ok(user["budget"], cand["budget"]):
        return False
    if not nonneg_ok(user, cand):
        return False
    return True


def pets_score(a, b):
    if a == b:
        return 1.0
    ia, ib = PETS.index(a), PETS.index(b)
    return 0.6 if abs(ia - ib) == 1 else 0.1


def move_in_score(a, b):
    if a == b:
        return 1.0
    ia, ib = MOVE_INS.index(a), MOVE_INS.index(b)
    return 0.7 if abs(ia - ib) == 1 else 0.4


def soft_score(user, cand):
    ul, cl = user["lifestyle"], cand["lifestyle"]
    sims = {k: 1 - abs(ul[k] - cl[k]) / 4 for k in LIFESTYLE_KEYS}
    lifestyle = sum(WEIGHTS[k] * sims[k] for k in LIFESTYLE_KEYS)
    smoke = _sym(SMOKE_SCORE, user["smoking"], cand["smoking"], 0.5)
    pets = pets_score(user["pets"], cand["pets"])
    move = move_in_score(user["move_in"], cand["move_in"])
    final = 100 * (0.70 * lifestyle + 0.10 * smoke + 0.10 * pets + 0.10 * move)
    return int(math.floor(final + 0.5)), sims  # half-up, matches JS Math.round


# Value-specific reason phrasing. Each entry: (key, predicate on (a,b), text)
def _both_high(a, b):
    return a >= 4 and b >= 4


def _both_low(a, b):
    return a <= 2 and b <= 2


SLIDER_REASONS = {
    "sleep": [(_both_high, "Both night owls"), (_both_low, "Both early birds")],
    "cleanliness": [(_both_high, "Both keep it spotless"), (_both_low, "Both relaxed about mess")],
    "guests": [(_both_high, "Both love hosting"), (_both_low, "Both prefer a quiet flat")],
    "wfh": [(_both_high, "Both work from home most days"), (_both_low, "Both out at the office")],
    "noise": [(_both_high, "Both like a lively home"), (_both_low, "Both like it quiet")],
    "cooking": [(_both_high, "Both cook most days"), (_both_low, "Both order in")],
}

FRICTION = {
    "sleep": ("Heads up: they sleep much later than you", "Heads up: they are up much earlier than you"),
    "cleanliness": ("Heads up: they are much tidier than you", "Heads up: they are more relaxed about mess than you"),
    "guests": ("Heads up: they host more often than you do", "Heads up: they host far less than you do"),
    "wfh": ("Heads up: they are home a lot more than you", "Heads up: they are out a lot more than you"),
    "noise": ("Heads up: they like a livelier home than you", "Heads up: they want it quieter than you"),
    "cooking": ("Heads up: they cook far more than you", "Heads up: they cook far less than you"),
}


def build_reasons(user, cand, sims, overlap):
    """Return up to 3 value-specific reasons, avoiding neutral middle values."""
    cands = []
    ul, cl = user["lifestyle"], cand["lifestyle"]
    # Rank slider reasons by weighted similarity, only when both sit at an end
    for k in sorted(LIFESTYLE_KEYS, key=lambda k: -WEIGHTS[k] * sims[k]):
        for pred, text in SLIDER_REASONS[k]:
            if pred(ul[k], cl[k]):
                cands.append((WEIGHTS[k] * sims[k] + 1.0, text))
                break
    if overlap:
        if len(overlap) == 1:
            cands.append((0.95, f"Both want {overlap[0]}"))
        else:
            cands.append((0.98, f"Both want {overlap[0]} or {overlap[1]}"))
    if user["budget"] == cand["budget"]:
        cands.append((0.9, "Same budget range"))
    if user["move_in"] == cand["move_in"]:
        cands.append((0.85, "Same move-in timing"))
    if user["smoking"] == "No" and cand["smoking"] == "No":
        cands.append((0.8, "Neither of you smokes"))
    if user["pets"] == cand["pets"]:
        pet_text = {"Love them": "Both love pets", "Fine with them": "Both fine with pets", "No pets please": "Both prefer no pets"}[user["pets"]]
        cands.append((0.78, pet_text))
    # Fallback: similar-but-neutral slider phrasing, only if we still lack reasons
    if len(cands) < 3:
        for k in sorted(LIFESTYLE_KEYS, key=lambda k: -sims[k]):
            if sims[k] >= 0.75 and not any(SLIDER_REASONS[k][0][1] == t or SLIDER_REASONS[k][1][1] == t for _, t in cands):
                label = {"sleep": "Similar sleep schedules", "cleanliness": "Similar cleanliness standards", "guests": "Similar take on guests", "wfh": "Similar WFH rhythm", "noise": "Similar noise levels", "cooking": "Similar cooking habits"}[k]
                cands.append((0.5 + sims[k] * 0.1, label))
    cands.sort(key=lambda x: -x[0])
    out = []
    for _, t in cands:
        if t not in out:
            out.append(t)
        if len(out) == 3:
            break
    return out


def build_friction(user, cand):
    ul, cl = user["lifestyle"], cand["lifestyle"]
    worst, worst_gap = None, 0
    for k in LIFESTYLE_KEYS:
        gap = cl[k] - ul[k]
        if abs(gap) >= 3 and abs(gap) > abs(worst_gap):
            worst, worst_gap = k, gap
    if not worst:
        return None
    hi, lo = FRICTION[worst]
    return hi if worst_gap > 0 else lo


def rank_matches(user, pool, limit=5):
    passing = [c for c in pool if not c.get("is_sample") and passes_hard_filters(user, c)]
    scored = []
    for c in passing:
        score, sims = soft_score(user, c)
        overlap = [a for a in user["areas"] if a in c["areas"]]
        scored.append((score, len(overlap), c, sims, overlap))
    scored.sort(key=lambda x: (-x[0], -x[1], x[2]["first_name"]))
    results = []
    seen = {}
    for score, _, c, sims, overlap in scored[:limit]:
        reasons = build_reasons(user, c, sims, overlap)
        key = tuple(reasons)
        if seen.get(key, 0) >= 2 and len(reasons) == 3:
            for r in _extra_reasons(user, c):
                if r not in reasons:
                    reasons = [reasons[1], reasons[2], r]
                    break
            key = tuple(reasons)
        seen[key] = seen.get(key, 0) + 1
        results.append({
            "id": c["id"],
            "first_name": c["first_name"],
            "age": c["age"],
            "gender": c["gender"],
            "areas": c["areas"],
            "overlap_areas": overlap,
            "budget": c["budget"],
            "move_in": c["move_in"],
            "bio": c.get("bio", ""),
            "is_demo": bool(c.get("is_demo")),
            "whatsapp": None if c.get("is_demo") else c.get("whatsapp"),
            "score": score,
            "reasons": reasons,
            "friction": build_friction(user, c),
        })
    return results, len(passing)


def _extra_reasons(user, cand):
    """Secondary phrasings used only to break up repeated reason sets."""
    extras = []
    if user["move_in"] == cand["move_in"]:
        extras.append("Same move-in timing")
    if user["smoking"] == cand["smoking"]:
        extras.append({"No": "Neither of you smokes", "Outside only": "Both smoke outside only", "Yes": "Both smokers"}[user["smoking"]])
    if user["budget"] == cand["budget"]:
        extras.append("Same budget range")
    if abs(user["age"] - cand["age"]) <= 2:
        extras.append("Around the same age")
    extras.append(f"Both want {[a for a in user['areas'] if a in cand['areas']][0]}")
    return extras
