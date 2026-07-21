# ValueProps Specification

## Overview
- **Target file:** `src/components/ValueProps.tsx`
- **Interaction model:** static

## DOM Structure
- 4-column grid section
- Each column:
  - Icon image (60x60px)
  - Title (bold)
  - Description paragraph

## Computed Styles

### Container
- display: grid
- grid-template-columns: repeat(4, 1fr)
- gap: 32px
- padding: 64px 16px
- max-width: 1280px
- margin: 0 auto

### Value Prop Item
- display: flex
- flex-direction: column
- gap: 16px

### Icon
- width: 60px
- height: 60px
- object-fit: contain

### Title
- font-size: 16px
- font-weight: 700
- color: rgb(37, 37, 37)
- line-height: 24px

### Description
- font-size: 14px
- color: rgb(82, 82, 92)
- line-height: 22px

## Text Content (verbatim)
1. **Packaging Made From Plants** - "Designed for the circular economy where resources are reused and not wasted."
2. **Certified Compostable** - "We champion composting as the best recycling solution for food packaging."
3. **B Corp Certified** - "We give back to people and planet, so your purchases directly affect positive change."
4. **Emissions Reduction** - "We have a roadmap in place to reduce our carbon emissions in our supply chain and operations."

## Assets
- `public/images/value-props/packaging-made-from-plants.png`
- `public/images/value-props/certified-compostable.png`
- `public/images/value-props/b-corp-certified.png`
- `public/images/value-props/emissions-reduction.png`

## Responsive Behavior
- **Desktop (1440px):** 4 columns
- **Tablet (768px):** 2 columns
- **Mobile (390px):** 1 column, centered
