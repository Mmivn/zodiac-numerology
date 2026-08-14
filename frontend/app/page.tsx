"use client";

import { useEffect, useState } from "react";

import Disclaimer from "@/components/Disclaimer";
import Hero from "@/components/Hero";
import LanguageSelector from "@/components/LanguageSelector";
import NumerologyDashboard from "@/components/NumerologyDashboard";
import ProfileForm from "@/components/ProfileForm";
import ZodiacDashboard from "@/components/ZodiacDashboard";
import { t } from "@/lib/i18n";
import {
  loadConsent,
  loadLanguage,
  loadProfile,
  saveConsent,
  saveLanguage,
  saveProfile,
} from "@/lib/storage";
import type { AIReadingResult, Language, Profile } from "@/lib/types";

type Tab = "zodiac" | "numerology";

interface HydratedState {
  hydrated: boolean;
  profile: Profile | null;
  consent: boolean;
  language: Language;
  showForm: boolean;
}

const INITIAL_STATE: HydratedState = {
  hydrated: false,
  profile: null,
  consent: false,
  language: "en",
  showForm: true,
};

export default function Home() {
  const [state, setState] = useState<HydratedState>(INITIAL_STATE);
  const [tab, setTab] = useState<Tab>("zodiac");
  // A stable Map identity across renders — one AI-result cache per browser
  // tab, shared across both dashboards, so switching tabs/actions never
  // re-fetches an already-generated reading for the same (domain, kind,
  // signature, language) combination this session. useState (not
  // useRef): the value is read during render (passed as a prop), and
  // refs must never be read during render.
  const [cache] = useState(() => new Map<string, { result: AIReadingResult }>());

  useEffect(() => {
    // Deliberate one-time setState-on-mount, not a "you might not need an
    // effect" case: localStorage doesn't exist during SSR, so this data
    // can only be read client-side, after mount. A lazy useState
    // initializer would read it during the client's first render instead
    // (see Next's "preventing flash before hydration" guide), but since
    // the server-rendered HTML has no matching localStorage read to sync
    // against, that would just trade this effect for a hydration mismatch
    // — worse, not better, for four independent pieces of state. The
    // `hydrated` flag keeps server and first-client-render output
    // identical (the placeholder below), so there is no mismatch, only a
    // deliberate one-frame gap before the real UI appears.
    const profile = loadProfile();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({
      hydrated: true,
      profile,
      consent: loadConsent(),
      language: loadLanguage(),
      showForm: profile === null,
    });
  }, []);

  function handleConsentChange(value: boolean) {
    setState((prev) => ({ ...prev, consent: value }));
    saveConsent(value);
  }

  function handleLanguageChange(value: Language) {
    setState((prev) => ({ ...prev, language: value }));
    saveLanguage(value);
  }

  function handleProfileSaved(newProfile: Profile) {
    setState((prev) => ({ ...prev, profile: newProfile, showForm: false }));
    saveProfile(newProfile);
  }

  function handleEditProfile() {
    setState((prev) => ({ ...prev, showForm: true }));
  }

  const { hydrated, profile, consent, language, showForm } = state;
  const copy = t(language);

  // Avoid a flash of the wrong screen before localStorage is read.
  if (!hydrated) {
    return <div className="min-h-dvh" />;
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="max-w-4xl w-full mx-auto px-4 sm:px-6 pt-8 pb-2 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">{copy.appTitle}</h1>
          <p className="text-xs text-muted mt-1 hidden sm:block">{copy.appSubtitle}</p>
        </div>
        <LanguageSelector language={language} onChange={handleLanguageChange} />
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
        {!profile || showForm ? (
          <div className="flex-1 flex items-center justify-center py-8">
            <ProfileForm
              language={language}
              consent={consent}
              onConsentChange={handleConsentChange}
              onSaved={handleProfileSaved}
              existing={profile}
            />
          </div>
        ) : (
          <>
            <Hero profile={profile} language={language} onEdit={handleEditProfile} />

            <div className="flex gap-2 border-b border-border pb-0">
              {(["zodiac", "numerology"] as Tab[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={
                    "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors " +
                    (tab === key
                      ? "border-violet text-foreground"
                      : "border-transparent text-muted hover:text-foreground")
                  }
                >
                  {key === "zodiac" ? copy.tabZodiac : copy.tabNumerology}
                </button>
              ))}
            </div>

            {tab === "zodiac" ? (
              <ZodiacDashboard
                profile={profile}
                language={language}
                consent={consent}
                onConsentChange={handleConsentChange}
                cache={cache}
              />
            ) : (
              <NumerologyDashboard
                profile={profile}
                language={language}
                consent={consent}
                onConsentChange={handleConsentChange}
                cache={cache}
              />
            )}
          </>
        )}
      </main>

      <footer className="mt-auto">
        <Disclaimer language={language} />
      </footer>
    </div>
  );
}
