import { useMemo, useState } from 'react';
import { REL_BY_CODE, REL_GROUPS } from '../constants/relationships';

const COL_W = 28;
const LEFT_MARGIN = 4;

export default function BracketPane({
  brackets,
  paneWidth,
  paneHeight,
  onUpdate,
  onDelete,
  onFlip,
  rowAnchors = [],
  nCols = 1,
  pendingAnchor = null,
  onAnchorClick,
}) {
  const [activeId, setActiveId] = useState(null);
  const active = useMemo(() => brackets.find((br) => br.id === activeId) || null, [brackets, activeId]);

  const findOverlapX = (target, isTop) => {
    const currentY = isTop ? target.yTop : target.yBottom;
    const inner = brackets
      .filter((candidate) => candidate.col > target.col && currentY >= candidate.yTop && currentY <= candidate.yBottom)
      .sort((a, b) => a.col - b.col)[0];

    return inner ? inner.stemX : target.stemX + 10;
  };

  const popoverStyle = active
    ? {
        left: Math.max(8, Math.min((active.stemX || 24) + 12, paneWidth - 260)),
        top: Math.max(8, (active.yTop || 0) - 4),
      }
    : null;

  const anchorColumns = Math.max(1, nCols + 1);

  return (
    <div
      className="relative border-r border-stone-300 bg-paper/70"
      style={{ width: paneWidth, minWidth: paneWidth }}
    >
      <svg width={paneWidth} height={Math.max(paneHeight, 200)} className="overflow-visible">
        {rowAnchors.flatMap((anchor) =>
          Array.from({ length: anchorColumns }).map((_, i) => {
            const cx = LEFT_MARGIN + i * COL_W + 10;
            const isPending = pendingAnchor === anchor.propId && i === anchorColumns - 1;
            return (
              <circle
                key={`anchor-${anchor.propId}-${i}`}
                cx={cx}
                cy={anchor.y}
                r={isPending ? 6 : 5}
                fill={isPending ? '#b8963e' : '#ddd8ca'}
                opacity={isPending ? 0.95 : 0.55}
                className="cursor-pointer transition hover:opacity-100"
                onClick={() => onAnchorClick?.(anchor.propId)}
              />
            );
          })
        )}

        {brackets.map((bracket) => {
          const topX2 = findOverlapX(bracket, true);
          const bottomX2 = findOverlapX(bracket, false);
          const rel = REL_BY_CODE[bracket.code];
          const labels = bracket.flipped ? [...rel.labels].reverse() : rel.labels;
          const topLabelX = (bracket.stemX + topX2) / 2;
          const bottomLabelX = (bracket.stemX + bottomX2) / 2;

          return (
            <g
              key={bracket.id}
              onMouseLeave={() => setActiveId((id) => (id === bracket.id ? null : id))}
            >
              <line
                x1={bracket.stemX}
                y1={bracket.yTop}
                x2={bracket.stemX}
                y2={bracket.yBottom}
                stroke={bracket.color}
                strokeWidth="2"
              />
              <line
                x1={bracket.stemX}
                y1={bracket.yTop}
                x2={topX2}
                y2={bracket.yTop}
                stroke={bracket.color}
                strokeWidth="2"
                className="cursor-pointer"
                onClick={() => setActiveId(bracket.id)}
              />
              <line
                x1={bracket.stemX}
                y1={bracket.yBottom}
                x2={bottomX2}
                y2={bracket.yBottom}
                stroke={bracket.color}
                strokeWidth="2"
                className="cursor-pointer"
                onClick={() => setActiveId(bracket.id)}
              />

              <text
                x={topLabelX}
                y={bracket.yTop - 8}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill={bracket.color}
              >
                {labels[0]}
              </text>

              {labels[1] && (
                <text
                  x={bottomLabelX}
                  y={bracket.yBottom + 14}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill={bracket.color}
                >
                  {labels[1]}
                </text>
              )}

              {activeId === bracket.id && (
                <g transform={`translate(${bracket.stemX - 8}, ${bracket.yTop - 10})`}>
                  <circle
                    cx="0"
                    cy="0"
                    r="8"
                    fill="#ffffff"
                    stroke="#7c2d12"
                    className="cursor-pointer"
                    onClick={() => onDelete(bracket.id)}
                  />
                  <text x="0" y="4" textAnchor="middle" fontSize="12" fill="#7c2d12">
                    ×
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {active && popoverStyle && (
        <div
          className="absolute z-10 w-64 rounded-lg border border-stone-300 bg-white p-3 shadow-xl"
          style={popoverStyle}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="font-semibold">Edit bracket</div>
            <button onClick={() => setActiveId(null)} className="text-stone-500">
              ×
            </button>
          </div>

          <div className="max-h-72 space-y-2 overflow-auto pr-1">
            {REL_GROUPS.map((group) => (
              <div key={group.category}>
                <div className="mb-1 text-xs uppercase tracking-[0.18em] text-stone-500">
                  {group.category}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <button
                      key={item.code}
                      onClick={() => onUpdate(active.id, { code: item.code })}
                      className="rounded-full border px-2 py-1 text-xs"
                      style={{
                        borderColor: group.color,
                        color: group.color,
                        background: `${group.color}18`,
                      }}
                    >
                      {item.code}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            {REL_BY_CODE[active.code].flippable && (
              <button onClick={() => onFlip(active.id)} className="rounded border px-2 py-1 text-xs">
                Flip direction
              </button>
            )}
            <button onClick={() => onDelete(active.id)} className="rounded border px-2 py-1 text-xs">
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}