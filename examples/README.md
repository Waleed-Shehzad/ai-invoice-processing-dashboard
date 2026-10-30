# Fictional example data

All suppliers, customer details, addresses and amounts in these fixtures are synthetic. Emails use reserved .example domains. These are demonstration documents, not business records.

## PDF fixtures

| File | Purpose |
| --- | --- |
| 01_cedar_it_pkr.pdf | PKR invoice |
| 02_harbor_cloud_usd.pdf | USD hosting invoice |
| 03_lumen_studio_gbp.pdf | GBP services invoice |
| 04_alder_equipment_eur_multipage.pdf | EUR invoice spanning multiple pages |
| 05_dune_logistics_aed.pdf | AED logistics invoice |
| 06_oakline_furniture_pkr_discount.pdf | PKR invoice with discount fields |
| 07_cedar_it_duplicate.pdf | Duplicate of invoice 01 |

Use a fresh test ledger. Process invoice 01 before invoice 07. The lookup key is supplier_name + invoice_number + currency; the expected result is one row for that invoice.

expected-core-fields.json lists deterministic source values for comparison. These are expectations, not a measured extraction score. Its supplier_name expectation is source spelling; LLM normalization differences may affect exact matching.

The workflow does not validate arithmetic or extract line items into separate ledger rows. Extra fields printed in the fixtures do not imply those features exist.

api/invoices.example.json demonstrates the response shape and includes a deliberately blank balance_due to illustrate optional calculation. The dashboard's own sample records are separate and must be retained from the real application.

sheets/invoice-ledger-template.csv contains the exact ledger headers. Import it into a test sheet or use its first row as headers.
