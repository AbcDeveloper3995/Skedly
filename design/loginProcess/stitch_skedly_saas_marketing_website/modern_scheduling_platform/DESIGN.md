---
name: Modern Scheduling Platform
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#444654'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#747686'
  outline-variant: '#c4c5d7'
  surface-tint: '#2f50d8'
  primary: '#2c4dd6'
  on-primary: '#ffffff'
  primary-container: '#4a68f0'
  on-primary-container: '#fffbff'
  inverse-primary: '#b9c3ff'
  secondary: '#575e70'
  on-secondary: '#ffffff'
  secondary-container: '#d9dff5'
  on-secondary-container: '#5c6274'
  tertiary: '#0058be'
  on-tertiary: '#ffffff'
  tertiary-container: '#2170e4'
  on-tertiary-container: '#fefcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dee1ff'
  primary-fixed-dim: '#b9c3ff'
  on-primary-fixed: '#001257'
  on-primary-fixed-variant: '#0233c1'
  secondary-fixed: '#dce2f7'
  secondary-fixed-dim: '#c0c6db'
  on-secondary-fixed: '#141b2b'
  on-secondary-fixed-variant: '#404758'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a42'
  on-tertiary-fixed-variant: '#004395'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-hero:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.025em
  display-hero-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
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
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
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
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.015em
  caption:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
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
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system projects clarity, high reliability, and effortless operational control. It targets busy service professionals, clinics, agencies, and independent service providers who require a tool that conveys unyielding stability while remaining warm and accessible to their end clients.

The visual direction merges **Corporate / Modern SaaS** precision with subtle humanist touches:
- **Atmosphere:** Clean, open, and calm. Clutter and cognitive load are minimized to create an anxiety-free booking and agenda-management environment.
- **Formality Level:** High-trust business utility elevated by crisp indigo-blue accents, avoiding cold clinical sterility through generous whitespace and soft geometry.
- **Copy Stance:** Microcopy and contextual labels are presented in clear, natural Spanish (*Español neutro y profesional*), prioritizing action-oriented verbs (*"Reservar cita"*, *"Gestionar agenda"*, *"Confirmar horario"*).

## Colors

The palette establishes an immediate hierarchy of purpose: structural elements remain anchor-dark or ultra-clean, while interactive pathways ignite with modern indigo.

- **Primary Accent (`#4F6DF5`):** The primary kinetic force. Used exclusively for primary call-to-actions, active navigation highlights, date-picker selections, and confirmed booking states.
- **Dark Structural Neutral (`#111827`):** Anchors high-contrast headlines, primary badges, and high-impact structural containers. Serves as the primary text tone for zero ambiguity.
- **Secondary Accent (`#3B82F6`):** Complementary sky-blue used for informational alerts, focused hover states, and calendar slot availability indicators.
- **Background & Canvas (`#F8FAFC`):** Soft, low-strain cool slate backdrop providing contrast against white foreground cards.
- **Surface Layer (`#FFFFFF`):** High-clarity white reserved for cards, modals, popovers, and calendar day cells.
- **Subdued Text (`#64748B`):** Supporting metadata, time zones, timestamps, and secondary captions. Meets WCAG AA contrast against `#FFFFFF` and `#F8FAFC`.
- **Dividers & Borders (`#E2E8F0`):** Subtle border separations ensuring structural integrity without visual noise.

## Typography

The typography system relies on **Inter** to ensure maximum legibility for scheduling data, timesheets, numerical values, and dense business dashboards.

- **Weight Pairing:** Headlines utilize semi-bold (`600`) and bold (`700`) weights with tight negative tracking (`-0.02em` to `-0.015em`) to retain authority and compact structure. Body copy maintains regular (`400`) weight for comfortable readability across long descriptive text and booking instructions.
- **Tabular Numerics:** For time slot listings, calendar grids, pricing tables, and analytics counters, render numerals using `font-variant-numeric: tabular-nums` to ensure strict vertical column alignment.
- **Language Adaptability:** Line-height scales provide generous vertical clearance (1.5x - 1.6x) to accommodate accented characters and length variances common in Spanish copy (e.g., *"Configuración de disponibilidad"*).

## Layout & Spacing

The layout operates on an 8px base rhythm, optimizing fluid adaptability between client-facing self-service booking flows and operational management dashboards.

- **Grid Architecture:** 
  - **Desktop (1024px+):** 12-column responsive grid with `1.5rem` (24px) gutters and a max-width container of `1280px`. In administrative views, a fixed 260px collapsible sidebar coordinates with a fluid multi-column work area.
  - **Tablet (768px – 1023px):** 8-column layout with `1rem` (16px) gutters. Complex schedules convert from multi-day side-by-side views to horizontal tabbed date carousels.
  - **Mobile (320px – 767px):** 4-column layout with `1rem` (16px) margins. Booking widgets transition to full-width stacked flows with pinned bottom confirmation actions.
- **Rhythm & Gap Rules:**
  - Component internals use `space-xs` (4px) and `space-sm` (8px) for tightly coupled metadata.
  - Card padding defaults to `space-lg` (24px) on desktop and `space-md` (16px) on mobile viewports.
  - Page sections separate cleanly with `space-xl` (32px) or larger multiples (`3rem` / `4rem`).

