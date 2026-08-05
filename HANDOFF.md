# Key2Nest — Project Handoff

**Last updated:** 2026-08-01 (Rev25 — accessibility + content pass)
**Owner:** Aarya / Sai Vivek Boddu (client)
**Active build:** this folder (`Key2Nest_Version5/`) — standalone; no v1/v2 siblings are present here
**Deployed:** https://gilded-peony-fba821.netlify.app
**Launch domain:** `key2nesthomeloans.com` — all canonical/og/sitemap/robots references now point here, but the domain is **NOT yet mapped in Netlify/DNS**. Do not deploy this build until it resolves with a valid certificate (§8).

Read this file first when resuming work. It's the single source of truth for project state — memory only points at it.

---

## 1. What this site is

Boutique mortgage advisory marketing site for **Key2Nest** — a Texas-licensed brokerage led by **Sai Vivek Boddu** with 4 partner MLOs. Single-page premium scroll layout with 4 legal sub-pages (privacy / terms / accessibility / licensing).

**Brand positioning:** Nationwide marketing language, Texas-only licensing. (Client explicitly chose this compromise after seeing audit warnings — multi-state licensing is being acquired in parallel. See §9 *Compliance trade-offs.*)

---

## 2. Folder layout

```
Key2Nest_Version5/            ← ACTIVE BUILD (this folder, standalone)
├── index.html
├── styles.css
├── main.js
├── apps-script.gs            ← paste into Google Apps Script editor to update notifications
├── privacy.html / terms.html / accessibility.html
│                               (licensing.html was DELETED in Rev23 — see §10)
├── styleguide.html           ← live design-system page, noindex
├── DESIGN-SYSTEM.md          ← written spec (styleguide.html is the proof)
├── sitemap.xml / robots.txt
├── HANDOFF.md                ← this file
├── brand/                    (3 logo-plaque source files — not used by the site)
├── .claude/
│   └── launch.json           (ONE config only: "key2nest" on port 5173)
└── assets/
    ├── logo.png              light-theme logo (289×236)
    ├── logo-gold.png?v=3     dark-theme logo — the site swaps these per theme (§3)
    ├── Vivek.jpeg / Naveen.jpeg / Sreedhar.jpeg / Lakshmi.jpeg / Rajaneesh_new.jpeg
    │                         all 5 advisor headshots, 700×700 (§4)
    ├── hero-1x.jpg/webp      (1280×720 mobile)  ├── hero-2x.jpg/webp (2560×1440 desktop)
    ├── home_hero.mp4         (6MB hero video, desktop only)
    ├── og-image.jpg          (1200×630 social preview)
    ├── favicon set           (ico + svg + 5 PNG sizes + apple-touch + maskable)
    └── UNUSED (candidates for deletion, deferred to post-launch cleanup):
        Logo_darkmode.png, Logo_lightmode.png, Logo_LV.png, Logo_DV.png,
        logo_old.png, logo_padded.png, founder.png, hero.png, hero.jpg,
        hero.webp, home_hero_2.mp4, Rajaneesh.jpeg (superseded by _new)
```

**Run a preview locally:** `python -m http.server 5175` from inside this folder, then open `http://localhost:5175`. NOTE: `.claude/launch.json` only defines a `key2nest` config on port **5173** — the v1/v2/v3 and 5176 configs described in earlier revisions are not present here. Always hard-refresh (Ctrl+F5) after a CSS/JS change.

---

## 3. Design system (locked decisions)

