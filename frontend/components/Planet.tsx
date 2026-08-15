export type PlanetVariant = "hero" | "saturn" | "moon";

interface Palette {
  base: string;
  band1: string;
  band2: string;
  band3: string;
  highlight: string;
}

// Cosmic palette tones only — no bright primary-color clipart look.
const PALETTES: Record<PlanetVariant, Palette> = {
  hero: {
    base: "#332c5c",
    band1: "#453c8f",
    band2: "#584a9c",
    band3: "#241f45",
    highlight: "#d9cdfb",
  },
  saturn: {
    base: "#6e5636",
    band1: "#8f7047",
    band2: "#b0925e",
    band3: "#4a3a24",
    highlight: "#f3ddab",
  },
  moon: {
    base: "#5c5568",
    band1: "#6d6580",
    band2: "#494257",
    band3: "#7d7690",
    highlight: "#e9e4f6",
  },
};

// One "tile" of cloud-band shapes, duplicated and offset by exactly its
// own width inside the rotating group below — see the comment there for
// why that's what makes the loop seamless.
const TILE_WIDTH = 300;
const BANDS = [
  { cx: 40, cy: 66, rx: 92, ry: 15, band: "band1" as const, opacity: 0.5 },
  { cx: 150, cy: 122, rx: 112, ry: 20, band: "band2" as const, opacity: 0.4 },
  { cx: 255, cy: 150, rx: 78, ry: 13, band: "band3" as const, opacity: 0.42 },
  { cx: 95, cy: 40, rx: 66, ry: 11, band: "band1" as const, opacity: 0.3 },
  { cx: 205, cy: 172, rx: 70, ry: 12, band: "band3" as const, opacity: 0.35 },
];

/**
 * One dimensional-looking planet, as a self-contained inline SVG sphere:
 *
 *  - a base fill circle, clipped, with slow-rotating cloud-band shapes
 *    inside it (the rotation illusion — see the "planet-texture" `<g>`)
 *  - a STATIC radial-gradient shading circle on top (highlight +
 *    terminator shadow) so the light direction never rotates with the
 *    surface underneath it — this is what actually reads as "a lit
 *    sphere" rather than a spinning flat disc
 *  - a limb-darkening circle for a soft, rounded edge
 *  - for Saturn: a back ring (drawn before the sphere, so the sphere
 *    naturally occludes its middle) plus a second copy of the ring,
 *    clipped to only its bottom half and drawn *after* the sphere, so
 *    it visibly crosses in front of the planet — the standard,
 *    perspective-transform-free way to draw a convincing ringed planet.
 *
 * Deliberately not a flat icon: three shading layers plus an outer glow
 * (applied by the caller via CSS `filter: drop-shadow(...)`) is what
 * keeps this from reading as clipart.
 */
export default function Planet({ variant, id }: { variant: PlanetVariant; id: string }) {
  const palette = PALETTES[variant];
  const hasRing = variant === "saturn";
  const clipId = `${id}-clip`;
  const lightId = `${id}-light`;
  const limbId = `${id}-limb`;
  const ringId = `${id}-ring`;
  const ringFrontClipId = `${id}-ring-front-clip`;

  return (
    <svg className="planet-svg" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={clipId}>
          <circle cx="100" cy="100" r="96" />
        </clipPath>
        {hasRing && (
          <clipPath id={ringFrontClipId}>
            <rect x="0" y="100" width="200" height="100" />
          </clipPath>
        )}
        <radialGradient id={lightId} cx="34%" cy="30%" r="75%">
          <stop offset="0%" stopColor={palette.highlight} stopOpacity="0.65" />
          <stop offset="35%" stopColor={palette.highlight} stopOpacity="0.12" />
          <stop offset="62%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
        </radialGradient>
        <radialGradient id={limbId} cx="50%" cy="50%" r="52%">
          <stop offset="80%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
        </radialGradient>
        {hasRing && (
          <linearGradient id={ringId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={palette.band3} stopOpacity="0.15" />
            <stop offset="32%" stopColor={palette.highlight} stopOpacity="0.85" />
            <stop offset="50%" stopColor={palette.band2} stopOpacity="0.9" />
            <stop offset="68%" stopColor={palette.highlight} stopOpacity="0.85" />
            <stop offset="100%" stopColor={palette.band3} stopOpacity="0.15" />
          </linearGradient>
        )}
      </defs>

      {hasRing && (
        <ellipse
          cx="100"
          cy="100"
          rx="94"
          ry="23"
          fill="none"
          stroke={`url(#${ringId})`}
          strokeWidth="7"
          opacity="0.55"
        />
      )}

      <circle cx="100" cy="100" r="96" fill={palette.base} />

      <g clipPath={`url(#${clipId})`}>
        {/* The rotation illusion: this group is wider than the visible
            clipped circle (two copies of the same band pattern, offset
            by exactly one tile width) and animates translateX by
            exactly -TILE_WIDTH in a loop — at the loop point the second
            copy sits pixel-identical to where the first started, so the
            reset is invisible. See globals.css's .planet-texture. */}
        <g className="planet-texture">
          {[0, TILE_WIDTH].map((offset) => (
            <g key={offset} transform={`translate(${offset - 50}, 0)`}>
              {BANDS.map((band, index) => (
                <ellipse
                  key={index}
                  cx={band.cx}
                  cy={band.cy}
                  rx={band.rx}
                  ry={band.ry}
                  fill={palette[band.band]}
                  opacity={band.opacity}
                />
              ))}
            </g>
          ))}
        </g>
      </g>

      <circle cx="100" cy="100" r="96" fill={`url(#${lightId})`} />
      <circle cx="100" cy="100" r="96" fill={`url(#${limbId})`} />

      {hasRing && (
        <g clipPath={`url(#${ringFrontClipId})`}>
          <ellipse
            cx="100"
            cy="100"
            rx="94"
            ry="23"
            fill="none"
            stroke={`url(#${ringId})`}
            strokeWidth="8"
            opacity="0.92"
          />
        </g>
      )}
    </svg>
  );
}
