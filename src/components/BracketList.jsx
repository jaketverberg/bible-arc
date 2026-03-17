import { REL_BY_CODE } from '../constants/relationships';

function formatRange(bracket, props) {
  const a = props.find((p) => p.id === bracket.from);
  const b = props.find((p) => p.id === bracket.to);
  if (!a || !b) return '—';
  const start = `v${a.verseNum}${a.subLabel}`;
  const end = `v${b.verseNum}${b.subLabel}`;
  return `${start}–${end}`;
}

export default function BracketList({ brackets, props, onFlip, onDelete }) {
  return (
    <div className="space-y-2">
      {brackets.length === 0 && <div className="text-sm text-stone-400">No brackets yet.</div>}
      {[...brackets].reverse().map((bracket) => {
        const rel = REL_BY_CODE[bracket.code];
        return (
          <div key={bracket.id} className="rounded-lg border border-stone-700 bg-stone-900/60 p-3 text-sm text-stone-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: bracket.color }} />
                <span className="font-semibold">{rel.labels.join(' / ')}</span>
              </div>
              <div className="flex items-center gap-1">
                {rel.flippable && (
                  <button onClick={() => onFlip(bracket.id)} className="rounded border border-stone-600 px-2 py-1 text-xs">⇄</button>
                )}
                <button onClick={() => onDelete(bracket.id)} className="rounded border border-stone-600 px-2 py-1 text-xs">Delete</button>
              </div>
            </div>
            <div className="mt-1 text-xs text-stone-400">{formatRange(bracket, props)} • {rel.name}</div>
          </div>
        );
      })}
    </div>
  );
}
