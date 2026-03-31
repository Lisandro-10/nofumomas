# Design System: No Fumo Mas
**Project ID:** 4255342839577012024

## 1. Visual Theme & Atmosphere
The core design philosophy is "The Breath of Change" – transitioning from heavy, clouded stagnation into an airy, light-filled clarity. The aesthetic is clean, medical-yet-approachable, offering a high-end editorial and modern experience. It is intentionally calm and reassuring, prioritizing trust and reduced anxiety for users attempting to quit smoking. The interface avoids dense complexity, opting instead for generous whitespace, highly localized focal points, and a professional, minimal presence that relies on typography rather than distracting icons or graphical logos.

## 2. Color Palette & Roles
*   **Spark of Life Orange (#FF7A18):** Used exclusively for primary actions, momentum, conversion CTAs, and active highlights. This delivers a necessary pulse of energy against the structural tones.
*   **Authoritative Navy (#1E3A5F):** Provides the professional, trustworthy foundation. Used as the global footer background, primary headline text color, and for structural deep-tones.
*   **Breathable Canvas (#F7F9FC):** The default application surface background. Provides a soft, airy foundation that isn't as glaring as pure white.
*   **Pure Container White (#FFFFFF):** Used for foreground cards and modal containers that sit on top of the Canvas to create semantic depth.
*   **Vitality Green (#2E8B57 / #25D366):** Used sparingly for success states (like "Pago confirmado" checkmarks) and official WhatsApp support actions.

## 3. Typography Rules
*   **Font Family:** **Montserrat** is strictly used throughout the entire application.
*   **Headlines & Titles:** Set in Bold (700) or ExtraBold (800) to act as confident, empathetic statements. Colors should strictly be Authoritative Navy (#1E3A5F).
*   **Body & Subtext:** Set in Regular (400) or Medium (500) for highly legible storytelling and instructional copy. Colors range from Dark Navy to muted grays depending on hierarchy.
*   **Action Text:** Action buttons and primary labels are set to Uppercase with slight letter-spacing to convey decisive action.
*   **Brand Type:** The top navigation bar's logo is strictly plain-text "No Fumo Mas" without any accompanying graphical icons, maintaining a pure typographic brand presence.

## 4. Component Stylings
*   **Primary Buttons:** Fully rounded "pill-shaped" geometry (`border-radius: 9999px`). The background is solid Spark of Life Orange (#FF7A18) with bold, white uppercase text. They do not rely on heavy drop shadows.
*   **Secondary/Disabled Buttons:** Rendered as "ghost" buttons or using flat muted grays with reduced opacity. Crucial for contrasting against active primary buttons (e.g., in flow steps or video players).
*   **Cards & Containers:** Utilizes soft, highly rounded corners (e.g., 2rem or 32px). They use Pure Container White (#FFFFFF) and sit on the off-white Canvas background. Boundaries are defined by subtle, whisper-soft diffused shadows rather than harsh 1px solid lines.
*   **Input Fields:** Rendered as pill-shaped or softly rounded rectangles with light gray fills (`surface-container-high` or similar). They omit hard, dark borders in favor of a clean, seamless look that blends into the card background.
*   **Unified Footer:** A block-level structural element present across all screens. It utilizes a solid Authoritative Navy (#1E3A5F) background with minimal white text, strictly declaring "© 2026 No Fumo Mas. Todos los derechos reservados." with no graphic assets.

## 5. Layout Principles
*   **Mobile-First Adaptability:** Interfaces prioritize centered, single-column card layouts on mobile that elegantly expand horizontally (like two-column checkout views) or remain as centered modals strictly on desktop.
*   **Whitespace over Lines:** Vertical spacing and structural whitespace separate content instead of drawing explicitly visible 1px divider lines.
*   **Tonal Nesting:** The hierarchy is communicated by resting bright white elements on the airy `#F7F9FC` background. 
*   **Calm Interactivity:** Even error or exception states (like "Session Displaced" or "Link Expired") avoid alarming reds or aggressive visual cues, favoring informative blue/gray callout boxes and neutral warning icons to keep the user's anxiety low.