## Elevation & Depth

Visual hierarchy uses a refined combination of crisp surface borders and atmospheric, diffused ambient shadows. High elevations avoid harsh dark drops, ensuring the interface remains light and modern.

- **Level 0 (Flat Surface):** Default cards and canvas panels. Uses `background: #FFFFFF` bordered with `1px solid #E2E8F0` and no shadow.
- **Level 1 (Subtle Lift - `shadow-sm`):** Standard interactive cards, list items on hover, and active time-slot pickers.
  - Shadow: `0 1px 3px 0 rgba(17, 24, 39, 0.05), 0 1px 2px -1px rgba(17, 24, 39, 0.05)`
  - Border: `1px solid #E2E8F0`
- **Level 2 (Floating Action - `shadow-md`):** Dropdowns, date-pickers, context menus, and highlighted booking summaries.
  - Shadow: `0 4px 6px -1px rgba(17, 24, 39, 0.06), 0 2px 4px -2px rgba(17, 24, 39, 0.04)`
  - Border: `1px solid #E2E8F0`
- **Level 3 (Modal / Overlay - `shadow-lg`):** Appointment confirmation dialogs, client profile side-drawers, and full overlays.
  - Shadow: `0 10px 15px -3px rgba(17, 24, 39, 0.08), 0 4px 6px -4px rgba(17, 24, 39, 0.03)`
  - Backdrop: `rgba(17, 24, 39, 0.35)` with `backdrop-filter: blur(4px)`

## Shapes

The design system applies a balanced geometric language with intentional rounding tiers:
- **Base Components (`rounded-lg` / 0.5rem - 8px):** Form inputs, buttons, dropdown triggers, and time-slot selection chips.
- **Cards & Containers (`rounded-xl` to `rounded-2xl` / 1rem - 1.5rem):** Standard dashboard widgets use `1rem` (16px), while public booking cards and featured service modules use `1.5rem` (24px) for a soft, friendly customer experience.
- **Pill Tags (`rounded-full` / 9999px):** Status indicators, service duration tags, and category filters use complete circular pill rounding.

## Components

### Buttons
- **Primary:** Background `#4F6DF5`, text `#FFFFFF`, font `label-md`. Height 44px (touch-friendly), horizontal padding `1.25rem`, border-radius `0.5rem`. Hover state transitions to `#3B82F6` with subtle translateY(-1px).
- **Secondary / Ghost:** White background, border `1px solid #E2E8F0`, text `#111827`. Hover background `#F8FAFC`.
- **Destructive:** Background `#FEE2E2`, text `#DC2626`, hover background `#FCD34D`.
- **Disabled:** Background `#F1F5F9`, text `#94A3B8`, border none, cursor `not-allowed`.

### Cards & Booking Containers
- Built on `#FFFFFF` with `rounded-2xl` (24px) geometry on main flows and `rounded-xl` (16px) inside internal dashboards.
- Subtly bound by a `1px solid #E2E8F0` border.
- Generous internal padding: `1.5rem` (24px) on desktop, scaling to `1rem` (16px) on mobile devices.
- Interactive cards (e.g., selectable staff or service packages) feature an outline state of `2px solid #4F6DF5` and an active background wash of `#4F6DF5` at 4% opacity.

### Form Inputs & Selects
- Height 44px, background `#FFFFFF`, border `1px solid #E2E8F0`, border-radius `0.5rem`.
- Padding: `0.75rem 1rem`. Typography: `body-md` with placeholder text in `#94A3B8`.
- Focus state: Border color transitions to `#4F6DF5` with an outer ring `0 0 0 3px rgba(79, 109, 245, 0.15)`.
- Spanish validation indicators sit directly beneath the field with error copy in `#DC2626` at `label-sm`.

### Chips & Pill Tags
- **Status Tags:** Pill-shaped (`rounded-full`), padding `0.25rem 0.75rem`, font `label-sm`.
  - *Confirmada / Pagada:* Background `#ECFDF5`, text `#059669`.
  - *Pendiente:* Background `#FEF3C7`, text `#D97706`.
  - *Cancelada:* Background `#FEE2E2`, text `#DC2626`.
- **Time-Slot Chips:** Rectangular with `0.5rem` radius, border `1px solid #E2E8F0`, text `#111827`, font `label-md`. When selected, background transitions to `#4F6DF5` with `#FFFFFF` text.

### Calendar & Time Slot Grids
- **Calendar Cell:** High-contrast dates, today marked with a small `#4F6DF5` dot. Unavailable dates dimmed to `#CBD5E1`.
- **Slot Matrix:** Displayed as a multi-column responsive grid (2 columns on mobile, 3-4 on desktop). Clear visual distinction between available (*"Disponible"*), busy (*"Ocupado"*), and reserved slots.

### Checkboxes & Radios
- Size 18px x 18px. Border `1.5px solid #CBD5E1`, border-radius `4px` (checkbox) or full circle (radio).
- Checked state: `#4F6DF5` fill with crisp white checkmark or center pip. Focus ring provides `3px` aura at 15% opacity.