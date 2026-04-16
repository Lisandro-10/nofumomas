# Mobile menu + CTA hierarchy roadmap

This roadmap defines a UX-safe path to add a mobile hamburger menu while preserving a single clear primary CTA by showing the sticky CTA only after the hero section.

## Context (current behavior)

- **Top header (mobile)**: `NavBar.tsx` shows brand + CTA.
- **Bottom sticky CTA (mobile)**: `StickyMobileCta.tsx` shows "EMPEZAR AHORA" + WhatsApp, currently visible immediately.
- **`FloatingWhatsapp`**: already `hidden md:flex` — desktop only, no conflict.
- **Goal**: add a mobile menu and avoid multiple competing primary CTAs.

## UX decision locked in

- **Sticky CTA appears after hero** (not immediately on page load).
- **Option A selected**: clean header with hamburger only on mobile; no header CTA on mobile.

## Implementation phases

### Phase 0 — Prerequisites ✅

- Add `id="hero"` to `<header>` in `HeroSplit.tsx` (IntersectionObserver target).
- Align CTA copy: `StickyMobileCta` uses `EMPEZAR AHORA` to match `NavBar`.

### Phase 1 — Delay StickyMobileCta past hero

- Convert `StickyMobileCta` to `'use client'`.
- Use `IntersectionObserver` on `#hero`; once hero exits viewport, show the bar.
- Render `null` until visible (no layout shift — it's `fixed`).
- Acceptance:
  - Sticky CTA hidden at initial load.
  - Appears consistently after hero on iOS/Android.
  - No layout shift / jank.

### Phase 2 — Add hamburger + drawer infrastructure

- Convert `NavBar` to `'use client'`; add `isOpen` state.
- Mobile header: brand + hamburger button only (header CTA hidden on mobile via `hidden md:flex`).
- Hamburger: 44×44 tap target, `aria-label="Abrir menú"`.
- New `MobileDrawer.tsx` component:
  - Slide-in panel from right, `z-50`, mobile-only.
  - Overlay click → close.
  - Close button (`aria-label="Cerrar menú"`).
  - Escape key → close.
  - Focus trap + `overflow-hidden` body scroll lock.

### Phase 3 — Populate drawer + scroll offset

- Drawer contents: anchor links (`#tecnicas`, `#precios`, `#nosotros`, `#testimonios`), phone + WhatsApp, secondary CTA.
- On link click: close drawer, navigate.
- Add `scroll-mt-20` to all anchor sections to compensate for fixed header height.

## QA checklist

- Mobile tap targets >= 44×44.
- `aria-label` and keyboard navigation supported.
- Drawer does not trap users (close is always discoverable).
- CTA copy consistent: `EMPEZAR AHORA` everywhere.
- Desktop unaffected: nav links + header CTA + FloatingWhatsapp visible as before.
