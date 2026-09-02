"use client";

import { useState } from "react";
import type { Lead, LeadStatus } from "@/lib/types";

const STATUSES: LeadStatus[] = ["new", "contacted", "interested", "meeting", "won", "lost"];

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
      if (!res.ok) throw new Error(data.error || "Failed to save.");
      onUpdated(data.lead);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-stone-500">Status</span>
        <select value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)} className="input">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-stone-500">Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="input resize-none"
          placeholder="Anything worth remembering before you reach out…"
        />
      </label>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button type="button" onClick={save} disabled={saving || !dirty} className="btn-secondary w-full">
        {saving ? "Saving…" : justSaved ? "Saved ✓" : "Save status & notes"}
      </button>
    </div>
  );
}
