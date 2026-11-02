---
name: Executive Precision
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464c'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#575e70'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#141b2b'
  on-primary-container: '#7d8497'
  inverse-primary: '#c0c6db'
  secondary: '#2c4dd6'
  on-secondary: '#ffffff'
  secondary-container: '#4a68f0'
  on-secondary-container: '#fffbff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002109'
  on-tertiary-container: '#009842'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce2f7'
  primary-fixed-dim: '#c0c6db'
  on-primary-fixed: '#141b2b'
  on-primary-fixed-variant: '#404758'
  secondary-fixed: '#dee1ff'
  secondary-fixed-dim: '#b9c3ff'
  on-secondary-fixed: '#001257'
  on-secondary-fixed-variant: '#0233c1'
  tertiary-fixed: '#7ffc97'
  tertiary-fixed-dim: '#62df7d'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005320'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.005em
  title-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.005em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style
The design system targets enterprise professionals, service providers, and scaling companies requiring a disciplined, high-confidence appointment scheduling and business operations engine.

### Brand Personality
- **Rigorous & Trustworthy:** Precision engineering where calendar synchronization, client retention, and cash-flow visibility never fail.
- **Minimalist & High-Density:** Function over decoration. Interfaces display complex daily agendas without sensory fatigue.
- **Executive Elegance:** Clean lines, deliberate micro-interactions, and institutional authority.

### Design Movement
**Modern Executive SaaS:** Blends Scandinavian digital minimalism with Swiss grid discipline. The aesthetic relies on an ultra-light slate canvas (`#F8FAFC`), crisp single-pixel framing (`#E2E8F0`), high-contrast slate-navy anchors (`#111827`), and an electric cobalt action point (`#4F6DF5`). Copy is tailored for formal, concise Spanish business software ("Gestionar citas", "Disponibilidad", "Configuración del equipo").

## Colors
The color palette creates distinct separation between structure, interactive cues, and system states.

### Core Palette
- **Primary Navy (`#111827`):** Anchors visual weight. Used for brand headers, primary structural icons, active navigation tabs, and dark solid actions.
- **Action Cobalt (`#4F6DF5`):** The primary interactive driver. Reserved for prime conversion triggers, active schedule slots, booking links, and focus rings.
- **Main Canvas (`#F8FAFC`):** Low-strain background that isolates white containers.
- **Pure White (`#FFFFFF`):** High-clarity elevated surface for data cards, modal sheets, and dropdowns.

### Typography & Border Elements
- **Primary Text (`#111827`):** High-contrast readability across all light surfaces.
- **Secondary / Muted Text (`#64748B`):** Metadata, timestamps, table column headers, and helper hints.
- **Structural Border (`#E2E8F0`):** Uniform 1px stroke across card boundaries, divider rules, and input perimeters.

### Semantic Tones
- **Success (`#16A34A`):** Confirmed appointments, paid invoices, and active statuses.
- **Warning (`#F59E0B`):** Pending approvals, conflicting slots, and expiring tokens.
- **Error (`#EF4444`):** Cancelled reservations, failed transactions, and critical validation alerts.

## Typography
All typography leverages Inter across four key weights: 400 (Regular), 500 (Medium), 600 (Semi-bold), and 700 (Bold).

### Structural Rules
- **Negative Tracking on Large Headings:** Any type scale above 20px applies tight tracking (`-0.015em` to `-0.025em`) to retain a sharp digital executive posture.
- **Tabular Figures:** Numbers in schedule listings, calendar times, and pricing tables must enable font-variant-numeric: `tabular-nums`.
- **Localization:** Spanish character sets (tildes, opening exclamation/question punctuation) inherit consistent kerning and line-heights to eliminate baseline clipping.

## Layout & Spacing
The layout model employs a fluid 12-column responsive grid on desktop viewports and a single/dual-column flow on handheld interfaces.

### Grid Breakpoints
- **Mobile (< 768px):** 4 columns, `margin-sm` (16px), `gutter-sm` (16px).
- **Tablet (768px - 1024px):** 8 columns, 24px margins, 20px gutters.
- **Desktop (> 1024px):** 12 columns with standard 32px (`margin`) boundary and 24px (`gutter`) column gaps. Maximum container shell capped at 1440px for broad displays.

