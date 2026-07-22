# SiteHeader Specification

## Overview
- **Target file:** `src/components/SiteHeader.tsx`
- **Interaction model:** scroll-triggered (sticky header)
- **Components:** SiteHeader (main), MegaMenu (sub-component)

## DOM Structure
- Fixed/sticky header at top
- Logo (left)
- Main navigation (center)
- Action buttons (right): Search, Account, Cart
- Mega menu dropdowns (on hover/click)

## Computed Styles

### Header Container
- position: fixed (or sticky)
- top: 0
- left: 0
- right: 0
- z-index: 50
- background: rgba(255, 255, 255, 0.95) (semi-transparent)
- backdrop-filter: blur(8px)
- border-bottom: 1px solid rgba(0, 0, 0, 0.05)
- transition: background 0.3s, box-shadow 0.3s

### Header Scrolled State
- background: white
- box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1)

### Header Inner
- max-width: 1440px
- margin: 0 auto
- padding: 0 24px
- height: 72px
- display: flex
- align-items: center
- justify-content: space-between

### Logo
- height: 40px (h-10)
- width: auto

### Main Navigation
- display: flex
- gap: 32px
- align-items: center

### Nav Link
- font-size: 14px
- font-weight: 600
- color: rgb(37, 37, 37)
- text-transform: uppercase
- letter-spacing: 0.05em
- display: flex
- align-items: center
- gap: 4px
- padding: 8px 0
- position: relative

### Nav Link Hover
- color: rgb(0, 122, 85)

### Nav Link Active Indicator
- position: absolute
- bottom: -2px
- left: 0
- right: 0
- height: 2px
- background: rgb(0, 122, 85)

### Action Buttons
- display: flex
- gap: 16px
- align-items: center

### Action Button
- width: 40px
- height: 40px
- display: flex
- align-items: center
- justify-content: center
- border-radius: 8px
- color: rgb(37, 37, 37)
- transition: background 0.2s

### Action Button Hover
- background: rgba(0, 0, 0, 0.05)

### Mega Menu
- position: absolute
- top: 100%
- left: 0
- right: 0
- background: white
- border-top: 1px solid rgba(0, 0, 0, 0.05)
- box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1)
- padding: 32px
- opacity: 0
- visibility: hidden
- transform: translateY(-10px)
- transition: opacity 0.2s, visibility 0.2s, transform 0.2s

### Mega Menu Open
- opacity: 1
- visibility: visible
- transform: translateY(0)

### Mega Menu Content
- max-width: 1280px
- margin: 0 auto
- display: grid
- grid-template-columns: repeat(4, 1fr)
- gap: 32px

### Mega Menu Column Title
- font-size: 14px
- font-weight: 700
- color: rgb(37, 37, 37)
- margin-bottom: 16px

### Mega Menu Link
- font-size: 14px
- color: rgb(82, 82, 92)
- padding: 6px 0
- display: block
- transition: color 0.2s

### Mega Menu Link Hover
- color: rgb(0, 122, 85)

### Mobile Menu Button
- display: none (hidden on desktop)

## Navigation Structure
- **SHOP** (mega menu): New, Cups, Containers, Plates & Trays, Cutlery & Straws, Bags, Napkins & Gloves, Retail, Sale
- **CUSTOM**: Custom Packaging, Design Process, Request Quote
- **INDUSTRY**: Fast Food, Events, Distributors, Coffee Roasters
- **SUSTAINABILITY**: Plastic Bans, Disposal Guide, Compost Connect, Impact Report
- **NEWS**: Blog, Customer Stories, Media Centre
- **ABOUT US**: Why Us, Sustainability, Give Back Fund, Awards, Contact

## Text Content
- Nav items: SHOP, CUSTOM, INDUSTRY, SUSTAINABILITY, NEWS, ABOUT US

## Assets
- Logo: `public/images/logo.png`
- Icons from `icons.tsx`: SearchIcon, UserIcon, ShoppingBagIcon, ChevronDownIcon

## Responsive Behavior
- **Desktop (1440px):** Full navigation, mega menus
- **Tablet (768px):** Hamburger menu, simplified nav
- **Mobile (390px):** Hamburger menu, full-screen mobile menu
