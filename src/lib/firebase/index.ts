// Firebase SDK (client-side)
export { app, auth, db } from "./client";

// Repositorio base genérico
export { FirestoreRepository } from "./repository";
export type { BaseEntity } from "./repository";

// Repositorios de colecciones
export { userRepository } from "./repositories/users.repository";
export type { UserEntity } from "./repositories/users.repository";

export { sessionRepository } from "./repositories/sessions.repository";
export type { SessionEntity, SessionStatus } from "./repositories/sessions.repository";

// Auth
export { AuthProvider, useAuth } from "./auth.context";
export { signIn, signOut, signUp } from "./auth.service";
