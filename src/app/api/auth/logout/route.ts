import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  const uid = req.cookies.get("nfm_uid")?.value;

  if (uid) {
    await adminDb.collection("sessions").doc(uid).delete().catch(() => {});
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete("nfm_session");
  res.cookies.delete("nfm_uid");

  return res;
}
