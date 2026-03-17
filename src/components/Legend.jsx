import { RELATIONSHIPS, CATEGORY_COLORS } from '../constants/relationships';

export default function Legend() {
  return (
    <div className="rounded-xl border border-stone-300 bg-white/90 p-5">
      <h3 className="mb-4 text-xl font-semibold">Logical Relationships Legend</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {RELATIONSHIPS.map((rel) => (
          <div key={rel.code} className="rounded-lg border border-stone-200 p-3">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ background: CATEGORY_COLORS[rel.category] }} />
              <div className="font-semibold">{rel.code} — {rel.name}</div>
            </div>
            <div className="mt-1 text-sm text-stone-600">{rel.category}</div>
            <div className="mt-1 text-sm text-stone-500">{rel.conjunctions}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
