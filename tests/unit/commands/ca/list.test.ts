import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runCommand } from "citty";

vi.mock("@certman/sdk", () => ({
  createCertmanClient: vi.fn(() => ({
    cas: {
      list: vi.fn(),
    },
  })),
}));

vi.mock("../../../../src/config.js", () => ({
  getApiKey: vi.fn(() => "test-api-key"),
  getApiUrl: vi.fn(() => "https://api.certman.app"),
}));

import { createCertmanClient } from "@certman/sdk";
import listCommand from "../../../../src/commands/ca/list.js";

const mockCas = [
  {
    id: "ca-123",
    name: "Root CA",
    common_name: "Root CA",
    key_algorithm: "ECDSA-P256",
    valid_to: "2034-01-01T00:00:00Z",
  },
  {
    id: "ca-456",
    name: "Intermediate CA",
    common_name: "Intermediate CA",
    key_algorithm: "RSA-4096",
    valid_to: "2029-01-01T00:00:00Z",
  },
];

describe("ca list command", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let mockList: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    mockList = vi.fn().mockResolvedValue({ cas: mockCas });
    vi.mocked(createCertmanClient).mockReturnValue({
      cas: { list: mockList },
    } as any);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.clearAllMocks();
  });

  it("displays CAs in table format", async () => {
    await runCommand(listCommand, { rawArgs: [] });

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0];
    expect(output).toContain("ID");
    expect(output).toContain("NAME");
    expect(output).toContain("ca-123");
    expect(output).toContain("Root CA");
  });

  it("outputs JSON when --json flag is provided", async () => {
    await runCommand(listCommand, { rawArgs: ["--json"] });

    expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(mockCas, null, 2));
  });

  it("displays empty message when no CAs exist", async () => {
    mockList.mockResolvedValue({ cas: [] });

    await runCommand(listCommand, { rawArgs: [] });

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0];
    expect(output).toContain("No results found");
  });
});
