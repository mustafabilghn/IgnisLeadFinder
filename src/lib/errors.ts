import { NextResponse } from "next/server";

/**
 * Thrown when a real external provider (Google Places, Anthropic) is selected
 * but its required credential isn't set. Route handlers catch this specifically
 * to return 503 with the exact configuration instructions — never a silent
 * fallback to fake data.
 */
export class NotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotConfiguredError";
  }
}

/**
 * Shared catch-block mapping for provider calls: a missing credential is 503
 * (fix your config), anything else is 502 (the upstream call itself failed) —
 * neither ever falls back to substituting fake data.
 */
export function providerErrorResponse(err: unknown, fallbackMessage: string): NextResponse {
  if (err instanceof NotConfiguredError) {
    return NextResponse.json({ error: err.message }, { status: 503 });
  }
  console.error(fallbackMessage, err);
  return NextResponse.json(
    { error: err instanceof Error ? err.message : fallbackMessage },
    { status: 502 },
  );
}
