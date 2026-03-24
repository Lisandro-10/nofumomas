import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  type Firestore,
  type DocumentData,
  type QueryConstraint,
  type WithFieldValue,
  type UpdateData,
} from "firebase/firestore";

export interface BaseEntity {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class FirestoreRepository<T extends BaseEntity & DocumentData> {
  protected readonly collectionName: string;
  protected readonly db: Firestore;

  constructor(db: Firestore, collectionName: string) {
    this.db = db;
    this.collectionName = collectionName;
  }

  // ──────────────── Helpers ─────────────────────────────────────────────────

  protected get collectionRef() {
    return collection(this.db, this.collectionName);
  }

  protected docRef(id: string) {
    return doc(this.db, this.collectionName, id);
  }

  private toEntity(id: string, data: DocumentData): T {
    return {
      ...data,
      id,
      createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() ?? data.updatedAt,
    } as T;
  }

  // ──────────────── CRUD ────────────────────────────────────────────────────

  async findById(id: string): Promise<T | null> {
    const snap = await getDoc(this.docRef(id));
    if (!snap.exists()) return null;
    return this.toEntity(snap.id, snap.data());
  }

  async findAll(): Promise<T[]> {
    const snap = await getDocs(this.collectionRef);
    return snap.docs.map((d) => this.toEntity(d.id, d.data()));
  }

  async findWhere(
    field: keyof T & string,
    operator: Parameters<typeof where>[1],
    value: unknown,
    opts?: { orderByField?: keyof T & string; limitTo?: number }
  ): Promise<T[]> {
    const constraints: QueryConstraint[] = [where(field, operator, value)];
    if (opts?.orderByField) constraints.push(orderBy(opts.orderByField));
    if (opts?.limitTo) constraints.push(limit(opts.limitTo));

    const snap = await getDocs(query(this.collectionRef, ...constraints));
    return snap.docs.map((d) => this.toEntity(d.id, d.data()));
  }

  /** Crea un documento con ID autogenerado. Devuelve el id. */
  async create(data: WithFieldValue<Omit<T, "id">>): Promise<string> {
    const now = new Date();
    const ref = await addDoc(this.collectionRef, {
      ...(data as object),
      createdAt: now,
      updatedAt: now,
    });
    return ref.id;
  }

  /** Crea o reemplaza un documento con un ID específico. */
  async set(id: string, data: WithFieldValue<Omit<T, "id">>): Promise<void> {
    const now = new Date();
    await setDoc(this.docRef(id), {
      ...(data as object),
      createdAt: now,
      updatedAt: now,
    });
  }

  async update(id: string, data: UpdateData<T>): Promise<void> {
    await updateDoc(this.docRef(id), {
      ...(data as object),
      updatedAt: new Date(),
    });
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(this.docRef(id));
  }
}
