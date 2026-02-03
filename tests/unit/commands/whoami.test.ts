import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runCommand } from "citty";

vi.mock("@certman/sdk", () => ({
  createCertmanClient: vi.fn(() => ({
    whoami: vi.fn(),
  })),
}));

vi.mock("../../../src/config.js", () => ({
  getApiKey: vi.fn(() => "test-api-key"),
  getApiUrl: vi.fn(() => "https://api.certman.app"),
}));

import { createCertmanClient } from "@certman/sdk";
import whoamiCommand from "../../../src/commands/whoami.js";

const mockIdentity = {
  user: { id: "user-123", email: "test@example.com" },
  workspace: { name: "Test Workspace", slug: "test-workspace" },
  apiKey: { name: "Test Key", prefix: "cm_test" },
};

describe("whoami command", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let mockWhoami: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    mockWhoami = vi.fn().mockResolvedValue(mockIdentity);
    vi.mocked(createCertmanClient).mockReturnValue({
      whoami: mockWhoami,
    } as any);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.clearAllMocks();
  });

  it("displays user email", async () => {
    await runCommand(whoamiCommand, { rawArgs: [] });

    expect(consoleSpy).toHaveBeenCalledWith("User:      test@example.com");
  });

  it("displays workspace info", async () => {
    await runCommand(whoamiCommand, { rawArgs: [] });

    expect(consoleSpy).toHaveBeenCalledWith("Workspace: Test Workspace (test-workspace)");
  });

  it("displays API key info", async () => {
    await runCommand(whoamiCommand, { rawArgs: [] });

    expect(consoleSpy).toHaveBeenCalledWith("API Key:   Test Key (cm_test...)");
  });

  it("outputs JSON when --json flag is provided", async () => {
    await runCommand(whoamiCommand, { rawArgs: ["--json"] });

    expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(mockIdentity, null, 2));
  });

  it("displays user ID when email is not available", async () => {
    mockWhoami.mockResolvedValue({
      user: { id: "user-123" },
    });

    await runCommand(whoamiCommand, { rawArgs: [] });

    expect(consoleSpy).toHaveBeenCalledWith("User:      user-123");
  });
});
