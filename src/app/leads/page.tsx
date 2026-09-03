import { Suspense } from "react";
import { LeadsExplorer } from "@/components/LeadsExplorer";
import { LoadingState } from "@/components/StatusStates";

export default function LeadsPage() {
  return (
    <Suspense fallback={<LoadingState message="Firmalar yükleniyor…" />}>
      <LeadsExplorer />
    </Suspense>
  );
}
