import type { DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { FirestoreRepository, type BaseEntity } from "@/lib/firebase/repository";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface UserEntity extends BaseEntity, DocumentData {
  /** uid de Firebase Auth */
  uid: string;
  email: string;
  displayName?: string | null;
  hasSeenWelcome: boolean;
  createdAt: Date;
}

// ─── Repositorio ──────────────────────────────────────────────────────────────

class UserRepository extends FirestoreRepository<UserEntity> {
  constructor() {
    super(db, "users");
  }

  /** Busca por uid de Firebase Auth (distinto del doc ID). */
  async findByUid(uid: string): Promise<UserEntity | null> {
    const results = await this.findWhere("uid", "==", uid, { limitTo: 1 });
    return results[0] ?? null;
  }

  /** Crea o actualiza el perfil del usuario tras el login. */
  async upsertFromAuth(uid: string, data: Partial<UserEntity>): Promise<void> {
    const existing = await this.findByUid(uid);
    if (existing?.id) {
      await this.update(existing.id, data);
    } else {
      await this.set(uid, { uid, ...data } as Omit<UserEntity, "id">);
    }
  }
}

export const userRepository = new UserRepository();
