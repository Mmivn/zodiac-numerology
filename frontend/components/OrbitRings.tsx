/**
 * Two glowing elliptical orbit paths, each with a small satellite
 * travelling along it. The visible ring is an SVG ellipse (a gradient
 * stroke, faded at both ends so it reads as a glowing arc rather than a
 * hard-edged circle); the satellite is a separate absolutely-positioned
 * dot whose `left`/`top` are keyframed through twelve points sampled
 * evenly around a same-proportioned ellipse — plain CSS, no JS, and
 * exactly reproducible from the numbers in globals.css's
 * `orbit-travel-a`/`orbit-travel-b`. Desktop-only (see the `hidden
 * sm:block` below) — orbits are the first thing trimmed on mobile,
 * per the "one visible planet, reduced animation" mobile rule.
 */
export default function OrbitRings() {
  return (
    <>
      <div className="orbit orbit-a hidden sm:block" aria-hidden="true">
        <svg
          className="orbit-ring-svg"
          viewBox="0 0 200 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="orbit-grad-a" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e4c99a" stopOpacity="0" />
              <stop offset="50%" stopColor="#e4c99a" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#e4c99a" stopOpacity="0" />
            </linearGradient>
          </defs>
          <ellipse cx="100" cy="50" rx="97" ry="46" fill="none" stroke="url(#orbit-grad-a)" strokeWidth="0.6" />
        </svg>
        <div className="orbit-satellite orbit-satellite-a" />
      </div>

      <div className="orbit orbit-b hidden sm:block" aria-hidden="true">
        <svg
          className="orbit-ring-svg"
          viewBox="0 0 200 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="orbit-grad-b" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#c3b6f7" stopOpacity="0" />
              <stop offset="50%" stopColor="#c3b6f7" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#c3b6f7" stopOpacity="0" />
            </linearGradient>
          </defs>
          <ellipse cx="100" cy="50" rx="94" ry="40" fill="none" stroke="url(#orbit-grad-b)" strokeWidth="0.6" />
        </svg>
        <div className="orbit-satellite orbit-satellite-b" />
      </div>
    </>
  );
}
