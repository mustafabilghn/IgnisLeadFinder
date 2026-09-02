import { NextResponse } from "next/server";
import { listDistinctDistricts, listDistinctIndustries } from "@/lib/leadRepository";

export async function GET() {
  try {
    return NextResponse.json({
      districts: listDistinctDistricts(),
      industries: listDistinctIndustries(),
    });
  } catch (err) {
    console.error("Failed to load filter metadata:", err);
    return NextResponse.json({ districts: [], industries: [] }, { status: 500 });
  }
}
