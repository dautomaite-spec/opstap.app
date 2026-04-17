# Opstap — Style Guide

## Reference
Based on: `Application Design Ideas.jpeg`

---

## Color Palette

| Role | Name | Hex |
|---|---|---|
| Primary | Deep indigo | `#3D3A8C` |
| Primary variant | Mid purple | `#5B57B5` |
| Accent | Warm yellow | `#F5C842` |
| Background | Lavender mist | `#EEE9F8` |
| Surface | Warm white | `#FFFFFF` |
| Card background | Soft peach | `#FFF0E6` |
| On primary | White | `#FFFFFF` |
| On surface | Near black | `#1A1A2E` |
| On surface variant | Muted grey | `#6B6B8A` |
| Error | Soft red | `#E53935` |
| Outline | Light grey | `#D8D8E8` |

---

## Typography

| Style | Font | Weight | Size |
|---|---|---|---|
| Display | Poppins | 700 (Bold) | 28–32px |
| Headline | Poppins | 600 (SemiBold) | 20–24px |
| Title | Poppins | 600 (SemiBold) | 16–18px |
| Body | Inter | 400 (Regular) | 13–15px |
| Label | Inter | 500 (Medium) | 11–13px |
| Caption | Inter | 400 (Regular) | 11px |

---

## Shape & Radius

| Element | Border radius |
|---|---|
| Cards | 20px |
| Buttons (primary) | 30px (pill) |
| Chips | 20px (pill) |
| Category icons | 12px |
| Job logo circles | 50% (circle) |
| Input fields | 14px |

---

## Decorative Elements

- **Floating circles** — appear in top corners of screens; colors: primary (`#3D3A8C`), accent yellow (`#F5C842`), soft pink (`#F48FB1`)
- Circles are partially off-screen (cropped at edges)
- Sizes: large (~80px), medium (~50px), small (~30px)
- Opacity: 100% — solid, not transparent

---

## Component Patterns

### Cards
- Background: white (`#FFFFFF`) or soft peach (`#FFF0E6`)
- Shadow: subtle, `0 4px 12px rgba(0,0,0,0.06)`
- Radius: 20px
- Padding: 16px

### Job listing row
- Left: company logo circle (40px, colored background, white initial letter)
- Center: job title (bold, 14px) + salary range (muted, 12px)
- Right: "Apply" pill button in accent yellow

### Primary button
- Background: indigo (`#3D3A8C`)
- Text: white, Poppins SemiBold 15px
- Radius: 30px (pill)
- Height: 52px

### Secondary button
- Background: white or peach
- Border: 1px solid outline color
- Text: indigo

### Category chips
- Background: white card
- Icon on top, label below
- Radius: 12px
- Selected: indigo background, white text/icon

### Bottom navigation
- Background: white
- Active icon: indigo
- Inactive: muted grey

---

## Screen Backgrounds

| Screen | Background |
|---|---|
| Welcome / Home | Lavender mist `#EEE9F8` with decorative circles |
| Job list | Lavender mist `#EEE9F8` |
| Job detail | White, header card in indigo gradient |
| Profile / Settings | White |
| Auth (login/register) | Lavender mist |

---

## Spacing

- Base unit: 8px
- Screen horizontal padding: 20px
- Card gap: 12px
- Section gap: 24px
