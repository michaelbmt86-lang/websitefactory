# SolidHydrogen — Page Behaviors

## Global
- **Smooth scroll:** Native browser scroll (no Lenis/Locomotive detected)
- **Scroll container:** Standard document scroll on `html/body`

## Header (`#SITE_HEADER`)
- **Interaction model:** static (sticky positioning)
- **Position:** `sticky`, `top: 0`, `z-index: 50`
- **Height:** 106px
- **Background:** transparent (`rgba(0,0,0,0)`) at all scroll positions — no scroll-triggered style change
- **Layout:** Logo left, horizontal nav center, Contact Us button right

### Nav links hover
- **Trigger:** hover on menu item
- **Before:** color `#FFFFFF`, no underline, border-bottom transparent
- **After:** color `#F26329`, `text-decoration: underline`, border-bottom `1px solid #F26329`
- **Transition:** border-color 0.4s ease, background-color 0.4s ease

### Contact Us button (header)
- **Default:** transparent background, `1px solid #F26329` border, white text
- **Hover:** background `#F26329`, white text

## Hero Section
- **Interaction model:** static with autoplay video background
- **Background:** Looping muted autoplay video with poster image fallback
- **Content:** Three-line centered headline with fade-in animation on load
- **Animation:** `motion-floatIn` 800ms 1500ms delay, translateY 60px → 0

## Technology & Benefits Section
- **Interaction model:** static
- **Background:** Image with gradient overlay (`linear-gradient` from transparent to `rgb(5, 32, 60)`)
- **Layout:** Two-column on desktop — left: hydrides description, right: benefits grid (4×2 icon cards)
- **Benefit cards:** Icon + text, orange decorative corner SVG accents

## Contact CTA Bar
- **Interaction model:** click-driven (mailto link)
- **Style:** Orange (`#F26329`) rounded bar, white text
- **Link:** `mailto:contact@solidhydrogen.tech`
- **"Contact us" text:** underlined within the CTA

## Executive Team Section
- **Interaction model:** static
- **Background:** Full-width image with dark overlay
- **Layout:** Two team member cards side by side (photo, name, title, bio)

## Footer
- **Interaction model:** static
- **Background:** Dark navy `#05203C`
- **Content:** Logo, Australia address block, copyright
- **"AUSTRALIA" label:** Orange accent color `#F26329`

## Responsive
- **Desktop (1440px):** Full horizontal nav, multi-column layouts
- **Tablet (768px):** Nav may compress, benefits grid 2 columns
- **Mobile (390px):** Single column stack, hamburger-style nav collapse recommended
