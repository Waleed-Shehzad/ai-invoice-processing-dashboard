# AI Invoice Processing & Dashboard

Application source for **Waleed | AI-Automation**. See the [repository overview](../README.md), [workflow setup](../docs/setup.md), and [verification](../docs/verification.md).

A local Next.js, TypeScript and Tailwind dashboard for an n8n invoice workflow. Start in explicitly labelled demo mode; no live failures are replaced with demo records.

## Run

Requires Node.js 20.9 or newer.

```powershell
npm install
Copy-Item .env.example .env.local
# Edit .env.local and enter your real N8N_INVOICE_API_KEY
npm run dev
```

Open http://localhost:3000. Select **Live data** in the top right to connect to n8n; choose **Demo data** to explore fictional records. Restart Next.js after changing environment variables. The n8n production workflow must be active and accessible from the Next.js server at the configured URL.

The browser calls `/api/invoices`. Only the server sends `X-API-Key` to n8n. `.env.local` is ignored by Git; never commit credentials. Requests bypass caching and time out after 15 seconds. Upstream response bodies and credentials are not logged or sent to the browser. Redirects are rejected to avoid forwarding credentials to another destination.

## Data behavior

- Search, currency and quick status filters apply to summaries, recent activity, ledger and CSV; date sorting applies to the ledger and export.
- Amounts are grouped by original currency. Missing values remain unavailable; partial totals are labelled with the count of known values.
- Blank balances are calculated only when both total and paid are numeric. The drawer identifies the calculation.
- Invoice dates are calendar dates; processing and fetch times use Asia/Karachi.
- Refresh retains previously fetched records on failure and clearly labels them as the last successful fetch.
- Demo original links lead to example.com. The workspace mode selector identifies demo data, and the drawer PDF action identifies the demo example.
- CSV exports every normalized field, including balance provenance. Potential spreadsheet formulas are escaped.

## Checks

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

Live credentials are intentionally not included. Verify the real workflow by entering a key and choosing Live data. Deploy this dashboard behind authentication before making financial records available on a public network; this portfolio implementation has no user authentication.

## Upload folder and dashboard scope

Set `NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_URL` to the actual Google Drive invoice folder URL in `.env.local`, then restart the development server (rebuild for production). This public setting contains a folder link only, never an API key. If omitted, setup guidance appears only in the Automation view and no upload action is shown in the invoice workspace. The action opens Google Drive; it does not simulate an upload or grant access to the folder.

Search, currency and quick status filters apply consistently to summaries, recently saved invoices, table rows, and CSV export. Date sorting affects the table and export order. Activity uses actual `processed_at` timestamps, most recent first. The single-day volume chart has been removed because it did not provide a useful trend.

Overview and Automation are distinct hash-addressable views. Browser back/forward navigation preserves the invoice filters. The workflow explanation, n8n credit and setup information live in Automation. Shared semantic colour and radius tokens are defined in `app/globals.css`.

Quick filters require a known, finite positive unpaid balance. Missing payment information remains unknown. Due filters additionally require a valid ISO calendar date. Overdue means before today; Due in 7 days includes today through the seventh day. Today is calculated in Asia/Karachi, and updates while the dashboard remains open. Invalid dates and unknown balances are excluded from date-based quick filters. Calculated balances retain their provenance in the details drawer and CSV.

## Themes

Light mode is the default for first-time visitors. The labelled sun/moon switch beside the data-source selector remembers an explicit choice in `invoice-dashboard-theme` browser storage. A synchronous head script applies the preference before the initial paint; storage failures fall back to light without breaking the current visit. The same switch is available inside the invoice drawer, preserving the selected invoice and filters. Open tabs sync theme changes.

Light and dark palettes share semantic CSS tokens, including separate primary-button and accent colours. Native controls use the selected `color-scheme`. The theme does not change invoice data, data-source mode or API behaviour.
