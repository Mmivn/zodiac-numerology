"use client";

import type { Language } from "@/lib/types";
import { t } from "@/lib/i18n";

/**
 * Inline, always-rendered-when-needed consent gate — the fix for the
 * Streamlit version's dead-end consent bug. There, a plain (non-form)
 * checkbox nested behind an "if clicked" branch could disappear the
 * moment it was checked, because Streamlit reruns the whole script and
 * that check wasn't itself a "click". None of that applies here: this is
 * normal React state, so `checked` always reflects the real, current
 * value and the button becomes usable the instant it's checked — no
 * server rerun, no dead-end error with no way forward.
 */
export default function ConsentGate({
  language,
  checked,
  onChange,
}: {
  language: Language;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const copy = t(language);

  return (
    <div className="card reveal p-5 space-y-3 border-gold-soft/30">
      <div className="flex items-start gap-2.5">
        <svg
          className="h-4 w-4 mt-0.5 shrink-0 text-gold-soft"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L14.71 3.86a2 2 0 0 0-3.42 0Z" />
        </svg>
        <p className="text-sm text-gold-soft font-medium">{copy.consentRequired}</p>
      </div>
      <p className="text-xs text-muted leading-relaxed pl-6">{copy.consentWhy}</p>
      <label className="flex items-start gap-2.5 text-sm cursor-pointer select-none pl-6 pt-1">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded accent-violet cursor-pointer"
        />
        <span className="text-foreground-dim leading-snug">{copy.consentLabel}</span>
      </label>
    </div>
  );
}
