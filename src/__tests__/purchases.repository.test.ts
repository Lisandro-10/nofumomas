import { purchasesRepository } from "@/lib/firebase/repositories/purchases.repository";
import { adminDb } from "@/lib/firebase/admin";

jest.mock("@/lib/firebase/admin", () => ({
  adminDb: {
    collection: jest.fn(),
  },
}));

jest.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    serverTimestamp: jest.fn().mockReturnValue("__serverTimestamp__"),
  },
}));

// ── Shared mock chain ──────────────────────────────────────────────────────────

const mockAdd = jest.fn();
const mockDocUpdate = jest.fn();
const mockGet = jest.fn();
const mockLimit = jest.fn();
const mockWhere = jest.fn();
const mockDoc = jest.fn();

const mockColRef = {
  add: mockAdd,
  doc: mockDoc,
  where: mockWhere,
};

function setupColRef() {
  (adminDb.collection as jest.Mock).mockReturnValue(mockColRef);
  mockDoc.mockReturnValue({ update: mockDocUpdate });
  mockWhere.mockReturnValue({ limit: mockLimit });
  mockLimit.mockReturnValue({ get: mockGet });
}

const BASE_DATA = {
  email: "user@test.com",
  provider: "stripe" as const,
  paymentId: "cs_test_123",
  status: "pending" as const,
  amount: 120,
  currency: "USD",
};

// ──────────────────────────────────────────────────────────────────────────────

describe("purchasesRepository.create", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupColRef();
  });

  it("calls adminDb.collection('purchases').add() with the provided data plus timestamps", async () => {
    mockAdd.mockResolvedValue({ id: "generated-id" });

    await purchasesRepository.create(BASE_DATA);

    expect(adminDb.collection).toHaveBeenCalledWith("purchases");
    expect(mockAdd).toHaveBeenCalledWith({
      ...BASE_DATA,
      createdAt: "__serverTimestamp__",
      updatedAt: "__serverTimestamp__",
    });
  });

  it("returns the Firestore-generated document id", async () => {
    mockAdd.mockResolvedValue({ id: "abc123" });

    const id = await purchasesRepository.create(BASE_DATA);

    expect(id).toBe("abc123");
  });
});

describe("purchasesRepository.updateStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupColRef();
    mockDocUpdate.mockResolvedValue(undefined);
  });

  it("calls doc(id).update() with the new status and updatedAt timestamp", async () => {
    await purchasesRepository.updateStatus("doc-id", "paid");

    expect(mockDoc).toHaveBeenCalledWith("doc-id");
    expect(mockDocUpdate).toHaveBeenCalledWith({
      status: "paid",
      updatedAt: "__serverTimestamp__",
    });
  });
});

describe("purchasesRepository.findByPaymentId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupColRef();
  });

  it("returns null when no document matches", async () => {
    mockGet.mockResolvedValue({ empty: true, docs: [] });

    const result = await purchasesRepository.findByPaymentId("cs_unknown");

    expect(result).toBeNull();
  });

  it("returns the purchase with id when a document is found", async () => {
    mockGet.mockResolvedValue({
      empty: false,
      docs: [{ id: "doc-1", data: () => ({ ...BASE_DATA }) }],
    });

    const result = await purchasesRepository.findByPaymentId("cs_test_123");

    expect(result).toEqual({ id: "doc-1", ...BASE_DATA });
  });

  it("queries the 'paymentId' field with the provided value", async () => {
    mockGet.mockResolvedValue({ empty: true, docs: [] });

    await purchasesRepository.findByPaymentId("cs_test_xyz");

    expect(mockWhere).toHaveBeenCalledWith("paymentId", "==", "cs_test_xyz");
  });
});
