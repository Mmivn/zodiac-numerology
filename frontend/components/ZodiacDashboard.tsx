"use client";

import { useState } from "react";

import { t, SIGN_NAMES } from "@/lib/i18n";
import type { AIReadingResult, Language, Profile, ZodiacKind } from "@/lib/types";
import ActionGrid from "./ActionGrid";
import AIPanel from "./AIPanel";
import AskAiPanel from "./AskAiPanel";
import CompatibilityPanel from "./CompatibilityPanel";

type Action = ZodiacKind | "compatibility";

export default function ZodiacDashboard({
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
  const [action, setAction] = useState<Action>("my_sign");
  const signName = SIGN_NAMES[language][profile.zodiac_sign] ?? profile.zodiac_sign;
  const today = new Date().toISOString().slice(0, 10);
  const signature =
    action === "my_sign" ? profile.zodiac_sign : `${profile.zodiac_sign}|${action}|${today}`;

  const items: { key: Action; label: string; description: string }[] = [
    { key: "my_sign", label: copy.zodiacCards.my_sign, description: copy.zodiacCardDesc.my_sign },
    { key: "today", label: copy.zodiacCards.today, description: copy.zodiacCardDesc.today },
    { key: "month", label: copy.zodiacCards.month, description: copy.zodiacCardDesc.month },
    { key: "year", label: copy.zodiacCards.year, description: copy.zodiacCardDesc.year },
    {
      key: "compatibility",
      label: copy.zodiacCards.compatibility,
      description: copy.zodiacCardDesc.compatibility,
    },
    { key: "ask_ai", label: copy.zodiacCards.ask_ai, description: copy.zodiacCardDesc.ask_ai },
  ];

  return (
    <div className="space-y-5">
      <ActionGrid items={items} active={action} onSelect={setAction} />

      {action === "compatibility" ? (
        <CompatibilityPanel
          key={`zodiac-compatibility-${language}`}
          domain="zodiac"
          name={profile.name}
          birthDate={profile.birth_date}
          language={language}
          consent={consent}
          onConsentChange={onConsentChange}
          title={copy.zodiacCards.compatibility}
          description={copy.zodiacCardDesc.compatibility}
        />
      ) : action === "ask_ai" ? (
        <AskAiPanel
          key={`zodiac-ask_ai-${language}`}
          domain="zodiac"
          name={profile.name}
          birthDate={profile.birth_date}
          language={language}
          consent={consent}
          onConsentChange={onConsentChange}
          title={copy.zodiacCards.ask_ai}
          description={copy.zodiacCardDesc.ask_ai}
        />
      ) : (
        <AIPanel
          key={`zodiac:${action}:${signature}:${language}`}
          domain="zodiac"
          kind={action}
          signature={signature}
          title={copy.zodiacCards[action]}
          description={copy.zodiacCardDesc[action]}
          buttonLabel={action === "my_sign" ? copy.getInterpretationButton : copy.getForecastButton}
          subtitle={signName}
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
