"use client";

/**
 * Shown in place of a reading card while an AI call is in flight —
 * elegant shimmer, not a spinner-in-a-void. Also gives Render's cold
 * start (which can take 20-40s the first time) a state that reads as
 * "working" rather than "broken".
 */
export default function ReadingSkeleton() {
  return (
    <div className="card p-6 sm:p-8 space-y-5" aria-hidden="true">
      <div className="space-y-2">
        <div className="skeleton h-2.5 w-20 rounded-full" />
        <div className="skeleton h-5 w-2/3 rounded-md" />
        <div className="divider-elegant !my-3 opacity-30" />
      </div>
      <div className="space-y-2.5">
        <div className="skeleton h-3 w-full rounded-md" />
        <div className="skeleton h-3 w-11/12 rounded-md" />
        <div className="skeleton h-3 w-4/5 rounded-md" />
      </div>
      <div className="space-y-2.5 pt-2">
        <div className="skeleton h-3.5 w-1/3 rounded-md" />
        <div className="skeleton h-3 w-full rounded-md" />
        <div className="skeleton h-3 w-5/6 rounded-md" />
      </div>
    </div>
  );
}
