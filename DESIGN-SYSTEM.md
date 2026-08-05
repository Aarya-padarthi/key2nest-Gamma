# Key2Nest Design System — Rev 10

**Living companion:** [`styleguide.html`](styleguide.html) renders every token and component from the *production* stylesheet in both themes. This document is the rationale; that page is the proof.

**Canon rule:** the client-approved brand colors — Navy `#0B1A2E`, 22K Gold `#D4AF37`, Ivory `#F4EFE3` — are fixed. Everything else in this system is derived to serve them.

---

## 1 · Brand color palette

### Primary

| Name | Hex | Role |
|---|---|---|
| Ink | `#06111E` | Deepest surface (footer, hero base), text on gold |
| **Navy (canon)** | `#0B1A2E` | Brand background — dark theme surface |
| **22K Gold (canon)** | `#D4AF37` | Brand metal — button surfaces, key accents |
| **Ivory (canon)** | `#F4EFE3` | Brand neutral — light theme surface, dark-theme text |

**Why this navy:** at L≈10 it is dark enough to make gold luminous, but blue enough to never read as black — black reads as tech, navy reads as trust. **Why this gold:** `#D4AF37` sits at hue 46° with restrained saturation — true 22-karat warmth. Brighter hexes (`#FFD700`) are yellow masquerading as gold and were explicitly rejected in Rev6.

### The gold ramp (surface + text duty)

| Token | Hex | Duty |
|---|---|---|
| brass-300 | `#FFF3C4` | Champagne highlight — shimmer bands, dark-theme emphasis text |
| brass-400 | `#F6D96A` | Dark-theme gold text, gradient light edge |
| brass-500 | `#D4AF37` | The metal itself — button/badge surfaces (both themes) |
| brass-600 | `#C89B1E` | Gradient dark edge, slider ends |
| brass-700 | `#A8740B` | Deep accent on ivory |
| brass-800 | `#8B600A` | **Gold text on ivory** (5.2:1) |
| brass-900 | `#6E4B08` | Strong gold text on ivory (7.3:1) |

**The one non-negotiable principle:** gold as a **surface** always uses the bright ramp (400–600) with near-black text pinned to `#06111E`; gold as **text** flips between `#F6D96A` (on navy) and `#8B600A` (on ivory) via the `--gold-text` tokens. This is what lets one component ship in both themes without ever failing contrast.

### Supporting neutrals

`#FAF6EC` cream-soft (light gradient top) · `#EDE5D2` cream-warm (light footer) · `#FFFDF7` paper-white (inputs/cards on ivory) · Parchment plaque: `#EBE1C5 → #DBCFB2` (logo backing, both themes).

### Semantic status (new in Rev10)

Deliberately desaturated so they whisper rather than shout — sage instead of traffic-light green, copper instead of amber (kept distinct from brand gold), a refined red, and the teal that already exists in the system as the atmospheric counter-light.

| Status | Dark text | Light text | Base | bg (both) |
|---|---|---|---|---|
| Success | `#8FCB9B` | `#2E6B44` | `#4A8C60` | 10–12% tint |
| Warning | `#E8B07C` | `#8A5420` | `#C87E3D` | 12% tint |
| Error | `#F4A9A9` | `#8C1D1D` | `#B3372F` | 7–10% tint |
| Info | `#8FC5CE` | `#2C5A63` | `#3D7A85` | 10–12% tint |

### Interaction states

- **Hover:** color/border shifts one ramp step toward light (dark theme) or deep (light theme); cards lift 2–4px and gain `--shadow-2`.
- **Active:** transform returns to 0; surface deepens one step.
- **Focus:** 2px `--focus-ring` outline, 3px offset — `#F6D96A` on navy, `#8B600A` on ivory. Never removed, never color-only.
- **Disabled:** `opacity: 0.45` + `saturate(0.7)`, pointer-events off. No color remapping — disabled should look like the same control asleep.

---

## 2 · Theme tokens

Single source of truth: CSS custom properties in `styles.css`. Dark values live in `:root`; light mode is a token override under `html[data-theme="light"]` — **not** a parallel stylesheet, so components can never fork.

