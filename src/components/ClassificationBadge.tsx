import type { EvidenceClassification } from "@/lib/types";

const STYLES: Record<EvidenceClassification, string> = {
  VERIFIED: "bg-emerald-100 text-emerald-800",
  DERIVED: "bg-purple-100 text-purple-800",
  INFERRED: "bg-sky-100 text-sky-800",
  UNKNOWN: "bg-stone-100 text-stone-500",
};

// Data-layer values (VERIFIED/DERIVED/INFERRED/UNKNOWN) are unchanged — only the displayed text is Turkish.
const LABELS: Record<EvidenceClassification, string> = {
  VERIFIED: "DOĞRULANDI",
  DERIVED: "TÜRETİLDİ",
  INFERRED: "ÇIKARIM",
  UNKNOWN: "BİLİNMİYOR",
};

export function ClassificationBadge({ classification }: { classification: EvidenceClassification }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide ${STYLES[classification]}`}>
      {LABELS[classification]}
    </span>
  );
}
