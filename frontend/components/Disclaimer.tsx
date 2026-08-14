"use client";

import { t } from "@/lib/i18n";
import type { Language } from "@/lib/types";

export default function Disclaimer({ language }: { language: Language }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 text-center">
      <div className="divider-elegant max-w-xs mx-auto" />
      <p className="text-xs text-muted leading-relaxed">{t(language).disclaimer}</p>
    </div>
  );
}
