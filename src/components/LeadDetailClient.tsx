"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Lead } from "@/lib/types";
import { PriorityBadge, ScoreBadge } from "@/components/PriorityBadge";
import { ScoreBreakdownCard } from "@/components/ScoreBreakdownCard";
import { EvidenceTable } from "@/components/EvidenceTable";
import { StatusEditor } from "@/components/StatusEditor";
import { EmptyState, ErrorState, LoadingState } from "@/components/StatusStates";

const NOT_AVAILABLE = "Bilinmiyor / Mevcut değil";

export function LeadDetailClient({ id }: { id: string }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rescanning, setRescanning] = useState(false);
  const [groqConfigured, setGroqConfigured] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Firma yüklenemedi.");
      setLead(data.lead);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Firma yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/meta/status")
      .then((r) => r.json())
      .then((s) => setGroqConfigured(!!s.groqConfigured))
      .catch(() => setGroqConfigured(false));
  }, []);

  async function rescan() {
    setRescanning(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${id}/rescan`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Yeniden tarama başarısız oldu.");
      setLead(data.lead);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yeniden tarama başarısız oldu.");
    } finally {
      setRescanning(false);
    }
  }

  if (loading) return <LoadingState message="Firma yükleniyor…" />;
  if (error && !lead) return <ErrorState message={error} onRetry={load} />;
  if (!lead) return <EmptyState title="Firma bulunamadı" message="Kaldırılmış olabilir." />;

  return (
    <div className="space-y-6">
      <Link href="/leads" className="text-sm text-stone-500 hover:text-ignis-700">
        ← Tüm firmalara dön
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">{lead.name}</h1>
          <p className="mt-1 text-sm text-stone-500">
            {lead.category} · {[lead.district, lead.city, lead.country].filter(Boolean).join(", ")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lead.aiRankPosition != null && (
            <span
              className="rounded-full bg-ignis-100 px-2.5 py-1 text-xs font-bold text-ignis-800"
              title="Bu firmanın aramasındaki AI sıralaması"
            >
              AI Sıra #{lead.aiRankPosition}
            </span>
          )}
          <ScoreBadge score={lead.score.total} />
          <PriorityBadge priority={lead.score.priority} />
        </div>
      </div>

      {error && <ErrorState message={error} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Ignis Uygunluk Puanı">
            <ScoreBreakdownCard score={lead.score} />
          </Section>

          <Section
            title="Ignis Sinyalleri"
            subtitle="Aşağıdaki her sinyal ya doğrudan gözlemlenmiş, türetilmiş, çıkarım yapılmış ya da bilinmiyor — asla uydurulmamıştır."
          >
            <EvidenceTable signals={lead.signals} />
          </Section>

          <UnknownFactsCard lead={lead} />

          <WhyThisLead lead={lead} onLead={setLead} aiConfigured={groqConfigured} />
          <DiscoveryQuestions lead={lead} onLead={setLead} aiConfigured={groqConfigured} />
          <OutreachMessage lead={lead} onLead={setLead} aiConfigured={groqConfigured} />
        </div>

        <div className="space-y-6">
          <Section title="Firma">
            <dl className="space-y-2 text-sm">
              <Row label="Ad" value={lead.name} />
              <Row label="Sektör" value={lead.category} />
              <Row label="Adres" value={lead.address ?? NOT_AVAILABLE} />
              <Row label="Telefon" value={lead.phone ?? NOT_AVAILABLE} />
              <Row
                label="Web Sitesi"
                value={
                  lead.website ? (
                    <a href={lead.website} target="_blank" rel="noreferrer" className="text-ignis-700 hover:underline">
                      {lead.website}
                    </a>
                  ) : (
                    NOT_AVAILABLE
                  )
                }
              />
              <Row
                label="Google Haritalar"
                value={
                  lead.googleMapsUrl ? (
                    <a href={lead.googleMapsUrl} target="_blank" rel="noreferrer" className="text-ignis-700 hover:underline">
                      Haritada Aç
                    </a>
                  ) : (
                    NOT_AVAILABLE
                  )
                }
              />
              <Row
                label="Puan"
                value={lead.rating != null ? `★ ${lead.rating.toFixed(1)} (${lead.reviewCount ?? 0} değerlendirme)` : NOT_AVAILABLE}
              />
              <Row label="Kaynak" value={lead.source === "mock" ? "Test / demo verisi" : "Google Places (alındı)"} />
            </dl>
          </Section>

          <Section
            title="Web Sitesi Taraması"
            action={
              <button type="button" onClick={rescan} disabled={rescanning} className="btn-secondary text-xs">
                {rescanning ? "Yeniden taranıyor…" : "↻ Yeniden Tara"}
              </button>
            }
          >
            {lead.websiteScan ? (
              <dl className="space-y-2 text-sm">
                <Row label="Erişilebilir" value={lead.websiteScan.reachable ? "Evet" : "Hayır"} />
                <Row label="HTTPS" value={lead.websiteScan.https ? "Evet" : "Hayır"} />
                <Row label="Sayfa başlığı" value={lead.websiteScan.title ?? NOT_AVAILABLE} />
                <Row label="Taranan sayfa sayısı" value={String(lead.websiteScan.pagesChecked.length)} />
                <Row
                  label="Son tarama"
                  value={lead.lastScannedAt ? new Date(lead.lastScannedAt).toLocaleString("tr-TR") : NOT_AVAILABLE}
                />
                {lead.websiteScan.mock && <Row label="Not" value="Test web sitesi içeriği (demo modu)" />}
                {lead.websiteScan.error && <Row label="Hata" value={<span className="text-red-700">{lead.websiteScan.error}</span>} />}
              </dl>
            ) : (
              <p className="text-sm text-stone-400">Kayıtlı bir web sitesi taraması yok.</p>
            )}
          </Section>

          <Section title="Firma Durumu">
            <StatusEditor lead={lead} onUpdated={setLead} />
          </Section>
        </div>
      </div>
    </div>
  );
}

const HEADLINE_UNKNOWN_KEYS = ["manual_order_entry", "erp_mentioned", "order_volume"] as const;
const UNKNOWN_FACT_LABELS: Record<(typeof HEADLINE_UNKNOWN_KEYS)[number], string> = {
  manual_order_entry: "Siparişlerin ne kadarının manuel işlendiği",
  erp_mentioned: "ERP kullanımı",
  order_volume: "Günlük/aylık sipariş hacmi",
};

function UnknownFactsCard({ lead }: { lead: Lead }) {
  const stillUnknown = HEADLINE_UNKNOWN_KEYS.filter(
    (key) => lead.signals.find((s) => s.key === key)?.classification === "UNKNOWN",
  );

  return (
    <Section
      title="Henüz Bilinmiyor"
      subtitle="Bunlar yalnızca doğrudan görüşmeyle netleşebilir — Lead Finder bir satış öncesi araştırma aracıdır."
    >
      <ul className="space-y-1.5 text-sm text-stone-600">
        {stillUnknown.map((key) => (
          <li key={key} className="flex gap-1.5">
            <span className="text-stone-300">?</span>
            {UNKNOWN_FACT_LABELS[key]}
          </li>
        ))}
        <li className="flex gap-1.5">
          <span className="text-stone-300">?</span>
          Hatalı/yanlış sipariş oranı
        </li>
      </ul>
    </Section>
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
// AI generation requires GROQ_API_KEY — there is no template/fake fallback.
// aiConfigured === null means "still checking"; treated as not-yet-known (button enabled,
// so a real click always gets the authoritative answer from the API either way).

function useAiAction(leadId: string, path: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (regenerate = false): Promise<unknown | null> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/leads/${leadId}/${path}${regenerate ? "?regenerate=1" : ""}`, {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Üretim başarısız oldu.");
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Üretim başarısız oldu.");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [leadId, path],
  );

  return { run, loading, error };
}

function AiUnavailableNote({ aiConfigured }: { aiConfigured: boolean | null }) {
  if (aiConfigured !== false) return null;
  return (
    <p className="mb-2 text-xs font-medium text-red-700">
      ✗ AI kullanılamıyor — AI analizini etkinleştirmek için sunucu ortamına GROQ_API_KEY ekleyin.
    </p>
  );
}

function WhyThisLead({
  lead,
  onLead,
  aiConfigured,
}: {
  lead: Lead;
  onLead: (l: Lead) => void;
  aiConfigured: boolean | null;
}) {
  const { run, loading, error } = useAiAction(lead.id, "ai/summary");

  async function generate(regenerate = false) {
    const data = (await run(regenerate)) as { summary: string } | null;
    if (data) onLead({ ...lead, aiSummary: data.summary });
  }

  return (
    <Section
      title="Neden Bu Firma?"
      subtitle="Yalnızca yukarıdaki kanıtlara dayanan kısa bir açıklama."
      action={
        <button
          type="button"
          onClick={() => generate(!!lead.aiSummary)}
          disabled={loading || aiConfigured === false}
          className="btn-secondary text-xs"
        >
          {loading ? "Düşünüyor…" : lead.aiSummary ? "Yeniden Oluştur" : "Oluştur"}
        </button>
      }
    >
      <AiUnavailableNote aiConfigured={aiConfigured} />
      {error && <p className="mb-2 text-sm text-red-700">{error}</p>}
      {lead.aiSummary ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-stone-700">{lead.aiSummary}</p>
      ) : (
        <p className="text-sm text-stone-400">Henüz oluşturulmadı.</p>
      )}
    </Section>
  );
}

