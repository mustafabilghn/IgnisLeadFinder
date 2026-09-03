import { NextResponse } from "next/server";
import { getAppStatus } from "@/lib/config";

/** Booleans only — never exposes the actual key values to the browser. */
export async function GET() {
  return NextResponse.json(getAppStatus());
}
