import { useRef } from 'react';
import PropositionRow from './PropositionRow';

export default function TextPane({
  props,
  selected,
  onSelect,
  onMeasure,
  onSplit,
  onMerge,
}) {
  const containerRef = useRef(null);
  let lastVerse = null;

  return (
    <div ref={containerRef} className="min-w-[420px] flex-1 px-4 py-4">
      {props.map((prop) => {
        const showVerseNumber = prop.verseNum !== lastVerse;
        lastVerse = prop.verseNum;

        return (
          <PropositionRow
            key={prop.id}
            prop={prop}
            selected={selected.includes(prop.id)}
            onSelect={onSelect}
            onMeasure={onMeasure}
            onSplit={onSplit}
            onMerge={onMerge}
            showVerseNumber={showVerseNumber}
            containerRef={containerRef}
          />
        );
      })}
    </div>
  );
}