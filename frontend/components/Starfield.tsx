import type { CSSProperties } from "react";

import { generateStars, type StarLayerConfig } from "@/lib/starfield";

// Far -> near: fewer/smaller/dimmer to more/bigger/brighter is the
// entire depth illusion, before anything even moves. Each layer also
// gets its own slow drift speed and scroll-parallax multiplier (see
// globals.css's .starfield-parallax-*), so the three layers separate
// further as the page scrolls.
const LAYERS: Record<"far" | "mid" | "near", StarLayerConfig> = {
  far: { count: 90, seed: 1010, minR: 0.6, maxR: 1.3, minOpacity: 0.2, maxOpacity: 0.5 },
  mid: { count: 55, seed: 2020, minR: 1.1, maxR: 2.0, minOpacity: 0.35, maxOpacity: 0.75 },
  near: { count: 30, seed: 3030, minR: 1.8, maxR: 3.2, minOpacity: 0.55, maxOpacity: 1 },
};

/**
 * Three star-depth layers, each a seeded/deterministic set of circles
 * (lib/starfield.ts — never Math.random(), so this renders identically
 * on the server and the client, no hydration mismatch). Every star
 * twinkles on its own randomized delay/duration using one of three
 * keyframe variants, so the field never visibly pulses in sync; each
 * layer additionally drifts as a whole, at its own slow independent
 * speed. Server-renderable (no client state) so it paints in the very
 * first HTML response.
 */
export default function Starfield() {
  return (
    <>
      {(Object.keys(LAYERS) as (keyof typeof LAYERS)[]).map((key) => {
        const stars = generateStars(LAYERS[key]);
        return (
          <div key={key} className={`starfield-parallax starfield-parallax-${key}`} aria-hidden="true">
            <svg
              className={`starfield-layer starfield-${key}`}
              viewBox="0 0 1000 1000"
              preserveAspectRatio="xMidYMid slice"
            >
              {stars.map((star, index) => (
                <circle
                  key={index}
                  cx={star.x}
                  cy={star.y}
                  r={star.r}
                  fill="#fff"
                  className={`star-twinkle star-twinkle-${star.variant}`}
                  // `--star-peak` is a per-star CSS custom property the
                  // star-twinkle-* keyframes (globals.css) read via
                  // calc() — this is what lets each star keep its own
                  // randomized peak brightness while still sharing one
                  // of only three keyframe definitions.
                  style={
                    {
                      "--star-peak": star.opacity,
                      animationDelay: `${star.delay}s`,
                      animationDuration: `${star.duration}s`,
                    } as CSSProperties
                  }
                />
              ))}
            </svg>
          </div>
        );
      })}
    </>
  );
}
