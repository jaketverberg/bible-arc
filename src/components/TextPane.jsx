import PropositionRow from './PropositionRow';

export default function TextPane({ props, selected, onSelect, onMeasure, onSplit }) {
  return (
    <div className="min-w-[420px] flex-1 px-4 py-4">
      {props.map((prop) => (
        <PropositionRow
          key={prop.id}
          prop={prop}
          selected={selected.includes(prop.id)}
          onSelect={onSelect}
          onMeasure={onMeasure}
          onSplit={onSplit}
        />
      ))}
    </div>
  );
}
