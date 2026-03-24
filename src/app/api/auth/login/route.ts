import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 días
};

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "idToken requerido" }, { status: 400 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

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
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}
