import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runCommand } from "citty";

vi.mock("@certman/sdk", () => ({
  createCertmanClient: vi.fn(() => ({
    certificates: {
      revoke: vi.fn(),
    },
  })),
}));

vi.mock("../../../../src/config.js", () => ({
  getApiKey: vi.fn(() => "test-api-key"),
  getApiUrl: vi.fn(() => "https://api.certman.app"),
}));

import { createCertmanClient } from "@certman/sdk";
import revokeCommand from "../../../../src/commands/cert/revoke.js";

const mockRevokeResult = {
  certificate: {
    id: "cert-123",
    revocation_reason: "keyCompromise",
    revoked_at: "2024-06-01T12:00:00Z",
  },
};

describe("cert revoke command", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let mockRevoke: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    mockRevoke = vi.fn().mockResolvedValue(mockRevokeResult);
    vi.mocked(createCertmanClient).mockReturnValue({
      certificates: { revoke: mockRevoke },
    } as any);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.clearAllMocks();
  });

  it("revokes certificate by ID", async () => {
    await runCommand(revokeCommand, { rawArgs: ["cert-123"] });

    expect(mockRevoke).toHaveBeenCalledWith("cert-123", undefined);
  });

  it("passes revocation reason to SDK", async () => {
    await runCommand(revokeCommand, { rawArgs: ["cert-123", "--reason", "keyCompromise"] });

    expect(mockRevoke).toHaveBeenCalledWith("cert-123", "keyCompromise");
  });

  it("displays confirmation message", async () => {
    await runCommand(revokeCommand, { rawArgs: ["cert-123"] });

    expect(consoleSpy).toHaveBeenCalledWith("Certificate cert-123 revoked successfully");
    expect(consoleSpy).toHaveBeenCalledWith("Reason: keyCompromise");
    expect(consoleSpy).toHaveBeenCalledWith("Revoked at: 2024-06-01T12:00:00Z");
  });

  it("outputs JSON when --json flag is provided", async () => {
    await runCommand(revokeCommand, { rawArgs: ["cert-123", "--json"] });

    expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(mockRevokeResult, null, 2));
  });
});
