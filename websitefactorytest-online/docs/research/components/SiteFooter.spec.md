# SiteFooter Specification

## Overview
- **Target file:** `src/components/SiteFooter.tsx`
- **Interaction model:** static

## DOM Structure
- Dark background footer
- Main footer content:
  - Left: Logo, description, social links
  - Right: 4-column link grid
- Bottom bar: Contact info, copyright, badges

## Computed Styles

### Footer Container
- background: rgb(21, 21, 21)
- color: white
- padding: 64px 16px 32px

### Footer Content
- max-width: 1280px
- margin: 0 auto
- display: grid
- grid-template-columns: 1fr 2fr
- gap: 64px

### Left Column
- max-width: 320px

### Footer Logo
- height: 40px
- margin-bottom: 16px

### Footer Description
- font-size: 14px
- color: rgba(255, 255, 255, 0.7)
- line-height: 22px
- margin-bottom: 24px

### Social Links
- display: flex
- gap: 16px

### Social Link
- width: 40px
- height: 40px
- display: flex
- align-items: center
- justify-content: center
- border-radius: 50%
- background: rgba(255, 255, 255, 0.1)
- color: white
- transition: background 0.2s

### Social Link Hover
- background: rgb(0, 122, 85)

### Links Grid
- display: grid
- grid-template-columns: repeat(4, 1fr)
- gap: 32px

### Link Column Title
- font-size: 14px
- font-weight: 700
- color: white
- margin-bottom: 16px

### Link
- font-size: 14px
- color: rgba(255, 255, 255, 0.7)
- padding: 6px 0
- display: block
- transition: color 0.2s

### Link Hover
- color: white

### Bottom Bar
- max-width: 1280px
- margin: 48px auto 0
- padding-top: 32px
- border-top: 1px solid rgba(255, 255, 255, 0.1)
- display: flex
- justify-content: space-between
- align-items: center

### Contact Info
- display: flex
- gap: 32px

### Contact Item
- display: flex
- align-items: center
- gap: 8px
- font-size: 14px
- color: rgba(255, 255, 255, 0.7)

### Copyright
- font-size: 14px
- color: rgba(255, 255, 255, 0.5)

### Badges
- display: flex
- gap: 16px

### Badge
- font-size: 12px
  font-weight: 600
  color: white
  background: rgba(255, 255, 255, 0.1)
  padding: 4px 12px
  border-radius: 100px

## Link Columns
1. **Shop:** All Products, Drinks, Food Packaging, Service & Accessories, Bags & Carry, Kits
2. **Custom:** BioPak Catalogue, BioPak Price List, Custom Packaging, Design Process, Request Quote, My Account
3. **Solutions:** Plastic Ban, Disposal Guide, Compost Connect, Customer Stories
4. **Company:** Why Choose BioPak, Sustainability, Give Back Fund, Sustainable Sourcing, Media Centre, News & Resources, Awards, Contact Us
5. **Support:** Delivery & Returns Policy, Terms & Conditions, Privacy Policy, Track Your order, Payment Methods, Become a Distributor, Preference Centre, FAQs

## Contact Info
- Phone: 1300 246 725
- Email: sales@biopak.com.au
- Location: Sydney, Australia

## Copyright
- "Copyright © 2025 BioPak. All rights reserved (FSC™ C110879)."

## Badges
- B Corp Certified
- Australian Owned

## Social Links
- Facebook: https://www.facebook.com/biopak/
- LinkedIn: https://www.linkedin.com/company/biopakpackaging/

## Assets
- Logo: `public/images/footer-logo.png`
- Icons from `icons.tsx`: FacebookIcon, LinkedinIcon, PhoneIcon, MailIcon, MapPinIcon

## Responsive Behavior
- **Desktop (1440px):** Two-column layout, 4-column links grid
- **Tablet (768px):** Stacked layout, 2-column links grid
- **Mobile (390px):** Stacked layout, 1-column links
