"use client";

import { useState, useCallback } from "react";

interface FigurineResult {
  id: string;
  fileName: string;
  imageUrl: string;
  status: "identifying" | "pricing" | "done" | "error";
  error?: string;
  // from identify
  name?: string;
  brand?: string;
  series?: string;
  character?: string;
  number?: string;
  searchQuery?: string;
  // from prices
  low?: string;
  high?: string;
  average?: string;
  count?: number;
  searchUrl?: string;
}

export default function Home() {
  const [results, setResults] = useState<FigurineResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (fileArray.length === 0) return;

    const newEntries: FigurineResult[] = fileArray.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      fileName: file.name,
      imageUrl: URL.createObjectURL(file),
      status: "identifying",
    }));

    setResults((prev) => [...newEntries, ...prev]);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const entry = newEntries[i];

      try {
        // Step 1: Identify
        const formData = new FormData();
        formData.append("image", file);
        const identRes = await fetch("/api/identify", {
          method: "POST",
          body: formData,
        });
        if (!identRes.ok) throw new Error("Identification failed");
        const identData = await identRes.json();

        setResults((prev) =>
          prev.map((r) =>
            r.id === entry.id
              ? { ...r, status: "pricing", ...identData }
              : r
          )
        );

        // Step 2: Get prices
        const priceRes = await fetch("/api/prices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ searchQuery: identData.searchQuery }),
        });
        if (!priceRes.ok) throw new Error("Price lookup failed");
        const priceData = await priceRes.json();

        setResults((prev) =>
          prev.map((r) =>
            r.id === entry.id
              ? { ...r, status: "done", ...priceData }
              : r
          )
        );
      } catch (err) {
        setResults((prev) =>
          prev.map((r) =>
            r.id === entry.id
              ? {
                  ...r,
                  status: "error",
                  error: err instanceof Error ? err.message : "Unknown error",
                }
              : r
          )
        );
      }
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  const downloadCSV = () => {
    const doneResults = results.filter((r) => r.status === "done");
    if (doneResults.length === 0) return;

    const headers = [
      "Item Name",
      "Brand",
      "Series",
      "Character",
      "Number",
      "Low Price ($)",
      "High Price ($)",
      "Avg Price ($)",
      "# Listings",
      "eBay Search Link",
      "Condition",
      "My Asking Price",
      "Notes",
    ];

    const rows = doneResults.map((r) => [
      r.name ?? "",
      r.brand ?? "",
      r.series ?? "",
      r.character ?? "",
      r.number ?? "",
      r.low ?? "",
      r.high ?? "",
      r.average ?? "",
      r.count ?? "",
      r.searchUrl ?? "",
      "",
      "",
      "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `figurines-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doneCount = results.filter((r) => r.status === "done").length;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 px-4 py-6 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold tracking-tight">
            🧸 Figurine Price Finder
          </h1>
          <p className="text-indigo-200 text-sm mt-1">
            Upload photos → AI identifies your figurines → Live eBay prices
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Upload Area */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 ${
            isDragging
              ? "border-indigo-400 bg-indigo-950"
              : "border-gray-700 bg-gray-900 hover:border-indigo-500 hover:bg-gray-800"
          }`}
        >
          <label className="flex flex-col items-center justify-center gap-3 py-10 px-6 cursor-pointer">
            <div className="text-5xl">📸</div>
            <div className="text-center">
              <p className="text-lg font-semibold text-white">
                Tap to upload photos
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Select multiple figurine photos from your camera roll
              </p>
            </div>
            <div className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-full text-sm transition-colors">
              Choose Photos
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileInput}
            />
          </label>
        </div>

        {/* Download CSV button */}
        {doneCount > 0 && (
          <button
            onClick={downloadCSV}
            className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <span>⬇️</span>
            <span>Download CSV ({doneCount} item{doneCount !== 1 ? "s" : ""})</span>
          </button>
        )}

        {/* Results */}
        <div className="space-y-4">
          {results.map((r) => (
            <ResultCard key={r.id} result={r} />
          ))}
        </div>
      </div>
    </main>
  );
}

function ResultCard({ result: r }: { result: FigurineResult }) {
  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-lg border border-gray-800">
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={r.imageUrl}
          alt={r.fileName}
          className="w-24 h-24 object-cover rounded-xl flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          {r.status === "identifying" && (
            <StatusBadge color="yellow" label="🔍 Identifying figurine..." />
          )}
          {r.status === "pricing" && (
            <>
              <p className="font-semibold text-white text-sm leading-tight truncate">
                {r.name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {r.brand} · {r.series}
              </p>
              <StatusBadge color="blue" label="💰 Looking up eBay prices..." />
            </>
          )}
          {r.status === "error" && (
            <>
              <p className="text-xs text-gray-500 truncate">{r.fileName}</p>
              <StatusBadge color="red" label={`❌ ${r.error}`} />
            </>
          )}
          {r.status === "done" && (
            <div className="space-y-2">
              <div>
                <p className="font-semibold text-white text-sm leading-tight">
                  {r.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {r.brand} · {r.series}
                  {r.number ? ` · ${r.number}` : ""}
                </p>
              </div>

              {r.count === 0 ? (
                <p className="text-xs text-yellow-400">No active listings found</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <PriceStat label="Low" value={r.low} color="green" />
                  <PriceStat label="Avg" value={r.average} color="blue" />
                  <PriceStat label="High" value={r.high} color="purple" />
                </div>
              )}

              {r.searchUrl && (
                <a
                  href={r.searchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs text-indigo-400 hover:text-indigo-300 mt-1"
                >
                  View {r.count} listings on eBay →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PriceStat({
  label,
  value,
  color,
}: {
  label: string;
  value?: string;
  color: "green" | "blue" | "purple";
}) {
  const colors = {
    green: "bg-green-900/50 text-green-300",
    blue: "bg-blue-900/50 text-blue-300",
    purple: "bg-purple-900/50 text-purple-300",
  };
  return (
    <div className={`rounded-lg px-2 py-1.5 text-center ${colors[color]}`}>
      <p className="text-xs opacity-70">{label}</p>
      <p className="font-bold text-sm">${value ?? "—"}</p>
    </div>
  );
}

function StatusBadge({
  label,
  color,
}: {
  label: string;
  color: "yellow" | "blue" | "red";
}) {
  const colors = {
    yellow: "text-yellow-400",
    blue: "text-blue-400",
    red: "text-red-400",
  };
  return (
    <p className={`text-xs mt-2 animate-pulse ${colors[color]}`}>{label}</p>
  );
}
