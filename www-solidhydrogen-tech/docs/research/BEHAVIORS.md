# Behaviors — solidhydrogen.tech

## Scroll Behaviors
- **No smooth scroll library** (no Lenis, Locomotive, or native smooth scroll)
- **No scroll-snap** on any container
- **Nav is sticky** (`position: sticky; z-index: 52`) — stays at top when scrolling
- **765 animated elements** detected via CSS `animation-timeline: scroll()` — Wix scroll-driven animations are present

## Header Behavior
- **Position:** Sticky at top
- **Background:** Transparent on initial load
- **Height:** 106px
- **Nav links:** Technology, Team, Benefits, Products, Use Cases, Blog
- **CTA:** "Contact Us" links to mailto:contact@solidhydrogen.tech
- **No visible scroll-triggered background change** — remains transparent

## Hero Section Behavior
- **Slideshow:** Cycles between words "SAFE" and "SOLID" in the heading "The future of hydrogen is ___"
- **Trigger:** Time-driven (auto-cycling, likely CSS animation or JS interval)
- **Video background:** Autoplaying, looped, muted video (mp4 from wixstatic)
- **Gradient overlay:** `linear-gradient(rgba(5, 53, 88, 0) 4.36883%, rgba(5, 32, 60, 0.21) 19.2982%, rgb(5, 32, 60) 53.5088%)` — darkens from top to bottom
- **Play Text Mask button:** Present (uid=1_28) — may trigger animation

## Hover States
- **Nav links:** Need to verify — likely color change or underline on hover
- **CTA button:** Likely background/color change on hover
- **Benefit cards:** May have subtle hover effects (scale, shadow)
- **Team member cards:** May have hover effects
- **Footer links:** Likely color change on hover

## Interactive Elements
- All nav links are `<a>` tags with href
- "Contact Us" CTA is mailto: link
- "Contact us to find out more" CTA in benefits section is mailto: link
- No modals, dropdowns, or accordions detected on homepage

## Responsive Breakpoints (observed)
- **Desktop (1440px):** Full layout as extracted
- **Tablet (768px):** Likely 2-column grid for benefits, stacked team cards
- **Mobile (390px):** Single column, stacked layout

## Animations
- Hero text slideshow (SAFE ↔ SOLID cycling)
- Wix scroll-driven animations (765 elements with scroll-timeline)
- Possible fade-in animations on section entry (Wix default)
