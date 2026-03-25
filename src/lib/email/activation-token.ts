import { SignJWT, jwtVerify } from "jose";

const TOKEN_TYPE = "account-activation";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_ACTIVATION_SECRET;
  if (!secret) throw new Error("JWT_ACTIVATION_SECRET no está configurado");
  return new TextEncoder().encode(secret);
}

export async function signActivationToken(
  purchaseId: string,
  email: string
): Promise<string> {
  return new SignJWT({ purchaseId, email, type: TOKEN_TYPE })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("48h")
    .sign(getSecret());
}

export async function verifyActivationToken(
  token: string
): Promise<{ purchaseId: string; email: string }> {
  const { payload } = await jwtVerify(token, getSecret());

  if (payload.type !== TOKEN_TYPE) {
    throw new Error("Tipo de token inválido");
  }

  return {
    purchaseId: payload.purchaseId as string,
    email: payload.email as string,
  };
}
