import { BrevoClient } from "@getbrevo/brevo";

function getClient(): BrevoClient {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY no está configurado");
  return new BrevoClient({ apiKey });
}

function getSender(): { email: string; name: string } {
  return {
    email: process.env.BREVO_SENDER_EMAIL!,
    name: process.env.BREVO_SENDER_NAME!,
  };
}

export async function sendActivationEmail({
  to,
  activationUrl,
}: {
  to: string;
  activationUrl: string;
}): Promise<void> {
  const templateId = Number(process.env.BREVO_ACTIVATION_TEMPLATE_ID);
  if (!templateId) throw new Error("BREVO_ACTIVATION_TEMPLATE_ID no está configurado");

  console.log("[brevo] enviando activación a", to, "| url:", activationUrl);
  await getClient().transactionalEmails.sendTransacEmail({
    to: [{ email: to }],
    sender: getSender(),
    templateId,
    params: { activationUrl },
  });
  console.log("[brevo] email enviado OK");
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string;
  resetUrl: string;
}): Promise<void> {
  const templateId = Number(process.env.BREVO_RESET_TEMPLATE_ID);
  if (!templateId) throw new Error("BREVO_RESET_TEMPLATE_ID no está configurado");

  await getClient().transactionalEmails.sendTransacEmail({
    to: [{ email: to }],
    sender: getSender(),
    templateId,
    params: { resetUrl },
  });
}

export async function sendAccountDisabledEmail({ to }: { to: string }): Promise<void> {
  const templateId = Number(process.env.BREVO_DISABLED_TEMPLATE_ID);
  if (!templateId) throw new Error("BREVO_DISABLED_TEMPLATE_ID no está configurado");

  await getClient().transactionalEmails.sendTransacEmail({
    to: [{ email: to }],
    sender: getSender(),
    templateId,
  });
}
