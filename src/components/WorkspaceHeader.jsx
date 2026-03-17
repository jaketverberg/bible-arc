export default function WorkspaceHeader({ currentRef }) {
  return (
    <div className="flex items-center justify-between border-b border-stone-300 bg-paper px-4 py-3">
      <div>
        <div className="text-xs uppercase tracking-[0.24em] text-stone-500">Bible Arcing Workspace</div>
        <div className="text-xl font-semibold text-stone-800">{currentRef || 'Load a passage to begin'}</div>
      </div>
    </div>
  );
}
