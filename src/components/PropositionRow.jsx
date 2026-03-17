import { useLayoutEffect, useMemo, useRef, useState } from 'react';

export default function PropositionRow({ prop, selected, onSelect, onMeasure, onSplit }) {
  const ref = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const tokens = useMemo(() => prop.text.split(/\s+/).filter(Boolean), [prop.text]);

  useLayoutEffect(() => {
    const measure = () => {
      if (!ref.current) return;
      onMeasure(prop.id, { top: ref.current.offsetTop, height: ref.current.offsetHeight });
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (ref.current) observer.observe(ref.current);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [onMeasure, prop.id, prop.text]);

  return (
    <div
      ref={ref}
      onClick={() => onSelect(prop.id)}
      className={`group mb-1.5 flex cursor-pointer items-stretch gap-3 rounded-[3px] border border-[#d0c8b4] px-3 py-2 transition ${selected ? 'bg-[rgba(184,150,62,0.13)]' : 'hover:bg-[rgba(184,150,62,0.06)]'}`}
    >
      <div className="w-14 shrink-0 pt-1 text-right text-sm text-stone-500">
        <span className="inline-block min-w-8">{prop.verseNum}</span>
        {prop.subLabel && <span>{prop.subLabel}</span>}
      </div>
      <div className="min-w-0 flex-1 font-body text-[1rem] leading-[1.7] text-stone-800">
        {tokens.map((word, idx) => (
          <span key={`${prop.id}-${idx}`} className="relative inline-block">
            <span>{word}</span>
            {idx < tokens.length - 1 && (
              <span
                className="relative inline-block px-[2px] text-transparent"
                onMouseEnter={(e) => {
                  e.stopPropagation();
                  setHoverIndex(idx + 1);
                }}
                onMouseLeave={(e) => {
                  e.stopPropagation();
                  setHoverIndex(null);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSplit(prop.id, idx + 1);
                  setHoverIndex(null);
                }}
              >
                {' '}
                <span className={`absolute inset-x-0 -top-[2px] text-center text-red-600 transition ${hoverIndex === idx + 1 ? 'opacity-100' : 'opacity-0'}`}>/</span>
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
