import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { sendPasswordResetEmail } from "@/lib/email/brevo.service";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  // Siempre responder 200 para no revelar si el email existe
  if (!email || typeof email !== "string") {
    return NextResponse.json({ ok: true });
  }

  try {
    const firebaseLink = await adminAuth.generatePasswordResetLink(email.trim());
    const oobCode = new URL(firebaseLink).searchParams.get("oobCode") ?? "";

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/set-password?oobCode=${oobCode}&email=${encodeURIComponent(email.trim())}`;
    await sendPasswordResetEmail({ to: email.trim(), resetUrl });
  } catch {
    // auth/user-not-found u otro error: no hacer nada, responder 200 igual
  }

  return NextResponse.json({ ok: true });
}
