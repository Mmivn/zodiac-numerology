import OrbitRings from "./OrbitRings";
import Planet from "./Planet";
import ScrollParallax from "./ScrollParallax";
import Starfield from "./Starfield";

/**
 * The full immersive cosmic scene behind the app — an explicit
 * back-to-front depth stack (see the z-index table at the top of the
 * "Cosmic background" block in globals.css):
 *
 *   backdrop wash -> star layers -> nebula glows -> planets ->
 *   orbit rings -> constellation -> [page content] -> foreground glow
 *
 * Everything here is `position: fixed`, negative (or, for the very
 * last vignette layer, high positive) z-index, and pointer-events:none
 * — it never intercepts a click and never reflows with page content.
 * Server-renderable (no client state of its own — ScrollParallax is
 * the one client island, and it renders nothing) so the whole scene
 * paints with the very first HTML response, before hydration.
 *
 * The Saturn/moon planets, the orbit rings, and the constellation are
 * hidden below the `sm` breakpoint — the mobile scene is deliberately
 * just stars, the hero planet, and the backdrop (see each component's
 * own `hidden sm:block`), which is what "one visible planet, reduced
 * animation, no heavy parallax" (the mobile requirement) means here.
 */
export default function CosmicBackground() {
  return (
    <>
      <ScrollParallax />

      <div className="cosmic-backdrop" aria-hidden="true" />

      <Starfield />

      <div className="cosmic-orbs" aria-hidden="true">
        <div className="cosmic-orb cosmic-orb-1" />
        <div className="cosmic-orb cosmic-orb-2" />
        <div className="cosmic-orb cosmic-orb-3" />
      </div>

      {/* The large, cinematic hero planet — always visible, mobile
          included, partially cropped off the top edge for scale. */}
      <div className="planet-parallax planet-parallax-hero" aria-hidden="true">
        <div className="planet planet-hero float-slow">
          <Planet variant="hero" id="planet-hero" />
        </div>
      </div>

      {/* Saturn-like ringed planet — desktop/tablet only. */}
      <div className="planet-parallax planet-parallax-saturn hidden sm:block" aria-hidden="true">
        <div className="planet planet-saturn float-slower">
          <Planet variant="saturn" id="planet-saturn" />
        </div>
      </div>

      {/* A smaller moon, lower on the page — desktop/tablet only. */}
      <div className="planet-parallax planet-parallax-moon hidden sm:block" aria-hidden="true">
        <div className="planet planet-moon float-slow">
          <Planet variant="moon" id="planet-moon" />
        </div>
      </div>

      <OrbitRings />

      {/* Faint hand-placed constellation accents — a few points and
          connecting lines, not a stock zodiac-wheel graphic or a
          specific real constellation, deliberately abstract "ambient
          star chart" detail. Desktop/tablet only, same as the orbits. */}
      <div className="cosmic-constellation hidden sm:block" aria-hidden="true">
        <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
          <g stroke="#e4c99a" strokeWidth="0.6" fill="none" opacity="0.5">
            <polyline points="80,120 160,90 240,140 300,80" />
            <polyline points="860,180 800,240 880,300 780,320" />
          </g>
          <g fill="#eeecf5">
            <circle cx="80" cy="120" r="1.6" />
            <circle cx="160" cy="90" r="1.2" />
            <circle cx="240" cy="140" r="1.8" />
            <circle cx="300" cy="80" r="1.2" />
            <circle cx="860" cy="180" r="1.6" />
            <circle cx="800" cy="240" r="1.2" />
            <circle cx="880" cy="300" r="1.8" />
            <circle cx="780" cy="320" r="1.2" />
          </g>
          <g stroke="#c3b6f7" strokeWidth="0.5" fill="none" opacity="0.4">
            <polyline points="120,860 200,900 260,840" />
          </g>
          <g fill="#c3b6f7">
            <circle cx="120" cy="860" r="1.4" />
            <circle cx="200" cy="900" r="1.1" />
            <circle cx="260" cy="840" r="1.6" />
          </g>
        </svg>
      </div>

      {/* A near-invisible vignette + top glow above everything else —
          the "foreground glow" layer. Purely atmospheric: transparent
          through the whole readable center of the page, so it never
          reduces text contrast. */}
      <div className="cosmic-foreground-glow" aria-hidden="true" />
    </>
  );
}
