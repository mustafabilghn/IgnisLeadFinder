import * as cheerio from "cheerio";
import type { WebsiteScanResult } from "./types";
import { RELEVANT_LINK_KEYWORDS } from "./signalDefinitions";

const FETCH_TIMEOUT_MS = 8000;
const MAX_EXTRA_PAGES = 2;
const MAX_BODY_BYTES = 1_500_000;
const USER_AGENT = "IgnisLeadFinder/0.1 (+internal customer-discovery research tool)";

export interface AnalyzedWebsite {
  scan: WebsiteScanResult;
  /** Whitespace-normalized visible text per page checked. Not persisted — used in-memory for signal extraction. */
  pages: { url: string; text: string }[];
}

interface AnalyzerInput {
  website: string | null;
  mockHtml?: string;
  mockPages?: { url: string; html: string }[];
}

export async function analyzeWebsite(input: AnalyzerInput): Promise<AnalyzedWebsite> {
  const now = new Date().toISOString();

  if (!input.website) {
    return {
      pages: [],
      scan: {
        url: "",
        reachable: false,
        https: false,
        title: null,
        pagesChecked: [],
        scannedAt: now,
        error: "No website on file",
      },
    };
  }

  if (input.mockHtml) {
    return analyzeMock(input.website, input.mockHtml, input.mockPages ?? [], now);
  }

  return analyzeLive(input.website, now);
}

function analyzeMock(
  url: string,
  homepageHtml: string,
  extraPages: { url: string; html: string }[],
  now: string,
): AnalyzedWebsite {
  const home = extractFromHtml(homepageHtml);
  const pagesChecked = [url];
  const pages = [{ url, text: home.text }];

  for (const page of extraPages.slice(0, MAX_EXTRA_PAGES)) {
    const extracted = extractFromHtml(page.html);
    pages.push({ url: page.url, text: extracted.text });
    pagesChecked.push(page.url);
  }

  return {
    pages,
    scan: {
      url,
      reachable: true,
      https: url.startsWith("https://"),
      title: home.title,
      pagesChecked,
      scannedAt: now,
      mock: true,
    },
  };
}

async function analyzeLive(rawUrl: string, now: string): Promise<AnalyzedWebsite> {
  let normalizedUrl = rawUrl.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  let homeFetch: FetchedPage;
  try {
    homeFetch = await fetchPage(normalizedUrl);
  } catch (err) {
    return {
      pages: [],
      scan: {
        url: normalizedUrl,
        reachable: false,
        // Unconfirmed, not "no" — we never completed a connection, so we can't claim either way.
        https: false,
        title: null,
        pagesChecked: [],
        scannedAt: now,
        error: err instanceof Error ? err.message : "Failed to fetch website",
      },
    };
  }

  const home = extractFromHtml(homeFetch.html);
  const pagesChecked = [homeFetch.finalUrl];
  const pages = [{ url: homeFetch.finalUrl, text: home.text }];

  const extraLinks = pickRelevantLinks(home.links, homeFetch.finalUrl).slice(0, MAX_EXTRA_PAGES);
  for (const link of extraLinks) {
    try {
      const extra = await fetchPage(link);
      const extracted = extractFromHtml(extra.html);
      pages.push({ url: extra.finalUrl, text: extracted.text });
      pagesChecked.push(extra.finalUrl);
    } catch {
      // Best-effort only — one unreachable sub-page shouldn't fail the whole scan.
    }
  }

  return {
    pages,
    scan: {
      url: normalizedUrl,
      reachable: true,
      https: homeFetch.finalUrl.startsWith("https://"),
      title: home.title,
      pagesChecked,
      scannedAt: now,
    },
  };
}

interface FetchedPage {
  html: string;
  finalUrl: string;
}

async function fetchPage(url: string): Promise<FetchedPage> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType && !contentType.includes("text/html") && !contentType.includes("xhtml")) {
      throw new Error(`Unsupported content-type: ${contentType}`);
    }
    const reader = res.body?.getReader();
    let html: string;
    if (reader) {
      html = await readCapped(reader, MAX_BODY_BYTES);
    } else {
      html = await res.text();
    }
    return { html, finalUrl: res.url || url };
  } finally {
    clearTimeout(timeout);
  }
}

async function readCapped(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  maxBytes: number,
): Promise<string> {
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.length;
    }
  }
  try {
    await reader.cancel();
  } catch {
    // ignore
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");
}

interface ExtractedPage {
  title: string | null;
  text: string;
  links: { href: string; text: string }[];
}

function extractFromHtml(html: string): ExtractedPage {
  const $ = cheerio.load(html);
  $("script, style, noscript, svg").remove();

  const title = $("title").first().text().trim() || null;
  const text = normalizeWhitespace($("body").text());

  const links: { href: string; text: string }[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    links.push({ href, text: normalizeWhitespace($(el).text()) });
  });

  return { title, text, links };
}

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function pickRelevantLinks(links: { href: string; text: string }[], baseUrl: string): string[] {
  let base: URL;
  try {
    base = new URL(baseUrl);
  } catch {
    return [];
  }

  const seen = new Set<string>();
  const picked: string[] = [];

  for (const link of links) {
    let resolved: URL;
    try {
      resolved = new URL(link.href, base);
    } catch {
      continue;
    }
    if (resolved.hostname !== base.hostname) continue;
    if (resolved.href === base.href) continue;

    const haystack = `${link.text} ${resolved.pathname}`.toLowerCase();
    const isRelevant = RELEVANT_LINK_KEYWORDS.some((kw) => haystack.includes(kw));
    if (!isRelevant) continue;

    const key = resolved.origin + resolved.pathname;
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(resolved.href);
  }

  return picked;
}