| Token | Dark | Light |
|---|---|---|
| `--navy` (background) | `#0B1A2E` | `#F4EFE3` |
| `--navy-deep` (footer) | `#06111E` | `#EDE5D2` |
| `--cream` (foreground) | `#F4EFE3` | `#0B1A2E` |
| `--text-secondary` | ivory 82% | navy 80% |
| `--text-muted` / `--text-quiet` | ivory 66% / 62% | navy 64% / 58% |
| `--gold-text` / `-strong` / `-mid` | `#F6D96A` / `#FFF3C4` / `#D4AF37` | `#8B600A` / `#6E4B08` / `#8B600A` |
| `--hairline` (borders) | gold 16% | deep-gold 32% |
| `--hairline-soft` (dividers) | gold 9% | deep-gold 18% |
| `--elev-1/2` (card gradient) | ivory 2.5% / 4.5% | paper-white 55% / 80% |
| `--focus-ring` | `#F6D96A` | `#8B600A` |
| `--shadow-1…4` | black-based | navy-tinted (see §4) |

Component surfaces: **cards** = paper-noise + elev gradient over `--navy`; **inputs** = `rgba(6,17,30,0.55)` dark glass / `#FFFDF7` paper; **nav** = transparent over hero → 80–85% blur glass when scrolled; **popover/modal** = `--navy` card + `--shadow-4` over an 88% ink scrim; **tables** = hairline rules, gold uppercase headers, tabular numerals; **badges/chips** = pill radius, status tokens; **tooltips** = ink surface, ivory text, `--shadow-3`.

### Theme modes

- **System (default):** first paint follows `prefers-color-scheme` via a pre-CSS inline script (no flash), and keeps following live OS changes.
- **Manual:** the header sun/moon toggle persists to `localStorage['k2n-theme']` and wins from then on.
- Each theme is *tuned*, not inverted: the hero keeps its dark cinematic treatment in both; paper-noise flips from `overlay` to `multiply` on light; museum-lighting halos are recalibrated per theme.

---

## 3 · Typography

| Role | Face | Size | Weight | Tracking / leading |
|---|---|---|---|---|
| Display (hero) | **Source Serif 4** (opsz 60) | clamp 52–124px | 420 | −0.022em / 0.98 |
| H2 section | Source Serif 4 | clamp 31–61px | 420 | −0.022em / 1.08 |
| H3 card/step | Source Serif 4 | 20–34px | 500 | −0.015em / 1.15 |
| Body | **Source Sans 3** | 14.5–16px | 400 | −0.005em / 1.6–1.65 |
| Eyebrow | Source Sans 3 | 10.5px | 500 | +0.3em, uppercase |
| Fine print | Source Sans 3 | 11.5–12.5px | 400 italic | — |
| Numerals | either | — | — | `tabular-nums` always |

**Why:** a transitional serif with optical sizing gives the "engraved stationery" quality luxury brands trade on, while a humanist sans keeps UI and legal text effortlessly legible. Both are variable fonts from one superfamily — visual kinship, two files. Scale is a Major Third (1.25) anchored at 16px: 13 · 16 · 20 · 25 · 31 · 39 · 49 · 61 · 76 · 95. Italic is reserved for gold emphasis moments (hero "Home Ownership.") and fine print — scarcity is what keeps it luxurious.

---

## 4 · Elevation & shadows

Two-part shadows: a tight near shadow (edge definition) + a long soft far shadow (depth). Light-theme shadows are **navy-tinted**, never gray sludge. Gold glow is reserved exclusively for gold surfaces (buttons, logo plaque) — ambient gold glow on ordinary cards would cheapen it.

| Token | Use |
|---|---|
| `--shadow-1` | Cards at rest, table containers |
| `--shadow-2` | Hover lift, active cards |
| `--shadow-3` | Dropdowns, popovers, tooltips |
| `--shadow-4` | Modals, dialogs |
| `--shadow-pill` | Logo plaque — includes the gold halo |

---

## 5 · Components (defining traits)

