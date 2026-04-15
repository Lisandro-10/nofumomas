# Roadmap: Validación de Email en Checkout (Estrategia 1)

**Objetivo:** Evitar que los usuarios ya registrados realicen el flujo de checkout redundante, bloqueándolos previo a la generación del cargo y derivándolos al flujo de Login.

## Fase 1: Backend - Validación Server-Side
**Archivo:** `src/app/api/checkout/route.ts`

- [ ] Importar `adminAuth` desde `@/lib/firebase/admin`.
- [ ] Antes de la creación del documento `purchase` (Stripe/MP), ejecutar `adminAuth.getUserByEmail(email)`.
- [ ] Manejar la excepción `auth/user-not-found` (ruta feliz: el usuario no existe, se procede al pago).
- [ ] Si el usuario existe, retornar un `NextResponse` con estado `409 Conflict`, devolviendo:
  ```json
  {
    "error": "El email ya está registrado. Por favor, iniciá sesión.",
    "code": "email_exists"
  }
  ```

## Fase 2: Frontend - Feedback UI en el Formulario
**Archivo:** `src/app/checkout/_components/CheckoutForm.tsx`

- [ ] Modificar la lógica de `handleSubmit` para atrapar códigos de error específicos.
- [ ] Si `data.code === 'email_exists'`, establecer un estado de error particular.
- [ ] Modificar el renderizado actual del error debajo del formulario:
  - En lugar de texto plano rojo, mostrar un banner o bloque destacado notificando que ya tiene cuenta.
  - Incluir un botón o un `<Link>` redirigiendo al usuario a `/login` (y si es posible, pasando `?email={email}` para facilitarle el acceso).

## Fase 3: Pruebas Globales
- [ ] Testear un correo falso/inexistente -> Debería avanzar normalmente al checkout de Stripe/MP.
- [ ] Testear un correo de prueba previamente registrado -> Debería bloquear inmediatamente con link al login, **sin** crear compras en "pending".
- [ ] Levantar el servidor local y confirmar por logs que no crashea si Firebase devuelve un error inesperado (ej. red caída).
