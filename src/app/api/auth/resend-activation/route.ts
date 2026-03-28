import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { sendActivationEmail } from "@/lib/email/brevo.service";
import { signActivationToken } from "@/lib/email/activation-token";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ ok: true });
  }

  try {
    // Buscar la compra más reciente en estado "paid" para este email
    const snap = await adminDb
      .collection("purchases")
      .where("email", "==", email.trim())
      .get();

    const paidPurchase = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as { id: string; status: string; email: string }))
      .find((p) => p.status === "paid");

    if (paidPurchase) {
      const token = await signActivationToken(paidPurchase.id, email.trim());
      const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/activate?token=${token}`;
      await sendActivationEmail({ to: email.trim(), activationUrl });
    }
  } catch {
    // No revelar errores
  }

  return NextResponse.json({ ok: true });
}
