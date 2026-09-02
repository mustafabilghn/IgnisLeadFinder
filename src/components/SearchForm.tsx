"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const PRESETS = [
  { label: "Beylikdüzü · Aluminum/PVC/Glass", country: "Turkey", city: "Istanbul", district: "Beylikdüzü", category: "Aluminum / PVC / Glass" },
  { label: "İkitelli · Industrial Distributor", country: "Turkey", city: "Istanbul", district: "İkitelli", category: "Industrial Distributor" },
  { label: "Esenyurt · Metal Manufacturer", country: "Turkey", city: "Istanbul", district: "Esenyurt", category: "Metal Manufacturer" },
];

export function SearchForm() {
  const router = useRouter();
  const [country, setCountry] = useState("Turkey");
  const [city, setCity] = useState("Istanbul");
  const [district, setDistrict] = useState("Beylikdüzü");
  const [category, setCategory] = useState("Aluminum / PVC / Glass");
  const [maxResults, setMaxResults] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, city, district: district || undefined, category, maxResults }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Search failed.");
      }
      router.push(`/leads?searchId=${data.searchId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-stone-900">Who should I contact first for Ignis?</h1>
      <p className="mt-2 text-sm text-stone-600">
        Discover real businesses in an area/industry, analyze their public footprint for Ignis-relevant
        signals, and rank them so you know who to research or reach out to first.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              setCountry(preset.country);
              setCity(preset.city);
              setDistrict(preset.district);
              setCategory(preset.category);
            }}
            className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:border-ignis-400 hover:text-ignis-700"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Country">
            <input
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="input"
              placeholder="Turkey"
            />
          </Field>
          <Field label="City">
            <input required value={city} onChange={(e) => setCity(e.target.value)} className="input" placeholder="Istanbul" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="District / Neighborhood (optional)">
            <input
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="input"
              placeholder="Beylikdüzü"
            />
          </Field>
          <Field label="Maximum businesses">
            <input
              type="number"
              min={1}
              max={60}
              required
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              className="input"
            />
          </Field>
        </div>

        <Field label="Industry / category">
          <input
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input"
            placeholder="Aluminum Manufacturer, Industrial Distributor, Metal Manufacturer…"
          />
        </Field>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-ignis-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-ignis-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Finding leads — discovering, scanning websites, scoring…" : "Find Leads"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-stone-500">{label}</span>
      {children}
    </label>
  );
}
