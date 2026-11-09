import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

const HEADERS = [
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
  "Date Added",
];

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set");
  const credentials = JSON.parse(raw);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });
}

export async function ensureHeaderRow(spreadsheetId: string) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  // Read the first row to check if headers exist
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Sheet1!A1:N1",
  });

  const firstRow = res.data.values?.[0] ?? [];
  if (firstRow.length === 0) {
    // Write headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Sheet1!A1",
      valueInputOption: "RAW",
      requestBody: { values: [HEADERS] },
    });
  }
}

export async function appendRow(
  spreadsheetId: string,
  row: (string | number | null)[]
) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Sheet1!A1",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
}

export function extractSpreadsheetId(input: string): string {
  // Accept full URL or bare ID
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  // If it looks like a plain ID already
  if (/^[a-zA-Z0-9_-]{20,}$/.test(input.trim())) return input.trim();
  throw new Error("Invalid Google Sheets URL or ID");
}
