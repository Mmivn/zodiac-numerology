"use client";

/**
 * Renders an AI reply as a structured "reading": intro paragraph, then
 * one block per detected section — mirrors ui/common.py's
 * parse_markdown_sections so replies look the same as the Streamlit app.
 * Falls back to plain text if the reply has no heading structure.
 */
function parseSections(text: string): { intro: string; sections: [string, string][] } {
  const headingRe = /^#{1,4}\s+(.+?)\s*$/;
  const boldHeadingRe = /^\*\*(.+?)\*\*:?\s*$/;

  const introLines: string[] = [];
  const sections: [string, string[]][] = [];

  for (const line of text.split("\n")) {
    const stripped = line.trim();
    const match = headingRe.exec(stripped) ?? boldHeadingRe.exec(stripped);
    if (match) {
      const heading = match[1].trim().replace(/:$/, "").trim();
      sections.push([heading, []]);
    } else if (sections.length > 0) {
      sections[sections.length - 1][1].push(line);
    } else {
      introLines.push(line);
    }
  }

  return {
    intro: introLines.join("\n").trim(),
    sections: sections
      .map(([heading, body]): [string, string] => [heading, body.join("\n").trim()])
      .filter(([, body]) => body.length > 0),
  };
}

function inlineMarkdown(text: string): string {
  // Escape first so the bold-substitution below can never inject markup.
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

const KEY_SECTION_KEYWORDS = [
  "совет", "рекоменд", "advice", "tip", "khuyên",
];

function isKeySection(heading: string): boolean {
  const low = heading.toLowerCase();
  return KEY_SECTION_KEYWORDS.some((kw) => low.includes(kw));
}

export default function ReadingCard({ title, text, subtitle }: { title: string; text: string; subtitle?: string }) {
  const { intro, sections } = parseSections(text);

  return (
    <div className="card p-5 sm:p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
      </div>

      {sections.length === 0 ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{text}</p>
      ) : (
        <>
          {intro && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{intro}</p>
          )}
          {sections.map(([heading, body], index) => (
            <div
              key={index}
              className={
                isKeySection(heading)
                  ? "rounded-lg border border-violet/50 bg-violet/10 p-3"
                  : ""
              }
            >
              <div
                className="text-sm font-semibold text-violet-soft mb-1"
                dangerouslySetInnerHTML={{ __html: inlineMarkdown(heading) }}
              />
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{body}</p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
