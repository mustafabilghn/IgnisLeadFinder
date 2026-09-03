"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { AppStatus } from "@/lib/config";
import { GOOGLE_NOT_CONFIGURED_MESSAGE } from "@/lib/config";

const PRESETS = [
  { label: "Beylikdüzü · Alüminyum/PVC/Cam", country: "Türkiye", city: "İstanbul", district: "Beylikdüzü", category: "Aluminum / PVC / Glass" },
  { label: "İkitelli · Endüstriyel Distribütör", country: "Türkiye", city: "İstanbul", district: "İkitelli", category: "Industrial Distributor" },
  { label: "Esenyurt · Metal Üreticisi", country: "Türkiye", city: "İstanbul", district: "Esenyurt", category: "Metal Manufacturer" },
];

export function SearchForm({ status }: { status: AppStatus }) {
  const router = useRouter();
  const [country, setCountry] = useState("Türkiye");
  const [city, setCity] = useState("İstanbul");
  const [district, setDistrict] = useState("Beylikdüzü");
  const [category, setCategory] = useState("Aluminum / PVC / Glass");
  const [maxResults, setMaxResults] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchBlocked = status.businessMode === "google_places" && !status.googleConfigured;

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
        throw new Error(data.error || "Arama başarısız oldu.");
      }
      router.push(`/leads?searchId=${data.searchId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir şeyler ters gitti.");
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900">Ignis için ilk kiminle konuşmalıyım?</h1>
      <p className="mt-2 text-sm text-stone-600">
        Bir bölge/sektördeki gerçek işletmeleri keşfedin, Ignis açısından önemli sinyaller için kamuya
        açık izlerini analiz edin ve önce kiminle görüşmeniz gerektiğini bilmek için sıralayın.
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
        {searchBlocked && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            <p className="font-semibold">🔴 Gerçek veri kullanılamıyor</p>
            <p className="mt-1">{GOOGLE_NOT_CONFIGURED_MESSAGE}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Ülke">
            <input
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="input"
              placeholder="Türkiye"
            />
          </Field>
          <Field label="Şehir">
            <input required value={city} onChange={(e) => setCity(e.target.value)} className="input" placeholder="İstanbul" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="İlçe / Semt (opsiyonel)">
            <input
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="input"
              placeholder="Beylikdüzü"
            />
          </Field>
          <Field label="Maksimum işletme sayısı">
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

        <Field label="Sektör / kategori">
          <input
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input"
            placeholder="Alüminyum Üreticisi, Endüstriyel Distribütör, Metal Üreticisi…"
          />
        </Field>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || searchBlocked}
          title={searchBlocked ? GOOGLE_NOT_CONFIGURED_MESSAGE : undefined}
          className="w-full rounded-lg bg-ignis-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-ignis-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Firmalar bulunuyor — keşfediliyor, web siteleri taranıyor, puanlanıyor…"
            : searchBlocked
              ? "Ignis İçin Firma Bul (engellendi — yukarıya bakın)"
              : "Ignis İçin Firma Bul"}
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
