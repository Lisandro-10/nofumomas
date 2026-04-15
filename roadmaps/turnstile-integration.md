# Roadmap: Integración de Cloudflare Turnstile

Este documento detalla la ruta de ejecución para implementar Cloudflare Turnstile en el proceso de pago ("Checkout") del proyecto No Fumo Más. Se ha elegido el uso de la librería `@marsidev/react-turnstile` para la integración frontend en Next.js App Router (State of the Art 2026).

## Tareas Preparatorias
- [ ] Añadir `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY` a `.env.local.example`
- [ ] Proveer e inyectar ambas variables en `.env.local` (usar test keys oficiales de CF en dev: site key `1x00000000000000000000AA`, secret key `1x0000000000000000000000000000000AA`)
- [ ] Ejecutar instalación de dependencia: `npm install @marsidev/react-turnstile`

## Frontend — `src/app/checkout/_components/CheckoutForm.tsx`
- [ ] Importar `Turnstile` desde `@marsidev/react-turnstile`
- [ ] Añadir estado `turnstileToken: string | null` inicializado en `null`
- [ ] Insertar `<Turnstile siteKey={...} onSuccess={setTurnstileToken} onExpire={() => setTurnstileToken(null)} onError={() => setTurnstileToken(null)} />` antes del botón de submit (`onExpire` y `onError` deben resetear a `null` para que el botón vuelva a deshabilitarse)
- [ ] Deshabilitar el botón cuando `!turnstileToken || loading`
- [ ] Añadir `turnstileToken` al payload del POST junto a `email`, `paymentProvider`, `plan`

## Backend — `src/app/api/checkout/route.ts`
- [ ] Desestructurar `turnstileToken` del body junto a los campos existentes
- [ ] En el bloque de validación (mismo patrón que `email`/`paymentProvider`): lanzar `new ValidationError(...)` si `!turnstileToken`
- [ ] Tras validación y **antes** del chequeo de email existente: POST a `https://challenges.cloudflare.com/turnstile/v0/siteverify` con `secret=TURNSTILE_SECRET_KEY` y `response=turnstileToken`
- [ ] Si `cfData.success` es falso: lanzar `new ValidationError("Turnstile verification failed")` → 400
- [ ] Las ramas de MercadoPago y Stripe no se modifican

## Tests — `src/__tests__/checkout.route.test.ts`
- [ ] Actualizar el mock de `global.fetch` para despachar por URL: `challenges.cloudflare.com` → `{ success: true }`, `dolarapi.com` → comportamiento actual (ambas coexisten)
- [ ] Añadir `turnstileToken: "valid-token"` por defecto en `makeRequest()` para que todos los tests existentes sigan pasando sin cambios individuales
- [ ] Nuevo test: `turnstileToken` ausente → 400, title coincide con /turnstile/i
- [ ] Nuevo test: Cloudflare devuelve `{ success: false }` → 400, title coincide con /turnstile/i
- [ ] Nuevo test: fetch a Cloudflare falla en red → 500

## Verificación (QA)
- [ ] `npm test` — todos los tests existentes y nuevos pasan sin regresiones
- [ ] `npm run dev` → ir a `/checkout` — widget de Turnstile renderiza correctamente antes del botón
- [ ] Submit con widget completado — redirige al proveedor de pago normalmente (Stripe y MercadoPago)
- [ ] Probar expiración del widget — el botón vuelve a deshabilitarse (estado se resetea a `null`)
- [ ] Probar submit sin completar el widget — botón deshabilitado, no se puede enviar
