import { SearchForm } from "@/components/SearchForm";
import { DiagnosticsPanel } from "@/components/DiagnosticsPanel";
import { getAppStatus } from "@/lib/config";

export default function HomePage() {
  const status = getAppStatus();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SearchForm status={status} />
      <DiagnosticsPanel status={status} />
    </div>
  );
}
