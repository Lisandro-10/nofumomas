import { NextRequest, NextResponse } from "next/server";
import { decodeJwt } from "jose";
import { verifyActivationToken } from "@/lib/email/activation-token";
import { purchasesRepository } from "@/lib/firebase/repositories/purchases.repository";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

function redirect(req: NextRequest, params: Record<string, string>) {
  const url = new URL("/", req.url);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return redirect(req, { error: "token-missing" });
  }

  let purchaseId: string;
  let email: string;
  try {
    ({ purchaseId, email } = await verifyActivationToken(token));
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "ERR_JWT_EXPIRED") {
      const payload = decodeJwt(token);
      const expiredEmail = typeof payload.email === "string" ? payload.email : "";
      const dest = new URL("/set-password", req.url);
      dest.searchParams.set("expired", "true");
      dest.searchParams.set("email", expiredEmail);
      dest.searchParams.set("mode", "activation");
      return NextResponse.redirect(dest.toString());
    }
    return redirect(req, { error: "invalid-token" });
  }

  const purchase = await purchasesRepository.findById(purchaseId);

  if (!purchase) {
    return redirect(req, { error: "invalid-token" });
  }

  if (purchase.status === "activated") {
    return redirect(req, { info: "already-activated" });
  }

  if (purchase.status !== "paid") {
    return redirect(req, { error: "purchase-not-paid" });
  }

  // Obtener o crear usuario en Firebase Auth
  let uid: string;
  let isNewUser = false;
  try {
    const existing = await adminAuth.getUserByEmail(email);
    uid = existing.uid;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code !== "auth/user-not-found") {
      console.error("[activate] Error inesperado al buscar usuario:", err);
      return redirect(req, { error: "auth-error" });
    }
    try {
      const newUser = await adminAuth.createUser({ email });
      uid = newUser.uid;
      isNewUser = true;
    } catch (createErr) {
      console.error("[activate] Error al crear usuario Firebase:", createErr);
      return redirect(req, { error: "auth-error" });
    }
  }

  // Crear perfil en Firestore si no existe
  const userRef = adminDb.collection("users").doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    await userRef.set({
      uid,
      email,
      hasSeenWelcome: false,
      createdAt: new Date(),
    });
  }

  // Activar la compra
  await purchasesRepository.activate(purchaseId, uid);

  // Usuario existente: redirigir al set-password con modo login
  if (!isNewUser) {
    const dest = new URL("/set-password", req.url);
    dest.searchParams.set("email", email);
    dest.searchParams.set("mode", "activation");
    dest.searchParams.set("firstTime", "false");
    return NextResponse.redirect(dest.toString());
  }

  // Usuario nuevo: generar oobCode y redirigir a página propia de seteo de contraseña
  const firebaseLink = await adminAuth.generatePasswordResetLink(email);
  const oobCode = new URL(firebaseLink).searchParams.get("oobCode") ?? "";
  const dest = new URL("/set-password", req.url);
  dest.searchParams.set("oobCode", oobCode);
  dest.searchParams.set("email", email);
  dest.searchParams.set("mode", "activation");
  return NextResponse.redirect(dest.toString());
}
