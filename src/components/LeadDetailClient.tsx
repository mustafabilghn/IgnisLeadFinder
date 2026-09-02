"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Lead } from "@/lib/types";
import { PriorityBadge, ScoreBadge } from "@/components/PriorityBadge";
import { ScoreBreakdownCard } from "@/components/ScoreBreakdownCard";
import { EvidenceTable } from "@/components/EvidenceTable";
import { StatusEditor } from "@/components/StatusEditor";
import { EmptyState, ErrorState, LoadingState } from "@/components/StatusStates";

export function LeadDetailClient({ id }: { id: string }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rescanning, setRescanning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load lead.");
      setLead(data.lead);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lead.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function rescan() {
    setRescanning(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${id}/rescan`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rescan failed.");
      setLead(data.lead);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rescan failed.");
    } finally {
      setRescanning(false);
    }
  }

  if (loading) return <LoadingState message="Loading lead…" />;
  if (error && !lead) return <ErrorState message={error} onRetry={load} />;
  if (!lead) return <EmptyState title="Lead not found" message="It may have been removed." />;

  return (
    <div className="space-y-6">
      <Link href="/leads" className="text-sm text-stone-500 hover:text-ignis-700">
        ← Back to all leads
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">{lead.name}</h1>
          <p className="mt-1 text-sm text-stone-500">
            {lead.category} · {[lead.district, lead.city, lead.country].filter(Boolean).join(", ")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ScoreBadge score={lead.score.total} />
          <PriorityBadge priority={lead.score.priority} />
        </div>
      </div>

      {error && <ErrorState message={error} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Ignis Fit Score">
            <ScoreBreakdownCard score={lead.score} />
          </Section>

          <Section title="Ignis Signals" subtitle="Every signal below is either directly observed, derived, inferred, or unknown — never invented.">
            <EvidenceTable signals={lead.signals} />
          </Section>

          <WhyThisLead lead={lead} onLead={setLead} />
          <DiscoveryQuestions lead={lead} onLead={setLead} />
          <OutreachMessage lead={lead} onLead={setLead} />
        </div>

        <div className="space-y-6">
          <Section title="Company">
            <dl className="space-y-2 text-sm">
              <Row label="Name" value={lead.name} />
              <Row label="Category" value={lead.category} />
              <Row label="Address" value={lead.address ?? "—"} />
              <Row label="Phone" value={lead.phone ?? "—"} />
              <Row
                label="Website"
                value={
                  lead.website ? (
                    <a href={lead.website} target="_blank" rel="noreferrer" className="text-ignis-700 hover:underline">
                      {lead.website}
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
              <Row
                label="Google Maps"
                value={
                  lead.googleMapsUrl ? (
                    <a href={lead.googleMapsUrl} target="_blank" rel="noreferrer" className="text-ignis-700 hover:underline">
                      Open in Maps
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
              <Row label="Rating" value={lead.rating != null ? `★ ${lead.rating.toFixed(1)} (${lead.reviewCount ?? 0} reviews)` : "—"} />
              <Row label="Source" value={lead.source === "mock" ? "Mock / demo data" : "Google Places"} />
            </dl>
          </Section>

          <Section
            title="Website Scan"
            action={
              <button type="button" onClick={rescan} disabled={rescanning} className="btn-secondary text-xs">
                {rescanning ? "Rescanning…" : "↻ Rescan"}
              </button>
            }
          >
            {lead.websiteScan ? (
              <dl className="space-y-2 text-sm">
                <Row label="Reachable" value={lead.websiteScan.reachable ? "Yes" : "No"} />
                <Row label="HTTPS" value={lead.websiteScan.https ? "Yes" : "No"} />
                <Row label="Page title" value={lead.websiteScan.title ?? "—"} />
                <Row label="Pages checked" value={String(lead.websiteScan.pagesChecked.length)} />
                <Row label="Last scanned" value={lead.lastScannedAt ? new Date(lead.lastScannedAt).toLocaleString() : "—"} />
                {lead.websiteScan.mock && <Row label="Note" value="Mock website content (demo mode)" />}
                {lead.websiteScan.error && <Row label="Error" value={<span className="text-red-700">{lead.websiteScan.error}</span>} />}
              </dl>
            ) : (
              <p className="text-sm text-stone-400">No website scan on file.</p>
            )}
          </Section>

          <Section title="Lead Status">
            <StatusEditor lead={lead} onUpdated={setLead} />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-stone-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-stone-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-stone-50 py-1 last:border-0">
      <dt className="text-stone-400">{label}</dt>
      <dd className="text-right text-stone-700">{value}</dd>
    </div>
  );
}

// ── AI sections ────────────────────────────────────────────────────────

function useAiAction(leadId: string, path: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiGenerated, setAiGenerated] = useState<boolean | null>(null);

  const run = useCallback(
    async (regenerate = false): Promise<unknown | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/leads/${leadId}/${path}${regenerate ? "?regenerate=1" : ""}`, {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Generation failed.");
        setAiGenerated(data.aiGenerated ?? true);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Generation failed.");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [leadId, path],
  );

  return { run, loading, error, aiGenerated };
}

function WhyThisLead({ lead, onLead }: { lead: Lead; onLead: (l: Lead) => void }) {
  const { run, loading, error, aiGenerated } = useAiAction(lead.id, "ai/summary");

  async function generate(regenerate = false) {
    const data = (await run(regenerate)) as { summary: string } | null;
    if (data) onLead({ ...lead, aiSummary: data.summary });
  }

  return (
    <Section
      title="Why This Lead?"
      subtitle="A short explanation grounded only in the evidence above."
      action={
        <button type="button" onClick={() => generate(!!lead.aiSummary)} disabled={loading} className="btn-secondary text-xs">
          {loading ? "Thinking…" : lead.aiSummary ? "Regenerate" : "Generate"}
        </button>
      }
    >
      {error && <p className="mb-2 text-sm text-red-700">{error}</p>}
      {lead.aiSummary ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-stone-700">{lead.aiSummary}</p>
      ) : (
        <p className="text-sm text-stone-400">Not generated yet.</p>
      )}
      {aiGenerated === false && <p className="mt-2 text-xs text-amber-600">Template fallback — no ANTHROPIC_API_KEY configured.</p>}
    </Section>
  );
}

function DiscoveryQuestions({ lead, onLead }: { lead: Lead; onLead: (l: Lead) => void }) {
  const { run, loading, error, aiGenerated } = useAiAction(lead.id, "ai/questions");

  async function generate(regenerate = false) {
    const data = (await run(regenerate)) as { questions: string[] } | null;
    if (data) onLead({ ...lead, discoveryQuestions: data.questions });
  }

  return (
    <Section
      title="Discovery Questions"
      subtitle="Learning-oriented questions for a first conversation — not a sales pitch."
      action={
        <button
          type="button"
          onClick={() => generate(!!lead.discoveryQuestions)}
          disabled={loading}
          className="btn-secondary text-xs"
        >
          {loading ? "Thinking…" : lead.discoveryQuestions ? "Regenerate" : "Generate"}
        </button>
      }
    >
      {error && <p className="mb-2 text-sm text-red-700">{error}</p>}
      {lead.discoveryQuestions && lead.discoveryQuestions.length > 0 ? (
        <ol className="list-decimal space-y-2 pl-5 text-sm text-stone-700">
          {lead.discoveryQuestions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-stone-400">Not generated yet.</p>
      )}
      {aiGenerated === false && <p className="mt-2 text-xs text-amber-600">Template fallback — no ANTHROPIC_API_KEY configured.</p>}
    </Section>
  );
}

function OutreachMessage({ lead, onLead }: { lead: Lead; onLead: (l: Lead) => void }) {
  const { run, loading, error, aiGenerated } = useAiAction(lead.id, "ai/outreach");
  const [copied, setCopied] = useState(false);

  async function generate(regenerate = false) {
    const data = (await run(regenerate)) as { message: string } | null;
    if (data) onLead({ ...lead, outreachMessage: data.message });
  }

  async function copy() {
    if (!lead.outreachMessage) return;
    try {
      await navigator.clipboard.writeText(lead.outreachMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard access can fail silently (permissions) — not worth surfacing as an error
    }
  }

  return (
    <Section
      title="Personalized Outreach Message"
      subtitle="Research-oriented, never a sales pitch. Always review before sending."
      action={
        <button
          type="button"
          onClick={() => generate(!!lead.outreachMessage)}
          disabled={loading}
          className="btn-secondary text-xs"
        >
          {loading ? "Thinking…" : lead.outreachMessage ? "Regenerate" : "Generate"}
        </button>
      }
    >
      {error && <p className="mb-2 text-sm text-red-700">{error}</p>}
      {lead.outreachMessage ? (
        <div className="space-y-2">
          <p className="whitespace-pre-line rounded-lg bg-stone-50 p-3 text-sm leading-relaxed text-stone-700">
            {lead.outreachMessage}
          </p>
          <button type="button" onClick={copy} className="text-xs font-medium text-ignis-700 hover:underline">
            {copied ? "Copied ✓" : "Copy to clipboard"}
          </button>
        </div>
      ) : (
        <p className="text-sm text-stone-400">Not generated yet.</p>
      )}
      {aiGenerated === false && <p className="mt-2 text-xs text-amber-600">Template fallback — no ANTHROPIC_API_KEY configured.</p>}
    </Section>
  );
}
