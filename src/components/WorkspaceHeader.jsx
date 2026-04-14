export default function WorkspaceHeader({
  currentRef,
  setCurrentRef,
  onLoad,
  translation,
  translations,
  setTranslation,
  loading,
}) {
  return (
    <div className="border-b border-stone-300 bg-paper px-4 py-4">
      <div className="mb-2 text-[11px] uppercase tracking-[0.28em] text-stone-500">
        Bible Arcing Workspace
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="text-3xl font-semibold text-stone-900">
            {currentRef || 'Load a passage'}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap sm:justify-end">
          <input
            value={currentRef}
            onChange={(e) => setCurrentRef(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onLoad(currentRef)}
            className="w-full rounded-md border border-stone-400 bg-white px-3 py-2 text-sm outline-none focus:border-gold sm:w-[300px]"
            placeholder="Romans 1:1-5"
          />
          <select
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            className="w-full rounded-md border border-stone-400 bg-white px-3 py-2 text-sm outline-none focus:border-gold sm:w-[280px]"
          >
            {translations.length === 0 ? (
              <option value={translation}>{translation}</option>
            ) : (
              translations.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))
            )}
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => onLoad(currentRef)}
              disabled={loading}
              className="rounded-md bg-gold px-3 py-2 text-sm font-semibold text-stone-900 disabled:opacity-60"
            >
              {loading ? 'Loading...' : 'Load'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
