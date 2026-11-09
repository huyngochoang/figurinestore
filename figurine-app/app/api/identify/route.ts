import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { checkAuth, checkImageSize } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const authErr = checkAuth(req);
  if (authErr) return authErr;

  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;
    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const sizeErr = checkImageSize(file.size);
    if (sizeErr) return sizeErr;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
                detail: "high",
              },
            },
            {
              type: "text",
              text: `You are an expert at identifying collectible figurines, action figures, and pop culture merchandise.

Identify this figurine and respond with ONLY a JSON object (no markdown, no code blocks) with these exact fields:
{
  "name": "Full product name as it would appear on eBay (e.g. 'Funko Pop Marvel Spider-Man #03' or 'Marvel Legends Iron Man Action Figure')",
  "brand": "Brand name (e.g. 'Funko', 'Hasbro', 'Hot Toys', 'Sideshow', 'NECA')",
  "series": "Series or line (e.g. 'Funko Pop', 'Marvel Legends', 'Marvel Select')",
  "character": "Character name (e.g. 'Spider-Man', 'Iron Man', 'Thanos')",
  "number": "Figure number if visible (e.g. '#03'), or null if not visible",
  "searchQuery": "Optimized eBay search query to find this exact item (keep it concise and specific)"
}

If you cannot identify the figurine with confidence, still provide your best guess based on what you can see.`,
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const content = response.choices[0].message.content || "";
    const cleaned = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const data = JSON.parse(cleaned);

    return NextResponse.json(data);
  } catch (err) {
    console.error("Identify error:", err);
    return NextResponse.json(
      { error: "Failed to identify figurine" },
      { status: 500 }
    );
  }
}
