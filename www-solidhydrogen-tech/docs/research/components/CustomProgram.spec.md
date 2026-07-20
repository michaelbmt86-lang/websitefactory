# CustomProgram Specification

## Overview
- **Target file:** `src/components/CustomProgram.tsx`
- **Interaction model:** static

## DOM Structure
- Two-column layout (60/40 split)
- Left column:
  - Badge: "Custom Program"
  - Title: "Build Your Brand with Custom Packaging"
  - Description paragraph
  - Feature list (2 items)
  - Two CTA buttons
- Right column:
  - Stats: "500+" / "Custom Projects"
  - Image: Custom BioPak Cup

## Computed Styles

### Container
- display: flex
- gap: 64px
- padding: 80px 16px
- max-width: 1280px
- margin: 0 auto
- align-items: center

### Left Column
- flex: 1

### Badge
- display: inline-block
- font-size: 14px
- font-weight: 600
- color: rgb(0, 122, 85)
- background: rgba(0, 122, 85, 0.1)
- padding: 6px 12px
- border-radius: 100px
- margin-bottom: 16px

### Title (H2)
- font-size: 36px
- font-weight: 800
- color: rgb(37, 37, 37)
- margin-bottom: 16px
- line-height: 1.2

### Description
- font-size: 16px
- color: rgb(82, 82, 92)
- line-height: 26px
- margin-bottom: 24px

### Feature List
- display: flex
- flex-direction: column
- gap: 16px
- margin-bottom: 32px

### Feature Item
- display: flex
- gap: 12px

### Feature Title
- font-size: 16px
- font-weight: 600
- color: rgb(37, 37, 37)

### Feature Description
- font-size: 14px
- color: rgb(82, 82, 92)

### Buttons
- display: flex
- gap: 16px

### Primary Button
- background: rgb(0, 122, 85)
- color: white
- padding: 12px 24px
- border-radius: 8px
- font-weight: 600

### Secondary Button
- background: transparent
- color: rgb(0, 122, 85)
- padding: 12px 24px
- border-radius: 8px
- font-weight: 600
- border: 1px solid rgb(0, 122, 85)

### Right Column
- flex: 0.67
- position: relative

### Stats
- position: absolute
- top: -20px
- left: -20px
- background: rgb(0, 122, 85)
- color: white
- padding: 24px
- border-radius: 12px
- text-align: center

### Stats Number
- font-size: 48px
- font-weight: 800

### Stats Label
- font-size: 14px

### Image
- width: 100%
- border-radius: 16px
- object-fit: cover

## Text Content (verbatim)
- Badge: "Custom Program"
- Title: "Build Your Brand with Custom Packaging"
- Description: "Stand out with fully customised, sustainable packaging. From design to delivery, we handle everything so you can focus on your business."
- Feature 1 Title: "Full Design Service"
- Feature 1 Description: "Expert design team to bring your brand vision to life"
- Feature 2 Title: "Dedicated Account Manager"
- Feature 2 Description: "Personal support throughout your project"
- Button 1: "Request Custom Quote"
- Button 2: "View Custom Examples"
- Stats Number: "500+"
- Stats Label: "Custom Projects"

## Assets
- `public/images/custom/custom-biopak-cup.jpg`

## Responsive Behavior
- **Desktop (1440px):** Two columns side-by-side
- **Tablet (768px):** Stacked, image on top
- **Mobile (390px):** Stacked, smaller text
