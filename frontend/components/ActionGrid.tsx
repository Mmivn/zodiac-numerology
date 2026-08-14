"use client";

export default function ActionGrid<K extends string>({
  items,
  active,
  onSelect,
}: {
  items: { key: K; label: string; description: string }[];
  active: K;
  onSelect: (key: K) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            aria-pressed={isActive}
            className={
              "card card-compact card-interactive relative p-4 sm:p-5 text-left overflow-hidden " +
              (isActive ? "card-active" : "")
            }
          >
            {isActive && (
              <span className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_8px_2px_rgba(207,169,106,0.6)]" />
            )}
            <div
              className={
                "text-sm font-semibold tracking-wide " +
                (isActive ? "text-gold-soft" : "text-foreground")
              }
            >
              {item.label}
            </div>
            <div className="text-xs text-muted mt-1.5 leading-relaxed">{item.description}</div>
          </button>
        );
      })}
    </div>
  );
}
