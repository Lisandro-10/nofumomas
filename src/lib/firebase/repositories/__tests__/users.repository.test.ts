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

import { getDocs, setDoc, updateDoc } from "firebase/firestore";
import { userRepository } from "../users.repository";

function makeQuerySnap(docs: Array<{ id: string; data: Record<string, unknown> }>) {
  return {
    docs: docs.map((d) => ({ id: d.id, data: () => d.data })),
  };
}

describe("UserRepository", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("findByUid", () => {
    it("returns null when user does not exist", async () => {
      (getDocs as jest.Mock).mockResolvedValue(makeQuerySnap([]));

      const result = await userRepository.findByUid("uid-123");

      expect(result).toBeNull();
    });

    it("returns the user when it exists", async () => {
      (getDocs as jest.Mock).mockResolvedValue(
        makeQuerySnap([
          {
            id: "uid-123",
            data: {
              uid: "uid-123",
              email: "test@test.com",
              hasSeenWelcome: false,
              createdAt: { toDate: () => new Date() },
            },
          },
        ])
      );

      const result = await userRepository.findByUid("uid-123");

      expect(result?.email).toBe("test@test.com");
      expect(result?.uid).toBe("uid-123");
    });
  });

  describe("upsertFromAuth", () => {
    it("creates a new document when uid is new", async () => {
      (getDocs as jest.Mock).mockResolvedValue(makeQuerySnap([]));
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      await userRepository.upsertFromAuth("new-uid", {
        email: "new@test.com",
        hasSeenWelcome: false,
        createdAt: new Date(),
      });

      expect(setDoc).toHaveBeenCalledTimes(1);
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it("updates the existing document and does not duplicate when uid already exists", async () => {
      (getDocs as jest.Mock).mockResolvedValue(
        makeQuerySnap([
          {
            id: "existing-uid",
            data: { uid: "existing-uid", email: "old@test.com", hasSeenWelcome: false },
          },
        ])
      );
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await userRepository.upsertFromAuth("existing-uid", { email: "updated@test.com" });

      expect(updateDoc).toHaveBeenCalledTimes(1);
      expect(setDoc).not.toHaveBeenCalled();
    });
  });
});
