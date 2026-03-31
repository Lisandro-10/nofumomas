# No Fumo Más — Landing Page Roadmap

This roadmap describes the implementation order to migrate the current landing page into the Next.js app and extract reusable components while aligning with `docs/DESIGN.md`.

## Scope

- Landing page for a single product (course to quit smoking) with **2 plans**.
- Primary conversion path goes to `/checkout`.
- Brand spelling standardized to **"No Fumo Más"** (with accent).

## Phases (implementation order)

### Phase 1 — Componentization baseline

- Extract primitives:
  - `Container`
  - `Section`
  - `Button`
  - `Card`
- Extract top-of-funnel components:
  - `NavBar`
  - `HeroSplit` — single CTA → `/checkout` (plan selected at checkout)
  - `HeroStats` — 4-stat grid (6 horas, 90%, Hipnosis, Limpio) rendered below hero copy
  - `TechniquesGrid` — 6-card grid (Mindfulness, Hipnosis Desoille, Reestructuración, etc.) with section CTA
- Fix brand name: render "No Fumo Más" (with accent) in NavBar and Footer.

### Phase 2 — Proof + pricing conversion

- Extract:
  - `DifferentialsSection` — "¿Por qué nuestro método funciona?" bullet list + 90% stat callout card
  - `TestimonialsCarousel` — 10 testimonials, scroll-snap, prev/next arrows
  - `PricingPlans` — Standard ($120 USD) and Intensivo Live ($450 USD, featured)
- Ensure **all** CTAs route to `/checkout` with plan query param (`?plan=live` / `?plan=standard`).

### Phase 3 — Authority + objections

- Extract:
  - `ExpertsSection` — 2 expert cards (Gonzalo Descotte, Germán Maravilla) + IMEP attribution
  - `ScienceBaseGrid` — 4-figure grid (Allen Carr, Albert Ellis, Robert Desoille, RCE)
- Create from scratch:
  - `FAQ` — new content (questions and answers TBD); implement with expand/collapse accordion
- Replace placeholder image URLs (lh3.googleusercontent.com) with real assets for expert headshots and science figures.

### Phase 4 — Lead capture + polish

- Extract:
  - `ContactLeadForm` — name, email, country, phone, message; wire to API/CRM
  - `StickyMobileCta` — mobile fixed bottom bar with "COMPRAR AHORA" + WhatsApp icon
  - `FloatingWhatsapp` — desktop fixed bottom-right button with hover tooltip
  - `FooterMinimal` — brand name, copyright, Términos and Privacidad links
- Config:
  - Extract WhatsApp number to `NEXT_PUBLIC_WHATSAPP_NUMBER` env var (currently hardcoded placeholder)
- Design system:
  - Enforce **Montserrat-only** typography across the entire page (remove Plus Jakarta Sans and Manrope).
- Quality:
  - Mobile-first responsive QA.
  - Accessibility pass (keyboard navigation, focus states, contrast).
  - Performance pass (Next/Image for all `<img>` tags, remove CDN Tailwind script, tree-shake Material Symbols).

## Notes / follow-ups

- Add a short clarification near the "9/10 éxito" / "90%" claim indicating the measurement source (internal registry/survey/etc.).
- Consider adding footer links for **Términos** and **Privacidad** (stub pages).
- FAQ content needs to be defined before Phase 3 can be completed.
