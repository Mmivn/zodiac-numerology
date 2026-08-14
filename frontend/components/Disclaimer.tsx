"use client";

import { t } from "@/lib/i18n";
import type { Language } from "@/lib/types";

export default function Disclaimer({ language }: { language: Language }) {
  return (
    <p className="text-xs text-muted text-center px-4 py-3 max-w-2xl mx-auto">
      {t(language).disclaimer}
    </p>
  );
}
