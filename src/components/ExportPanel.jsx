import html2canvas from 'html2canvas';

export default function ExportPanel({ workspaceRef, exportBg, setExportBg, exportLegend, setExportLegend }) {
  const exportPng = async () => {
    if (!workspaceRef.current) return;
    const canvas = await html2canvas(workspaceRef.current, {
      backgroundColor: exportBg === 'transparent' ? null : exportBg,
      scale: 2,
      useCORS: true,
    });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'bible-arc.png';
    link.click();
  };

  return (
    <div className="space-y-3 text-sm text-stone-200">
      <div>
        <label className="mb-1 block text-xs uppercase tracking-[0.18em] text-stone-400">Background</label>
        <select value={exportBg} onChange={(e) => setExportBg(e.target.value)} className="w-full rounded-md border border-stone-600 bg-stone-900 px-3 py-2">
          <option value="transparent">Transparent</option>
          <option value="#f8f5ef">Paper</option>
          <option value="#ffffff">White</option>
          <option value="#171717">Dark</option>
        </select>
      </div>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={exportLegend} onChange={(e) => setExportLegend(e.target.checked)} />
        Export with legend
      </label>
      <div className="flex gap-2">
        <button onClick={exportPng} className="rounded-md bg-gold px-3 py-2 text-sm font-semibold text-stone-900">Export PNG</button>
        <button onClick={() => window.print()} className="rounded-md border border-stone-500 px-3 py-2 text-sm">Print / PDF</button>
      </div>
    </div>
  );
}
