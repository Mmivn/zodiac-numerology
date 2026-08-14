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
      <header className="max-w-4xl w-full mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-4 flex items-center justify-between gap-4">
        {/* Keyed on language so a language switch replays the reveal
            animation on the title block — a visible confirmation the
            change took effect, without an effect calling setState. */}
        <div key={language} className="reveal">
          <span className="eyebrow">Astrology · Numerology · AI</span>
          <h1 className="font-display text-2xl sm:text-3xl text-foreground mt-1.5">
            {copy.appTitle}
          </h1>
          <p className="text-xs text-muted mt-1.5 hidden sm:block max-w-sm leading-relaxed">
            {copy.appSubtitle}
          </p>
        </div>
        <LanguageSelector language={language} onChange={handleLanguageChange} />
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
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

            <div className="flex gap-1.5 p-1 rounded-xl bg-surface-2/60 backdrop-blur-sm border border-border w-fit">
              {(["zodiac", "numerology"] as Tab[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  aria-pressed={tab === key}
                  className={
                    "px-4 sm:px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ease-out " +
                    (tab === key
                      ? "bg-violet/25 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(111,98,214,0.45),0_6px_16px_-6px_rgba(111,98,214,0.35)] -translate-y-px"
                      : "text-muted hover:text-foreground-dim hover:bg-white/5")
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