- **Buttons:** pill radius. Primary = gold gradient (400→600) + `--gold-shimmer` champagne band + sheen sweep on hover + magnetic cursor pull (desktop). Ghost = 1px outline, fills with 6% gold on hover. Labels 13px, +0.04em.
- **Inputs:** 10px radius, generous 14–16px padding, gold border + soft gold ring on focus, `.is-invalid` red state with inline message below.
- **Dropdowns/selects:** custom gold chevron, native menu themed per surface.
- **Cards:** 16–20px radius, paper-noise texture, hairline border, hover = −3px lift + border brightening. Never more than one texture per surface.
- **Tables:** gold uppercase 10.5px headers, hairline row rules, right-aligned tabular numerals, expandable rows use a rotating ▸.
- **Navigation:** fixed, transparent over hero, blur-glass after 24px scroll; links get a gold underline that scales in from the left.
- **Hero:** full-viewport media with triple scrim (warm tint, vertical seal, left legibility), serif display with staggered line reveal.
- **Dialogs/modals:** `--shadow-4` card over 88% ink scrim with 14px blur; close affordance top-right; body scroll locked.
- **Badges:** pill, uppercase, 10.5px; gold = brand moments (Pending), status colors for state.
- **Progress:** thin 4px gold track fill (as in calculator sliders); indeterminate = the shimmer band drifting.
- **Tabs:** segmented control — active segment gets the full gold-shimmer surface treatment.
- **Accordions:** hairline-divided rows, circled chevron that rotates 180°, serif question titles.
- **Pagination:** ghost-button numbers, gold-filled current page — same grammar as tabs.

---

## 6 · Luxury design principles

- **Radius system:** 8/10 inputs · 12/14 chips · 16 cards · 18/20 feature panels · 999 pills. Nothing sharp, nothing bubbly.
- **Spacing:** 4-pt grid; `--section-y` clamp(56–84px); whitespace is the primary luxury signal — one idea per viewport.
- **Grid:** 1240px max width, 12-column mental model, 20–32px gutters.
- **Icons:** 1.5–1.8px stroke outline (Lucide-style), never filled, always `currentColor`.
- **Photography:** warm dusk architecture, interior glow, real people; grade toward amber highlights + navy shadows so imagery agrees with the palette.
- **Glassmorphism:** navigation bar only. Frosted cards everywhere is a trend; a frosted toolbar is a tool.
- **Gradients:** only within one material family (gold 400→600, navy→ink, ivory→cream). Never cross-hue.
- **Gold discipline:** gold is punctuation, not prose — if more than ~10% of a viewport is gold, remove some.
- **Texture:** one paper-noise grain, 4.5% opacity — tactility without visibility.
- **Motion philosophy:** calm confidence. Things settle; they never bounce.

---

## 7 · Animations

| Interaction | Spec |
|---|---|
| Scroll reveal | opacity 0→1, y 24→0, 900ms power3.out, once |
| Hero entrance | staggered line rise (expo.out, 1.1s, 0.14s stagger) |
| Card hover | −3px lift + border color, 350ms `--ease-luxe` |
| Primary button | sheen sweep 700ms + magnetic pull (desktop only) |
| Numbers | tween 0.6–1.6s power2.out, tabular so nothing shifts |
| Accordion/tabs | chevron rotate 320ms; panel swap instant (content is the star) |
| Loading | gold spinner 0.8s linear; button label fades during send |
| Theme switch | instant token swap — a cross-fade would draw attention to the mechanism |

All motion is disabled under `prefers-reduced-motion` (hero video removed entirely).

---

## 8 · Accessibility

- Contrast (verified live on the style-guide page): ivory-on-navy **12.6:1** (AAA) · gold-text on navy **9.4:1** (AAA) · ink-on-gold buttons **9.3:1** (AAA) · `#8B600A` on ivory **5.2:1** (AA) · all status text ≥ AA in both themes.
- Bright gold `#D4AF37` on ivory is **1.95:1 — decorative only**, never text. This is enforced by the `--gold-text` token flip.
- Focus visible everywhere; semantic HTML (details/summary, fieldset/legend, role=tablist); reduced-motion honored; touch targets ≥ 40px; form errors are text + color, never color alone.

---

## 9 · Inspiration lineage

Stripe's restraint with color-as-punctuation · Apple's optical typography discipline · Rolex/Bentley's "metal is earned, not sprayed" gold usage · Linear's token rigor · private-banking sites' navy-and-cream trust language. References for quality bars only — no layouts or branding borrowed.

## 10 · Critical rules (enforced)

No saturated primaries · no cross-hue gradients · no bright-yellow "gold" · max one texture per surface · shadows whisper · gold is punctuation · whitespace before decoration · every new color must enter as a token, never a hex in a component.

---

*Rev 10 · 2026-07-07 · Changes require client approval; canon colors are frozen.*
