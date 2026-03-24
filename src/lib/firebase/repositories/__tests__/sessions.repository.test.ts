jest.mock("@/lib/firebase/client", () => ({ db: {} }));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => "collectionRef"),
  doc: jest.fn(() => "docRef"),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn((...args: unknown[]) => args),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
}));

import { getDocs, setDoc, doc } from "firebase/firestore";
import { sessionRepository } from "../sessions.repository";

function makeQuerySnap(docs: Array<{ id: string; data: Record<string, unknown> }>) {
  return {
    docs: docs.map((d) => ({ id: d.id, data: () => d.data })),
  };
}

describe("SessionRepository", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("findActiveByUser", () => {
    it("returns null when user has no sessions", async () => {
      (getDocs as jest.Mock).mockResolvedValue(makeQuerySnap([]));

      const result = await sessionRepository.findActiveByUser("uid-123");

      expect(result).toBeNull();
    });

    it("returns the active session", async () => {
      (getDocs as jest.Mock).mockResolvedValue(
        makeQuerySnap([
          {
            id: "session-1",
            data: {
              userId: "uid-123",
              sessionToken: "token-abc",
              status: "active",
              lastActive: { toDate: () => new Date() },
            },
          },
        ])
      );

      const result = await sessionRepository.findActiveByUser("uid-123");

      expect(result?.sessionToken).toBe("token-abc");
    });
  });

  describe("single session enforcement", () => {
    it("overwrites the previous session when called twice with the same uid", async () => {
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      await sessionRepository.set("uid-123", {
        userId: "uid-123",
        sessionToken: "token-1",
        lastActive: new Date(),
      });
      await sessionRepository.set("uid-123", {
        userId: "uid-123",
        sessionToken: "token-2",
        lastActive: new Date(),
      });

      expect(setDoc).toHaveBeenCalledTimes(2);
      // Both calls target the same document ID (uid-123)
      const calls = (doc as jest.Mock).mock.calls.filter((c) => c[2] === "uid-123");
      expect(calls).toHaveLength(2);
    });
  });
});
