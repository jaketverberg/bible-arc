import html2canvas from 'html2canvas';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function ExportPanel({
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
  const exportPng = async () => {
    if (!workspaceRef.current) return;

    const previousShowLegend = showLegend;

    if (exportLegend && !showLegend) {
      setShowLegend(true);
      await sleep(120);
    }

    const canvas = await html2canvas(workspaceRef.current, {
      backgroundColor: exportBg === 'transparent' ? null : exportBg,
      scale: 2,
      useCORS: true,
    });

    if (exportLegend && !previousShowLegend) {
      setShowLegend(false);
    }

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'bible-arc.png';
    link.click();
  };

  const preset = ['transparent', '#f8f5ef', '#ffffff', '#171717'].includes(exportBg)
    ? exportBg
    : 'custom';

  return (
    <div className="space-y-3 text-sm text-stone-200">
      <div>
        <label className="mb-1 block text-xs uppercase tracking-[0.18em] text-stone-400">
          Background
        </label>
        <select
          value={preset}
          onChange={(e) => setExportBg(e.target.value === 'custom' ? '#d6c7a5' : e.target.value)}
          className="w-full rounded-md border border-stone-600 bg-stone-900 px-3 py-2"
        >
          <option value="transparent">Transparent</option>
          <option value="#f8f5ef">Paper</option>
          <option value="#ffffff">White</option>
          <option value="#171717">Dark</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <label className="block text-xs uppercase tracking-[0.18em] text-stone-400">
        Custom color
      </label>
      <input
        type="color"
        value={exportBg === 'transparent' ? '#f8f5ef' : exportBg}
        onChange={(e) => setExportBg(e.target.value)}
        className="h-10 w-full rounded-md border border-stone-600 bg-stone-900 p-1"
      />

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={exportLegend}
          onChange={(e) => setExportLegend(e.target.checked)}
        />
        Export PNG with legend
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={printLegend}
          onChange={(e) => setPrintLegend(e.target.checked)}
        />
        Include legend on print / PDF
      </label>

      <button
        type="button"
        onClick={() => setShowLegend((v) => !v)}
        className="rounded-md border border-stone-500 px-3 py-2 text-sm"
      >
        {showLegend ? 'Hide legend' : 'Show legend'}
      </button>

      <div className="flex gap-2">
        <button
          onClick={exportPng}
          className="rounded-md bg-gold px-3 py-2 text-sm font-semibold text-stone-900"
        >
          Export PNG
        </button>
        <button
          onClick={() => window.print()}
          className="rounded-md border border-stone-500 px-3 py-2 text-sm"
        >
          Print / PDF
        </button>
      </div>
    </div>
  );
}