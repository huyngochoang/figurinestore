# Figurine Price Finder

A mobile-friendly web app that identifies collectible figurines from photos and looks up live eBay active listing prices, then saves results directly to Google Sheets.

## How it works

1. Open the app on your phone browser
2. Tap **Choose Photos** and select figurine photos from your camera roll
3. AI (GPT-4o Vision) identifies each figurine — name, brand, series, number
4. eBay active listings are scraped for low, high, and average USD prices
5. Download a **CSV** or save directly to **Google Sheets**

---

## Secrets Setup

Add these in Cursor Dashboard → Cloud Agents → Secrets:

### 1. `OPENAI_API_KEY`

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click **Create new secret key**, name it "Figurine App"
3. Copy the key (starts with `sk-`)
4. Add it as `OPENAI_API_KEY` in Cursor Secrets

---

### 2. `GOOGLE_SERVICE_ACCOUNT_JSON`

This lets the app write rows directly to your Google Sheet. Takes about 5 minutes.

#### Step 1 — Create a Google Cloud project
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top → **New Project**
3. Name it "Figurine App" → **Create**

#### Step 2 — Enable Google Sheets API
1. In the left menu go to **APIs & Services** → **Library**
2. Search for **Google Sheets API** → click it → **Enable**

#### Step 3 — Create a Service Account
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Name it "figurine-app" → **Create and Continue** → **Done**
4. Click the service account email you just created
5. Go to the **Keys** tab → **Add Key** → **Create new key** → **JSON** → **Create**
6. A `.json` file downloads automatically — open it in a text editor

#### Step 4 — Add the JSON key as a secret
1. Copy the **entire contents** of the downloaded `.json` file
2. In Cursor Dashboard → Secrets, add a new secret named `GOOGLE_SERVICE_ACCOUNT_JSON`
3. Paste the full JSON as the value → Save

#### Step 5 — Set up your Google Sheet
1. Go to [sheets.google.com](https://sheets.google.com) → create a new blank spreadsheet
2. Open the `.json` key file and find the `"client_email"` field — copy that email address
3. In your Google Sheet, click **Share** → paste the service account email → give it **Editor** access → **Send**
4. Copy your sheet's URL (looks like `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`)

#### Step 6 — Use it in the app
1. After processing your figurine photos, paste the Google Sheet URL into the **Save to Google Sheets** field
2. Click **Save X items to Sheets**
3. The app auto-creates headers on first save and appends one row per figurine

---

## Spreadsheet Columns

| Column | Description |
|---|---|
| Item Name | Full product name identified by AI |
| Brand | e.g. Funko, Hasbro, Hot Toys |
| Series | e.g. Funko Pop, Marvel Legends |
| Character | e.g. Spider-Man, Iron Man |
| Number | Figure number if visible (e.g. #03) |
| Low Price ($) | Lowest active eBay listing |
| High Price ($) | Highest active eBay listing |
| Avg Price ($) | Average of all active listings |
| # Listings | Number of eBay listings found |
| eBay Search Link | Direct link to eBay search results |
| Condition | Fill in yourself (New / Used / etc.) |
| My Asking Price | Fill in your sale price |
| Notes | Any additional notes |
| Date Added | Auto-filled with today's date |

---

## Local Development

```bash
cd figurine-app
cp .env.local.example .env.local   # fill in your keys
npm install
npm run dev
```
