import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { UnauthorizedError } from "@/lib/errors";
import { withErrorHandler } from "@/lib/errors/withErrorHandler";

async function handler(req: NextRequest) {
  const uid = req.cookies.get("nfm_uid")?.value;

  if (!uid) {
    throw new UnauthorizedError();
  }

  await adminDb.collection("users").doc(uid).update({ hasSeenWelcome: true });

  return NextResponse.json({ ok: true });
}

export const POST = withErrorHandler(handler);
