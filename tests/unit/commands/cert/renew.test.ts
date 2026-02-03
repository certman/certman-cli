import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runCommand } from "citty";

const mocks = vi.hoisted(() => ({
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    writeFileSync: mocks.writeFileSync,
    readFileSync: mocks.readFileSync,
  };
});

vi.mock("@certman/sdk", () => ({
  createCertmanClient: vi.fn(() => ({
    certificates: {
      renew: vi.fn(),
    },
  })),
}));

vi.mock("../../../../src/config.js", () => ({
  getApiKey: vi.fn(() => "test-api-key"),
  getApiUrl: vi.fn(() => "https://api.certman.app"),
}));

import { createCertmanClient } from "@certman/sdk";
import renewCommand from "../../../../src/commands/cert/renew.js";

const mockRenewResult = {
  certificate: {
    id: "cert-456",
    common_name: "app.local",
    certificate_pem: "-----BEGIN CERTIFICATE-----\nRENEWED_CERT\n-----END CERTIFICATE-----\n",
    valid_from: "2024-06-01T00:00:00Z",
    valid_to: "2025-06-01T00:00:00Z",
    serial_number: "DEF456",
  },
  privateKey: "-----BEGIN PRIVATE KEY-----\nRENEWED_KEY\n-----END PRIVATE KEY-----\n",
};

describe("cert renew command", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let mockRenew: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    mockRenew = vi.fn().mockResolvedValue(mockRenewResult);
    vi.mocked(createCertmanClient).mockReturnValue({
      certificates: { renew: mockRenew },
    } as any);
    mocks.writeFileSync.mockClear();
    mocks.readFileSync.mockClear();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.clearAllMocks();
  });

  it("renews certificate by ID", async () => {
    await runCommand(renewCommand, { rawArgs: ["cert-123"] });

    expect(mockRenew).toHaveBeenCalledWith("cert-123", {});
  });

  it("passes validity days to SDK", async () => {
    await runCommand(renewCommand, { rawArgs: ["cert-123", "--validity-days", "90"] });

    expect(mockRenew).toHaveBeenCalledWith("cert-123", { validityDays: 90 });
  });

  it("reads CSR file and passes to SDK", async () => {
    mocks.readFileSync.mockReturnValue("-----BEGIN CERTIFICATE REQUEST-----\nCSR\n-----END CERTIFICATE REQUEST-----");

    await runCommand(renewCommand, { rawArgs: ["cert-123", "--csr", "request.csr"] });

    expect(mocks.readFileSync).toHaveBeenCalledWith("request.csr", "utf-8");
    expect(mockRenew).toHaveBeenCalledWith("cert-123", {
      csrPem: "-----BEGIN CERTIFICATE REQUEST-----\nCSR\n-----END CERTIFICATE REQUEST-----",
    });
  });

  it("displays certificate info when no output files specified", async () => {
    await runCommand(renewCommand, { rawArgs: ["cert-123"] });

    expect(consoleSpy).toHaveBeenCalled();
    const calls = consoleSpy.mock.calls.map((c) => c[0]);
    expect(calls.some((c) => c.includes("cert-456"))).toBe(true);
  });

  it("writes files when output paths specified", async () => {
    await runCommand(renewCommand, {
      rawArgs: ["cert-123", "--out-cert", "renewed.pem", "--out-key", "renewed.key"],
    });

    expect(mocks.writeFileSync).toHaveBeenCalledWith("renewed.pem", mockRenewResult.certificate.certificate_pem);
    expect(mocks.writeFileSync).toHaveBeenCalledWith("renewed.key", mockRenewResult.privateKey, { mode: 0o600 });
  });

  it("outputs JSON when --json flag is provided", async () => {
    await runCommand(renewCommand, { rawArgs: ["cert-123", "--json"] });

    expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(mockRenewResult, null, 2));
  });

  it("passes CA passphrase to SDK", async () => {
    await runCommand(renewCommand, { rawArgs: ["cert-123", "--ca-passphrase", "secret"] });

    expect(mockRenew).toHaveBeenCalledWith("cert-123", { caPassphrase: "secret" });
  });
});
