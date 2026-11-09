import { NextRequest, NextResponse } from "next/server";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

export function checkAuth(req: NextRequest): NextResponse | null {
  const secret = process.env.FIGURINE_APP_SECRET;
  if (!secret) {
    // Secret not configured — block all access
    return NextResponse.json(
      { error: "App not configured. Set FIGURINE_APP_SECRET." },
      { status: 503 }
    );
  }
  const provided =
    req.headers.get("x-app-secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null; // authorized
}

export function checkImageSize(sizeBytes: number): NextResponse | null {
  if (sizeBytes > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: `Image too large. Maximum size is 10 MB.` },
      { status: 413 }
    );
  }
  return null;
}
