import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { userRepository } from "@/lib/firebase/repositories/users.repository";

async function postToAuthApi(path: string, body?: object): Promise<Response> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Error ${res.status}`);
  }
  return res;
}

export async function signIn(email: string, password: string): Promise<void> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await credential.user.getIdToken();
  await postToAuthApi("/api/auth/login", { idToken });
}

export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<void> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });
  await userRepository.upsertFromAuth(credential.user.uid, {
    email,
    displayName,
    hasSeenWelcome: false,
    createdAt: new Date(),
  });
  const idToken = await credential.user.getIdToken();
  await postToAuthApi("/api/auth/login", { idToken });
}

export async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const { user } = credential;

  const info = getAdditionalUserInfo(credential);
  if (info?.isNewUser) {
    await userRepository.upsertFromAuth(user.uid, {
      email: user.email ?? "",
      displayName: user.displayName ?? "",
      hasSeenWelcome: false,
      createdAt: new Date(),
    });
  }

  const idToken = await user.getIdToken();
  await postToAuthApi("/api/auth/login", { idToken });
}

export async function signOut(): Promise<void> {
  await postToAuthApi("/api/auth/logout");
  await firebaseSignOut(auth);
}
