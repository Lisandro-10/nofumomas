import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";

/**
 * Validates the session cookies against the Firestore sessions/{uid} document.
 * - If cookies are missing → redirects to /login
 * - If token doesn't match (session displaced) → redirects to /session-displaced
 * - Returns uid on success.
 *
 * Call this at the top of any protected Server Component or Route Handler.
 */
export async function validateSession(): Promise<string> {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("nfm_session")?.value;
  const uid = cookieStore.get("nfm_uid")?.value;

  if (!sessionToken || !uid) {
    redirect("/login");
  }

  const doc = await adminDb.collection("sessions").doc(uid).get();

  if (!doc.exists || doc.data()?.sessionToken !== sessionToken) {
    redirect("/session-displaced");
  }

  return uid;
}
