import { useEffect, useMemo, useRef, useState } from 'react';
import { REL_BY_CODE, REL_GROUPS } from '../constants/relationships';

export default function BracketPane({
  brackets,
  paneWidth,
  paneHeight,
  onUpdate,
  onDelete,
  onFlip,
  rowAnchors = [],
  bracketAnchors = [],
  pendingAnchor = null,
  onAnchorClick,
}) {
  const [activeId, setActiveId] = useState(null);
  const paneDivRef = useRef(null);

  const active = useMemo(
    () => brackets.find((br) => br.id === activeId) || null,
    [brackets, activeId]
  );

  // Auto-close popover when the active bracket is deleted.
  useEffect(() => {
    if (activeId !== null && !brackets.find((br) => br.id === activeId)) {
      setActiveId(null);
    }
  }, [brackets, activeId]);

  // Close popover on Escape key.
  useEffect(() => {
    if (!activeId) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveId(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeId]);

  // Close popover when clicking outside the bracket pane.
  useEffect(() => {
    if (!activeId) return;
    const handleClickOutside = (e) => {
      if (paneDivRef.current && !paneDivRef.current.contains(e.target)) {
        setActiveId(null);
      }
    };
    // Use capture phase so this fires before bubbling stops it.
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [activeId]);

  const findOverlapX = (target, isTop) => {
    const currentY = isTop ? target.yTop : target.yBottom;
    const inner = brackets
      .filter(
        (candidate) =>
          candidate.col > target.col &&
          currentY >= candidate.yTop &&
          currentY <= candidate.yBottom
      )
      .sort((a, b) => a.col - b.col)[0];

    return inner ? inner.stemX : paneWidth - 10;
  };

  // Position the popover to the right of the stem, clamped so it never
  // clips off the right edge of the viewport.
  const popoverLeft = active
    ? Math.max(8, (active.stemX || 24) + 18)
    : 0;
  const popoverTop = active
    ? Math.max(8, (active.anchorY || 0) - 36)
    : 0;

  return (
    <div
      ref={paneDivRef}
      className="relative border-r border-stone-300 bg-paper/70"
      style={{ width: paneWidth, minWidth: paneWidth }}
    >
      <svg
        width={paneWidth}
        height={Math.max(paneHeight, 200)}
        className="overflow-visible"
        aria-hidden="true"
      >
        {/* Row anchors — one per proposition */}
        {rowAnchors.map((anchor) => {
          const isPending = pendingAnchor === anchor.id;
          return (
            <circle
              key={anchor.id}
              cx={paneWidth - 10}
              cy={anchor.y}
              r={isPending ? 6 : 5}
              fill={isPending ? '#b8963e' : '#ddd8ca'}
              opacity={isPending ? 0.95 : 0.6}
              className="cursor-pointer transition hover:opacity-100"
              onClick={() => onAnchorClick?.(anchor.id)}
              role="button"
              aria-label="Select proposition anchor"
            />
          );
        })}

        {/* Bracket lines and labels */}
        {brackets.map((bracket) => {
          const topX2 = findOverlapX(bracket, true);
          const bottomX2 = findOverlapX(bracket, false);
          const rel = REL_BY_CODE[bracket.code];
          if (!rel) return null;
          const labels = bracket.flipped ? [...rel.labels].reverse() : rel.labels;
          const topLabelX = (bracket.stemX + topX2) / 2;
          const bottomLabelX = (bracket.stemX + bottomX2) / 2;
          const isActive = bracket.id === activeId;

          return (
            <g key={bracket.id} className="cursor-pointer" onClick={() => setActiveId(bracket.id)}>
              {/* Invisible wide hit area on the stem for easier clicking */}
              <line
                x1={bracket.stemX}
                y1={bracket.yTop}
                x2={bracket.stemX}
                y2={bracket.yBottom}
                stroke="transparent"
                strokeWidth="10"
              />
              {/* Visible stem */}
              <line
                x1={bracket.stemX}
                y1={bracket.yTop}
                x2={bracket.stemX}
                y2={bracket.yBottom}
                stroke={bracket.color}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {/* Top arm */}
              <line
                x1={bracket.stemX}
                y1={bracket.yTop}
                x2={topX2}
                y2={bracket.yTop}
                stroke={bracket.color}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {/* Bottom arm */}
              <line
                x1={bracket.stemX}
                y1={bracket.yBottom}
                x2={bottomX2}
                y2={bracket.yBottom}
                stroke={bracket.color}
                strokeWidth={isActive ? 2.5 : 2}
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
            </g>
          );
        })}

        {/* Bracket anchors — for nested bracket connections */}
        {bracketAnchors.map((anchor) => {
          const isPending = pendingAnchor === anchor.id;
          return (
            <circle
              key={anchor.id}
              cx={anchor.x}
              cy={anchor.y}
              r={isPending ? 6 : 5}
              fill={isPending ? '#b8963e' : '#ddd8ca'}
              opacity={isPending ? 0.95 : 0.45}
              className="cursor-pointer transition hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onAnchorClick?.(anchor.id);
              }}
              role="button"
              aria-label="Select bracket anchor"
            />
          );
        })}

        {/* Delete button on active bracket */}
        {active && (
          <g
            transform={`translate(${active.stemX - 8}, ${active.yTop - 10})`}
            className="cursor-pointer"
            onClick={() => {
              onDelete(active.id);
              setActiveId(null);
            }}
            role="button"
            aria-label="Delete bracket"
          >
            <circle cx="0" cy="0" r="8" fill="#ffffff" stroke="#7c2d12" />
            <text x="0" y="4" textAnchor="middle" fontSize="12" fill="#7c2d12">
              ×
            </text>
          </g>
        )}
      </svg>

      {/* Edit popover — renders inside the pane div so it inherits z-index stacking */}
      {active && (
        <div
          className="absolute z-20 w-64 rounded-lg border border-stone-300 bg-white p-3 shadow-xl"
          style={{ left: popoverLeft, top: popoverTop }}
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold text-stone-800">Edit bracket</div>
            <button
              onClick={() => setActiveId(null)}
              className="text-stone-400 hover:text-stone-700"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="max-h-72 space-y-2 overflow-auto pr-1">
            {REL_GROUPS.map((group) => (
              <div key={group.category}>
                <div className="mb-1 text-xs uppercase tracking-[0.18em] text-stone-400">
                  {group.category}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <button
                      key={item.code}
                      onClick={() => {
                        onUpdate(active.id, { code: item.code });
                        setActiveId(null);
                      }}
                      className="rounded-full border px-2 py-1 text-xs transition hover:opacity-80"
                      style={{
                        borderColor: group.color,
                        color: group.color,
                        background: `${group.color}18`,
                      }}
                      title={`${item.name} — ${item.conjunctions}`}
                    >
                      {item.code}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-2 border-t border-stone-100 pt-3">
            {REL_BY_CODE[active.code]?.flippable && (
              <button
                onClick={() => onFlip(active.id)}
                className="rounded border border-stone-300 px-2 py-1 text-xs text-stone-700 hover:bg-stone-50"
              >
                Flip direction
              </button>
            )}
            <button
              onClick={() => {
                onDelete(active.id);
                setActiveId(null);
              }}
              className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
