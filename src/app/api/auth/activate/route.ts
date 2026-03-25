import { NextRequest, NextResponse } from "next/server";
import { verifyActivationToken } from "@/lib/email/activation-token";
import { purchasesRepository } from "@/lib/firebase/repositories/purchases.repository";

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
  try {
    ({ purchaseId } = await verifyActivationToken(token));
  } catch {
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

  await purchasesRepository.activate(purchaseId);

  return redirect(req, { activated: "true" });
}
