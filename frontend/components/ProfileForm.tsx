"use client";

import { useRef, useState } from "react";

import { ApiError, createProfile } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { Language, Profile } from "@/lib/types";
import ConsentGate from "./ConsentGate";

export default function ProfileForm({
  language,
  consent,
  onConsentChange,
  onSaved,
  existing,
}: {
  language: Language;
  consent: boolean;
  onConsentChange: (value: boolean) => void;
  onSaved: (profile: Profile) => void;
  existing?: Profile | null;
}) {
  const copy = t(language);
  const [name, setName] = useState(existing?.name ?? "");
  const [birthDate, setBirthDate] = useState(existing?.birth_date ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inFlightRef = useRef(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(copy.emptyName);
      return;
    }
    if (!birthDate.trim()) {
      setError(copy.invalidDate);
      return;
    }
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    setSaving(true);
    try {
      const profile = await createProfile(trimmedName, birthDate.trim(), language);
      onSaved(profile);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError(copy.errorGeneric);
      }
    } finally {
      inFlightRef.current = false;
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card card-glow p-7 sm:p-9 space-y-6 w-full max-w-md">
      <div>
        <span className="eyebrow">{copy.appTitle.replace(/^[^\p{L}]*/u, "")}</span>
        <h2 className="font-display text-2xl sm:text-[1.75rem] text-foreground mt-2 leading-tight">
          {copy.onboardingTitle}
        </h2>
        <ul className="text-xs text-muted space-y-1.5 mt-4">
          {copy.onboardingPoints.map((point) => (
            <li key={point} className="flex items-center gap-2.5">
              <span className="text-gold-soft text-[0.6rem]">✦</span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      <div className="divider-elegant !my-0" />

      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted uppercase tracking-wide block mb-2">{copy.askName}</label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={copy.namePlaceholder}
            className="input-field w-full px-3.5 py-3 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-muted uppercase tracking-wide block mb-2">
            {copy.askBirthDate}
          </label>
          <input
            type="text"
            value={birthDate}
            onChange={(event) => setBirthDate(event.target.value)}
            placeholder={copy.birthDatePlaceholder}
            className="input-field w-full px-3.5 py-3 text-sm"
          />
        </div>
      </div>

      <ConsentGate language={language} checked={consent} onChange={onConsentChange} />

      {error && <p className="text-sm text-red">{error}</p>}

      <button type="submit" disabled={saving} className="btn-primary w-full py-3.5 text-sm">
        {saving ? copy.loadingReading : copy.saveButton}
      </button>
    </form>
  );
}
