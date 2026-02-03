import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runCommand } from "citty";

vi.mock("@certman/sdk", () => ({
  createCertmanClient: vi.fn(() => ({
    cas: {
      get: vi.fn(),
    },
  })),
}));

vi.mock("../../../../src/config.js", () => ({
  getApiKey: vi.fn(() => "test-api-key"),
  getApiUrl: vi.fn(() => "https://api.certman.app"),
}));

import { createCertmanClient } from "@certman/sdk";
import getCommand from "../../../../src/commands/ca/get.js";

const mockCa = {
  id: "ca-123",
  name: "Root CA",
  common_name: "Root CA",
  key_algorithm: "ECDSA-P256",
  valid_from: "2024-01-01T00:00:00Z",
  valid_to: "2034-01-01T00:00:00Z",
  certificate_pem: "-----BEGIN CERTIFICATE-----\nMOCK\n-----END CERTIFICATE-----",
};

describe("ca get command", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    mockGet = vi.fn().mockResolvedValue({ ca: mockCa });
    vi.mocked(createCertmanClient).mockReturnValue({
      cas: { get: mockGet },
    } as any);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.clearAllMocks();
  });

  it("fetches CA by ID", async () => {
    await runCommand(getCommand, { rawArgs: ["ca-123"] });

    expect(mockGet).toHaveBeenCalledWith("ca-123");
  });

  it("displays CA details", async () => {
    await runCommand(getCommand, { rawArgs: ["ca-123"] });

    expect(consoleSpy).toHaveBeenCalled();
    const calls = consoleSpy.mock.calls.map((c) => c[0]);
    expect(calls.some((c) => c.includes("ca-123"))).toBe(true);
    expect(calls.some((c) => c.includes("Root CA"))).toBe(true);
  });

  it("outputs JSON when --json flag is provided", async () => {
    await runCommand(getCommand, { rawArgs: ["ca-123", "--json"] });

    expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(mockCa, null, 2));
  });
});
