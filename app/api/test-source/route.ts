import { NextResponse } from "next/server";
import data from "@/lib/automation/test-source.json";

export async function GET() {
  return NextResponse.json({
  jobs: data
});
}