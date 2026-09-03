"use client";

import type { LeadFilters, LeadStatus } from "@/lib/types";

export interface FilterBarProps {
  filters: LeadFilters;
  onChange: (next: LeadFilters) => void;
  industries: string[];
  districts: string[];
}

const TOGGLES: { key: keyof LeadFilters; label: string }[] = [
  { key: "b2b", label: "B2B" },
  { key: "dealer", label: "Bayi" },
  { key: "technical", label: "Teknik/Özel Üretim" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "hasWebsite", label: "Web Sitesi Var" },
];

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Yeni",
  contacted: "İletişime Geçildi",
  interested: "İlgileniyor",
  meeting: "Görüşme",
  won: "Kazanıldı",
  lost: "Kaybedildi",
};

export function FilterBar({ filters, onChange, industries, districts }: FilterBarProps) {
  function set<K extends keyof LeadFilters>(key: K, value: LeadFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="card flex flex-wrap items-end gap-4">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-stone-500">Min Ignis Puanı</span>
        <input
          type="number"
          min={0}
          max={100}
          value={filters.minScore ?? ""}
          onChange={(e) => set("minScore", e.target.value ? Number(e.target.value) : undefined)}
          className="input w-28"
          placeholder="0"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-stone-500">Sektör</span>
        <select
          value={filters.industry ?? ""}
          onChange={(e) => set("industry", e.target.value || undefined)}
          className="input w-48"
        >
          <option value="">Tüm sektörler</option>
          {industries.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-stone-500">İlçe</span>
        <select
          value={filters.district ?? ""}
          onChange={(e) => set("district", e.target.value || undefined)}
          className="input w-40"
        >
          <option value="">Tüm ilçeler</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-stone-500">Durum</span>
        <select
          value={filters.status ?? ""}
          onChange={(e) => set("status", (e.target.value || undefined) as LeadFilters["status"])}
          className="input w-36"
        >
          <option value="">Herhangi bir durum</option>
          {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-wrap gap-2 pb-0.5">
        {TOGGLES.map((t) => {
          const active = !!filters[t.key];
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => set(t.key, (active ? undefined : true) as never)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "border-ignis-500 bg-ignis-50 text-ignis-700"
                  : "border-stone-300 bg-white text-stone-600 hover:border-stone-400"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {(filters.minScore || filters.industry || filters.district || filters.status || TOGGLES.some((t) => filters[t.key])) && (
        <button
          type="button"
          onClick={() => onChange({ searchId: filters.searchId })}
          className="text-xs font-medium text-stone-500 underline hover:text-stone-700"
        >
          Filtreleri temizle
        </button>
      )}
    </div>
  );
}
