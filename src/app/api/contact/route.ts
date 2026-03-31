import { NextRequest, NextResponse } from "next/server";
import { sendContactNotification } from "@/lib/email/brevo.service";
import { ValidationError } from "@/lib/errors";
import { withErrorHandler } from "@/lib/errors/withErrorHandler";

async function handler(req: NextRequest) {
  const { name, email, country, phone, message } = await req.json();

  if (!name || !email || !message) {
    throw new ValidationError("Nombre, email y consulta son requeridos");
  }

  await sendContactNotification({
    name,
    email,
    country: country ?? "",
    phone: phone ?? "",
    message,
  });

  return NextResponse.json({ ok: true });
}

export const POST = withErrorHandler(handler);
