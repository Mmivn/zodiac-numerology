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
 * elegant dividers).
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
    <div className="card p-6 sm:p-8 space-y-5">
      <div>
        <span className="eyebrow">AI reading</span>
        <h3 className="font-display text-xl sm:text-2xl text-foreground mt-1">{title}</h3>
        {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
        <div className="divider-elegant" />
      </div>

      <div className="reading-prose">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </div>
    </div>
  );
}
