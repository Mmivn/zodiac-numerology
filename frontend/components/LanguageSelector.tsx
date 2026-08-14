"use client";

import { LANGUAGE_NAMES } from "@/lib/i18n";
import type { Language } from "@/lib/types";

const LANGUAGES: Language[] = ["ru", "en", "vi"];

export default function LanguageSelector({
  language,
  onChange,
}: {
  language: Language;
  onChange: (language: Language) => void;
}) {
  return (
    <div className="relative">
      <select
        value={language}
        onChange={(event) => onChange(event.target.value as Language)}
        className="input-field appearance-none pl-3.5 pr-9 py-2 text-sm cursor-pointer"
        aria-label="Language"
      >
        {LANGUAGES.map((code) => (
          <option key={code} value={code} className="bg-[#131220] text-foreground">
            {LANGUAGE_NAMES[code]}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}
