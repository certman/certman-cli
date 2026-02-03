import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runCommand } from "citty";

const mocks = vi.hoisted(() => ({
  loadConfigFile: vi.fn(),
  saveConfigFile: vi.fn(),
}));

vi.mock("../../../src/config.js", () => ({
  loadConfigFile: mocks.loadConfigFile,
  saveConfigFile: mocks.saveConfigFile,
}));

import logoutCommand from "../../../src/commands/logout.js";

describe("logout command", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    mocks.loadConfigFile.mockReturnValue({ apiKey: "test-key", apiUrl: "https://api.certman.app" });
    mocks.saveConfigFile.mockClear();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.clearAllMocks();
  });

  it("removes API key from config", async () => {
    await runCommand(logoutCommand, { rawArgs: [] });

    expect(mocks.saveConfigFile).toHaveBeenCalledWith({ apiUrl: "https://api.certman.app" });
  });

  it("prints confirmation message", async () => {
    await runCommand(logoutCommand, { rawArgs: [] });

    expect(consoleSpy).toHaveBeenCalledWith("API key removed from ~/.certman/config.json");
  });
});
