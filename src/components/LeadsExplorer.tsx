"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { LeadFilters, LeadSummary } from "@/lib/types";
import { filtersToSearchParams } from "@/lib/filterQuery";
import { FilterBar } from "@/components/FilterBar";
import { LeadTable } from "@/components/LeadTable";
import { PriorityLeadCard } from "@/components/PriorityLeadCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/StatusStates";

const PRIORITY_COUNT = 10;

type AiRankingState = "idle" | "loading" | "ready" | "unavailable" | "error";

export function LeadsExplorer() {
  const searchParams = useSearchParams();
  const initialSearchId = searchParams.get("searchId") || undefined;

  const [filters, setFilters] = useState<LeadFilters>({ searchId: initialSearchId });
  const [scopedToSearch, setScopedToSearch] = useState(!!initialSearchId);
  const [leads, setLeads] = useState<LeadSummary[] | null>(null);
  const [meta, setMeta] = useState<{ industries: string[]; districts: string[] }>({
    industries: [],
    districts: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [aiRankingState, setAiRankingState] = useState<AiRankingState>("idle");
  const [aiRankingError, setAiRankingError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/meta/filters")
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = filtersToSearchParams(filters);
      const res = await fetch(`/api/leads?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Firmalar yüklenemedi.");
      setLeads(data.leads);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Firmalar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  // Second-stage AI ranking: only for a specific search's results (not the
  // cross-search "all leads" view), triggered once per searchId and cached
  // server-side — revisiting this page or changing filters won't re-call Groq.
  const triggerAiRanking = useCallback(
    async (regenerate = false) => {
      if (!initialSearchId) return;
      setAiRankingState("loading");
      setAiRankingError(null);
      try {
        const res = await fetch(`/api/search/${initialSearchId}/rank${regenerate ? "?regenerate=1" : ""}`, {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) {
          setAiRankingState(res.status === 503 ? "unavailable" : "error");
          setAiRankingError(data.error || null);
          return;
        }
        setAiRankingState("ready");
        load();
      } catch {
        setAiRankingState("error");
        setAiRankingError("AI sıralaması alınamadı.");
      }
    },
    [initialSearchId, load],
  );

  useEffect(() => {
    triggerAiRanking(false);
    // Only re-run when the search itself changes, not on every filter tweak.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSearchId]);

  const exportHref = `/api/export?${filtersToSearchParams(filters).toString()}`;

  const priorityLeads = leads ? leads.slice(0, Math.min(PRIORITY_COUNT, leads.length)) : [];
  const otherLeads = leads ? leads.slice(priorityLeads.length) : [];
  const aiActive = scopedToSearch && aiRankingState === "loading";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">🔥 Ignis İçin Öncelikli Firmalar</h1>
          <p className="mt-1 text-sm text-stone-600">{describeResults(leads, scopedToSearch)}</p>
        </div>
        <div className="flex items-center gap-2">
          {scopedToSearch && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setScopedToSearch(false);
                setFilters((f) => ({ ...f, searchId: undefined }));
              }}
            >
              Tüm firmaları göster
            </button>
          )}
          <a href={exportHref} className="btn-secondary">
            ⬇ CSV Dışa Aktar
          </a>
        </div>
      </div>

      <FilterBar filters={filters} onChange={setFilters} industries={meta.industries} districts={meta.districts} />

      {loading && <LoadingState message="Firmalar yükleniyor…" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && leads && leads.length === 0 && (
        <EmptyState
          title="Bu filtrelere uyan firma yok"
          message="Bir filtreyi gevşetmeyi deneyin veya daha fazla işletme keşfetmek için Ara sayfasına dönün."
        />
      )}

      {!loading && !error && leads && leads.length > 0 && (
        <>
          {scopedToSearch && aiRankingState === "unavailable" && (
            <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              ✗ AI sıralaması kullanılamıyor{aiRankingError ? ` — ${aiRankingError}` : ""}. Aşağıdaki sıralama
              deterministik Ignis Uygunluk Puanına göre yapıldı.
            </div>
          )}
          {scopedToSearch && aiRankingState === "error" && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
              <p>AI sıralaması başarısız oldu{aiRankingError ? `: ${aiRankingError}` : "."}</p>
              <button type="button" onClick={() => triggerAiRanking(false)} className="mt-1 font-medium underline">
                Tekrar dene
              </button>
            </div>
          )}

          <div className="space-y-4">
            {priorityLeads.map((lead) => (
              <PriorityLeadCard key={lead.id} lead={lead} aiActive={aiActive} />
            ))}
          </div>

          {otherLeads.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-stone-800">Diğer Bulunan Firmalar</h2>
              <LeadTable leads={otherLeads} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function describeResults(leads: LeadSummary[] | null, scopedToSearch: boolean): string {
  const scope = scopedToSearch ? "en son aramanızdan" : "şimdiye kadar toplanan";
  if (!leads || leads.length === 0) {
    return `Ignis Uygunluk Puanına göre sıralandı — en yüksekten başlayarak.`;
  }
  const real = leads.filter((l) => l.source === "google_places").length;
  const mock = leads.length - real;

  let sourceText: string;
  if (mock === 0) {
    sourceText = `${real} gerçek işletme bulundu (Google Places)`;
  } else if (real === 0) {
    sourceText = `${mock} test/demo firma (BUSINESS_PROVIDER=mock)`;
  } else {
    sourceText = `${leads.length} firma (${real} gerçek, ${mock} test/demo — önceki test aramalarından)`;
  }

  return `${sourceText}, ${scope} — göreceli sıralamaya göre en güçlü adaylar önce.`;
}
