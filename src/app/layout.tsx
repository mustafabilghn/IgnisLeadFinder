import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ignis Lead Finder",
  description: "Internal tool for finding and ranking B2B customer-discovery leads for Ignis.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const provider = (process.env.BUSINESS_PROVIDER || "mock").trim().toLowerCase();
  const isMock = provider !== "google_places";
  const aiEnabled = !!process.env.ANTHROPIC_API_KEY;

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
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  isMock ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                }`}
                title={isMock ? "Business discovery is using sample/mock data" : "Business discovery is using live Google Places data"}
              >
                {isMock ? "MOCK DATA MODE" : "LIVE: Google Places"}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  aiEnabled ? "bg-sky-100 text-sky-800" : "bg-stone-100 text-stone-600"
                }`}
                title={aiEnabled ? "AI text generation is enabled" : "No ANTHROPIC_API_KEY — AI text falls back to templates"}
              >
                {aiEnabled ? "AI ENABLED" : "AI: TEMPLATE FALLBACK"}
              </span>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
