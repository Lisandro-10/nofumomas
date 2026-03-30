# Roadmap: Error Handling Strategy (2026)

This document outlines the phased rollout of the new error handling strategy for the **No fumo más** MVP.
The strategy is designed to be middle-ground: relying on robust local logging and an incremental integration over time, avoiding the complexity of full external observability platforms (e.g., Sentry) at this initial stage.

## Phase 1: Foundation (Current)

The goal of this phase is to establish the core utilities without breaking the existing application flow.

- [ ] **1.1. Create Shared Error Primitives** (`src/lib/errors/index.ts`)
  - Define a generic `AppError` class that extends the standard JS `Error` but includes HTTP status codes and operational flags.
  - Define custom sub-errors: `ValidationError` (400), `UnauthorizedError` (401), and `NotFoundError` (404).
  - Define a `FirebaseAuthError` sub-error (or `mapFirebaseError` utility) to normalize Firebase-specific error codes (e.g. `auth/user-not-found`, `auth/email-already-exists`) into `AppError` instances. This eliminates duplicated `if (error.code === ...)` checks across multiple routes.
- [ ] **1.2. Implement API Error Wrapper** (`src/lib/errors/withErrorHandler.ts`)
  - Create a generic `withErrorHandler` HOC (Higher-Order Component) for Next.js Route Handlers.
  - The wrapper will catch any `AppError` and return standard structured JSON (RFC 9457 style).
  - Unhandled errors (e.g., standard `Error` or variable crashes) will output an organized `console.error` locally and return a generic 500 error payload, preventing stack trace leaks.
  - **Important:** `forgot-password` and `resend-activation` must **not** use this wrapper. These routes intentionally return `{ ok: true }` on all outcomes for security reasons (obscuring whether an account exists). Do not override this behavior.
- [ ] **1.3. UI Resilience Boundaries:**
  - Create `src/app/error.tsx` to handle segment-level crashes visually gracefully.
  - Create `src/app/global-error.tsx` to catch fatal layout-level errors.

## Phase 2: Incremental API Refactoring

Instead of a big-bang rewrite of all endpoints, we will migrate routes selectively, in the order below.

- [ ] **2.1. Checkout (Start here):**
  - Apply `withErrorHandler` to `src/app/api/checkout/route.ts` first — it already uses good status codes (400/409/500) and is the most straightforward adoption.
- [ ] **2.2. Authentication Routes:**
  - Refactor `src/app/api/auth/login/route.ts` — simple, good second migration.
  - Refactor `src/app/api/auth/activate/route.ts` — most complex; it uses redirect-with-error-code params (`?error=token-missing`, etc.) rather than JSON responses. **Do not replace this pattern with JSON errors** — preserve the redirect behavior within the wrapper.
  - Add `withErrorHandler` to `src/app/api/auth/logout/route.ts` — currently has no wrapper; keep session delete failure non-fatal.
  - Add `withErrorHandler` to `src/app/api/user/seen-welcome/route.ts` — currently has zero error handling (unguarded Firestore write).
- [ ] **2.3. Webhook & Checkout:**
  - Apply the wrapper to `src/app/api/webhooks/stripe/route.ts`. **Note:** the current try-catch only covers signature verification — the wrapper must cover the entire handler, including the event processing logic.
  - Apply to `src/app/api/webhooks/mercadopago/route.ts`. The inner silent failure in the refund status flow is intentional — preserve it and add a comment explaining why rather than removing it.
- [ ] **2.4. Server Actions:**
  - Ongoing transition of new Next.js Server Actions over to return robust discriminated unions (Result pattern) for the frontend to consume.

## Phase 3: Future Upgrades (Post-MVP)

As the project scales into a broader test audience, we may iterate based on debugging needs.

- [ ] **3.1. External Observability:**
  - If local Vercel logs prove insufficient, integrate a lightweight aggregator (like Axiom or Highlight) or Sentry to track unhandled bugs on both API and user sessions.
- [ ] **3.2. Form Integrations:**
  - Bind the `AppError` types closely with the frontend forms (React Hook Form / Zod) to provide instant user feedback mapped explicitly from backend failures.
