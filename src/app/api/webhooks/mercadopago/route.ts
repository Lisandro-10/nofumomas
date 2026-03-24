import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { purchasesRepository } from "@/lib/firebase/repositories/purchases.repository";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // MercadoPago sends { type, data: { id } } for payment notifications
    if (body.type !== "payment") {
      return NextResponse.json({ received: true });
    }

    const paymentId: string = body.data?.id;
    if (!paymentId) {
      return NextResponse.json({ received: true });
    }

    const mpClient = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    });

    const paymentClient = new Payment(mpClient);
    const paymentData = await paymentClient.get({ id: paymentId });

    const purchaseId = paymentData.external_reference;
    if (!purchaseId) {
      console.warn("[webhook/mercadopago] sin external_reference", paymentId);
      return NextResponse.json({ received: true });
    }

    const mpStatus = paymentData.status;
    if (mpStatus === "approved") {
      await purchasesRepository.updateStatus(purchaseId, "paid");
    } else if (mpStatus === "rejected" || mpStatus === "cancelled") {
      await purchasesRepository.updateStatus(purchaseId, "failed");
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook/mercadopago]", err);
    return NextResponse.json({ error: "Error procesando webhook" }, { status: 500 });
  }
}