### Palette
- **Navy** `#0B1A2E` (one shade across the whole site — no multi-navy stacking)
- **Navy deep** `#06111E` (footer + scrollbar only)
- **22K brushed metallic gold** `#6E4B08 / #8B600A / #A8740B / #C89B1E / #D4AF37 / #F6D96A / #FFF3C4` — 22-karat ornament gold with warm honey/amber undertones and satin metallic finish. Primary `#D4AF37` (hue ~46°, contrast 8.31:1 on navy). Deep antique shadows (#6E4B08) through champagne highlights (#FFF3C4). Replaced the earlier yellow-leaning gold in Rev6. Token names remain `--brass-*`.
- **Cream** `#F4EFE3 / #FAF6EC / #EDE5D2`
- **Logo pill parchment** `#EBE1C5 → #DBCFB2` gradient (header + footer share this; lighter than first muted attempt)
- **Teal accent** `#3D7A85` (cool counter-light, ATMOSPHERIC ORBS ONLY — never for UI/text)
- **Ivory action sections** (Rev7) — `.midcap` + `.section-contact` are the ONLY light sections: ivory `#FAF6EC → #F4EFE3` backgrounds, warm-white `#FFFDF7` cards, white inputs. Design rule: light = "paper you write on" (forms only). Gold TEXT on ivory uses the deep ramp — `#8B600A` accents (5.2:1), `#6E4B08` strong (7.3:1); bright `#D4AF37` is decorative-only on light (1.95:1, fails text). Body text navy. Gold hairlines on ivory: `rgba(139,96,10,…)`. Buttons identical in both contexts. Client chose single theme (no light/dark toggle) on 2026-07-04.
- **Gold shimmer** (Rev6.5) — `--gold-shimmer` token: champagne highlight band + top radial glow layered over `.btn-primary` and active `.calc-tab` ("liquid gold" Option D, chosen over brushed-metal crosshatch).

### Typography
- **Display:** Source Serif 4 (variable, opsz 8–60, ital available) — loaded from Google Fonts
- **Body:** Source Sans 3 (variable, wght 300–700)
- *Why this pair:* Adobe editorial pair, professional/conservative. Replaced Fraunces + Inter Tight after client said original fonts felt unprofessional.

### Type scale (Major Third 1.25 ratio, anchored at 16px)
CSS tokens: `--fs-13` through `--fs-95` (13 / 16 / 20 / 25 / 31 / 39 / 49 / 61 / 76 / 95)

### Spacing scale (4-pt grid)
CSS tokens: `--sp-4` through `--sp-128`. Section vertical rhythm: `--section-y: clamp(72px, 7.5vw, 112px)`.

### Italic-gold rule
Italic + brass color appears in **hero only** (one moment of emphasis). Other section titles use plain cream serif. Don't break this rule.

### Atmospheric system
Every section has two layered pseudo-elements:
- `::before` — soft "museum lighting" halo from the top (brass-tinted radial)
- `::after` — directional brass orb + cool teal counter-light per section (diagonally paired)

Opacities are tuned (15–20% brass / 12–13% teal). Don't push them stronger without checking — they're at the right "feel-but-don't-see" threshold.

### Logo treatment
**Theme-aware pair** (undocumented until Rev25): every logo slot renders TWO `<img>` tags — `logo-gold.png?v=3` with class `logo-img-dark` and `logo.png` with class `logo-img-light`; CSS shows one per theme. Dark mode gets the all-gold mark (reads premium on navy), light mode the navy+gold mark. Both are 289×236, cropped from the original 309×337 to remove built-in whitespace. If you swap a logo file, **bump the `?v=` string** or browsers serve the stale image (same trap as team photos, §10 Rev14).

Header pill: `padding: 8px 12px`, height 56px. Footer pill: `padding: 14px 22px`, height 132px. Header plaque also carries the `NMLS #2819804` line.

---

## 4. Team data (real)

5 advisors, ordered Sai first then alphabetical. **All five now have real headshots** — `Vivek.jpeg?v=3`, `Naveen.jpeg?v=2`, `Sreedhar.jpeg?v=1`, `Lakshmi.jpeg?v=2`, `Rajaneesh_new.jpeg?v=2`. No initials circles remain in the markup. The initials fallback in `main.js` (`.team-initials` → `.team-modal-initials-lg`) is still wired and functional — it just has nothing to match. Keep it: it is the graceful path for the next advisor who joins before a headshot arrives.

| # | Name | Title | NMLS | Email | Initials |
|---|---|---|---|---|---|
| 1 | Sai Vivek Boddu | Senior Mortgage Loan Originator | [#2331676](https://www.nmlsconsumeraccess.org/TuringTestPage.aspx?ReturnUrl=/EntityDetails.aspx/INDIVIDUAL/2331676) | vivek.boddu@key2nesthomeloans.com | — (photo) |
| 2 | Naveen Cheedhalla | Mortgage Loan Originator | [#2666486](https://www.nmlsconsumeraccess.org/TuringTestPage.aspx?ReturnUrl=/EntityDetails.aspx/INDIVIDUAL/2666486) | naveen.cheedhalla@key2nesthomeloans.com | N.C. |
| 3 | Sreedhar Seelam | Mortgage Loan Originator | [#2085620](https://www.nmlsconsumeraccess.org/TuringTestPage.aspx?ReturnUrl=/EntityDetails.aspx/INDIVIDUAL/2085620) | sreedhar@key2nesthomeloans.com | S.S. |
| 4 | Sreelakshmi Jasti | Mortgage Loan Originator | [#2565439](https://www.nmlsconsumeraccess.org/TuringTestPage.aspx?ReturnUrl=/EntityDetails.aspx/INDIVIDUAL/2565439) | sreelakshmi@key2nesthomeloans.com | S.J. |
| 5 | Venkata Rajaneesh Jandhyam | Mortgage Loan Originator | [#2142434](https://www.nmlsconsumeraccess.org/TuringTestPage.aspx?ReturnUrl=/EntityDetails.aspx/INDIVIDUAL/2142434) | rj@key2nesthomeloans.com | R.J. |

**Original full bios are in `C:\Users\Aarya\Downloads\Team details.txt`** — site uses trimmed versions (~30–45 words each) for visual card balance. If client wants longer bios reinstated, the trimmed versions are what's currently rendered.

**Company NMLS:** #2819804 (broker).
**Sai's old personal email** `b.vivek065@gmail.com` is GONE from the site — replaced by his corporate email `vivek.boddu@key2nesthomeloans.com`. Apps Script `NOTIFY_EMAIL` set to `admin@key2nesthomeloans.com`.

---

## 5. Contact pipeline (form → sheet)

Both forms (`#contact-form` and `#midcap-form`) use `method="POST"` + JavaScript that intercepts submit and `fetch()`-es to:

```
POST https://script.google.com/macros/s/AKfycbwt7mpLIb2-PDYWD3hqLdu_szTyeiLRNursMFHVkKYvAGdeu_UlnOT7cE_EVBpeU4U/exec
```

⚠️ **The above is what `main.js:13` actually ships — it is NOT verified as the live deployment.** Earlier revisions of this file recorded two different IDs (`AKfycbwsXuxA7M…` in §5, `AKfycbwjSPrlh3…` in §8). Three IDs exist and nobody has confirmed which deployment is live. **Resolve before launch** (§8, Blocker 2).

⚠️ **Both forms POST with `mode: 'no-cors'`** (`main.js` contact + midcap handlers). The response is opaque, so `fetch` resolves even on a 403/500 or a server-side Turnstile rejection — the visitor sees the success message while the lead is silently lost. The `catch` only fires on a total network failure. **This means a broken endpoint or an unallowlisted Turnstile hostname cannot be detected after launch.** Fix is queued as Blocker 3.

The Apps Script appends a row to the sheet and emails `contact@key2nesthomeloans.com` (changed from `admin@` in Rev23 — **requires a redeploy to take effect**).

**Sheet:** https://docs.google.com/spreadsheets/d/1628Z84TsXOpDDg2Z15sJoD5j0Me7tCHbKduSGw5Cvkw/edit

**To update Apps Script** (e.g., change notification email):
1. Sheet → Extensions → Apps Script
2. Replace code with current `apps-script.gs` contents from this folder
3. Deploy → Manage deployments → ✏️ existing deployment → Version: New version → Deploy
4. The `/exec` URL stays the same — `main.js` doesn't need updating

**Form source labels** to distinguish leads in the sheet:
- Main contact form → `"Website V3"`
- Mid-page form → `"Website V3 — Mid-page"`

**Preferred call time** (radio buttons) is appended to the message body on submit so the sheet schema (7 columns) stays unchanged.

---

## 6. External CTAs + market data links

- **Apply Now** (nav, hero, pre-footer) → `https://ensurehomeloans.my1003app.com/2331676/register` (`target="_blank" rel="noopener noreferrer"`)
- **NMLS Verify** pattern → `https://www.nmlsconsumeraccess.org/TuringTestPage.aspx?ReturnUrl=/EntityDetails.aspx/INDIVIDUAL/{ID}`
- **WhatsApp** — the general contact-section CTA (`wa.me/18643597122`) is **GONE**. Confirmed as intended on 2026-08-01: that number is Vivek's personal line, and Rev23 moved the company number to 469·481·6216. The only WhatsApp link on the site is Sreelakshmi's own (`wa.me/14699706522`) on her team card. If a general channel is ever restored it needs a *business* number plus the RESPA disclaimer ("general questions only — applications go through the secure form").
- **Company phone** → `+1 469 481 6216` — nav, contact card, JSON-LD `telephone`, and both forms' failure copy. (Vivek's 864 number stays on his team card only.)
- **Market rates link** was removed in Rev1 (was Mortgage News Daily, now gone per client request)

---

## 7. Section order (current)

1. Hero (video + still fallback, GSAP entrance)
2. Trust strip (3 stats: 20+ lenders / Expert / NMLS)
3. **Loan Programs** (8 cards: 7 programs + 1 "talk to us")
4. **Mid-page capture form** (positioned here per audit — high-intent moment)
5. Calculator (4 tabs: Payment / Affordability / Refinance / Extra Payment)
6. Process (4 numbered steps)
7. **Testimonials** (HIDDEN via `hidden` attribute since Rev7 — placeholder cards intact, unhide when real quotes arrive; see §8)
8. Why Key2Nest (4 reasons, Arabic numerals 01-04)
9. Team (5 advisor cards, equal weight) — **each card opens a split profile modal** (see below)
10. FAQ (**6 questions** — state coverage · down payment · pre-approval timing · pre-qual vs pre-approval · how we get paid · what happens next)
11. Contact (form + phone / email / **office address** cards)
12. Pre-footer CTA
13. Footer (logo + address + legal links + EHO badge + regulatory disclosure)

### Two features that had never been documented (recorded Rev25)

**Team profile modal** — entirely JS-built in `main.js` (there is no modal markup in `index.html`). Each card gets an injected "View profile" button; clicking it, or anywhere on the card with a mouse, opens a split dialog (photo left, details right) populated by cloning the card's own name / title / NMLS / bio / contact nodes. Cards also get a 3D hover tilt. Rev25 rebuilt the accessibility of this — see §10.

**Program card → contact form pre-fill** — `[data-program-cta]` links read their card's `.program-title` and pre-select the matching option in the contact form's loan-type `<select>`, with a brief gold pulse so the change is visible. If you rename a program card, rename the matching `<option>` value or the pre-fill silently stops matching.

---

## 8. Outstanding items (blocked on client)

| Item | Status | Notes |
|---|---|---|
| **3 client testimonials** | Section HIDDEN (Rev7, client request) — `hidden` attribute on `#testimonials`, placeholder cards intact underneath. | When real quotes arrive: remove `hidden` from the section tag + swap the 3 cards in ~5 min. |
| **Partner MLO headshots** | ✅ DONE — all 5 advisors have real photos as of Rev16/Rev25 audit. | — |
| **Physical business address** | ✅ DONE (Rev25) — `4225 Lake View Rd., Oak Point, TX 75068` now in JSON-LD `address`, `privacy.html`, the **footer**, and a third **contact card**. | ⚠️ Nobody has independently confirmed this is the licensed HQ address of record — verify with the client. |
| **Multi-state licensing** | Client committed to acquiring more state licenses to back the "nationwide" marketing language. | Status check before any major regulator-facing event. |
| **Domain mapping** (`key2nesthomeloans.com`) | ⚠️ CODE DONE / DNS NOT DONE (Rev25). All canonical, `og:url`, `og:image`, `twitter:image`, JSON-LD `url`+`image`, all 4 `sitemap.xml` URLs and `robots.txt` now point at `key2nesthomeloans.com`. The domain is **not yet mapped in Netlify and DNS**. | **Deploying before the domain resolves points every canonical at a dead host — worse than the netlify URLs were.** Map domain + provision the HTTPS cert first. `key2nest.com` (the old §8 target) is used nowhere and was a stale reference in `robots.txt`. |
| **Apps Script redeploy** | ✅ DONE (2026-07-04). New script (Turnstile + admin@ email) deployed at `AKfycbwjSPrlh3gMOXaqr3QetcTU60csp5ulxXqc_RCeb7RS3lWbD6N-RHy2-PtGOUv6s7wm` — new /exec URL updated in main.js `SHEETS_ENDPOINT`. Verified via GET (live) + diagnostic POST. | — |
| **TURNSTILE_SECRET_KEY property** | ✅ DONE (2026-07-04) — diagnostic POST confirms the secret is read. | — |
| **Apps Script authorization (UrlFetchApp)** | ✅ DONE (2026-07-04) — scope granted after unblocking the popup. Diagnostic POST now returns "Security verification failed: invalid-input-response" (Cloudflare reached, fake token correctly rejected). Full server pipeline healthy. | — |
| **Form pipeline E2E test** | ✅ VERIFIED (2026-07-04) — real localhost submission: Turnstile passed, sheet row appended, email sent to admin@ (landed in Spam — see next row). From-address is always the script owner's account (Apps Script limitation, not a bug). | — |
| **Email lands in Spam + replyTo** | Notification emails go to admin@'s Spam folder. Local `apps-script.gs` now adds `name: 'Key2Nest Website'` + `replyTo: data.email` (reply goes straight to the lead) — **needs redeploy** (paste code → Deploy → Manage deployments → New version; URL unchanged). | In admin@ inbox: mark one "Not spam" + Gmail filter `subject:"New Key2Nest Inquiry"` → Never send to Spam. |
| **Turnstile hostnames** | `localhost` added (2026-07-04). Netlify + production domains to be added after deploy. | Add `gilded-peony-fba821.netlify.app` and `key2nesthomeloans.com` post-deploy. |
| **main.js cache-busting** | `index.html` now loads `main.js?v=rev9` AND `styles.css?v=rev9`. **Bump both `?v=` strings whenever either file changes** so browsers fetch the update. | — |
| **Calendly booking** | Deferred. | Could add as a third CTA option ("Book a 20-minute call →"). |
| **Legal attorney review** | Strongly recommended before going live. | The 4 legal pages were AI-drafted with industry-standard content — should be reviewed by a Texas mortgage attorney. |

---

## 9. Compliance trade-offs (important context)

**The "nationwide" claim** — site copy says "Serving clients nationwide" and "borrowers nationwide" but Key2Nest is currently licensed only in Texas. The audit (Claude extension critique) flagged this as a potential CFPB/UDAP violation. Client explicitly chose to keep the nationwide language and bet on quickly acquiring more state licenses.

If a fresh session is asked to roll this back:
- The decision was **made by the client** in a multi-option question. Don't unilaterally revert.
- The FAQ has a "What states is Key2Nest licensed in?" question that honestly answers Texas-only — providing some legal cover.
- Compliance text (footer regulatory disclosure, licensing page, JSON-LD `addressRegion: TX`) all accurately say Texas. Only marketing copy uses "nationwide."

**Lender-count claim** — was "100+", changed to "20+" at client request (2026-07-04, Rev7). The same revision removed all "10+ years / decade of experience" claims in favor of "Expert" positioning (no number) — client decision; don't reintroduce year counts.

**WhatsApp** — kept with a disclaimer ("general questions only — applications go through the secure portal") to handle RESPA concerns about loan-related communication record-keeping.

---

## 10. Revision history (high-level)

- **V1** — Initial premium scaffold (port 5173). Navy + gold + Bodoni + Jost.
- **V2** — Palette refinement (single navy + warm material), multi-tab calculator, team grid (port 5174).
- **V3 (initial)** — Fraunces + Inter Tight, atmospheric orbs, 7-card programs, FAQ, legal pages, favicons (port 5175).
- **V3 Rev1** — Client revision: 12 items (email swap to admin@, team heading, ADA Accessibility, nationwide audit, footer cleanup, etc.).
- **V3 Rev2** — Real team data (5 MLOs), new transparent logo, Vivek photo.
- **V3 Rev3** — Logo pill restored at larger size, Source Serif 4 + Source Sans 3 font swap, footer MLO NMLS removed.
- **V3 Rev4** — Typography + spacing system (Major Third scale, 4-pt grid, tighter section rhythm), 19 audit easy-wins (POST forms, aria-labels, donut label, Roman→Arabic, hero copy, FAQ expansion, mid-page reposition, WhatsApp disclaimer, etc.), testimonials section with 3 Pending placeholders, hero image upscaled to 2560×1440 with srcset, footer logo to muted parchment.
- **V3 logo polish** — Logo cropped 309×337 → 289×236 (removed built-in whitespace), pill backgrounds unified to lighter parchment `#EBE1C5 → #DBCFB2` on both header and footer, padding tightened.
- **V3 Rev5** — Client feedback batch: (1) NMLS #2819804 line added inside the header logo plaque (company NMLS only — never Vivek's individual number outside his bio, per client); (2) Cloudflare Turnstile on both forms — explicit render, dark/flexible, token gated at submit, auto-refresh on expiry, reset after every send, friendly error messages; `apps-script.gs` rewritten with server-side siteverify (secret in Script Properties as `TURNSTILE_SECRET_KEY`, fails closed, token never stored); (3) brass→gold palette shift (hue 32°→43°) across styles.css tokens, Tailwind configs (index + 4 legal pages), favicon.svg; custom CSS radio buttons (gold ring + radial-gradient dot) replacing accent-color; (4) FAQ +/× toggle replaced with rotating SVG chevron in circle. Turnstile site key lives in main.js (`TURNSTILE_SITE_KEY`); widget escalates to interactive checkbox on suspicious traffic — expected behavior.
- **V3 Rev6** — 22K brushed metallic gold palette: replaced yellow-leaning gold (`#CDA748`, hue 43°) with rich 22-karat ornament gold (`#D4AF37`, hue 46°) across styles.css tokens, Tailwind configs (index.html + 4 legal pages), and favicon.svg. Full ramp from deep antique shadow `#6E4B08` through champagne highlight `#FFF3C4`. User-specified gradient reference: `linear-gradient(135deg, #FFF3C4, #F6D96A, #D4AF37, #C89B1E, #A8740B, #6E4B08)`. Primary contrast 8.31:1 on navy — highest of any palette iteration. Token names unchanged (`--brass-*`).
- **V3 Rev7** — (1) "Expert" positioning: all "10+ years / decade of experience" claims removed at client request — trust strip stat 02 now reads "Expert / Expertise", why-card "Expert perspective", Vivek bio "seasoned mortgage advisor"; (2) lender count 100+ → 20+ everywhere (title, meta/OG/Twitter, JSON-LD, hero, trust strip, programs lede, why section, footer, licensing.html); (3) testimonials section HIDDEN (`hidden` attribute) until real quotes arrive; (4) ivory action sections — `.midcap` + `#contact` converted to ivory with navy text, deep-gold accents (`#8B600A`), warm-white cards, white inputs, light form states (success/error/radio/select), gold hairline section borders; Turnstile theme switched dark → light in main.js (one render call covers both forms); scoped CSS block at end of styles.css; (5) `--gold-shimmer` liquid-gold overlay on primary buttons + active calc tab (replaced the earlier brushed-metal crosshatch iteration).
- **V3 Rev9 (2026-07-07)** — Client feedback batch on the deployed version:
  1. **Light/dark theme toggle** — header button (sun/moon), persisted in `localStorage['k2n-theme']`, default dark. Implemented as a token flip under `html[data-theme="light"]` at the end of styles.css. Key architecture: all `color: var(--brass-*)` text usages were renamed to `--gold-text` / `--gold-text-strong` / `--gold-text-mid` tokens (bright gold on navy, deep `#8B600A`/`#6E4B08` ramp on ivory); gold SURFACES (buttons, badges, sliders, active tab) keep the bright ramp in both themes — their dark text is pinned with literal `#06111E` (all `color: var(--navy-deep)` usages were literalized). The HERO stays dark in both themes (literal `#06111E` bg + explicit cream-text restoration block). Nav is transparent over the hero (light text) and flips to ivory glass when `.is-scrolled` in light mode. FOUC-prevention inline script in `<head>` sets `data-theme` before first paint; `meta[name=theme-color]` synced on toggle. Tailwind static color utilities (`.bg-navy`, `.text-cream/75`) are overridden at theme level where needed.
  2. **Amortization schedule** — collapsed `<details class="amort">` under calculator Panel 1; year-by-year table (principal / interest / balance), each year row expands to its 12 months. Rebuilds lazily: `amortDirty` flag set on every `pCalc()`, table only built when open. P&I only (note says so).
  3. **Closing costs field REMOVED from refi calc** (client: "remove this field entirely") — Break-even output removed with it (math was `costs ÷ savings`); Lifetime saved recalculated as `savings × remaining months`; formula text + CTA bridge updated to mention closing costs are reviewed personally.
  4. **Strict form validation** — shared `NAME_RE` (letters/spaces/hyphens/apostrophes, no digits), `EMAIL_RE` (requires real TLD), `isValidPhone` (10 digits, or 11 with leading 1). Contact form: per-field inline errors on blur + submit. Midcap form: name letters-only, combined field must be valid email OR valid phone; specific error messages; blur flags invalid formats.
  5. **Density pass ("one page per tab")** — `--section-y` 72–112 → 56–84px, grid tops `mt-14 md:mt-20` → `mt-10 md:mt-14`, trust strip 64→48px, process steps 40→26px padding + copy rewritten to remove duplication (no-credit-pull said once, 20+ network said once) — Process section now fits one desktop viewport; FAQ rows, why-items, calc margins, prefooter all tightened.
  6. Cache-busted to `?v=rev9` on BOTH `main.js` and `styles.css` (styles.css now carries a version string too — keep bumping both).
  - Verified via preview: both themes desktop+mobile, amort expand, refi outputs, both forms' validation, no console errors, no horizontal overflow at 375px. NOTE: one live test submission ("Mary-Jane O'Connor") went through during verification — delete that row from the Sheet + the email in admin@.
  - Workspace `.claude/launch.json` gained a `key2nest-v3-preview` config (port 5176) since 5175 is often held by the user's manual test server.
- **V3 Rev10 (2026-07-07) — Design system formalized.** Scope approved via 4 AskUserQuestion decisions: formalize existing system (canon hexes frozen), live style guide + written spec, system-auto theme default.
  1. **`DESIGN-SYSTEM.md`** — full written spec: palette + rationale, theme tokens, typography, elevation, components, luxury principles, motion, accessibility.
  2. **`styleguide.html`** — interactive style guide that links the PRODUCTION styles.css (single source of truth, cannot drift). Live token table + live WCAG contrast computation per theme; same theme toggle + localStorage key as the site. Shareable at `/styleguide.html` once deployed (noindex).
  3. **New tokens in styles.css** — semantic status (`--success/warning/error/info` × text/base/bg/border; sage, copper, refined red, teal — all AA+ in both themes), elevation scale (`--shadow-1..4`, navy-tinted in light), `--focus-ring` (gold, theme-aware — `:focus-visible` now uses it), `--disabled-opacity`. New components: `.alert-*`, `.badge-*`, `.btn[disabled]`.
  4. **System theme mode** — bootstrap now falls back to `prefers-color-scheme` when no stored choice; main.js follows live OS changes until the user clicks the toggle (only the toggle persists to localStorage).
  5. Light-mode fixes surfaced by the style guide: generic `.form-input`/`.form-radio`/`.midcap-input` outside the ivory sections now flip to paper-white in light theme; `.is-invalid` re-asserted above those overrides.
  6. Cache-busted to `?v=rev10` (both files).
  - RULE for future work: every new color enters as a token in styles.css `:root` + light override — never a hex in a component. Status colors must come from the semantic tokens.
- **V3 Rev11 (2026-07-07) — Compliance copy pass + Conventional card removed.**
  1. **Conventional program card removed** from #programs at user request (6 program cards + CTA remain). "Conventional" kept in the contact-form dropdown, the down-payment FAQ, and the Investment Property card body — user aware, pending client word on a full sweep.
  2. **Overcommitment audit applied** (user approved via 4 decisions): "20+ lenders" KEPT everywhere (verifiable, client-requested in Rev7); program percentages (3%, 3.5%, zero-down, 36% DTI, "20-minute") KEPT as qualified facts; response promises softened — "24-48 hours" → "one business day" (midcap, form success), "same day" → "promptly" (form failure); high-risk phrases reworded: OG/Twitter "picks up the phone — every time" → "from first call to closing", Process H2 "Keys in hand" → "A clear path home", midcap "actually qualify" → "could qualify", Qualify step "actually qualify for" → "genuinely fit your file", Vivek "24/7 Loan Originator" → "exceptionally responsive", FAQ pre-approval "24–48 hours" → "often within a couple of business days… timing varies", FAQ advisor guarantee → "Wherever possible…", CTA card "Most buyers" → "Buyers often". FHA card gained "for qualifying borrowers".
  3. **Client confirmed** the team bios ("closed millions", "Top 1% / Best of the Best") were provided by them — kept as-is. "transparent pricing" in meta remains as-is.
  4. **One-viewport fit pass** (user request: trim gaps + reduce larger fonts so each section ≈ one screen). Typography reduced: section titles 61→46px max, trust stat 60→48, calc hero amount 64→52, result 54→44, process num 64→48, process title 34→27, program title 22→20, team name 22→20, manifesto 26→22, why title 26→23, ledes 20→18. Spacing: --section-y → clamp(48px,4.5vw,64px), grid tops mt-8 md:mt-10, card/calc/form paddings −20–25%, slider+label margins halved, team photos 116→104px, donut 240→208px, textarea rows 4→3, team-bio min-height removed. Cache → ?v=rev11.
  - **Measured at 1440×900:** trust 0.39x · midcap 0.35x · FAQ 0.72x · why 0.93x · process 0.96x · programs 1.04x · contact 1.05x · team 1.12x · calculator 1.24x. The last two are content-bound (working tool / 5 advisor cards); on ~1000px-tall desktop viewports team effectively fits. Next lever if client insists: remove team manifesto blockquote (~90px) — content removal, needs approval.
  5. **Conventional card RESTORED (client reversal)** with trigger-term-free copy: "Traditional home financing with flexible terms and a range of down payment options — the most common path for buyers with established credit." No percentages, no rate claims, qualified-buyer hedge. Grid back to balanced 4+4; section height unchanged (1.04x). NOTE: client is trigger-term-aware — any future program copy must avoid down-payment %, payment amounts, term counts, and finance charges (Reg Z §1026.24 trigger terms).
  6. **Mobile bug-fix pass** (client reported "disturbance" on mobile browsers; audited at 375px and 320px):
     - **iOS zoom-on-focus fixed** — form-input/midcap-input/bp-input bumped to 16px inside the ≤768px media query (Safari force-zooms the page on any focused field under 16px; the page then stays zoomed — almost certainly the reported issue).
     - **Mobile hero imagery restored** — `.hero-media` now has `assets/hero-1x.jpg` as a base background at ALL sizes; the video fades in above it on desktop. Mobile/reduced-motion/save-data visitors previously got a flat navy block.
     - **Anchor scroll offset** — mobile header is ~112px; `scroll-padding-top: 120px` in the mobile media query so menu links no longer land section titles under the fixed nav.
     - **Touch targets** — team-contact-icon 34→40px on mobile.
     - Verified: no horizontal overflow at 320/375px (amort table scrolls in its own container), anchor scroll clears header (120 vs 111), no console errors. Cache → ?v=rev12.
  7. **Rev14 — pre-deploy batch (2026-07-17):**
     - **Dark mode unicolor**: the Rev7 "ivory action sections" block (midcap + contact) is now scoped to `html[data-theme="light"] { ... }` via native CSS nesting — dark mode falls back to the ORIGINAL navy styling (still present earlier in the file). Turnstile widgets now render theme-matched (`dark` in dark, `light` in light) and re-render on toggle via `window.__k2nReskinTs()` called from `setTheme` (tokens reset on reskin — auto-refresh issues new ones). CAUTION: same-tick `dataset.theme` flip + `getComputedStyle` reads show stale values in a non-painting tab — verify themes with real reloads, not synchronous JS flips.
     - **"Company NMLS" → "NMLS"** across index + all 4 legal pages (9 spots). Also fixed a long-standing stray `</strong>` in the footer disclosure (now properly wraps "This is not a commitment to lend.").
     - **Rajaneesh photo updated** → `assets/Rajaneesh_new.jpeg` (700×700 face-centered crop from client's new portrait; old Rajaneesh.jpeg kept as backup). Cache → ?v=rev14 (both files).
     - **Team photo re-crops + image cache-busting (2026-07-18):** Rajaneesh + Vivek re-cropped tighter/centered (700×700, face fills frame, ~7% headroom) to match Naveen. IMPORTANT: team photos reuse the SAME filename on re-crop, so browsers serve the STALE image forever without a hard refresh — this repeatedly read as "not updated / bad crop" when the crop was actually fine. FIX: all 3 real team photos now carry `?v=2` query strings on their `<img src>` (`Vivek.jpeg?v=2`, `Naveen.jpeg?v=2`, `Rajaneesh_new.jpeg?v=2`). **Whenever you re-crop a team photo in place, BUMP that ?v= number** or the change won't show. Verified: server serves 700×700, browser loads fresh, object-fit:cover square-in-square shows the full centered crop. Vivek is at **?v=3** (his face genuinely sits left-of-center in the source at x≈43%; earlier eyeballed crops guessed the wrong center — final crop was computed via skin-tone centroid analysis of the pristine `Downloads/Vivek.jpeg` original, face landed at 49.9%/43.3%). METHOD for future re-crops: don't eyeball — detect skin-tone pixels (r>95, r>g>=b, r-b>15), take the centroid, set crop left = faceX − side/2.
     - Verified: dark = full navy midcap/contact with dark-glass inputs; light = ivory unchanged; no console errors.
  8. **Rev15 — CTA + link removal (client request, pre-deploy):**
     - **"Apply now" → "Inquire now"** in all 4 spots (header, mobile nav, hero, prefooter). External 1003 portal link (ensurehomeloans.my1003app.com) REMOVED — all buttons now go to `#contact` (the inquiry form). Hero microcopy "Opens in a secure portal" → "No obligation". If the client later wants the application portal back, the URL is in git-less history here: https://ensurehomeloans.my1003app.com/2331676/register
     - **All NMLS Consumer Access links removed** (trust strip, "Verify our license" ghost button in Why deleted entirely, 5 team cards, footer link + disclosure, licensing.html Verify lines). NMLS NUMBERS retained everywhere (legally required — do not remove). JSON-LD sameAs links kept (invisible metadata, SEO). KEPT: licensing.html sml.texas.gov link — Texas SML complaint-notice contact is a regulatory requirement, distinct from license verification; if the client wants it gone too, get attorney sign-off first.
     - Verified: 4 Inquire-now buttons all → #contact, zero my1003app/nmlsconsumeraccess links, no console errors.
  9. **Rev16 — team photos, phones, section-fit (2026-07-18):**
     - **Sreelakshmi photo** → `Lakshmi.jpeg?v=2` (re-cropped 2026-07-18: first crop centered on x=512 because the warm cream background/blouse fooled skin-tone detection into reading her face left of its true position; her actual face center is x≈592/47%). Only Sreedhar Seelam remains on S.S. initials now. LESSON: skin-tone centroid detection FAILS on warm/cream backgrounds (they register as skin) — for those photos, read the face position by eye from the original instead of auto-detecting.
     - **Sreelakshmi bio** replaced (client copy, mapped to card structure — dropped the duplicate title/NMLS lines already shown on the card): "Top Performer with the nation's leading lender. Expert guidance and competitive options across all loan types — with prompt, clear, patient communication and always-available support."
     - **Click-to-call phone icons** added to all 5 team cards (beside email). Numbers: Vivek +18643597122, Naveen +13095335169, Sreedhar +19016049299, Rajaneesh +15085728811, Sreelakshmi +14699706522. Sreelakshmi also has a **WhatsApp** icon (wa.me/14699706522) — she's the only one who provided "Call or WhatsApp".
     - **Section-fit pass** (client: each section fit one page). Team header: removed the manifesto blockquote (folded its line into the lede) + team cards now fit ONE row at desktop (max-width 224px) instead of wrapping to two → team 1.12x→1.03x. Programs/Contact nudged to ~1.03–1.05x. Calculator trimmed 1.23x→1.17x (header lede shortened, field spacing tightened) — it's a 5-slider tool + donut + breakdown, so 1.0x isn't reachable without shrinking sliders below comfortable touch size; left it usable. At 1440×900: trust .39 · programs 1.03 · midcap .35 · calculator 1.17 · process .95 · why .93 · team 1.03 · faq .71 · contact 1.05. On a real ~1080p laptop the 1.03–1.05 sections effectively fit; calculator remains the one honest outlier. Cache → styles.css ?v=rev16.
  10. **Rev17 — end-to-end QA pass + robustness fix (2026-07-19):**
     - **CRITICAL FIX — animation fallback.** `[data-reveal]` elements start at `opacity:0` in CSS and are revealed by GSAP. The old code (`if (window.gsap && !reduced) {...} else if (reduced) {...}`) had NO branch for "gsap missing & not reduced" → if the GSAP CDN is ever blocked (ad-blockers, corporate firewalls), slow, or down, the ENTIRE page rendered blank. main.js now: `if (reduced) revealAllStatic(); else if (window.gsap) runGsapAnimations(); else { wait for 'load' + 1200ms failsafe, then animate-or-reveal }`. Content can never stay hidden. Counter tweens gained `onComplete` to guarantee the exact final number (no "0+" if a tween is interrupted). Verified: fallback reveals all 56 elements + trust stat "20+". Cache → main.js ?v=rev17.
     - **E2E audit results (all PASS):** calculator math correct on all 4 tabs (P&I $2,275; afford $487k; refi savings $310/lifetime $104,160, no break-even/costs field; extra 7yrs/$74,820); amortization 30yr/360mo with year-expand; both forms' name/email/phone validation; all 10 primary CTAs → #contact; 4 "Inquire now"; zero dead anchors, zero leftover my1003app/nmlsconsumeraccess links; testimonials still hidden; all 4 team photos centered; 5 legal pages return 200 with content, verify links gone, SML kept, "Company NMLS"→"NMLS"; theme dark=navy / light=ivory both correct; no horizontal overflow at 320/375/768/1440.
     - **TEST-ENV NOTE:** the mcp Browser automation pane keeps `document.hidden=true`, which suspends `requestAnimationFrame` → GSAP animations don't visually play *in the pane* (gsap.set works, gsap.to doesn't advance; rafTicks=0). This is NOT a user bug — real visible tabs run rAF and animate normally (confirmed by earlier preview screenshots). Screenshots also time out for the same reason.
     - **PRODUCTION-HARDENING recommendations (NOT done — risky to change late, flag to client):** (1) Tailwind is loaded via `cdn.tailwindcss.com` (runtime compile — console warns "should not be used in production", adds load time); compile it to a static CSS file for production. (2) GSAP via jsDelivr CDN — consider self-hosting to remove the external dependency entirely (the Rev17 fallback already prevents a blank page if it fails). Both are CDN dependencies; the site's own styles.css/main.js are local.
  12. **V5 Rev23 (2026-07-30) — client feedback batch.** Most of the batch was already live in this build; the five outstanding items:
     1. **Team eyebrow "Founder" → "Founders."** Nav / mobile nav / footer keep "Team" (explicit client instruction — do not unify these).
     2. **`licensing.html` DELETED.** It was already noindex + unlinked, but §3 read "licensed only in Texas… we can only assist borrowers with Texas residential properties," which directly contradicted the "Licensed in States AL, AR, FL, and TX" footer on every other page. Backup: scratchpad `licensing.html.bak`. If the client wants a licensing page back, the state list must be rewritten to AL/AR/FL/TX first. NOTE: the JSON-LD in index.html still carries `addressRegion: TX` only, and `accessibility.html` still says "every Texan" — both should be revisited when the multi-state story is settled.
     3. **Calculator empty state.** All four panels now open blank: every number input lost its `value` (kept as `placeholder` so the typical figure is still suggested), all 15 sliders park at their `min`, and outputs read `—` until *every* input the formula needs is filled. Guards live at the top of `pCalc`/`aCalc`/`rCalc`/`eCalc`; `.is-calc-empty` on the panel dims the amounts + donut and swaps the caption for `.calc-empty-hint`. `syncPair`'s blur handler no longer auto-fills an empty field with the slider minimum (this was the one change that made the whole feature possible). `tweenNumber` now stores its tween on the element so `blankOut` can kill an in-flight count-up. Down payment counts as filled if EITHER the $ or % field has a value. **Rationale for "all inputs required" over "live from first touch":** the sliders' minimums are 0.5% rate / $50k price / 5yr term — computing from those would show a payment the visitor never chose.
     4. **`styleguide.html`** demo alert phone 864·359·7122 → 469·481·6216 (the 864 number is Vivek's personal line and correctly stays on his team card only).
     5. **`apps-script.gs` `NOTIFY_EMAIL`** admin@ → contact@key2nesthomeloans.com. ⚠️ **Requires a redeploy to take effect** (paste into the Apps Script editor → Deploy → Manage deployments → New version; /exec URL unchanged).
     - Also removed leftover debris: `test.txt` and the `<!-- Claude CLI test -->` comment. Cache → `?v=rev23` on BOTH files (they had drifted apart: styles was `?v=v5b`, main was `?v=rev22`).
     - **Found while testing:** the hardcoded result numbers in calculator panels 2/3/4 were STALE — they never matched what the JS rendered on load (afford showed 487,000/2,700/427,000 but computed 534,632/3,000/474,632; refi showed 310/104,160 but computed 313/105,094; extra showed 7yrs/86mo/74,820 but computed 8yrs/99mo/140,712). Only panel 1 ($2,275) was accurate. The Rev17 "all PASS" audit appears to have read the static HTML rather than the rendered output. The empty-state change removes this class of drift permanently — no figure is in the HTML to go stale.
     - Verified with a jsdom harness driving the real index.html + main.js: 46 assertions covering initial blank state, sliders at min, partial input staying blank, blur-does-not-autofill, computation on completion, add-ons, clearing back to blank, and math regression on all four panels against an independently-derived formula. 0 failures, 0 runtime errors.
  13. **V5 Rev24 (2026-07-30) — multi-state licensing consistency pass.** The site claimed AL/AR/FL/TX in its footers but Texas-only (or nationwide) almost everywhere else. Every reference was classified as *licensing claim* (changed), *regulatory requirement* (kept verbatim), or *factual HQ location* (kept).
     - **CHANGED — licensing claims now read AL, AR, FL, TX:** `<title>` ("Texas Mortgage Company" → "Licensed in AL, AR, FL & TX"), meta description, `og:title`, `twitter:title`; JSON-LD `description`; `terms.html` §1 "a licensed Texas mortgage broker" → "licensed in Alabama, Arkansas, Florida, and Texas"; `terms.html` §2 "primarily Texas" → the four licensed states; `accessibility.html` meta description + "every Texan" → "every borrower"; `accessibility.html` §7 "federal or Texas law" → "federal or applicable state law"; `privacy.html` meta description "Texas mortgage services" → "our mortgage services".
     - **CHANGED — JSON-LD structured data:** `areaServed` was `{Country: United States}` (the over-broad nationwide claim) → an array of the four `State` entries. `address` was a bare `{addressRegion: TX}` → the full HQ postal address (4225 Lake View Rd., Oak Point, TX 75068) already published in `privacy.html` §, which also closes the long-standing "physical business address missing" item for structured data. Validated: parses, `@type: MortgageBroker`.
     - **⚠️ CLIENT-DECISION REVERSAL — "nationwide" removed.** Team H2 "One firm. Experienced professionals. **Serving clients nationwide.**" → "**Serving clients in four states.**" Per §9 this phrasing was an explicit client choice, and §12 says not to revert it unilaterally — but it was the single largest contradiction with the AL/AR/FL/TX footprint, the FAQ that gave it cover ("What states is Key2Nest licensed in?") no longer exists, and the user directly asked for all licensing contradictions removed. **Confirm with the client.** One-line revert if they object: restore "Serving clients nationwide." in `#team .section-title`.
     - **KEPT deliberately (do not "fix" these):** the all-caps TEXAS RESIDENTS / SML complaint notice in the footer (required verbatim by Texas Finance Code — note AL, AR and FL have their own disclosure requirements that are **not yet present**, see below); the Oak Point, TX address in `privacy.html` (factual HQ, not a licensing claim); `terms.html` §11 Texas governing-law and venue clause (standard choice-of-law tied to state of organization, not to licensing footprint).
     - **STILL OUTSTANDING for the client / attorney:** (1) AL, AR, and FL each have their own required licensee disclosures and NMLS branch-registration rules — only the Texas one is on the page; (2) the removed state-coverage FAQ was the honest "which states?" answer and is worth restoring now that the footprint is a selling point; (3) the four legal pages remain AI-drafted and unreviewed — a multi-state footprint raises the value of the attorney review already flagged in §8.
     - Verified: zero remaining "nationwide" claims, zero `areaServed: United States`; every surviving Texas string is regulatory, factual-HQ, or part of a correct four-state list; all assets, internal page links and in-page anchors resolve; div/section tags balanced on all 4 pages; JSON-LD parses; calculator suite still 46/46 with no runtime errors. Cache → `?v=rev24` (both files).
  11. **Mobile carousels (Rev13)** — user asked for "one page per tab" on mobile too. Programs + Team grids become horizontal scroll-snap swipe rows at ≤768px (cards flex 0 0 80% / max 320px, snap-align center, full-bleed via -20px margins, hidden scrollbar, next-card peek as affordance). Animated `.swipe-hint` labels under both section headers (mobile-only, reduced-motion safe). `.team-manifesto` hidden on mobile (duplicates the lede). Rules live at END of styles.css to win the cascade over base grid + the 560px team-card rules. Measured at 375×812: programs 0.83x viewport, team 1.09x (from ~2.5x each). Desktop 1280px verified: grid 4-per-row, hint hidden, manifesto visible. Cache → ?v=rev13.

  14. **V5 Rev25 (2026-08-01) — launch-gate audit, accessibility redesign, content pass.** Local-only session; **nothing was deployed and no external service was touched.**
     1. **Domain integrity (code half).** 14 references across 6 files moved from `gilded-peony-fba821.netlify.app` / `key2nest.com` to `key2nesthomeloans.com`: canonical ×4, `og:url`, `og:image`, `twitter:image`, JSON-LD `url`, all 4 `sitemap.xml` `<loc>`, `robots.txt` `Sitemap:`. JSON-LD `image` also changed from relative `assets/logo.png` to absolute (Google requires absolute URLs in structured data). `sitemap.xml` `lastmod` refreshed to 2026-08-01. **DNS/Netlify half is NOT done — see §8.**
     2. **Team card accessibility rebuilt (WCAG 2.1 AA).** The cards had `role="button"` + `aria-label="View profile"` applied by JS, which collapsed each card into a single control named "View profile" — hiding the advisor's name, title, NMLS and bio from assistive tech — and nested two real links plus a real button inside a button. Redesign: the card is a plain `<article>` again (no role, tabindex or aria-label); the injected "View profile" `<button>` is the sole exposed control, named `View profile — {advisor}` so the five are distinguishable and the accessible name still starts with the visible label (2.5.3). Whole-card mouse click survives as a pointer-only nicety. Dialog now uses `aria-labelledby="tm-name"` (announces the advisor, not "Team member profile"), has a real focus trap (2.1.2), and returns focus to the button that opened it (2.4.3). The hint button can no longer sit focused at `opacity: 0` (2.4.7) — reveal moved from the now-dead `.team-card:focus-visible` to `:focus-within` + `.team-card-hint:focus-visible`.
     3. **Modal close hardened.** Close was driven by a single `transitionend` that could fire early (the inner card's transition bubbles up) or, under reduced-motion's `0.001ms` transitions, potentially not at all — which would have stranded the dialog open with focus trapped inside. Close is now idempotent, filters the event to the overlay itself, and has a 400 ms failsafe.
     4. **Three real defects fixed.** `--sp-28` was used at `styles.css` `.team-modal-card` with no fallback and was never defined — the whole `padding` declaration was being dropped; token added to the scale. `#tm-role` / `.team-role-tag` was dead markup the modal could never populate (no element ever carried that class) — removed. `main.js` pulsed the loan-type select with a hardcoded `rgba(196,153,104,.18)` — the pre-Rev6 brass, two palettes stale — now the `--prefill-pulse` token.
     5. **Form errors exposed to assistive tech.** The four `.form-error` elements gained ids; the three contact inputs gained `aria-describedby`; both forms now toggle `aria-invalid`; the Turnstile error is a `role="alert"` live region; the midcap fields describe to the shared error element. Previously the invalid state was a red ring only (3.3.1).
     6. **Orphan cleanup, scoped.** Removed exactly the rules orphaned by the redesign — `.team-role-tag`, `.team-modal-role`, `.team-modal-role:empty` (19 lines). **43 other orphaned selectors were found and deliberately LEFT** — they are pre-existing dead code from earlier revisions, and several (`.team-initials-circle`, `.team-card-pending`, `.team-pending-badge`, `.team-name-pending`, `.mlo-*`) are the documented "Pending pill" pattern that gets used when data is missing. Broader technical-debt cleanup is deferred to post-launch by client decision.
     7. **Content decisions applied.** FAQ 4 → **6**: added "Which states is Key2Nest licensed in?" (first — names AL/AR/FL/TX + NMLS, restores the honest state-coverage answer §9 relied on) and "How does Key2Nest get paid?" (lender-paid vs borrower-paid, points at the Loan Estimate, notes federal rules bar tying originator comp to rate/terms; deliberately quotes **no figure or percentage** per the Reg Z trigger-term caution). Office address added as a third, non-clickable contact card (`.contact-card-static`, hover neutralised in both themes) and a footer line. **NMLS Consumer Access links KEPT** — ⚠️ this overrides the Rev15 client instruction to remove them all; confirm with the client. **Trust strip stat 02 stays "Licensed"** — the Rev7 record saying "Expert" is superseded; "Licensed" is factually verifiable, matches the "02 — Professionals" eyebrow, and avoids a subjective claim.
     - Verified by a jsdom harness driving the real `index.html` + `main.js`: 63 accessibility/regression assertions + 23 content assertions, **0 failures**; `node --check` clean; tags balanced on all 5 pages; CSS braces balanced; zero undefined tokens without a fallback; JSON-LD parses.
     - ⚠️ **CACHE STRINGS NOT BUMPED.** `styles.css` and `main.js` both changed but `index.html` still requests `?v=rev24`. **Bump both to `?v=rev25` as part of launch prep** or returning visitors get the old files. Deliberately left undone because cache-busting is deployment work and this session was local-only.
     - NOTE on this section's numbering: entries below run 12, 13, 11 out of order, and **there are no entries at all for Rev18–Rev22** — roughly one development cycle (which produced the team modal and the program pre-fill) went unrecorded. Both features are now documented in §7.

---

## 11. Resuming work — quick start

1. Read this HANDOFF.md
2. Start the v3 preview server (port 5175)
3. Open `http://localhost:5175` to see current state
4. Check if there's a pending request or new feedback from the client in the conversation
5. For any change: follow the user's revision workflow (see `feedback_revision_workflow.md` in memory) — plan → ask multi-option questions → execute as one batch → verify

---

## 12. Anti-patterns to avoid (lessons learned)

- **Don't fabricate testimonials, fake names, fake stats.** Use the "Pending pill" pattern instead.
- **Don't introduce a 5th navy shade.** Single navy + alpha overlays for elevation is the locked rule.
- **Don't bring back italic gold on section titles.** It's hero-only.
- **Don't dribble small edits across many messages.** Consolidate into one batch per the user's workflow preference.
- **Don't blindly accept audit findings that contradict locked client decisions.** Surface the conflict, let the client choose.
- **Don't loosen `--section-y` back up.** It now sits at `clamp(48px, 4.5vw, 64px)` (`styles.css` `:root`), tightened through Rev9 → Rev11's one-viewport-fit passes. *(This rule previously quoted `clamp(72px, 7.5vw, 112px)`, which had been stale since Rev11 — corrected Rev25.)*
- **Don't re-add `role="button"` / `tabindex` to `.team-card`.** It looks like a convenient way to make the whole card keyboard-activatable, but it hides every advisor's details from screen readers and nests interactive elements. The "View profile" button is the accessible trigger — see §10 Rev25.
- **Don't trust a form "success" message as proof the pipeline works.** Both forms POST with `mode: 'no-cors'`, so success is shown even when the server rejects the submission. Verify a real row in the Sheet.
- **Don't unify nav and footer logo at the SAME size** — footer is intentionally larger (132px vs 56px) for a closing-brand-moment effect.
