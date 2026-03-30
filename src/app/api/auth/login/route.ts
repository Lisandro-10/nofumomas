import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { ValidationError, UnauthorizedError } from "@/lib/errors";
import { withErrorHandler } from "@/lib/errors/withErrorHandler";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 días
};

async function handler(req: NextRequest) {
  const { idToken } = await req.json();

  if (!idToken) {
    throw new ValidationError("idToken requerido");
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    throw new UnauthorizedError("Token inválido");
  }

  const sessionToken = crypto.randomUUID();

  await adminDb.collection("sessions").doc(uid).set({
    userId: uid,
    sessionToken,
    lastActive: new Date(),
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("nfm_session", sessionToken, COOKIE_OPTIONS);
  res.cookies.set("nfm_uid", uid, COOKIE_OPTIONS);

  return res;
}

export const POST = withErrorHandler(handler);
