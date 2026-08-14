/**
 * The full layered depth stack behind the app — see the "Cosmic
 * background" block in globals.css for the mechanics of each layer.
 * Server-renderable (no client state), so it paints with the very
 * first HTML response, before hydration.
 *
 * The constellation lines are a small, hand-placed set of points, not
 * a stock zodiac-wheel graphic or a specific real constellation —
 * deliberately abstract "ambient star chart" detail.
 */
export default function CosmicBackground() {
  return (
    <>
      <div className="cosmic-backdrop" aria-hidden="true" />
      <div className="cosmic-orbs" aria-hidden="true">
        <div className="cosmic-orb cosmic-orb-1" />
        <div className="cosmic-orb cosmic-orb-2" />
        <div className="cosmic-orb cosmic-orb-3" />
      </div>
      <div className="cosmic-constellation" aria-hidden="true">
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
      <div className="cosmic-stars-far" aria-hidden="true" />
      <div className="cosmic-stars" aria-hidden="true" />
    </>
  );
}
