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
      issue: vi.fn(),
    },
  })),
}));

vi.mock("../../../../src/config.js", () => ({
  getApiKey: vi.fn(() => "test-api-key"),
  getApiUrl: vi.fn(() => "https://api.certman.app"),
}));

import { createCertmanClient } from "@certman/sdk";
import issueCommand from "../../../../src/commands/cert/issue.js";

const mockCertificateResult = {
  certificate: {
    id: "cert-123",
    common_name: "test.local",
    certificate_pem: "-----BEGIN CERTIFICATE-----\nMOCK_CERT\n-----END CERTIFICATE-----\n",
    valid_from: "2024-01-01T00:00:00Z",
    valid_to: "2025-01-01T00:00:00Z",
    serial_number: "ABC123",
  },
  privateKey: "-----BEGIN PRIVATE KEY-----\nMOCK_KEY\n-----END PRIVATE KEY-----\n",
};

describe("cert issue command", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let mockIssue: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    mockIssue = vi.fn().mockResolvedValue(mockCertificateResult);
    vi.mocked(createCertmanClient).mockReturnValue({
      certificates: { issue: mockIssue },
    } as any);
    mocks.writeFileSync.mockClear();
    mocks.readFileSync.mockClear();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.clearAllMocks();
  });

  it("prints certificate and key PEM to stdout when no output files specified", async () => {
    await runCommand(issueCommand, {
      rawArgs: ["--ca-id", "ca-123"],
    });

    expect(consoleSpy).toHaveBeenCalledWith(mockCertificateResult.certificate.certificate_pem);
    expect(consoleSpy).toHaveBeenCalledWith(mockCertificateResult.privateKey);
  });

  it("prints only certificate PEM when no private key returned (CSR mode)", async () => {
    mockIssue.mockResolvedValue({
      certificate: mockCertificateResult.certificate,
      privateKey: undefined,
    });

    await runCommand(issueCommand, {
      rawArgs: ["--ca-id", "ca-123"],
    });

    expect(consoleSpy).toHaveBeenCalledWith(mockCertificateResult.certificate.certificate_pem);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });

  it("outputs JSON when --json flag is provided", async () => {
    await runCommand(issueCommand, {
      rawArgs: ["--ca-id", "ca-123", "--json"],
    });

    expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(mockCertificateResult, null, 2));
  });

  it("writes files and prints confirmation when output paths specified", async () => {
    await runCommand(issueCommand, {
      rawArgs: ["--ca-id", "ca-123", "--out-cert", "cert.pem", "--out-key", "key.pem"],
    });

    expect(mocks.writeFileSync).toHaveBeenCalledWith("cert.pem", mockCertificateResult.certificate.certificate_pem);
    expect(mocks.writeFileSync).toHaveBeenCalledWith("key.pem", mockCertificateResult.privateKey, { mode: 0o600 });
    expect(consoleSpy).toHaveBeenCalledWith("Certificate written to cert.pem");
    expect(consoleSpy).toHaveBeenCalledWith("Private key written to key.pem");
  });

  it("passes correct request parameters to SDK", async () => {
    await runCommand(issueCommand, {
      rawArgs: [
        "--ca-id", "ca-123",
        "--common-name", "myapp.local",
        "--san-dns", "myapp.local,api.myapp.local",
        "--san-ip", "192.168.1.1",
        "--key-algorithm", "ECDSA-P384",
        "--validity-days", "90",
      ],
    });

    expect(mockIssue).toHaveBeenCalledWith({
      caId: "ca-123",
      mode: "managed",
      commonName: "myapp.local",
      sanDns: ["myapp.local", "api.myapp.local"],
      sanIp: ["192.168.1.1"],
      keyAlgorithm: "ECDSA-P384",
      validityDays: 90,
    });
  });
});
