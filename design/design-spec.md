# Alterx-Inspired Design System Spec
Modern SaaS Dashboard + Marketing UI

Goal:
Refactor the app UI to match a clean, modern SaaS style similar to Alterx:
- strong hierarchy
- card-based layout
- soft shadows
- rounded corners
- generous whitespace
- light dashboard aesthetic
- professional analytics feel

Keep functionality unchanged. Visuals only.

---

# 1. Layout System

## App Shell
Use a 3-region layout:

- Left: Sidebar navigation (fixed)
- Top: Header / toolbar
- Main: Content area with cards/grid

Structure:
Sidebar (240px fixed)
Header (64px height)
Main (fluid, max-w-7xl centered)

Use:
- flex for app shell
- grid for dashboard cards

---

# 2. Spacing Scale

Use 8pt system (Tailwind default works)

xs → 4px
sm → 8px
md → 16px
lg → 24px
xl → 32px
2xl → 48px
3xl → 64px

Rules:
- Card padding: p-6
- Section gap: gap-6 or gap-8
- Page padding: p-8

---

# 3. Color Palette

Style: light SaaS dashboard with subtle contrast

## Neutrals
Background:        #F7F8FA
Surface/Card:      #FFFFFF
Border:            #E5E7EB
Muted text:        #6B7280
Primary text:      #111827

## Brand
Primary:           #2563EB  (blue)
Primary hover:     #1D4ED8
Success:           #10B981
Warning:           #F59E0B
Danger:            #EF4444

## Usage
- Backgrounds: neutral light gray
- Cards: white
- Buttons/links: primary blue
- Charts: primary + success/amber

---

# 4. Typography

Font:
Inter / system-ui / sans-serif

Weights:
400 regular
500 medium
600 semibold
700 bold

Scale:
H1 → text-4xl font-bold
H2 → text-2xl font-semibold
H3 → text-xl font-semibold
Body → text-sm / text-base
Caption → text-xs text-gray-500

Rules:
- Large headings for marketing
- Compact typography in dashboard tables

---

# 5. Border Radius & Elevation

Radius:
cards → rounded-xl (12–16px)
buttons → rounded-lg
inputs → rounded-lg
pills → rounded-full

Shadows:
card default → shadow-sm
hover → shadow-md
dropdown → shadow-lg

Avoid heavy shadows.

---

# 6. Core Components

## Sidebar
- fixed left
- light background
- vertical nav items
- icons + labels
- active state: blue bg + white text
- subtle hover

Classes:
w-60 bg-white border-r

---

## Header / Topbar
Contains:
- search
- notifications
- avatar
- page title

Style:
bg-white border-b px-6 h-16 flex items-center justify-between

---

## Cards
Style:
- white background
- rounded-xl
- shadow-sm
- p-6

Used for:
- stats
- charts
- tables
- feature blocks

---

## Stat Cards (like Total Users / Orders / Products)
Structure:
- label
- large number
- small change indicator (+1.2%)

Style:
- big number text-2xl font-bold
- delta colored green/red

Grid:
grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6

---

## Tables
- compact rows
- subtle borders
- zebra optional
- hover highlight

Classes:
text-sm divide-y divide-gray-200

---

## Buttons

Primary:
bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-4 py-2

Secondary:
border bg-white hover:bg-gray-50

Ghost:
text-gray-600 hover:bg-gray-100

---

## Inputs
- soft borders
- no heavy outlines
- focus ring blue

Classes:
border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500

---

## Charts / Analytics
- placed inside cards
- minimal gridlines
- lots of whitespace
- subtle axis labels

---

# 7. Visual Patterns

Adopt:
✓ card-based sections
✓ large whitespace
✓ light gray backgrounds
✓ modular blocks
✓ soft hierarchy

Avoid:
✗ dense layouts
✗ heavy borders
✗ dark backgrounds
✗ small cramped text

---

# 8. Dashboard Layout Example

Main:
- stats row (4 cards)
- analytics chart row (2/3 + 1/3)
- table section
- activity or orders list

Use CSS grid:
grid-cols-12 gap-6

---

# 9. Tailwind Tokens (recommended)

Add to tailwind.config.js:

theme.extend = {
  borderRadius: {
    xl: "14px",
  },
  boxShadow: {
    card: "0 1px 2px rgba(0,0,0,0.05)",
  }
}

---

# 10. Implementation Rules for Cursor

When refactoring components:
- change styling only
- use Tailwind only
- remove inline styles
- make reusable components
- keep logic untouched
- responsive first

---

# 11. Component Checklist

Create:
- Sidebar
- Header
- Card
- StatCard
- Table
- Button
- Input
- Badge
- ChartCard

All built using the above system.
