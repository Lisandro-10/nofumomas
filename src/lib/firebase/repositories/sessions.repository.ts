import type { DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { FirestoreRepository, type BaseEntity } from "@/lib/firebase/repository";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type SessionStatus = "active" | "completed" | "abandoned";

export interface SessionEntity extends BaseEntity, DocumentData {
  /** uid del usuario propietario */
  userId: string;
  sessionToken: string;
  lastActive: Date;
}

// ─── Repositorio ──────────────────────────────────────────────────────────────

class SessionRepository extends FirestoreRepository<SessionEntity> {
  constructor() {
    super(db, "sessions");
  }

  /** Todas las sesiones de un usuario ordenadas por fecha de inicio. */
  async findByUser(userId: string): Promise<SessionEntity[]> {
    return this.findWhere("userId", "==", userId, {
      orderByField: "startedAt",
    });
  }

  /** Sesión activa actual del usuario (si existe). */
  async findActiveByUser(userId: string): Promise<SessionEntity | null> {
    const results = await this.findWhere("userId", "==", userId);
    const active = results.find((s) => s.status === "active");
    return active ?? null;
  }
}

export const sessionRepository = new SessionRepository();
