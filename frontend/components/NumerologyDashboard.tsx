"use client";

import { useEffect, useState } from "react";

import { fetchNumerology } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { AIReadingResult, Language, NumerologyKind, NumerologyNumbers, Profile } from "@/lib/types";
import ActionGrid from "./ActionGrid";
import AIPanel from "./AIPanel";
import AskAiPanel from "./AskAiPanel";
import CompatibilityPanel from "./CompatibilityPanel";

type Action = NumerologyKind | "compatibility";

export default function NumerologyDashboard({
  profile,
  language,
  consent,
  onConsentChange,
  cache,
}: {
  profile: Profile;
  language: Language;
  consent: boolean;
  onConsentChange: (value: boolean) => void;
  cache: Map<string, { result: AIReadingResult }>;
}) {
  const copy = t(language);
  const [action, setAction] = useState<Action>("life_path");
  const [numbers, setNumbers] = useState<NumerologyNumbers | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    let cancelled = false;
    fetchNumerology(profile.birth_date, language)
      .then((data) => {
        if (!cancelled) setNumbers(data);
      })
      .catch(() => {
        // Deterministic calc failing is unexpected (no AI involved) — the
        // stats row just stays hidden; individual AI panels still work.
      });
    return () => {
      cancelled = true;
    };
  }, [profile.birth_date, language]);

  const items: { key: Action; label: string; description: string }[] = [
    {
      key: "life_path",
      label: copy.numerologyCards.life_path,
      description: copy.numerologyCardDesc.life_path,
    },
    { key: "today", label: copy.numerologyCards.today, description: copy.numerologyCardDesc.today },
    { key: "month", label: copy.numerologyCards.month, description: copy.numerologyCardDesc.month },
    { key: "year", label: copy.numerologyCards.year, description: copy.numerologyCardDesc.year },
    {
      key: "full_reading",
      label: copy.numerologyCards.full_reading,
      description: copy.numerologyCardDesc.full_reading,
    },
    {
      key: "compatibility",
      label: copy.numerologyCards.compatibility,
      description: copy.numerologyCardDesc.compatibility,
    },
    { key: "ask_ai", label: copy.numerologyCards.ask_ai, description: copy.numerologyCardDesc.ask_ai },
  ];

  const signature =
    action === "life_path"
      ? String(profile.life_path_number)
      : numbers
        ? `${profile.life_path_number}|${action}|${today}`
        : `${profile.life_path_number}|${action}|pending`;

  return (
    <div className="space-y-5">
      {numbers && (
        <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
          {(
            [
              [copy.numerologyCards.life_path, numbers.life_path_number],
              [copy.numerologyCards.today, numbers.personal_day_number],
              [copy.numerologyCards.month, numbers.personal_month_number],
              [copy.numerologyCards.year, numbers.personal_year_number],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="card p-3 sm:p-4">
              <div className="font-display text-2xl sm:text-3xl text-gold-soft">{value}</div>
              <div className="text-[10px] sm:text-[11px] text-muted mt-1 leading-tight uppercase tracking-wide">
                {label}
              </div>
            </div>
          ))}
        </div>
      )}

      <ActionGrid items={items} active={action} onSelect={setAction} />

      {action === "compatibility" ? (
        <CompatibilityPanel
          key={`numerology-compatibility-${language}`}
          domain="numerology"
          name={profile.name}
          birthDate={profile.birth_date}
          language={language}
          consent={consent}
          onConsentChange={onConsentChange}
          title={copy.numerologyCards.compatibility}
          description={copy.numerologyCardDesc.compatibility}
        />
      ) : action === "ask_ai" ? (
        <AskAiPanel
          key={`numerology-ask_ai-${language}`}
          domain="numerology"
          name={profile.name}
          birthDate={profile.birth_date}
          language={language}
          consent={consent}
          onConsentChange={onConsentChange}
          title={copy.numerologyCards.ask_ai}
          description={copy.numerologyCardDesc.ask_ai}
        />
      ) : (
        <AIPanel
          key={`numerology:${action}:${signature}:${language}`}
          domain="numerology"
          kind={action}
          signature={signature}
          title={copy.numerologyCards[action]}
          description={copy.numerologyCardDesc[action]}
          buttonLabel={
            action === "life_path"
              ? copy.getInterpretationButton
              : action === "full_reading"
                ? copy.getFullReadingButton
                : copy.getForecastButton
          }
          name={profile.name}
          birthDate={profile.birth_date}
          language={language}
          consent={consent}
          onConsentChange={onConsentChange}
          cache={cache}
        />
      )}
    </div>
  );
}
