# CategoryGrid Specification

## Overview
- **Target file:** `src/components/CategoryGrid.tsx`
- **Interaction model:** static with hover effects

## DOM Structure
- Section with heading and subtitle
- 3-column grid (2 rows)
- Each category card:
  - Image (full width, aspect ratio)
  - Content overlay at bottom
    - Category title (bold)
    - Subtitle text
    - "Browse" link with arrow icon

## Computed Styles

### Section Header
- text-align: center
- margin-bottom: 48px

### Section Title (H2)
- font-size: 36px
- font-weight: 800
- color: rgb(37, 37, 37)
- margin-bottom: 8px

### Section Subtitle
- font-size: 18px
- color: rgb(82, 82, 92)

### Grid Container
- display: grid
- grid-template-columns: repeat(3, 1fr)
- gap: 24px
- max-width: 1280px
- margin: 0 auto
- padding: 0 16px

### Category Card
- position: relative
- border-radius: 12px
- overflow: hidden
- aspect-ratio: 3/4
- group (for hover effects)

### Card Image
- width: 100%
- height: 100%
- object-fit: cover
- transition: transform 0.3s

### Card Content
- position: absolute
- bottom: 0
- left: 0
- right: 0
- padding: 24px
- background: linear-gradient(to top, rgba(0,0,0,0.7), transparent)
- color: white

### Card Title (H3)
- font-size: 24px
- font-weight: 700
- margin-bottom: 4px

### Card Subtitle
- font-size: 14px
- opacity: 0.9
- margin-bottom: 16px

### Card Link
- display: flex
- align-items: center
- gap: 8px
- font-size: 14px
- font-weight: 600
- color: white
- transition: gap 0.2s

### Hover Effects
- Card image: transform scale(1.05)
- Card link: gap increases to 12px

## Categories Data
1. **Drinks** - "Cups, Lids & Straws" - `/au/cups` - `categories/drinks.png`
2. **Food Packaging** - "Containers, Bowls & Plates" - `/au/containers-lids` - `categories/food-packaging.png`
3. **Service & Accessories** - "Cutlery, Napkins & Gloves" - `/au/napkins-washroom` - `categories/service-accessories.jpg`
4. **Bags & Carry** - "Paper & Carry Bags" - `/au/bags` - `categories/bags-carry.jpg`
5. **Kits** - "Retail & Catering Packs" - `/au/cutlery-straws` - `categories/kits.png`
6. **Plates & Trays** - "Compostable Serveware" - `/au/plates-trays` - `categories/plates-trays.jpg`

## "View All Products" Link
- Displayed below the grid
- Full-width button or centered link
- ArrowRight icon

## Responsive Behavior
- **Desktop (1440px):** 3 columns, 2 rows
- **Tablet (768px):** 2 columns, 3 rows
- **Mobile (390px):** 1 column, 6 rows
