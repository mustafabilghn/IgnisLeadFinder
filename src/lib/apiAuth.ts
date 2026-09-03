import { NextResponse } from "next/server";

/** Optional shared-secret check for mutating routes. No-op unless APP_ACCESS_TOKEN is set. */
export function checkApiAuth(req: Request): NextResponse | null {
  const token = process.env.APP_ACCESS_TOKEN;
  if (!token) return null;

  const provided = req.headers.get("x-ignis-token");
  if (provided === token) return null;

  return NextResponse.json({ error: "Yetkisiz — x-ignis-token başlığı eksik veya geçersiz." }, { status: 401 });
}
