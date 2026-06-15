import { useLayoutEffect, useRef, useState } from 'react';
import PropositionRow from './PropositionRow';

export default function TextPane({ props, selected, onMeasure, onSplit, onMerge }) {
  const containerRef = useRef(null);
  // Incremented whenever the container resizes (e.g. fonts load, window resizes,
  // sidebar toggles). PropositionRow includes this in its effect deps so all rows
  // re-measure at the same time, keeping circles aligned with their actual rows.
  const [remeasureToken, setRemeasureToken] = useState(0);
  let lastVerse = null;

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setRemeasureToken((v) => v + 1);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="min-w-[420px] flex-1 px-4 py-4">
      {props.map((prop) => {
        const showVerseNumber = prop.verseNum !== lastVerse;
        lastVerse = prop.verseNum;

        return (
          <PropositionRow
            key={prop.id}
            prop={prop}
            selected={selected.includes(`p:${prop.id}`)}
            onMeasure={onMeasure}
            onSplit={onSplit}
            onMerge={onMerge}
            showVerseNumber={showVerseNumber}
            containerRef={containerRef}
            remeasureToken={remeasureToken}
          />
        );
      })}
    </div>
  );
}
