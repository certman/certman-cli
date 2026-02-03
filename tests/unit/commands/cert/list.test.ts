import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runCommand } from "citty";

vi.mock("@certman/sdk", () => ({
  createCertmanClient: vi.fn(() => ({
    certificates: {
      list: vi.fn(),
    },
  })),
}));

vi.mock("../../../../src/config.js", () => ({
  getApiKey: vi.fn(() => "test-api-key"),
  getApiUrl: vi.fn(() => "https://api.certman.app"),
}));

import { createCertmanClient } from "@certman/sdk";
import listCommand from "../../../../src/commands/cert/list.js";

const mockCertificates = [
  {
    id: "cert-123",
    common_name: "app.local",
    key_algorithm: "ECDSA-P256",
    valid_to: "2025-01-01T00:00:00Z",
    revoked_at: null,
  },
  {
    id: "cert-456",
    common_name: "api.local",
    key_algorithm: "RSA-2048",
    valid_to: "2025-06-01T00:00:00Z",
    revoked_at: "2024-06-01T00:00:00Z",
  },
];

const mockListResult = {
  certificates: mockCertificates,
  total: 2,
  page: 1,
  totalPages: 1,
};

describe("cert list command", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let mockList: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    mockList = vi.fn().mockResolvedValue(mockListResult);
    vi.mocked(createCertmanClient).mockReturnValue({
      certificates: { list: mockList },
    } as any);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.clearAllMocks();
  });

  it("displays certificates in table format", async () => {
    await runCommand(listCommand, { rawArgs: [] });

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0];
    expect(output).toContain("ID");
    expect(output).toContain("COMMON NAME");
    expect(output).toContain("cert-123");
    expect(output).toContain("app.local");
  });

  it("displays pagination info", async () => {
    await runCommand(listCommand, { rawArgs: [] });

    const calls = consoleSpy.mock.calls.map((c) => c[0]);
    expect(calls.some((c) => c.includes("Total: 2"))).toBe(true);
  });

  it("outputs JSON when --json flag is provided", async () => {
    await runCommand(listCommand, { rawArgs: ["--json"] });

    expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(mockListResult, null, 2));
  });

  it("passes filter parameters to SDK", async () => {
    await runCommand(listCommand, {
      rawArgs: ["--ca-id", "ca-123", "--status", "active", "--search", "app"],
    });

    expect(mockList).toHaveBeenCalledWith({
      caId: "ca-123",
      status: "active",
      search: "app",
    });
  });

  it("calls SDK without filters when none provided", async () => {
    await runCommand(listCommand, { rawArgs: [] });

    expect(mockList).toHaveBeenCalledWith({});
  });
});
