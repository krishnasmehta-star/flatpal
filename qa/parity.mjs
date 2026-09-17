import fs from "fs";
import { rankMatches } from "../frontend/src/lib/matching.js";
const pool = JSON.parse(fs.readFileSync("frontend/src/lib/demoPool.json"));
const users = JSON.parse(fs.readFileSync("qa/parity-users.json"));
const out = users.map(u => { const [m, n] = rankMatches(u, pool); return { n, m: m.map(x => [x.id, x.score, x.reasons, x.friction, x.stretch]) }; });
fs.writeFileSync("qa/parity-js.json", JSON.stringify(out));
