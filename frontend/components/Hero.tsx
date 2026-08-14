"use client";

import { SIGN_NAMES, t } from "@/lib/i18n";
import type { Language, Profile } from "@/lib/types";

export default function Hero({
  profile,
  language,
  onEdit,
}: {
  profile: Profile;
  language: Language;
  onEdit: () => void;
}) {
  const copy = t(language);
  const signName = SIGN_NAMES[language][profile.zodiac_sign] ?? profile.zodiac_sign_name;

  return (
    <div className="card p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
      <div className="flex items-center gap-4 sm:gap-5">
        <div className="relative h-16 w-16 sm:h-18 sm:w-18 shrink-0">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet/25 via-transparent to-gold/15 blur-sm" />
          <div className="relative h-full w-full rounded-full border border-gold-soft/40 flex items-center justify-center bg-surface-2/60">
            <span className="font-display text-[0.7rem] sm:text-xs text-gold-soft text-center leading-tight px-1">
              {signName}
            </span>
          </div>
        </div>
        <div>
          <div className="eyebrow mb-1">{copy.profileZodiacSign}</div>
          <div className="font-display text-xl sm:text-2xl text-foreground">
            {copy.heroGreeting(profile.name)}
          </div>
          <div className="text-xs text-muted mt-1.5 flex items-center gap-2 flex-wrap">
            <span>{signName}</span>
            <span className="text-border-strong">·</span>
            <span>
              {copy.profileLifePath} {profile.life_path_number}
            </span>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="btn-secondary px-4 py-2.5 text-xs self-start sm:self-auto shrink-0"
      >
        {copy.editProfile}
      </button>
    </div>
  );
}
