import { REL_BY_CODE } from '../constants/relationships';
import { bracketNodeId, getNodeRange } from '../utils/nodeIds';

function buildBracketMap(brackets) {
  return new Map(brackets.map((br) => [br.id, br]));
}

function buildPropOrderMap(props) {
  return new Map(props.map((prop, idx) => [prop.id, idx]));
}

function formatRange(bracket, props, brackets) {
  const propsById = new Map(props.map((p) => [p.id, p]));
  const propOrderMap = buildPropOrderMap(props);
  const bracketMap = buildBracketMap(brackets);
  const range = getNodeRange(bracketNodeId(bracket.id), propOrderMap, bracketMap);

  const start = propsById.get(range.startPropId);
  const end = propsById.get(range.endPropId);

  if (!start || !end) return '—';

  return `v${start.verseNum}${start.subLabel}–v${end.verseNum}${end.subLabel}`;
}

export default function BracketList({ brackets, props, onFlip, onDelete }) {
  return (
    <div className="space-y-2">
      {brackets.length === 0 && <div className="text-sm text-stone-400">No brackets yet.</div>}

      {[...brackets].reverse().map((bracket) => {
        const rel = REL_BY_CODE[bracket.code];

        return (
          <div
            key={bracket.id}
            className="rounded-lg border border-stone-700 bg-stone-900/60 p-3 text-sm text-stone-200"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: bracket.color }}
                />
                <span className="font-semibold">{rel.labels.join(' / ')}</span>
              </div>

              <div className="flex items-center gap-1">
                {rel.flippable && (
                  <button
                    onClick={() => onFlip(bracket.id)}
                    className="rounded border border-stone-600 px-2 py-1 text-xs"
                    title="Flip label direction"
                  >
                    ⇄
                  </button>
                )}
                <button
                  onClick={() => onDelete(bracket.id)}
                  className="rounded border border-stone-600 px-2 py-1 text-xs"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="mt-1 text-xs text-stone-400">
              {formatRange(bracket, props, brackets)} • {rel.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
