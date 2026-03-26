import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  const uid = req.cookies.get("nfm_uid")?.value;

  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await adminDb.collection("users").doc(uid).update({ hasSeenWelcome: true });

  return NextResponse.json({ ok: true });
}
