# Verification

Checks recorded on 30 October 2026 for the integrated repository. Browser checks used the production build on a temporary local port, with fictional demo records. No live n8n requests, invoice processing or email sends were executed during this verification.

## Application checks

| Check | Actual result |
| --- | --- |
| `npm ci --offline --no-audit --no-fund` in `dashboard/` | Passed using the included npm lockfile; 368 packages installed from the local cache |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm run build` | Passed; Next.js 16.4.3, including `/` and the dynamic `/api/invoices` route |
| `npm test` | Runner blocked by this Windows environment: `uv_os_get_passwd returned ENOMEM` inside tsx before executing the tests |
| Same test sources compiled with TypeScript and run with Node's test runner | All 7 tests passed |
| `npm run start -- --port 3001` | Production server started successfully for browser checks |

The test fallback was run from `dashboard/`:

```powershell
npx tsc --module commonjs --esModuleInterop --target es2021 --outDir .next/invoice-tests lib/invoices.ts lib/invoice-filters.ts lib/invoices.test.ts
node --test .next/invoice-tests/invoices.test.js
```

This fallback uses the existing tests without changing the app's scripts. Test output remains ignored under `.next/`. The seven tests cover missing/invalid/zero amounts, balance derivation and provenance, Karachi day boundaries, inclusive seven-day due filters, leap/invalid calendar dates, timestamps, CSV escaping/formula protection and unsafe URL schemes. The tsx runner limitation is not reported as a passed `npm test` run.

## Browser checks on the integrated application

- Search for Forma plus USD returned two records. Oldest-invoice sorting put FS-1076 first.
- Adding Unpaid returned only FS-1082. Downloaded CSV contained one record, included FS-1082 and excluded the settled FS-1076 record.
- Due in 7 days returned two demo records on the verification date. Overdue showed an intentional empty state. Missing/zero/credit balances and invalid due dates were also checked by the data tests.
- Reset filters and demo refresh worked. Summary amounts and activity used the same current filter scope as the table and CSV.
- Details opened, showed the calculated-balance explanation, and retained the selected invoice while switching themes. Escape closed the drawer and returned focus to View details; keyboard focus stayed within the drawer.
- Demo PDF actions retained the `https://example.com/` destination and were identified as demo examples in the drawer. This is a link-target check, not verification of a real Google Drive PDF.
- First visits used light mode. Dark selection persisted after reload. Theme switching preserved search filters and the selected invoice on desktop and mobile.
- A separate browser context denied all localStorage access: the dashboard still loaded in light mode, switched to dark and produced no uncaught page errors.
- Overview and Automation navigation, browser back, author branding and the absent upload-folder setup notice were checked. Setup information stayed in Automation; no fake upload control appeared in Overview.
- Widths 320, 390, 768 and 1440px had no page overflow. Table text remained 14px; wide tables scroll within their own region. Mobile drawer controls remained usable.
- Desktop and mobile screenshots in both themes were captured from the integrated production build and checked for readability. Screenshots contain only demo records.

## Package and workflow checks

- All committed JSON files parse, local Markdown links resolve, and screenshot files have valid PNG signatures.
- Seven PDF fixtures exist and have PDF headers and complete end markers. Embedded text was decoded locally and matched the expected supplier, invoice number, currency, dates and total for each fixture. The Alder fixture has two pages; the remaining fixtures have one page.
- The Cedar duplicate's expected core fields match its original exactly. These fixture checks do not measure model extraction accuracy.
- The sheet template's 12 headers match the Append row mappings. The API fixture has the shape expected by the actual server proxy; its blank balance is intentionally derived by normalization.
- All 18 workflow node names and connection targets resolve. The workflow is inactive, pinned data is empty, account credential bindings are absent, and private resource IDs remain replacement markers.
- The duplicate lookup includes invoice number, supplier and currency, with Always Output Data enabled. Boolean IF true connects to No Operation; false connects to Restore Values and then Append. Restore retains the extractor's `output` object.
- The IF condition was evaluated locally for missing, null, blank and present row numbers. The response expression was evaluated locally for empty emitted items and a populated invoice row. Both passed. This is static expression simulation, not an n8n runtime execution.
- The webhook uses Header Auth and the final invoices-array response, not the temporary test response. The Sheets read node emits an empty item so the empty-array expression can run.
- The workflow export remains byte-for-byte identical to the sanitised supplied template. No newer local export was found in the task workspace.
- Staged files were reviewed for secret patterns, credential bindings, private Drive/Sheet links, generated output, dependencies, local skill folders and handoff-only material. Those files are excluded; only the sanitised workflow and fictional fixtures are included.
- No CI workflow or licence was invented. The actual application scripts and lockfile were retained. Turbopack's root is explicitly scoped to `dashboard/` so nesting the checkout does not select a parent lockfile.

## Earlier workflow evidence

The supplied development notes report successful new-invoice append, duplicate skip, email sending and an independently authenticated invoice-list endpoint request. Those observations were not repeated here and are not a production reliability benchmark. The final dashboard's live integration deliberately remains unverified.

## Remaining manual checks

- Configure account credentials, Drive folder, Sheet resource IDs, Groq models and a recipient you control in n8n.
- Confirm the installed Sheets node combines the three duplicate filters using AND; exercise actual sequential new/duplicate invoices and inspect the complete execution trace.
- Verify the imported workflow in your n8n version, including model output, append behaviour and Gmail delivery. Sanitised imports were not activated or executed here.
- If live mode is desired, enter the actual server-side environment values and test the dashboard connection separately. Add access protection before exposing financial records; there is no dashboard sign-in layer.

## Repository publication

The private repository was created under the authenticated Waleed-Shehzad account:

https://github.com/Waleed-Shehzad/ai-invoice-processing-dashboard

An initial authentication check was blocked by a configured GitHub credential helper pointing to a missing GitHub CLI executable. Direct Windows Git Credential Manager access confirmed the existing account credential; publication uses that helper without changing global Git configuration. Credentials are never included in the project or command output.

