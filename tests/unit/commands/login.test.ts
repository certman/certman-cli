import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runCommand } from "citty";

const mocks = vi.hoisted(() => {
  class CertmanAuthenticationError extends Error {
    name = "CertmanAuthenticationError";
  }
  return {
    loadConfigFile: vi.fn(),
    saveConfigFile: vi.fn(),
    getApiUrl: vi.fn(() => "https://api.certman.app"),
    CertmanAuthenticationError,
  };
});

vi.mock("@certman/sdk", () => ({
  createCertmanClient: vi.fn(() => ({
    whoami: vi.fn(),
  })),
  CertmanAuthenticationError: mocks.CertmanAuthenticationError,
}));

vi.mock("../../../src/config.js", () => ({
  loadConfigFile: mocks.loadConfigFile,
  saveConfigFile: mocks.saveConfigFile,
  getApiUrl: mocks.getApiUrl,
}));

import { createCertmanClient } from "@certman/sdk";
import loginCommand from "../../../src/commands/login.js";

describe("login command", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;
  let mockWhoami: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    mockWhoami = vi.fn().mockResolvedValue({ user: { id: "user-123" } });
    vi.mocked(createCertmanClient).mockReturnValue({
      whoami: mockWhoami,
    } as any);
    mocks.loadConfigFile.mockReturnValue({});
    mocks.saveConfigFile.mockClear();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    vi.clearAllMocks();
  });

  it("saves valid API key to config", async () => {
    await runCommand(loginCommand, { rawArgs: ["--api-key", "cm_test_key"] });

    expect(mocks.saveConfigFile).toHaveBeenCalledWith({ apiKey: "cm_test_key" });
    expect(consoleSpy).toHaveBeenCalledWith("API key saved to ~/.certman/config.json");
  });

  it("validates API key with whoami call", async () => {
    await runCommand(loginCommand, { rawArgs: ["--api-key", "cm_test_key"] });

    expect(mockWhoami).toHaveBeenCalled();
  });

  it("rejects invalid API key", async () => {
    mockWhoami.mockRejectedValue(new mocks.CertmanAuthenticationError("Invalid"));

    // process.exit is mocked, so execution continues and error is re-thrown
    await expect(runCommand(loginCommand, { rawArgs: ["--api-key", "invalid_key"] })).rejects.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalledWith("Error: Invalid API key");
    expect(processExitSpy).toHaveBeenCalledWith(1);
    expect(mocks.saveConfigFile).not.toHaveBeenCalled();
  });

  it("trims whitespace from API key", async () => {
    await runCommand(loginCommand, { rawArgs: ["--api-key", "  cm_test_key  "] });

    expect(mocks.saveConfigFile).toHaveBeenCalledWith({ apiKey: "cm_test_key" });
  });

  it("creates client with custom API URL", async () => {
    await runCommand(loginCommand, {
      rawArgs: ["--api-key", "cm_test_key", "--api-url", "https://custom.api.com"],
    });

    expect(createCertmanClient).toHaveBeenCalledWith({
      apiKey: "cm_test_key",
      baseUrl: "https://api.certman.app",
    });
  });
});
