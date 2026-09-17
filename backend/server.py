"""FlatPal API. FastAPI + MongoDB (falls back to a JSON file store when MONGO_URL is unset)."""
import json
import os
import random
import time
import uuid
from collections import defaultdict, deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Literal, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field, field_validator

from matching import rank_matches
from seed import AREAS, BUDGETS, MOVE_INS, GENDERS, PREFS, SMOKING, PETS, NON_NEG, FOODS, HABITS, OKAY_WITH, HAS_PET, generate_demo_pool, sample_personas

MONGO_URL = (
    os.environ.get("MONGO_URL")
    or os.environ.get("MONGODB_URI")
    or next((v for k, v in os.environ.items() if k.endswith("MONGODB_URI") and v), None)
)
DB_NAME = os.environ.get("DB_NAME", "flatpal")
_default_data = "/tmp/flatpal-profiles.json" if os.environ.get("VERCEL") else "data/profiles.json"
DATA_FILE = Path(os.environ.get("DATA_FILE", _default_data))
ALLOWED_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",")]


# ---------- storage ----------
class FileStore:
    def __init__(self, path: Path):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._data: Dict[str, dict] = {}
        if self.path.exists():
            self._data = {p["id"]: p for p in json.loads(self.path.read_text())}

    def _flush(self):
        self.path.write_text(json.dumps(list(self._data.values())))

    async def count(self):
        return len(self._data)

    async def insert_many(self, docs):
        for d in docs:
            self._data[d["id"]] = d
        self._flush()

    async def insert(self, doc):
        self._data[doc["id"]] = doc
        self._flush()

    async def get(self, pid):
        return self._data.get(pid)

    async def all(self):
        return list(self._data.values())

    async def samples(self):
        return [p for p in self._data.values() if p.get("is_sample")]

    async def delete_where(self, **kw):
        ids = [k for k, v in self._data.items() if all(v.get(a) == b for a, b in kw.items())]
        for k in ids:
            del self._data[k]
        self._flush()
        return len(ids)

    async def delete_stale_tests(self, before_iso):
        ids = [k for k, v in self._data.items() if v.get("is_test") and (v.get("created_at") or "") < before_iso]
        for k in ids:
            del self._data[k]
        if ids:
            self._flush()
        return len(ids)


class MongoStore:
    def __init__(self, url, db):
        from motor.motor_asyncio import AsyncIOMotorClient
        self.col = AsyncIOMotorClient(url)[db]["profiles"]

    async def count(self):
        return await self.col.count_documents({})

    async def insert_many(self, docs):
        await self.col.insert_many([dict(d) for d in docs])

    async def insert(self, doc):
        await self.col.insert_one(dict(doc))

    async def get(self, pid):
        return await self.col.find_one({"id": pid}, {"_id": 0})

    async def all(self):
        return await self.col.find({}, {"_id": 0}).to_list(length=10000)

    async def samples(self):
        return await self.col.find({"is_sample": True}, {"_id": 0}).to_list(length=50)

    async def delete_where(self, **kw):
        r = await self.col.delete_many(kw)
        return r.deleted_count

    async def delete_stale_tests(self, before_iso):
        r = await self.col.delete_many({"is_test": True, "created_at": {"$lt": before_iso}})
        return r.deleted_count


store = MongoStore(MONGO_URL, DB_NAME) if MONGO_URL else FileStore(DATA_FILE)

# ---------- app ----------
app = FastAPI(title="FlatPal API")
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_methods=["*"], allow_headers=["*"])

SEED_VERSION = 4


import asyncio

_seeded = False
_seed_lock = asyncio.Lock()


@app.middleware("http")
async def ensure_seeded(request: Request, call_next):
    # Serverless hosts may skip ASGI startup events, so seed lazily on the first request instead.
    global _seeded
    if not _seeded:
        async with _seed_lock:
            if not _seeded:
                await seed()
                _seeded = True
    return await call_next(request)


TEST_DOMAINS = ("@example.com", "@example.org", "@test.com")


def is_test_email(e: str) -> bool:
    return str(e or "").lower().endswith(TEST_DOMAINS)


async def seed():
    existing = await store.all()
    # Test profiles (example.com style emails) never surface for real members. Purge ones older than a day.
    from datetime import timedelta
    cutoff = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    legacy = [p for p in existing if not p.get("is_demo") and not p.get("is_sample") and not p.get("is_test") and is_test_email(p.get("email"))]
    for p in legacy:
        await store.delete_where(id=p["id"])
    await store.delete_stale_tests(cutoff)
    existing = [p for p in existing if p not in legacy]
    demo_v = [p for p in existing if p.get("is_demo") and p.get("seed_version") == SEED_VERSION]
    if not demo_v:
        # Replace any older demo pool (v1 had 25 profiles) but keep real users.
        await store.delete_where(is_demo=True)
        docs = generate_demo_pool() + sample_personas()
        for d in docs:
            d["seed_version"] = SEED_VERSION
        await store.insert_many(docs)


# ---------- rate limit ----------
_hits: Dict[str, deque] = defaultdict(deque)


def rate_limited(ip: str, limit=10, window=3600):
    now = time.time()
    q = _hits[ip]
    while q and now - q[0] > window:
        q.popleft()
    if len(q) >= limit:
        return True
    q.append(now)
    return False


