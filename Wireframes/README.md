# Opstap — Wireframes & Mockups

## Google Stitch Project (Live, shareable)
**URL:** https://stitch.withgoogle.com/projects/4148466425856813163

Open this link to see all screens in an interactive canvas. The project is set to public — share this URL directly.

---

## Screens in the project

| # | Screen | Description |
|---|---|---|
| 1 | Onboarding Welkom | First screen users see — welcome + CTA |
| 2 | CV Uploaden (upload state) | File picker + AVG consent |
| 3 | CV Uploaden (processing state) | Upload progress / confirmation |
| 4 | Profiel Invullen | Manual profile setup form |
| 5 | Jouw Profiel | View your filled-in profile |
| 6 | Inloggen | Login form + Google Sign-In |
| 7 | Account Aanmaken | Register + password strength bar + AVG |
| 8 | Vacatures Zoeken | Job search + filter chips + result cards |
| 9 | Motivatiebrief Genereren | Letter preview + style selector + send |
| 10 | Instellingen | Settings / account / data management |

---

## Design system
See `../Style guide/STYLE_GUIDE.md` for full design tokens.

**Key tokens:**
- Primary: `#003f87` → `#0056b3` (gradient)
- Surface: `#f9f9f9`
- Cards: `#ffffff`
- Headline font: Manrope
- Body font: Inter
- Corner radius: xl (12px cards), pill (buttons)
- No border lines — use tonal surface shifts instead

---

## Rate limits (as of v1)
| Action | Limit |
|---|---|
| Letter generation per job | 5× total |
| Letter generation daily | 10× per user |
| Applications sent daily | 20× per user |
