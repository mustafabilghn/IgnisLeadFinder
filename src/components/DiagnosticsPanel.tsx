import type { AppStatus } from "@/lib/config";

export function DiagnosticsPanel({ status }: { status: AppStatus }) {
  const rows = [
    {
      label: "Google Places API",
      ok: status.businessMode === "mock" ? null : status.googleConfigured,
      okText: "Configured",
      badText: "Missing GOOGLE_MAPS_API_KEY",
      note: status.businessMode === "mock" ? "Skipped — BUSINESS_PROVIDER=mock is active" : undefined,
    },
    {
      label: "Groq AI",
      ok: status.groqConfigured,
      okText: "Configured",
      badText: "Missing GROQ_API_KEY",
    },
  ];

  const allGood = status.realDataActive && status.groqConfigured;

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-stone-900">System Status</h2>
        {!allGood && (
          <span className="text-xs text-stone-500">
            Set these in <code className="rounded bg-stone-100 px-1 py-0.5">.env.local</code>, then restart the server.
          </span>
        )}
      </div>
      <dl className="space-y-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <dt className="text-stone-600">{row.label}</dt>
            <dd className="flex items-center gap-2">
              {row.note ? (
                <span className="text-stone-400">{row.note}</span>
              ) : row.ok ? (
                <span className="font-medium text-emerald-700">✓ {row.okText}</span>
              ) : (
                <span className="font-medium text-red-700">✗ {row.badText}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
