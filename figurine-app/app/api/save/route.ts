import { NextRequest, NextResponse } from "next/server";
import { appendRow, ensureHeaderRow, extractSpreadsheetId } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { spreadsheetUrl, items } = body as {
      spreadsheetUrl: string;
      items: Array<{
        name?: string;
        brand?: string;
        series?: string;
        character?: string;
        number?: string;
        low?: string;
        high?: string;
        average?: string;
        count?: number;
        searchUrl?: string;
      }>;
    };

    if (!spreadsheetUrl) {
      return NextResponse.json(
        { error: "spreadsheetUrl is required" },
        { status: 400 }
      );
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items to save" }, { status: 400 });
    }

    const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);
    await ensureHeaderRow(spreadsheetId);

    const dateAdded = new Date().toLocaleDateString("en-US");
    let saved = 0;

    for (const item of items) {
      const row = [
        item.name ?? "",
        item.brand ?? "",
        item.series ?? "",
        item.character ?? "",
        item.number ?? "",
        item.low ? `$${item.low}` : "",
        item.high ? `$${item.high}` : "",
        item.average ? `$${item.average}` : "",
        item.count ?? "",
        item.searchUrl ?? "",
        "",        // Condition — user fills in
        "",        // My Asking Price — user fills in
        "",        // Notes — user fills in
        dateAdded,
      ];
      await appendRow(spreadsheetId, row);
      saved++;
    }

    return NextResponse.json({ saved });
  } catch (err) {
    console.error("Save error:", err);
    const message = err instanceof Error ? err.message : "Failed to save";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
