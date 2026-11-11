import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { checkAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const authErr = checkAuth(req);
  if (authErr) return authErr;

  try {
    const { searchQuery } = await req.json();
    if (!searchQuery) {
      return NextResponse.json({ error: "No search query" }, { status: 400 });
    }

    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "SERPAPI_KEY not configured" },
        { status: 503 }
      );
    }

    const encoded = encodeURIComponent(searchQuery);
    const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encoded}&LH_BIN=1&_sop=15`;

    // Search Google Shopping via SerpAPI
    const { data } = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google_shopping",
        q: searchQuery,
        api_key: apiKey,
        num: 40,
        gl: "us",
        hl: "en",
      },
      timeout: 15000,
    });

    const shoppingResults: Array<{ price?: string }> =
      data.shopping_results ?? [];

    const prices: number[] = [];
    for (const item of shoppingResults) {
      if (!item.price) continue;
      const match = item.price.match(/([0-9,]+\.?\d*)/);
      if (match) {
        const val = parseFloat(match[1].replace(/,/g, ""));
        if (!isNaN(val) && val > 0 && val < 100000) {
          prices.push(val);
        }
      }
    }

    if (prices.length === 0) {
      return NextResponse.json({
        low: null,
        high: null,
        average: null,
        count: 0,
        searchUrl,
      });
    }

    prices.sort((a, b) => a - b);

    // Trim top/bottom 5% outliers for a more representative average
    const trim = Math.max(0, Math.floor(prices.length * 0.05));
    const trimmed = prices.slice(trim, prices.length - trim);
    const forAvg = trimmed.length > 0 ? trimmed : prices;

    const low = prices[0];
    const high = prices[prices.length - 1];
    const average = forAvg.reduce((sum, p) => sum + p, 0) / forAvg.length;

    return NextResponse.json({
      low: low.toFixed(2),
      high: high.toFixed(2),
      average: average.toFixed(2),
      count: prices.length,
      searchUrl,
    });
  } catch (err) {
    console.error("Prices error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch prices: ${message}` },
      { status: 500 }
    );
  }
}

export const maxDuration = 30;
