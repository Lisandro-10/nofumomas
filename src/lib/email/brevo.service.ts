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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendContactNotification({
  name,
  email,
  country,
  phone,
  message,
}: {
  name: string;
  email: string;
  country: string;
  phone: string;
  message: string;
}): Promise<void> {
  const recipient = process.env.BREVO_CONTACT_RECIPIENT_EMAIL;
  if (!recipient) throw new Error("BREVO_CONTACT_RECIPIENT_EMAIL no está configurado");

  await getClient().transactionalEmails.sendTransacEmail({
    to: [{ email: recipient }],
    sender: getSender(),
    replyTo: { email, name },
    subject: `Nueva consulta de ${escapeHtml(name)} — No Fumo Más`,
    htmlContent: `
      <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>País:</strong> ${escapeHtml(country) || "—"}</p>
      <p><strong>Teléfono:</strong> ${escapeHtml(phone) || "—"}</p>
      <hr/>
      <p><strong>Consulta:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
    `,
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
