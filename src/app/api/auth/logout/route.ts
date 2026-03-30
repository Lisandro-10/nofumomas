import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { withErrorHandler } from "@/lib/errors/withErrorHandler";

async function handler(req: NextRequest) {
  const uid = req.cookies.get("nfm_uid")?.value;

  if (uid) {
    // Session delete failure is non-fatal — cookies are cleared regardless
    await adminDb.collection("sessions").doc(uid).delete().catch(() => {});
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete("nfm_session");
  res.cookies.delete("nfm_uid");

  return res;
}

export const POST = withErrorHandler(handler);