function DiscoveryQuestions({
  lead,
  onLead,
  aiConfigured,
}: {
  lead: Lead;
  onLead: (l: Lead) => void;
  aiConfigured: boolean | null;
}) {
  const { run, loading, error } = useAiAction(lead.id, "ai/questions");

  async function generate(regenerate = false) {
    const data = (await run(regenerate)) as { questions: string[] } | null;
    if (data) onLead({ ...lead, discoveryQuestions: data.questions });
  }

  return (
    <Section
      title="Keşif Soruları"
      subtitle="İlk görüşme için öğrenme odaklı sorular — satış konuşması değil."
      action={
        <button
          type="button"
          onClick={() => generate(!!lead.discoveryQuestions)}
          disabled={loading || aiConfigured === false}
          className="btn-secondary text-xs"
        >
          {loading ? "Düşünüyor…" : lead.discoveryQuestions ? "Yeniden Oluştur" : "Oluştur"}
        </button>
      }
    >
      <AiUnavailableNote aiConfigured={aiConfigured} />
      {error && <p className="mb-2 text-sm text-red-700">{error}</p>}
      {lead.discoveryQuestions && lead.discoveryQuestions.length > 0 ? (
        <ol className="list-decimal space-y-2 pl-5 text-sm text-stone-700">
          {lead.discoveryQuestions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-stone-400">Henüz oluşturulmadı.</p>
      )}
    </Section>
  );
}

function OutreachMessage({
  lead,
  onLead,
  aiConfigured,
}: {
  lead: Lead;
  onLead: (l: Lead) => void;
  aiConfigured: boolean | null;
}) {
  const { run, loading, error } = useAiAction(lead.id, "ai/outreach");
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
      title="Kişiselleştirilmiş İletişim Mesajı"
      subtitle="Araştırma odaklı, asla satış konuşması değil. Göndermeden önce mutlaka gözden geçirin."
      action={
        <button
          type="button"
          onClick={() => generate(!!lead.outreachMessage)}
          disabled={loading || aiConfigured === false}
          className="btn-secondary text-xs"
        >
          {loading ? "Düşünüyor…" : lead.outreachMessage ? "Yeniden Oluştur" : "Oluştur"}
        </button>
      }
    >
      <AiUnavailableNote aiConfigured={aiConfigured} />
      {error && <p className="mb-2 text-sm text-red-700">{error}</p>}
      {lead.outreachMessage ? (
        <div className="space-y-2">
          <p className="whitespace-pre-line rounded-lg bg-stone-50 p-3 text-sm leading-relaxed text-stone-700">
            {lead.outreachMessage}
          </p>
          <button type="button" onClick={copy} className="text-xs font-medium text-ignis-700 hover:underline">
            {copied ? "Kopyalandı ✓" : "Panoya Kopyala"}
          </button>
        </div>
      ) : (
        <p className="text-sm text-stone-400">Henüz oluşturulmadı.</p>
      )}
    </Section>
  );
}
