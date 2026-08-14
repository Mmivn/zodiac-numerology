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
            className={
              "card p-4 text-left transition-colors " +
              (isActive ? "card-glow border-violet" : "hover:border-violet/60")
            }
          >
            <div className="text-sm font-semibold text-foreground">{item.label}</div>
            <div className="text-xs text-muted mt-1">{item.description}</div>
          </button>
        );
      })}
    </div>
  );
}
