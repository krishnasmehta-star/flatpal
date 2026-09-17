// Deterministic demo avatars. Real users never get a stock photo, only demo profiles do.
const POOL = {
  Woman: ["/avatars/w1.webp", "/avatars/w2.webp", "/avatars/w3.webp", "/avatars/w4.webp", "/avatars/w5.webp", "/avatars/w6.webp", "/avatars/w7.webp", "/avatars/w8.webp", "/avatars/w9.webp", "/avatars/w10.webp", "/avatars/w11.webp", "/avatars/w12.webp", "/avatars/w13.webp", "/avatars/w14.webp", "/avatars/w15.webp"],
  Man: ["/avatars/m1.webp", "/avatars/m2.webp", "/avatars/m3.webp", "/avatars/m4.webp", "/avatars/m5.webp", "/avatars/m6.webp", "/avatars/m7.webp", "/avatars/m8.webp", "/avatars/m9.webp", "/avatars/m10.webp", "/avatars/m11.webp", "/avatars/m12.webp", "/avatars/m13.webp", "/avatars/m14.webp", "/avatars/m15.webp", "/avatars/m16.webp", "/avatars/m17.webp"],
};

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Assign avatars to a list of matches, avoiding repeats on the same page where the pool allows.
export function assignAvatars(matches) {
  const used = new Set();
  return matches.map((m) => {
    if (!m.is_demo) return null;
    const pool = POOL[m.gender];
    if (!pool) return null;
    const start = hash(m.id || m.first_name || "") % pool.length;
    for (let k = 0; k < pool.length; k++) {
      const pick = pool[(start + k) % pool.length];
      if (!used.has(pick)) {
        used.add(pick);
        return pick;
      }
    }
    // Pool exhausted for this page: fall back to initials rather than repeat a face.
    return null;
  });
}
