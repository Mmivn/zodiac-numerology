"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders an AI reply through a real Markdown parser (react-markdown +
 * remark-gfm) — never a hand-rolled regex pass over raw text. This is
 * what guarantees "**bold**" / "---" / "## heading" never leak to the
 * screen as literal characters: they're parsed into real <strong>/<hr>/
 * <h2> elements and styled via .reading-prose in globals.css (max
 * readable width, comfortable line height, gold-accented headings,
 * elegant dividers, glass-panel blockquotes).
 *
 * This is the product's most valuable surface, so it gets the deepest
 * elevation tier (card-feature) and a one-time reveal-on-arrival
 * animation — a fresh reading fades/lifts in rather than just
 * appearing, without ever looping or blocking interaction.
 */
export default function ReadingCard({
  title,
  text,
  subtitle,
}: {
  title: string;
  text: string;
  subtitle?: string;
}) {
  return (
    <div className="card card-feature reveal p-6 sm:p-8 space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <svg
            className="h-3.5 w-3.5 text-gold-soft"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
          </svg>
          <span className="eyebrow">AI reading</span>
        </div>
        <h3 className="font-display text-xl sm:text-2xl text-foreground mt-1.5">{title}</h3>
        {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
        <div className="divider-elegant" />
      </div>

      <div className="reading-prose">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </div>
    </div>
  );
}
