import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export type PaymentProvider = "stripe" | "mercadopago";
export type PurchaseStatus = "pending" | "paid" | "failed" | "cancelled";

export interface Purchase {
  id?: string;
  email: string;
  provider: PaymentProvider;
  paymentId: string; // Stripe session ID or MercadoPago preference ID
  status: PurchaseStatus;
  amount: number;
  currency: string;
  amountArs?: number;
  exchangeRate?: number;
  createdAt?: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
}

const COL = "purchases";

export const purchasesRepository = {
  async create(data: Omit<Purchase, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const ref = await adminDb.collection(COL).add({
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return ref.id;
  },

  async updateStatus(id: string, status: PurchaseStatus): Promise<void> {
    await adminDb.collection(COL).doc(id).update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
    });
  },

  async findByPaymentId(paymentId: string): Promise<Purchase | null> {
    const snap = await adminDb
      .collection(COL)
      .where("paymentId", "==", paymentId)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() } as Purchase;
  },

  async findByExternalRef(externalRef: string): Promise<Purchase | null> {
    const snap = await adminDb
      .collection(COL)
      .where("externalRef", "==", externalRef)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() } as Purchase;
  },
};
