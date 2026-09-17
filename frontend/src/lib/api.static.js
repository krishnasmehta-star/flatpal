// Backend-free API shim for the shareable preview build. Same call shapes as lib/api.js.
// Real profiles live in this browser's localStorage only. Production uses the FastAPI backend.
import demoPool from "@/lib/demoPool.json";
import { rankMatches } from "@/lib/matching";

const KEY = "flatpal.preview.profiles.v2";
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };
const save = (list) => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* private mode: keep in memory only */ } };
let mem = load();
const pool = () => [...demoPool, ...mem];

const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "p-" + Math.random().toString(36).slice(2) + Date.now().toString(36));
const respond = (data, delay = 250) => new Promise((r) => setTimeout(() => r({ data }), delay));
const fail = (status, detail) => Promise.reject({ response: { status, data: { detail } } });

const publicView = (p) => { const { email, whatsapp, ...rest } = p; return rest; };

export const API = "static";

export const api = {
  async get(path) {
    let m;
    if (path === "/health") return respond({ ok: true, pool: pool().length });
    if (path === "/sample") {
      const s = demoPool.filter((p) => p.is_sample);
      return respond({ profile_id: s[Math.floor(Math.random() * s.length)].id });
    }
    if ((m = path.match(/^\/profiles\/(.+)$/))) {
      const p = pool().find((x) => x.id === m[1]);
      return p ? respond(publicView(p)) : fail(404, "Profile not found");
    }
    if ((m = path.match(/^\/matches\/(.+)$/))) {
      const user = pool().find((x) => x.id === m[1]);
      if (!user) return fail(404, "Profile not found");
      const [matches, passing] = rankMatches(user, pool());
      return respond({
        first_name: user.first_name,
        is_sample: !!user.is_sample,
        pool_size: pool().filter((p) => !p.is_sample).length,
        total_passing: passing,
        matches,
      });
    }
    return fail(404, "Not found");
  },
  async post(path, body) {
    if (path !== "/profiles") return fail(404, "Not found");
    let digits = String(body.whatsapp || "").replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
    if (!/^[6-9]\d{9}$/.test(digits)) return fail(422, "Enter a valid 10 digit Indian mobile number");
    if (!(body.age >= 18 && body.age <= 45)) return fail(422, "Age must be between 18 and 45");
    if (!body.areas || !body.areas.length) return fail(422, "Pick at least one area");
    const doc = { ...body, whatsapp: digits, id: uuid(), is_demo: false, is_sample: false, created_at: new Date().toISOString() };
    mem = [...mem, doc];
    save(mem);
    return respond({ profile_id: doc.id }, 400);
  },
};