### Layout Hierarchy
Workspaces are divided into a fixed 260px administrative navigation sidebar, a contextual sub-panel (e.g., calendar list, filter queries) when active, and a primary fluid canvas displaying timetables, kanban flows, and metrics.

## Elevation & Depth
Depth is produced via subtle borders and light, multi-tier ambient drop shadows. Heavy blurs and colored glow patterns are strictly excluded.

### Elevation Hierarchy
- **Level 0 (Flat Canvas):** `#F8FAFC` base surface with no shadow or line separator.
- **Level 1 (Card & Content Blocks):** `#FFFFFF` surfaces bounded by a crisp 1px stroke of `#E2E8F0` and an ambient rest shadow: `0 1px 3px rgba(0, 0, 0, 0.05)`.
- **Level 2 (Hover & Floating Elements):** Applied to active appointment cards during pointer hover and quick-action sheets: `0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -2px rgba(0, 0, 0, 0.03)` with border shifting to `#CBD5E1`.
- **Level 3 (Modals & Overlays):** Appointment booking sidebars, event modification drawers, and popovers: `0 10px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -6px rgba(0, 0, 0, 0.02)`. Accompanied by a transparent overlay fill (`rgba(17, 24, 39, 0.35)`).

## Shapes
Geometry uses clean, structured curves that balance approachable SaaS patterns with administrative precision.

### Geometric Rules
- **Panels & Container Cards:** Fixed at `12px` to `16px` radius (`rounded-xl` equivalent in this system tier) to enclose appointment records cleanly.
- **Inputs & Dropdowns:** `8px` corner radiuses ensure strict structural vertical rhythm beside standard buttons.
- **Badges, Status Chips & Avatars:** Fully rounded pill shapes (`9999px`) provide clear contrast against rectangular data tables and grid units.

## Components

### Buttons
- **Primary:** Background `#4F6DF5`, text `#FFFFFF`, font-weight 500, radius 8px, hover `#3E5BD9`, active state inset shadow. Text example: *"Nueva Cita"*, *"Guardar Cambios"*.
- **Secondary / Structural:** Background `#FFFFFF`, text `#111827`, border 1px solid `#E2E8F0`, hover background `#F1F5F9`.
- **Destructive:** Background `#FFFFFF`, border 1px solid `#FCA5A5`, text `#EF4444`, hover background `#FEF2F2`.

### Cards & Panels
- Constructed with `#FFFFFF` background, uniform 1px solid `#E2E8F0` perimeter, 14px outer corner radius, and Level 1 elevation.
- Internal headers include 16px bottom padding separated by a subtle 1px `#E2E8F0` divider line.

### Form Inputs & Date Selectors
- Surface `#FFFFFF`, height 40px, padding `0 12px`, radius 8px, 1px border `#E2E8F0`.
- **Focus state:** 1px border `#4F6DF5` along with a 3px outer ring: `rgba(79, 109, 245, 0.15)`.
- Helper and validation copy sits 4px below the input in `body-sm` (`#64748B` default, `#EF4444` on validation mismatch).

### Badges & Status Chips
- Pill-shaped (`rounded-full`), padding `2px 10px`, typography `label-sm`.
- **Confirmado (Success):** Background `rgba(22, 163, 74, 0.1)`, text `#16A34A`.
- **Pendiente (Warning):** Background `rgba(245, 158, 11, 0.1)`, text `#D97706`.
- **Cancelado (Error):** Background `rgba(239, 68, 68, 0.1)`, text `#DC2626`.
- **Borrador (Neutral):** Background `#F1F5F9`, text `#64748B`.

### Calendar Slots & Scheduling Grid
- Interactive timeline blocks leverage an `#FFFFFF` surface with an assertive left border (3px solid `#4F6DF5` for confirmed bookings, `#F59E0B` for unverified holds).
- Selected timeslots feature a `#4F6DF5` outline with an ultra-light tint background (`rgba(79, 109, 245, 0.04)`).