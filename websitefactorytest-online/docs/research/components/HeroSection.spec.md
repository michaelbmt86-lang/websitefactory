# HeroSection Specification

## Overview
- **Target file:** `src/components/HeroSection.tsx`
- **Screenshot:** `docs/design-references/desktop-fullpage.png`
- **Interaction model:** static

## DOM Structure
- Full-width container with background image (cover, center)
- Semi-transparent dark overlay
- Content wrapper (max-w-3xl, centered left)
  - H1 title (Montserrat 800, 60px/75px, white)
  - Subtitle paragraph (20px/32.5px, white with 0.9 opacity)
  - Button row (flex, gap-16px)
    - Primary button: white bg, green text (#004F3B), rounded-lg 8px, padding 0 24px, height 48px
    - Outline button: white bg 10% opacity, white text, rounded-lg 8px, padding 0 20px, height 48px
  - Trust badges row (flex, gap-24px)
    - Each badge: flex with icon + text, 14px, white, green bullet dot

## Computed Styles

### Container
- background: url(hero-bg.jpg) cover center
- min-height: 100vh (full viewport)
- display: flex, align-items: center

### Content Wrapper
- max-width: 768px
- padding: 112px 16px

### H1 Title
- font-family: Montserrat, sans-serif
- font-size: 60px
- font-weight: 800
- line-height: 75px
- color: white
- margin-bottom: 24px

### Subtitle
- font-size: 20px
- line-height: 32.5px
- color: rgba(255, 255, 255, 0.9)
- margin-bottom: 32px

### Buttons Container
- display: flex
- gap: 16px
- margin-bottom: 32px

### Primary Button (Shop Sale)
- background: white
- color: rgb(0, 79, 59)
- font-weight: 600
- padding: 12px 24px
- border-radius: 8px
- display: flex
- gap: 8px
- align-items: center

### Outline Button (Request Custom Quote)
- background: rgba(255, 255, 255, 0.1)
- color: white
- font-weight: 600
- padding: 12px 20px
- border-radius: 8px
- display: flex
- gap: 8px
- align-items: center

### Trust Badges
- display: flex
- gap: 24px
- font-size: 14px
- color: white

### Trust Badge Item
- display: flex
- gap: 8px
- align-items: center

### Trust Badge Bullet
- width: 8px
- height: 8px
- background: rgb(168, 205, 54)
- border-radius: 50%

## Text Content (verbatim)
- H1: "Quick Service Food Packaging for the Circular World"
- Subtitle: "Certified compostable ranges, reliable supply, and custom branding — shipped Australia-wide."
- Button 1: "Shop Sale" (with ShoppingBag icon and ArrowRight icon)
- Button 2: "Request Custom Quote" (with MessageCircle icon)
- Badge 1: "AS4736 & AS5810 Certified Compostable"
- Badge 2: "Next day delivery to metro areas"
- Badge 3: "Trusted by 10,000+ venues"

## Assets
- Background image: `public/images/hero-bg.jpg`
- Icons from `icons.tsx`: ShoppingBagIcon, ArrowRightIcon, MessageCircleIcon, ShieldCheckIcon

## Responsive Behavior
- **Desktop (1440px):** Full viewport height, large title (60px), side-by-side buttons
- **Tablet (768px):** Title reduces to ~40px, buttons stack or stay side-by-side
- **Mobile (390px):** Title ~28px, buttons full-width or stacked, reduced padding
