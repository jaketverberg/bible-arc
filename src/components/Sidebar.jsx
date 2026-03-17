import RelationshipPalette from './RelationshipPalette';
import BracketList from './BracketList';
import ExportPanel from './ExportPanel';

function instructions(selectedCount) {
  if (selectedCount === 0) return 'Hover between words to split a proposition, then click a row to select it.';
  if (selectedCount === 1) return 'Select one more proposition to define the bracket span.';
  return 'Now click a relationship chip to apply the bracket.';
}

export default function Sidebar({
  currentRef,
  setCurrentRef,
  onLoad,
  loading,
  selected,
  onApplyRelation,
  brackets,
  props,
  onFlip,
  onDelete,
  onUndoSplit,
  onAutoSplit,
  onResetSplits,
  onShowKey,
  workspaceRef,
  exportBg,
  setExportBg,
  exportLegend,
  setExportLegend,
}) {
  return (
    <aside className="no-print w-full shrink-0 bg-sidebar text-stone-100 lg:w-[270px] lg:min-w-[270px]">
      <div className="border-b border-stone-800 bg-sidebarHeader px-4 py-4">
        <div className="text-xl font-semibold">Bible Arcing</div>
      </div>
      <div className="h-full space-y-6 overflow-auto px-4 py-4">
        <section>
          <div className="mb-2 text-xs uppercase tracking-[0.18em] text-stone-400">Passage</div>
          <div className="space-y-2">
            <input
              value={currentRef}
              onChange={(e) => setCurrentRef(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onLoad(currentRef)}
              className="w-full rounded-md border border-stone-600 bg-stone-900 px-3 py-2 text-sm outline-none focus:border-gold"
              placeholder="Philippians 1:3-11"
            />
            <div className="flex gap-2">
              <button onClick={() => onLoad(currentRef)} disabled={loading} className="rounded-md bg-gold px-3 py-2 text-sm font-semibold text-stone-900 disabled:opacity-60">{loading ? 'Loading...' : 'Load'}</button>
              <button onClick={onShowKey} className="rounded-md border border-stone-600 px-3 py-2 text-sm">Change Key</button>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-2 text-xs uppercase tracking-[0.18em] text-stone-400">Instructions</div>
          <div className="rounded-lg border border-stone-700 bg-stone-900/60 p-3 text-sm text-stone-300">{instructions(selected.length)}</div>
        </section>

        <section>
          <div className="mb-2 text-xs uppercase tracking-[0.18em] text-stone-400">Splits</div>
          <div className="flex flex-wrap gap-2">
            <button onClick={onUndoSplit} className="rounded-md border border-stone-600 px-3 py-2 text-sm">Undo last split</button>
            <button onClick={onAutoSplit} className="rounded-md border border-stone-600 px-3 py-2 text-sm">Auto-split</button>
            <button onClick={onResetSplits} className="rounded-md border border-stone-600 px-3 py-2 text-sm">Reset splits</button>
          </div>
        </section>

        <section>
          <div className="mb-2 text-xs uppercase tracking-[0.18em] text-stone-400">Relationships</div>
          <RelationshipPalette selectedCount={selected.length} onApply={onApplyRelation} />
        </section>

        <section>
          <div className="mb-2 text-xs uppercase tracking-[0.18em] text-stone-400">Bracket List</div>
          <BracketList brackets={brackets} props={props} onFlip={onFlip} onDelete={onDelete} />
        </section>

        <section>
          <div className="mb-2 text-xs uppercase tracking-[0.18em] text-stone-400">Export</div>
          <ExportPanel
            workspaceRef={workspaceRef}
            exportBg={exportBg}
            setExportBg={setExportBg}
            exportLegend={exportLegend}
            setExportLegend={setExportLegend}
          />
        </section>
      </div>
    </aside>
  );
}
