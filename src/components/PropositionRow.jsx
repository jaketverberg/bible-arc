import { useLayoutEffect, useMemo, useRef, useState } from 'react';

export default function PropositionRow({
  prop,
  selected,
  onMeasure,
  onSplit,
  onMerge,
  showVerseNumber,
  containerRef,
}) {
  const ref = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const tokens = useMemo(() => prop.text.split(/\s+/).filter(Boolean), [prop.text]);

  useLayoutEffect(() => {
    const measure = () => {
      if (!ref.current || !containerRef?.current) return;
      const rowRect = ref.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      onMeasure(prop.id, {
        top: rowRect.top - containerRect.top + containerRef.current.scrollTop,
        height: rowRect.height,
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    if (ref.current) observer.observe(ref.current);
    window.addEventListener('resize', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [containerRef, onMeasure, prop.id, prop.text]);

  return (
    <div
      ref={ref}
      className={`group mb-1.5 flex items-stretch gap-3 rounded-[3px] border border-[#d0c8b4] px-3 py-2 transition ${
        selected ? 'bg-[rgba(184,150,62,0.13)]' : 'hover:bg-[rgba(184,150,62,0.04)]'
      }`}
    >
      <div className="w-16 shrink-0 pt-1 text-right text-sm text-stone-500">
        <span className="inline-block min-w-8">{showVerseNumber ? prop.verseNum : ''}</span>
        {prop.subLabel && <span>{prop.subLabel}</span>}
      </div>

      <div className="min-w-0 flex-1 font-body text-[1rem] leading-[1.7] text-stone-800">
        {tokens.map((word, idx) => (
          <span key={`${prop.id}-${idx}`} className="inline">
            <span>{word}</span>

            {idx < tokens.length - 1 && (
              <button
                type="button"
                aria-label="Split here"
                className="relative inline-flex h-[1.35em] w-4 translate-y-[0.08em] items-center justify-center align-baseline"
                onMouseEnter={() => setHoverIndex(idx + 1)}
                onMouseLeave={() => setHoverIndex(null)}
                onClick={() => {
                  onSplit(prop.id, idx + 1);
                  setHoverIndex(null);
                }}
              >
                <span
                  className={`h-[1.15em] w-[2px] rounded bg-red-600 transition ${
                    hoverIndex === idx + 1 ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </button>
            )}
          </span>
        ))}
      </div>

      {prop.subLabel && (
        <button
          type="button"
          onClick={() => onMerge(prop.id)}
          className="self-start rounded px-1 text-stone-400 transition hover:text-red-700"
          title="Remove split and merge upward"
        >
          ×
        </button>
      )}
    </div>
  );
}