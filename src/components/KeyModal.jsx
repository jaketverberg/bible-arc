export default function KeyModal({ open, value, onChange, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-stone-700 bg-sidebar p-6 text-stone-100 shadow-2xl">
        <h2 className="mb-2 text-2xl font-semibold">Enter your ESV API key</h2>
        <p className="mb-4 text-sm text-stone-300">
          Your key is stored only in localStorage on this device.
        </p>
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-stone-600 bg-stone-900 px-3 py-2 text-sm outline-none focus:border-gold"
          placeholder="ESV API token"
        />
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-stone-500 px-4 py-2 text-sm">Save</button>
        </div>
      </div>
    </div>
  );
}
