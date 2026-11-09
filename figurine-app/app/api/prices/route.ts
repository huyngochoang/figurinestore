import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { checkAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const authErr = checkAuth(req);
  if (authErr) return authErr;

  try {
    const { searchQuery } = await req.json();
    if (!searchQuery) {
      return NextResponse.json({ error: "No search query" }, { status: 400 });
    }

    const encoded = encodeURIComponent(searchQuery);
    const url = `https://www.ebay.com/sch/i.html?_nkw=${encoded}&_sop=15&LH_BIN=1`;

    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "text/html,application/xhtml+xml,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(html);
    const prices: number[] = [];

    $(".s-item").each((_, el) => {
      const priceText = $(el).find(".s-item__price").first().text().trim();
      // Skip "to" ranges for now, grab first clean price
      const match = priceText.match(/\$([0-9,]+\.?\d*)/);
      if (match) {
        const val = parseFloat(match[1].replace(/,/g, ""));
        if (!isNaN(val) && val > 0) {
          prices.push(val);
        }
      }
    });

    if (prices.length === 0) {
      return NextResponse.json({
        low: null,
        high: null,
        average: null,
        count: 0,
        searchUrl: url,
      });
    }

    prices.sort((a, b) => a - b);
    const low = prices[0];
    const high = prices[prices.length - 1];
    const average = prices.reduce((sum, p) => sum + p, 0) / prices.length;

    return NextResponse.json({
      low: low.toFixed(2),
      high: high.toFixed(2),
      average: average.toFixed(2),
      count: prices.length,
      searchUrl: url,
    });
  } catch (err) {
    console.error("Prices error:", err);
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 }
    );
  }
}
