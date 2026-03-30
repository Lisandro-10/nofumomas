export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly isOperational = true,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "No autorizado") {
    super(message, 401);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "No encontrado") {
    super(message, 404);
  }
}

// Maps Firebase client-side Auth error codes to user-friendly Spanish messages.
// Use this on the frontend to avoid showing raw Firebase error strings to users.
const FIREBASE_AUTH_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "El email o la contraseña son incorrectos.",
  "auth/user-not-found": "El email o la contraseña son incorrectos.",
  "auth/wrong-password": "El email o la contraseña son incorrectos.",
  "auth/user-disabled": "Tu cuenta fue deshabilitada. Contactá al soporte.",
  "auth/too-many-requests": "Demasiados intentos fallidos. Intentá de nuevo más tarde.",
  "auth/network-request-failed": "Error de red. Verificá tu conexión e intentá de nuevo.",
  "auth/invalid-email": "El formato del email no es válido.",
  "auth/popup-blocked": "El navegador bloqueó la ventana emergente. Permitila e intentá de nuevo.",
  "auth/cancelled-popup-request": "Se canceló el inicio de sesión.",
};

export function getFirebaseAuthMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  return FIREBASE_AUTH_MESSAGES[code] ?? "Ocurrió un error al iniciar sesión. Intentá de nuevo.";
}

// Maps Firebase Auth error codes to HTTP status codes.
// Routes currently duplicate this logic with manual `if (error.code === ...)` checks.
const FIREBASE_ERROR_STATUS: Record<string, number> = {
  "auth/user-not-found": 404,
  "auth/email-already-exists": 409,
  "auth/invalid-email": 400,
  "auth/weak-password": 400,
  "auth/user-disabled": 403,
  "auth/id-token-expired": 401,
  "auth/argument-error": 400,
};

export function mapFirebaseError(err: unknown): AppError {
  const code = (err as { code?: string })?.code ?? "";
  const message = (err as { message?: string })?.message ?? "Firebase error";
  const statusCode = FIREBASE_ERROR_STATUS[code] ?? 500;
  return new AppError(message, statusCode);
}
