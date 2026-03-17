import { REL_BY_CODE } from '../constants/relationships';

function propNodeId(propId) {
  return `p:${propId}`;
}

function isPropNode(nodeId) {
  return String(nodeId).startsWith('p:');
}

function isBracketNode(nodeId) {
  return String(nodeId).startsWith('b:');
}

function numericNodeId(nodeId) {
  return Number(String(nodeId).split(':')[1]);
}

function toNodeId(value) {
  if (typeof value === 'string' && (value.startsWith('p:') || value.startsWith('b:'))) {
    return value;
  }
  return propNodeId(value);
}

function buildBracketMap(brackets) {
  return new Map(brackets.map((br) => [br.id, br]));
}

function buildPropOrderMap(props) {
  return new Map(props.map((prop, idx) => [prop.id, idx]));
}

function getNodeRange(nodeId, propsById, propOrderMap, bracketMap, cache = new Map()) {
  if (cache.has(nodeId)) return cache.get(nodeId);

  if (isPropNode(nodeId)) {
    const propId = numericNodeId(nodeId);
    const index = propOrderMap.get(propId) ?? 0;
    const result = {
      topIndex: index,
      bottomIndex: index,
      startPropId: propId,
      endPropId: propId,
    };
    cache.set(nodeId, result);
    return result;
  }

  if (isBracketNode(nodeId)) {
    const bracketId = numericNodeId(nodeId);
    const bracket = bracketMap.get(bracketId);

    if (!bracket) {
      const fallback = {
        topIndex: 0,
        bottomIndex: 0,
        startPropId: null,
        endPropId: null,
      };
      cache.set(nodeId, fallback);
      return fallback;
    }

    const a = getNodeRange(
      toNodeId(bracket.fromId ?? bracket.from),
      propsById,
      propOrderMap,
      bracketMap,
      cache
    );
    const b = getNodeRange(
      toNodeId(bracket.toId ?? bracket.to),
      propsById,
      propOrderMap,
      bracketMap,
      cache
    );

    const result = {
      topIndex: Math.min(a.topIndex, b.topIndex),
      bottomIndex: Math.max(a.bottomIndex, b.bottomIndex),
      startPropId: a.topIndex <= b.topIndex ? a.startPropId : b.startPropId,
      endPropId: a.bottomIndex >= b.bottomIndex ? a.endPropId : b.endPropId,
    };

    cache.set(nodeId, result);
    return result;
  }

  const fallback = {
    topIndex: 0,
    bottomIndex: 0,
    startPropId: null,
    endPropId: null,
  };
  cache.set(nodeId, fallback);
  return fallback;
}

function formatRange(bracket, props, brackets) {
  const propsById = new Map(props.map((p) => [p.id, p]));
  const propOrderMap = buildPropOrderMap(props);
  const bracketMap = buildBracketMap(brackets);
  const range = getNodeRange(`b:${bracket.id}`, propsById, propOrderMap, bracketMap);

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
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: bracket.color }}
                />
                <span className="font-semibold">{rel.labels.join(' / ')}</span>
              </div>

              <div className="flex items-center gap-1">
                {rel.flippable && (
                  <button
                    onClick={() => onFlip(bracket.id)}
                    className="rounded border border-stone-600 px-2 py-1 text-xs"
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