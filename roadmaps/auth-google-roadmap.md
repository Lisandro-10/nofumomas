# Google Auth — Roadmap de Implementación

Stack: Firebase 12.x · Next.js 14 App Router · TypeScript

---

## Arquitectura Actual (Contexto)

El flujo actual funciona así:

```
[Client Component]
  Email + Password
    ↓
auth.service.ts → signInWithEmailAndPassword()
    ↓ idToken
POST /api/auth/login  (Firebase Admin verifica)
    ↓
Set-Cookie: nfm_session + nfm_uid (HttpOnly)
    ↓
Redirect → /dashboard
```

Para Google, el flujo es **idéntico a partir del idToken**.
La única diferencia: origen del token (popup OAuth) y registro automático en Firestore si es usuario nuevo.

---

## Fase 1 — auth.service.ts

Agregar la función `signInWithGoogle`:

```ts
// Merge with the existing firebase/auth import in auth.service.ts — do not add a second import line.
// Add GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo to the existing import.

export async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const { user } = credential;

  // Registrar en Firestore solo si es la primera vez
  const info = getAdditionalUserInfo(credential);
  if (info?.isNewUser) {
    await userRepository.upsertFromAuth(user.uid, {
      email: user.email ?? "",
      displayName: user.displayName ?? "",
      hasSeenWelcome: false,
      createdAt: new Date(),
    });
  }

  // Reutilizar el circuito de sesión existente (no hay cambios en el backend)
  const idToken = await user.getIdToken();
  await postToAuthApi("/api/auth/login", { idToken });
}
```

> `postToAuthApi` ya existe en el archivo. No hay cambios en el backend.

---

## Fase 2 — auth.context.tsx

1. Agregar `signInWithGoogle: () => Promise<void>` al tipo `AuthContextType`.
2. Proveer la función en el `AuthProvider` y agregarla al `value` del contexto.

---

## Fase 3 — Componente GoogleSignInButton

Archivo nuevo: `src/app/(auth)/login/_components/GoogleSignInButton.tsx`

Estructura:

```tsx
"use client";
import { useState } from "react";
import { useAuth } from "@/lib/firebase/auth.context";
import { useRouter } from "next/navigation";

export function GoogleSignInButton() {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err: unknown) {
      // Silently ignore popup closed by user — not an error
      if ((err as { code?: string }).code === "auth/popup-closed-by-user") return;
      setError(err instanceof Error ? err.message : "Error al iniciar sesión con Google");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex items-center justify-center gap-3 w-full border border-navy/20 rounded-lg py-2.5 text-sm font-medium text-navy hover:bg-navy/5 transition-colors disabled:opacity-60"
      >
        <GoogleIcon />
        {loading ? "Conectando..." : "Continuar con Google"}
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
```

El SVG del logo de Google (4 paths oficiales de colores #4285F4, #34A853, #FBBC05, #EA4335) va en un componente `<GoogleIcon />` separado dentro del mismo archivo.

---

## Fase 4 — login/page.tsx

Después del `</form>`, agregar:

```tsx
{/* Divisor */}
<div className="flex items-center gap-3">
  <hr className="flex-1 border-navy/20" />
  <span className="text-xs text-navy/40 font-medium uppercase tracking-wider">o</span>
  <hr className="flex-1 border-navy/20" />
</div>

{/* Botón de Google */}
<GoogleSignInButton />
```

---

## Checklist de Verificación Manual

- [ ] El botón "Continuar con Google" aparece en /login
- [ ] Al hacer click, se abre el popup de Google
- [ ] Tras autenticarse: redirect a /dashboard
- [ ] DevTools → Application → Cookies: existen nfm_session y nfm_uid
- [ ] Firestore → colección users: existe el documento del UID de Google
- [ ] Segunda sesión con la misma cuenta: no falla (upsertFromAuth es idempotente)
- [ ] Cerrar popup sin autenticarse: no produce error no manejado

---

## Notas

- No hay cambios en el backend. /api/auth/login ya acepta cualquier idToken de Firebase.
- upsertFromAuth ya es idempotente: hace findByUid → update si existe, set si no existe. No requiere merge: true.
- GoogleAuthProvider soporta addScope() si en el futuro se necesitan permisos adicionales.
