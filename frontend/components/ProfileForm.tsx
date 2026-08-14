"use client";

import { useState } from "react";

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
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card card-glow p-6 sm:p-8 space-y-5 w-full max-w-md">
      <div>
        <h2 className="text-xl font-semibold mb-1">{copy.onboardingTitle}</h2>
        <ul className="text-xs text-muted space-y-1 mt-3">
          {copy.onboardingPoints.map((point) => (
            <li key={point} className="flex items-center gap-2">
              <span className="text-gold">✦</span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <label className="text-sm text-muted block mb-1.5">{copy.askName}</label>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={copy.namePlaceholder}
          className="input-field w-full p-3 text-sm"
        />
      </div>

      <div>
        <label className="text-sm text-muted block mb-1.5">{copy.askBirthDate}</label>
        <input
          type="text"
          value={birthDate}
          onChange={(event) => setBirthDate(event.target.value)}
          placeholder={copy.birthDatePlaceholder}
          className="input-field w-full p-3 text-sm"
        />
      </div>

      <ConsentGate language={language} checked={consent} onChange={onConsentChange} />

      {error && <p className="text-sm text-red">{error}</p>}

      <button type="submit" disabled={saving} className="btn-primary w-full py-3 text-sm">
        {saving ? copy.loadingReading : copy.saveButton}
      </button>
    </form>
  );
}
