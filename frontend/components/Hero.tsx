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
    <div className="card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full border-2 border-violet flex items-center justify-center shrink-0 bg-gradient-to-br from-violet/20 to-transparent">
          <span className="text-xs font-semibold text-violet-soft text-center leading-tight px-1">
            {signName}
          </span>
        </div>
        <div>
          <div className="text-lg font-semibold">{copy.heroGreeting(profile.name)}</div>
          <div className="text-xs text-muted mt-0.5">
            {copy.profileZodiacSign}: {signName} · {copy.profileLifePath}: {profile.life_path_number}
          </div>
        </div>
      </div>
      <button type="button" onClick={onEdit} className="btn-secondary px-4 py-2 text-xs self-start sm:self-auto">
        {copy.editProfile}
      </button>
    </div>
  );
}
