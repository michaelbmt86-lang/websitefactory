# Page Topology — solidhydrogen.tech

## Page Info
- **Title:** Home | Solidhydrogen
- **URL:** https://www.solidhydrogen.tech/
- **Platform:** Wix
- **Scroll height:** 3943px
- **Smooth scroll library:** None
- **Scroll snap:** None

## Section Map (top to bottom)

| # | Section ID | Top (px) | Height (px) | Description | Interaction |
|---|------------|----------|-------------|-------------|-------------|
| 1 | `comp-m68vrihq` | 5 | 101 | **Header/Nav** — Sticky (z-52), transparent bg. Logo left, nav links center, Contact Us CTA right | Static |
| 2 | `comp-m79iqtji` | 106 | 1113 | **Hero** — Full-width background image (dark gradient overlay), video bg, text "The future of hydrogen is [SAFE/SOLID]" with slideshow cycling between words | Time-driven (slideshow cycles words) |
| 3 | `comp-m74gaar9` | 1219 | 1281 | **Hydrides Intro** — Light bg (#F9FCFD), title "HYDRIDES - A PROVEN TECHNOLOGY FOR HYDROGEN STORAGE", description paragraph, then benefits title + "OUR ADVANTAGE" heading, 11 benefit cards in 4-column grid | Static |
| 4 | `comp-m79lgz7g` | 2254 | 131 | **CTA Banner** — Orange bg (#F26329), "Contact us to find out more about SOLIDHYDROGEN" with link | Static |
| 5 | `comp-m74jciun` | 2500 | 907 | **Team Section** — Background image (watercolor texture), title "Our Executive Team" + subtitle "BEST OF CLASS TECHNICALLY AND IN BUSINESS", 2 team member cards with photos | Static |
| 6 | `comp-m68vriic` | 3407 | 536 | **Footer** — Dark navy bg (#05203C), company description, logo, address (AUSTRALIA), copyright 2025 | Static |

## Layout Structure
- **Scroll container:** Default browser scroll (no library)
- **Header:** `position: sticky; z-index: 52` — overlays content
- **Body:** Single column, full-width sections
- **Page container:** `#otrfx` (relative positioning)

## Dependencies
- Header overlays hero section
- Hero section has video background + gradient overlay
- CTA banner is a standalone full-width orange section
- Footer is full-width dark navy

## Fonts
- **Primary:** Albert Sans (regular 400, bold 700)
- **Secondary:** DIN Next W01 Light (for small text, labels)
- **Fallback:** Arial, Helvetica, sans-serif

## Color Palette
| Token | RGB | Hex | Usage |
|-------|-----|-----|-------|
| Primary/CTA | rgb(242, 99, 41) | #F26329 | Buttons, CTA banner, accents |
| Dark | rgb(5, 32, 60) | #05203C | Footer bg, headings, text |
| Light | rgb(249, 252, 253) | #F9FCFD | Page bg, section bg |
| White | rgb(255, 255, 255) | #FFFFFF | Text on dark, card bg |
| Accent hover | rgb(243, 115, 33) | #F37321 | Button hover states |
| Subtitle | rgb(242, 99, 41) | #F26329 | Subtitle text color |
