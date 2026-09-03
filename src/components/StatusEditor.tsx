"use client";

import { useState } from "react";
import type { Lead, LeadStatus } from "@/lib/types";

const STATUSES: LeadStatus[] = ["new", "contacted", "interested", "meeting", "won", "lost"];

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Yeni",
  contacted: "İletişime Geçildi",
  interested: "İlgileniyor",
  meeting: "Görüşme",
  won: "Kazanıldı",
  lost: "Kaybedildi",
};

export function StatusEditor({ lead, onUpdated }: { lead: Lead; onUpdated: (lead: Lead) => void }) {
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const dirty = status !== lead.status || notes !== (lead.notes ?? "");

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kaydedilemedi.");
      onUpdated(data.lead);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-stone-500">Durum</span>
        <select value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)} className="input">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-stone-500">Notlar</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="input resize-none"
          placeholder="İletişime geçmeden önce hatırlamaya değer bir şey…"
        />
      </label>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button type="button" onClick={save} disabled={saving || !dirty} className="btn-secondary w-full">
        {saving ? "Kaydediliyor…" : justSaved ? "Kaydedildi ✓" : "Durumu ve notları kaydet"}
      </button>
    </div>
  );
}
