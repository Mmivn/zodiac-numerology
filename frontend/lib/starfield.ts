// Deterministic star-position generator for the cosmic background (see
// components/Starfield.tsx). Pure math — a seeded PRNG, never
// Math.random() — so the server and the client produce byte-identical
// output and there is no hydration mismatch, the same reasoning as the
// hand-placed constellation points already in CosmicBackground.tsx.

export interface Star {
  x: number; // 0-1000, position in the layer's viewBox
  y: number; // 0-1000
  r: number; // radius, in the same viewBox units
  opacity: number; // peak twinkle opacity (the trough is a bit dimmer)
  delay: number; // seconds — twinkle animation-delay
  duration: number; // seconds — twinkle animation-duration
  variant: 0 | 1 | 2; // which of the three twinkle keyframes (globals.css)
}

export interface StarLayerConfig {
  count: number;
  seed: number;
  minR: number;
  maxR: number;
  minOpacity: number;
  maxOpacity: number;
}

// mulberry32 — a tiny, fast, deterministic PRNG. Decoration, not
// security: this only needs to be repeatable, not unpredictable.
function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateStars(config: StarLayerConfig): Star[] {
  const random = mulberry32(config.seed);
  const stars: Star[] = [];
  for (let i = 0; i < config.count; i++) {
    stars.push({
      x: random() * 1000,
      y: random() * 1000,
      r: config.minR + random() * (config.maxR - config.minR),
      opacity: config.minOpacity + random() * (config.maxOpacity - config.minOpacity),
      delay: random() * 8,
      duration: 4 + random() * 5,
      variant: Math.floor(random() * 3) as 0 | 1 | 2,
    });
  }
  return stars;
}
