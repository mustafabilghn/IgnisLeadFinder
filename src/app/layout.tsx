import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getAppStatus } from "@/lib/config";

export const metadata: Metadata = {
  title: "Ignis Lead Finder",
  description: "Internal tool for finding and ranking B2B customer-discovery leads for Ignis.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const status = getAppStatus();
  const isMockMode = status.businessMode === "mock";

  let businessBadge: { text: string; className: string; title: string };
  if (isMockMode) {
    businessBadge = {
      text: "🧪 MOCK DATA MODE",
      className: "bg-amber-100 text-amber-800",
      title: "BUSINESS_PROVIDER=mock is set — business discovery is using clearly-labeled sample data, not real businesses.",
    };
  } else if (status.googleConfigured) {
    businessBadge = {
      text: "🟢 REAL DATA MODE",
      className: "bg-emerald-100 text-emerald-800",
      title: "Business discovery is using live Google Places data.",
    };
  } else {
    businessBadge = {
      text: "🔴 REAL DATA UNAVAILABLE",
      className: "bg-red-100 text-red-800",
      title: "GOOGLE_MAPS_API_KEY is not set — searches are blocked until it's configured.",
    };
  }

  const aiBadge = status.groqConfigured
    ? { text: "✓ AI ENABLED", className: "bg-sky-100 text-sky-800", title: "AI text generation (Groq) is enabled." }
    : {
        text: "✗ AI UNAVAILABLE",
        className: "bg-red-100 text-red-800",
        title: "GROQ_API_KEY is not set — AI generation is blocked, not faked.",
      };

  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <span className="text-lg font-semibold tracking-tight text-stone-900">Ignis Lead Finder</span>
            </Link>
            <nav className="flex items-center gap-5 text-sm font-medium text-stone-600">
              <Link href="/" className="hover:text-ignis-600">
                Search
              </Link>
              <Link href="/leads" className="hover:text-ignis-600">
                All Leads
              </Link>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${businessBadge.className}`}
                title={businessBadge.title}
              >
                {businessBadge.text}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${aiBadge.className}`} title={aiBadge.title}>
                {aiBadge.text}
              </span>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
