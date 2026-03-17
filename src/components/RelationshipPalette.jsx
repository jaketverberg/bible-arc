import { REL_GROUPS } from '../constants/relationships';

export default function RelationshipPalette({ selectedCount, onApply }) {
  return (
    <div className="space-y-4">
      {REL_GROUPS.map((group) => (
        <div key={group.category}>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-300">{group.category}</div>
          <div className="flex flex-wrap gap-2">
            {group.items.map((rel) => (
              <button
                key={rel.code}
                title={`${rel.name} • ${rel.conjunctions}`}
                disabled={selectedCount !== 2}
                onClick={() => onApply(rel.code)}
                className="rounded-full border px-3 py-1 text-sm transition disabled:cursor-not-allowed disabled:opacity-40"
                style={{ borderColor: group.color, color: group.color, background: `${group.color}18` }}
              >
                {rel.code}
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="text-xs leading-5 text-stone-400">To apply Ground or Inference to a single verse&apos;s content, split the verse first.</p>
    </div>
  );
}
