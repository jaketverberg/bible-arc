import { useState } from 'react';
import RelationshipPalette from './RelationshipPalette';
import BracketList from './BracketList';
import ExportPanel from './ExportPanel';

function instructions(selectedCount) {
  if (selectedCount === 0) return 'Click one faint circle, then another, and choose a relationship.';
  if (selectedCount === 1) return 'Choose one more faint circle to define the bracket span.';
  return 'Now click a relationship chip to apply the bracket.';
}

export default function Sidebar({
  selected,
  onApplyRelation,
  brackets,
  props,
  onFlip,
  onDelete,
  onUndoSplit,
  onAutoSplit,
  onResetSplits,
  workspaceRef,
  exportBg,
  setExportBg,
  exportLegend,
  setExportLegend,
  showLegend,
  setShowLegend,
  printLegend,
  setPrintLegend,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const toolsContent = (
    <>
      <section className="space-y-3">
        <button
          type="button"
          onClick={() => setShowInstructions((v) => !v)}
          className="flex w-full items-center justify-between rounded-md border border-stone-700 bg-stone-900/60 px-3 py-2 text-left text-sm"
        >
          <span className="text-xs uppercase tracking-[0.18em] text-stone-300">Instructions</span>
          <span className="text-stone-400">{showInstructions ? '−' : '+'}</span>
        </button>

        {showInstructions && (
          <div className="rounded-lg border border-stone-700 bg-stone-900/60 p-3 text-sm text-stone-300">
            {instructions(selected.length)}
          </div>
        )}
      </section>

      <section>
        <div className="mb-2 text-xs uppercase tracking-[0.18em] text-stone-400">Splits</div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onUndoSplit}
            className="rounded-md border border-stone-600 px-2 py-2 text-xs"
            title="Undo last split"
          >
            Undo
          </button>
          <button
            onClick={onAutoSplit}
            className="rounded-md border border-stone-600 px-2 py-2 text-xs"
            title="Auto-split"
          >
            Auto
          </button>
          <button
            onClick={onResetSplits}
            className="rounded-md border border-stone-600 px-2 py-2 text-xs"
            title="Reset splits"
          >
            Reset
          </button>
        </div>
      </section>

      <section>
        <div className="mb-2 text-xs uppercase tracking-[0.18em] text-stone-400">Relationships</div>
        <RelationshipPalette selectedCount={selected.length} onApply={onApplyRelation} />
        <p className="mt-2 text-xs text-stone-400">
          To apply Ground or Inference to a single verse&apos;s content, split the verse first.
        </p>
      </section>

      <section className="min-h-0 flex-1">
        <div className="mb-2 text-xs uppercase tracking-[0.18em] text-stone-400">Bracket List</div>
        <div className="max-h-full overflow-y-auto pr-1">
          <BracketList brackets={brackets} props={props} onFlip={onFlip} onDelete={onDelete} />
        </div>
      </section>
    </>
  );

  const exportContent = (
    <section className="border-t border-stone-800 px-4 py-4">
      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-stone-400">Export</div>
      <ExportPanel
        workspaceRef={workspaceRef}
        exportBg={exportBg}
        setExportBg={setExportBg}
        exportLegend={exportLegend}
        setExportLegend={setExportLegend}
        showLegend={showLegend}
        setShowLegend={setShowLegend}
        printLegend={printLegend}
        setPrintLegend={setPrintLegend}
      />
    </section>
  );

  const fullContent = (
    <div className="flex h-full flex-col">
      <div className="border-b border-stone-800 bg-sidebarHeader px-4 py-4">
        <div className="text-xl font-semibold">Bible Arcing</div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
          {toolsContent}
        </div>
        {exportContent}
      </div>
    </div>
  );

  return (
    <>
      <aside className="no-print hidden shrink-0 bg-sidebar text-stone-100 lg:sticky lg:top-0 lg:block lg:h-screen lg:w-[270px] lg:min-w-[270px]">
        {fullContent}
      </aside>

      <div className="no-print lg:hidden">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="fixed bottom-4 right-4 z-40 rounded-full bg-sidebar px-4 py-3 text-sm font-semibold text-stone-100 shadow-xl"
        >
          {mobileOpen ? 'Close tools' : 'Open tools'}
        </button>
        {mobileOpen && <div className="fixed inset-0 z-40 bg-black/35" onClick={() => setMobileOpen(false)} />}
        <aside
          className={`fixed inset-x-0 bottom-0 z-50 max-h-[88vh] rounded-t-2xl bg-sidebar text-stone-100 shadow-2xl transition-transform ${
            mobileOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          {fullContent}
        </aside>
      </div>
    </>
  );
}