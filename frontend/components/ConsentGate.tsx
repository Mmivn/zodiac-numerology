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
    <div className="rounded-xl border border-gold/40 bg-surface-2 p-4 space-y-2">
      <p className="text-sm text-gold">{copy.consentRequired}</p>
      <p className="text-xs text-muted">{copy.consentWhy}</p>
      <label className="flex items-start gap-2 text-sm cursor-pointer select-none pt-1">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 h-4 w-4 accent-violet"
        />
        <span>{copy.consentLabel}</span>
      </label>
    </div>
  );
}
