# POS Receipt Template

A single-file, print-ready HTML receipt styled to look like a real thermal
point-of-sale (POS) printout — monospace type, dashed/double rule dividers,
and Nigerian Naira (₦) pricing.

## Files

- `receipt.html` — the entire receipt (markup + styles, no build step, no dependencies)

## Usage

Open `receipt.html` directly in a browser:

```bash
open receipt.html
```

- **On screen**: the receipt renders at a fixed ~300px width, centered on a
  grey background, so it reads like an actual paper strip instead of
  stretching across the page.
- **When printed** (`Cmd/Ctrl + P`): the `@page` rule switches the layout to
  a 2.8in-wide roll (standard 80mm thermal paper) and drops the on-screen
  shadow/centering, so it prints edge-to-edge like a real receipt.

## Customizing

All content is static HTML/CSS — edit `receipt.html` directly:

| What | Where |
|---|---|
| Store name, address, phone | `<header>` block, `.store-name` / `.store-info` |
| Tax ID | the `TIN:` line below the header |
| Date / time / table / bill number | `.bill-details` table |
| Line items | rows inside `<table class="items"> <tbody>` — each row is `Item / Qty / Rate / Amount` |
| Subtotal / VAT / Total | the last three rows of the items table |
| Payment method / tendered / change | `<section>` below the items table |
| Currency symbol | `.price::before` and `.total.price::before` (`content: "\20A6"` = ₦) |
| Footer text | `<footer>` |

Amounts in `.price` cells are plain numbers — the ₦ symbol is added
automatically via CSS `::before`, so don't type the symbol into the cell
itself.

## Notes

- No JavaScript — all totals are entered by hand. If you need the
  subtotal/VAT/total to compute automatically from the line items, that
  would require adding a small script.
- Swap `logo.png` in the project root to change the header logo (the `#logo`
  div references `./logo.png`).
