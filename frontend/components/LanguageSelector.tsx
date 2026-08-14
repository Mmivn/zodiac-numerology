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
    <select
      value={language}
      onChange={(event) => onChange(event.target.value as Language)}
      className="input-field px-3 py-2 text-sm"
      aria-label="Language"
    >
      {LANGUAGES.map((code) => (
        <option key={code} value={code}>
          {LANGUAGE_NAMES[code]}
        </option>
      ))}
    </select>
  );
}
