# POS Receipt Generator

A small web app for building and printing receipts styled to look like a
real thermal point-of-sale (POS) printout. Fill in a form, get a live
receipt preview, and print it (or save as PDF) sized for an 80mm thermal
roll.

## Files

- `index.html` — the generator app: form on the left, live receipt preview on the right
- `style.css` — form layout + receipt paper styling (both templates)
- `app.js` — form state, item add/remove, live calculations, template/currency switching, print handling
- `receipt.html` — a static, non-interactive example of the classic receipt format (hand-edited, kept for reference)

No build step, no package dependencies — everything runs from plain HTML/CSS/JS in the browser. The **Compact (Dot Matrix)** template loads the "Doto" typeface from Google Fonts over the network for its pixel-grid look; every other part of the app works fully offline, and the Classic template always uses a local system monospace font.

## Usage

```bash
open index.html
```

1. Pick a **Template** (Classic or Compact/Dot Matrix) and **Currency** (₦ Naira or $ US Dollar) at the top of the form.
2. Fill in store details (name, address, phone, TIN, optional logo), transaction details (date, time, table/bill number, payment method), and footer text.
3. Add items with the **+ Add item** button; remove any row with the ✕ button. Qty and Rate can be any number (decimals allowed), so it works for anything from a single unit to items sold by weight.
4. Set a VAT % (defaults to 0 — set it to 7.5 for standard Nigerian VAT, or whatever applies to your business).
5. Enter the amount tendered — Subtotal, VAT, Total, and Change (or Balance Due, if tendered is less than the total) are calculated live as you type.
6. Click **Print / Save as PDF**. Only the receipt itself is printed (the form is hidden), sized exactly to the receipt's own width and height (3.15in / 80mm wide, standard thermal paper) — no extra blank page or margins.

## Customizing further

- **Currency**: symbols live in `CURRENCY_SYMBOLS` in `app.js`. Add more entries there and a matching `<option>` in the `#currency` select in `index.html` to support additional currencies.
- **Templates**: each template is a separate render function in `app.js` (`renderClassic`, `renderCompact`), switched on by the `#template` select. Styling for each lives under `.receipt-paper` (classic, default) and `.receipt-paper.template-compact` in `style.css`. To add a new template: write a `renderX()` function, add a CSS block scoped to `.receipt-paper.template-x`, and add an `<option>` to `#template`.
- **Payment method options**: edit the `<option>` list in the `#metaPayment` select in `index.html`.
- **Default starting items/values**: edit `DEFAULT_ITEMS` and the field `value` attributes in `index.html` — useful if you always start from a similar order.

## Notes

- Most form state lives directly in the DOM (the form fields) — there's no
  backend or persistence, so refreshing the page resets it to the defaults.
- The logo upload reads the image as a data URL client-side; nothing is
  uploaded anywhere.
- The barcode above the thank-you message is a generated decorative pattern
  (seeded from the bill number and date so it stays stable while you edit
  items), not a real scannable barcode encoding.