# ---------- models ----------
class Lifestyle(BaseModel):
    sleep: int = Field(ge=1, le=5)
    cleanliness: int = Field(ge=1, le=5)
    guests: int = Field(ge=1, le=5)
    wfh: int = Field(ge=1, le=5)
    noise: int = Field(ge=1, le=5)
    cooking: int = Field(ge=1, le=5)


class ProfileIn(BaseModel):
    first_name: str = Field(min_length=1, max_length=40)
    age: int = Field(ge=18, le=45)
    gender: Literal["Woman", "Man", "Non-binary", "Prefer not to say"]
    whatsapp: str
    email: EmailStr
    bio: str = Field(default="", max_length=120)
    areas: List[str] = Field(min_length=1)
    budget: Literal["under 10k", "10k to 15k", "15k to 20k", "20k to 30k", "30k+"]
    move_in: Literal["ASAP", "within a month", "1 to 3 months", "just exploring"]
    flatmate_gender_pref: Literal["Women only", "Men only", "Any"]
    lifestyle: Lifestyle
    smoking: Literal["No", "Outside only", "Yes"]
    pets: Literal["Love them", "Fine with them", "No pets please"]
    non_negotiables: List[str] = []
    food: Literal["Vegetarian", "Eggetarian", "Non-vegetarian", "Vegetarian, fine with non-veg at home"]
    habits: List[Literal["Drinking", "420 friendly"]] = []
    okay_with: List[Literal["Smoking", "Drinking", "420 friendly"]] = []
    has_pet: Literal["None", "Cat", "Dog", "Other"] = "None"
    hometown: str = Field(default="", max_length=40)
    work: str = Field(default="", max_length=60)
    deal_breakers: str = Field(default="", max_length=240)
    photo: Optional[str] = Field(default=None, max_length=160_000)

    @field_validator("photo")
    @classmethod
    def _photo(cls, v):
        if v in (None, ""):
            return None
        if not v.startswith("data:image/jpeg;base64,") and not v.startswith("data:image/webp;base64,"):
            raise ValueError("Photo must be a JPEG or WebP image")
        return v

    @field_validator("hometown", "work", "deal_breakers")
    @classmethod
    def _strip(cls, v):
        return " ".join(str(v or "").split())

    @field_validator("whatsapp")
    @classmethod
    def _wa(cls, v):
        digits = "".join(ch for ch in v if ch.isdigit())
        if len(digits) == 12 and digits.startswith("91"):
            digits = digits[2:]
        if len(digits) != 10 or digits[0] not in "6789":
            raise ValueError("Enter a valid 10 digit Indian mobile number")
        return digits

    @field_validator("areas")
    @classmethod
    def _areas(cls, v):
        bad = [a for a in v if a not in AREAS]
        if bad:
            raise ValueError(f"Unknown area: {bad[0]}")
        return list(dict.fromkeys(v))

    @field_validator("non_negotiables")
    @classmethod
    def _nn(cls, v):
        bad = [a for a in v if a not in NON_NEG]
        if bad:
            raise ValueError(f"Unknown non-negotiable: {bad[0]}")
        return v


def public_view(p: dict, include_contact=False):
    out = {k: v for k, v in p.items() if k not in ("email", "whatsapp", "_id")}
    if include_contact:
        out["whatsapp"] = p.get("whatsapp")
    return out


# ---------- routes ----------
@app.get("/api/health")
async def health():
    return {"ok": True, "pool": await store.count()}


@app.post("/api/profiles")
async def create_profile(body: ProfileIn, request: Request):
    ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "?").split(",")[0].strip()
    # Test emails (example.com etc.) are isolated and deduped, so they get a looser limit for QA runs.
    if rate_limited(ip, limit=120 if is_test_email(body.email) else 10):
        raise HTTPException(429, "Too many profiles from this network. Try again in an hour.")
    doc = body.model_dump()
    if is_test_email(body.email):
        # Test profiles are single-instance per email so repeated QA runs do not pile up clones.
        await store.delete_where(email=body.email.lower())
    doc["email"] = body.email.lower()
    doc.update({
        "id": str(uuid.uuid4()),
        "is_demo": False,
        "is_sample": False,
        "is_test": is_test_email(body.email),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await store.insert(doc)
    return {"profile_id": doc["id"]}


@app.get("/api/profiles/{pid}")
async def get_profile(pid: str):
    p = await store.get(pid)
    if not p:
        raise HTTPException(404, "Profile not found")
    return public_view(p)


@app.get("/api/matches/{pid}")
async def get_matches(pid: str):
    user = await store.get(pid)
    if not user:
        raise HTTPException(404, "Profile not found")
    pool = await store.all()
    # Real members never see test profiles; test profiles see demo + other test profiles only.
    if user.get("is_test"):
        pool = [p for p in pool if p.get("is_demo") or p.get("is_test") or p.get("is_sample")]
    else:
        pool = [p for p in pool if not p.get("is_test")]
    matches, passing = rank_matches(user, pool)
    return {
        "first_name": user["first_name"],
        "is_sample": bool(user.get("is_sample")),
        "is_test": bool(user.get("is_test")),
        "pool_size": len([p for p in pool if not p.get("is_sample")]),
        "total_passing": passing,
        "matches": matches,
    }


@app.get("/api/sample")
async def sample():
    s = await store.samples()
    if not s:
        raise HTTPException(404, "No sample personas seeded")
    return {"profile_id": random.choice(s)["id"]}
