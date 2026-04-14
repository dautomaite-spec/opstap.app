# Opstap — Style Guide

> Version 1.0 · Based on "Joyful Career" design direction  
> Reference: `Human input/Application Design Ideas.jpeg`

---

## 1. Design Principles

| Principle | Description |
|---|---|
| **Friendly & approachable** | Rounded shapes, warm palette, welcoming tone |
| **Clear hierarchy** | White cards float on a lavender background — content always stands out |
| **Purposeful color** | Indigo for actions, yellow for active/selected, pink/peach as decorative accents |
| **Trust by default** | Privacy-forward messaging that feels reassuring, not bureaucratic |

---

## 2. Color Tokens

### Core palette

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#3E3CB6` | Buttons, links, focus rings, icon fills |
| `primaryContainer` | `#5653CA` | Gradient endpoint on CTAs, hover states |
| `onPrimary` | `#FFFFFF` | Text/icons on primary background |

### Active / selected state

| Token | Hex | Usage |
|---|---|---|
| `tertiaryContainer` | `#FFD55A` | **Yellow** — selected job cards, match score chips, active filters |
| `onTertiaryContainer` | `#1C1A2E` | Dark text on yellow backgrounds |

### Surfaces

| Token | Hex | Usage |
|---|---|---|
| `surface` | `#EAE7F5` | **Lavender** — app background (scaffold) |
| `surfaceContainerLowest` | `#FFFFFF` | **White** — cards, form fields, dialogs |
| `surfaceContainerLow` | `#F4F2FB` | Light lavender tint — subtle section areas |
| `surfaceContainerHigh` | `#E5E2F2` | Unselected chips, secondary areas |

### Content / text

| Token | Hex | Usage |
|---|---|---|
| `onSurface` | `#1C1A2E` | Primary text (dark navy-black) |
| `onSurfaceVariant` | `#6B6880` | Secondary text, labels, placeholders |
| `outline` | `#A8A4BC` | Borders, dividers |
| `outlineVariant` | `#CCAAE0` | Subtle dividers |

### Accent / decorative (extended tokens)

| Token | Hex | Usage |
|---|---|---|
| `warmAccent` | `#F8D8B0` | Peach — decorative circles in hero sections |
| `pinkAccent` | `#FFAAC4` | Soft pink — decorative circles, celebration states |
| `secondaryContainer` | `#E8E4FA` | Skill chips, tag backgrounds |

---

## 3. Typography

### Fonts

| Role | Font | Notes |
|---|---|---|
| Display / Headline / Title | **Poppins** | Rounded, friendly, confident |
| Body / Labels / Captions | **Inter** | Neutral, highly readable at small sizes |

Both are loaded via `google_fonts` — no asset bundling needed.

### Scale

| Name | Font | Size | Weight | Letter-spacing | Usage |
|---|---|---|---|---|---|
| `displayLg` | Poppins | 34px | 700 | –0.5 | Hero headlines |
| `headlineMd` | Poppins | 26px | 700 | –0.3 | Screen titles |
| `titleMd` | Poppins | 18px | 600 | 0 | Section headers, AppBar |
| `titleSm` | Poppins | 16px | 600 | 0 | Card titles, form section labels |
| `bodyMd` | Inter | 14px | 400 | 0 | Primary body text |
| `bodySm` | Inter | 13px | 400 | 0 | Secondary body, descriptions |
| `labelMd` | Inter | 13px | 600 | 0 | Button labels, chip text |
| `labelSm` | Inter | 11–12px | 400–500 | 0 | Captions, footnotes |

---

## 4. Shape & Radius

| Component | Radius | Notes |
|---|---|---|
| CTA buttons (full-width) | `30` | Pill shape |
| Floating action buttons | `16` | |
| Cards (job, benefit, info) | `20` | |
| Section containers | `20` | Form sections, consent lists |
| Input fields | `12` | TextField decoration |
| Icon containers (small, 36–44px) | `12–14` | |
| Chips / tags | `20` | Pill shape |
| Hero section bottom corners | `28` | Keeps hero from looking rectangular |
| Dialog / bottom sheet | `24` | |

