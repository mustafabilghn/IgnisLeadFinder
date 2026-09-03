"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { LeadFilters, LeadSummary } from "@/lib/types";
import { filtersToSearchParams } from "@/lib/filterQuery";
import { FilterBar } from "@/components/FilterBar";
import { LeadTable } from "@/components/LeadTable";
import { EmptyState, ErrorState, LoadingState } from "@/components/StatusStates";

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
      if (!res.ok) throw new Error(data.error || "Failed to load leads.");
      setLeads(data.leads);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leads.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const exportHref = `/api/export?${filtersToSearchParams(filters).toString()}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Top Ignis Leads</h1>
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
              Show all leads
            </button>
          )}
          <a href={exportHref} className="btn-secondary">
            ⬇ Export CSV
          </a>
        </div>
      </div>

      <FilterBar filters={filters} onChange={setFilters} industries={meta.industries} districts={meta.districts} />

      {loading && <LoadingState message="Loading leads…" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && leads && leads.length === 0 && (
        <EmptyState
          title="No leads match these filters"
          message="Try loosening a filter, or head back to Search to discover more businesses."
        />
      )}
      {!loading && !error && leads && leads.length > 0 && <LeadTable leads={leads} />}
    </div>
  );
}

function describeResults(leads: LeadSummary[] | null, scopedToSearch: boolean): string {
  const scope = scopedToSearch ? "from your most recent search" : "collected so far";
  if (!leads || leads.length === 0) {
    return `Ranked by Ignis Fit Score — highest first.`;
  }
  const real = leads.filter((l) => l.source === "google_places").length;
  const mock = leads.length - real;

  let sourceText: string;
  if (mock === 0) {
    sourceText = `Found ${real} real business${real === 1 ? "" : "es"} (Google Places)`;
  } else if (real === 0) {
    sourceText = `${mock} mock/demo lead${mock === 1 ? "" : "s"} (BUSINESS_PROVIDER=mock)`;
  } else {
    sourceText = `${leads.length} leads (${real} real, ${mock} mock/demo — from earlier test runs)`;
  }

  return `${sourceText} ${scope}, ranked by Ignis Fit Score — highest first.`;
}
