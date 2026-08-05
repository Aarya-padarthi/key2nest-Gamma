# Key2Nest — Digital Business Cards

Premium, mobile-first "digital business card" pages for each Key2Nest team
member, designed to be opened by scanning a **QR code printed on a physical
business card**. ~95% of traffic is mobile, so the mobile experience is the
priority; desktop is responsive but centered.

The look inherits the site's **Rev 10 design system** — Navy `#0B1A2E`, 22K Gold
`#D4AF37`, Ivory `#F4EFE3`, Source Serif 4 + Source Sans 3, dark/light theming —
so a card feels like it belongs to the same brand as the main site.

> This first version is **deployed independently** of the main marketing site.
> The slugs are chosen so they migrate cleanly later (e.g. `/vivek` →
> `/team/vivek`) without needing to reprint QR codes if a redirect is added.

## The 5 cards

| Person | Slug | Card URL* |
|---|---|---|
| Sai Vivek Boddu | `vivek` | `<base>/vivek` |
| Naveen Cheedhalla | `naveen` | `<base>/naveen` |
| Sreedhar Seelam | `sreedhar` | `<base>/sreedhar` |
| Sreelakshmi Jasti | `lakshmi` | `<base>/lakshmi` |
| (RJ) Venkata Rajaneesh Jandhyam | `rj` | `<base>/rj` |

\* `<base>` is set by `BASE_URL` in `build.py` (currently
`https://key2nesthomeloans.com`). **Set this to the real deployment host and
re-run the build before printing any QR codes** (see below).

## What each card offers

- **Save to Contacts** — downloads a vCard 3.0 (`.vcf`) with the person's name,
  title, phone, email, company, NMLS, and an **embedded portrait**, so the saved
  phone contact shows their photo.
- **Call / Text / Email / WhatsApp / Website** — one-tap actions; Website
  opens the Key2Nest homepage (`https://key2nesthomeloans.com`).
- **Apply Now** — CTA to the main site's inquiry form
  (`https://key2nesthomeloans.com/#contact`).
- Automatic light/dark theme via `prefers-color-scheme` (no manual toggle);
  the logo swaps between the gold (dark) and navy (light) lockups. NMLS badges, company
  licensing footer, Person + Organization schema.org markup.

## Structure

```
cards/
├── build.py          # single source of truth — people data + generator
├── card.css          # shared stylesheet (brand tokens, self-contained)
├── index.html        # directory landing page (lists all cards; noindex)
├── assets/           # portraits, logo, favicons
├── <slug>/index.html # one generated page per person → clean /<slug> URL
├── vcards/<slug>.vcf # Save-to-Contacts files
└── qr/<slug>.svg|png # QR codes (vector + print-ready raster)
```

## Regenerating

All content is generated from `PEOPLE` / `COMPANY` in **`build.py`**. Edit data
there (never hand-edit the generated `*/index.html`, `.vcf`, or `qr/` files),
then:

```bash
pip install segno          # one-time; pure-Python QR library, no other deps
python3 build.py                                  # uses BASE_URL in build.py
python3 build.py --base-url https://your-host.com # override the QR/canonical host
```

## Deploying (integrated under key2nesthomeloans.com)

The cards ship as part of the main site deploy and live at
`key2nesthomeloans.com/cards/...`. A Netlify rewrite maps the clean per-person
URL onto that folder, so the QR target `/vivek` serves `/cards/vivek/` while the
address bar keeps `/vivek`:

- **`../_redirects`** (in the site root, next to `index.html`) holds the rewrite
  rules — one `200` line per slug. Keep it in sync with `PEOPLE` if slugs change.
- The per-card pages reference assets **absolutely** under `ASSET_BASE`
  (`/cards` — set in `build.py`) so they resolve regardless of the served URL.

To publish: deploy the **site folder** (the one containing `index.html` and the
`cards/` subfolder) to the Netlify site that serves `key2nesthomeloans.com`
— Netlify manual deploy: *Deploys → drag the folder* (or *Manage deployments →
New version*). After it goes live, scan-test one card before printing.

Direct URLs that work even without the rewrite: `key2nesthomeloans.com/cards/<slug>/`.

> Hosting the `cards/` folder as its own standalone site instead? Set
> `ASSET_BASE = ""` in `build.py`, rerun, and skip `_redirects` — directory
> routing then gives clean `/<slug>` URLs with no rewrite needed.

**Before printing QR codes:** confirm the deployed URL resolves, then use the
files in `qr/` (SVG for print, PNG as a fallback). The QR payload is
`BASE_URL + "/" + slug`.

## Notes / open items for v2

- **WhatsApp** is enabled on every card using each person's own phone number
  (client-confirmed). To change or remove it for anyone, edit their
  `"whatsapp"` value in `build.py` and rerun.
- **Base URL** is set to `https://key2nesthomeloans.com` — the cards are meant
  to live at `/<slug>` on the main domain (host there or add redirects before
  the QR codes resolve).
- Future scope (per discussion): LinkedIn, calendar/booking links, per-person
  taglines, and folding these fully into the main domain under `/team/<slug>`.