---

## 5. Spacing

| Token | Value | Usage |
|---|---|---|
| `xs` | 4px | Icon gaps |
| `sm` | 8px | Between related items |
| `md` | 12–14px | Internal card padding (vertical) |
| `lg` | 16–20px | Section padding, card padding |
| `xl` | 24px | Screen horizontal margin |
| `xxl` | 32–36px | Between major sections |
| `hero` | 44–48px | Top padding inside hero sections |

---

## 6. Elevation & Shadows

Cards use a single subtle shadow — no stacking:

```dart
BoxShadow(
  color: Color(0xFF1C1A2E).withValues(alpha: 0.06),
  blurRadius: 16,
  offset: Offset(0, 6),
)
```

Primary buttons add a coloured glow shadow:

```dart
BoxShadow(
  color: OpstapColors.primary.withValues(alpha: 0.28),
  blurRadius: 20,
  offset: Offset(0, 8),
)
```

No shadow on unselected/inactive elements.

---

## 7. Decorative Circles

Hero sections (welcome, confirmation) use an `_OrganicCirclesPainter` that draws 4–5 partially off-screen filled circles behind the content:

| Circle | Colour | Alpha | Position |
|---|---|---|---|
| Large white — upper right | `#FFFFFF` | 10% | Off canvas right |
| Mid white — right edge | `#FFFFFF` | 7% | Mid-right |
| Yellow accent — upper left | `#FFD55A` | 30% | Off canvas left |
| Pink accent — lower right | `#FFAAC4` | 38% | Lower right |
| Peach accent — lower left | `#F8D8B0` | 40% | Lower left |

The white circles create depth within the indigo hero gradient. The coloured circles peek in from the edges to give the playful, organic feel from the reference design.

---

## 8. Key Components

### Primary CTA button
- Full-width, `BorderRadius.circular(30)` (pill)
- Indigo gradient (`primary` → `primaryContainer`)
- Coloured glow shadow
- Poppins 15px w600 white label

### Secondary button
- Full-width, `BorderRadius.circular(30)`
- `surfaceContainerHigh` background
- Primary colour text and icon

### Job card
- `surfaceContainerLowest` (white) background
- `BorderRadius.circular(20)`
- Subtle shadow
- **Selected state**: `tertiaryContainer` (yellow) fill at 25% alpha, yellow border

### Match score chip
- `tertiaryContainer` (yellow) background
- `onTertiaryContainer` (dark) text
- Pill shape

### Form section
- Poppins 15px w600 label
- `surfaceContainerLowest` (white) container, `BorderRadius.circular(20)`

### Bottom bar
- `surface` background with thin top border
- Holds the primary CTA button

---

## 9. Illustrations / Icons

- Material Symbols Rounded (`Icons.*_rounded`) throughout
- Icon containers: filled with `secondaryContainer` (`#E8E4FA`) on lavender backgrounds
- Icon containers on indigo backgrounds: filled with `Colors.white.withValues(alpha: 0.15)`
- Size guidance: 18px for inline, 22px for cards, 26–32px for feature icons

---

## 10. Do / Don't

| Do | Don't |
|---|---|
| Use lavender `#EAE7F5` as the scaffold background | Use white or light grey as the app background |
| Use white `#FFFFFF` for cards floating on lavender | Use grey-tinted surfaces for card backgrounds |
| Use yellow `#FFD55A` for selected/active states | Use the indigo primary for selection indicators |
| Use Poppins for all heading/title text | Use Manrope (replaced) or system font for headings |
| Add organic circles to hero/celebration sections | Add circles to non-hero content screens |
| Pill shape (`radius: 30`) for CTA buttons | Square or mildly-rounded (`radius: 8`) buttons |
| Keep privacy messaging brief and user-focused | Lead with compliance jargon (AVG, GDPR acronyms) |
