import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Mock the home directory before importing config
const testConfigDir = join(tmpdir(), `certman-test-${Date.now()}`);
vi.mock("node:os", async () => {
  const actual = await vi.importActual<typeof import("node:os")>("node:os");
  return {
    ...actual,
    homedir: () => testConfigDir,
  };
});

// Import after mocking
const { loadConfigFile, saveConfigFile, getApiKey, getApiUrl } = await import(
  "../../src/config.js"
);

describe("config", () => {
  beforeEach(() => {
    mkdirSync(testConfigDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testConfigDir, { recursive: true, force: true });
    vi.unstubAllEnvs();
  });

  describe("loadConfigFile", () => {
    it("returns empty object when config file does not exist", () => {
      const config = loadConfigFile();
      expect(config).toEqual({});
    });

    it("loads config from file", () => {
      const configPath = join(testConfigDir, ".certman", "config.json");
      mkdirSync(join(testConfigDir, ".certman"), { recursive: true });
      writeFileSync(configPath, JSON.stringify({ apiKey: "test-key" }));

      const config = loadConfigFile();
      expect(config).toEqual({ apiKey: "test-key" });
    });

    it("returns empty object on invalid JSON", () => {
      const configPath = join(testConfigDir, ".certman", "config.json");
      mkdirSync(join(testConfigDir, ".certman"), { recursive: true });
      writeFileSync(configPath, "invalid json");

      const config = loadConfigFile();
      expect(config).toEqual({});
    });
  });

  describe("saveConfigFile", () => {
    it("creates config directory and file", () => {
      saveConfigFile({ apiKey: "new-key" });

      const configPath = join(testConfigDir, ".certman", "config.json");
      expect(existsSync(configPath)).toBe(true);

      const content = JSON.parse(readFileSync(configPath, "utf-8"));
      expect(content).toEqual({ apiKey: "new-key" });
    });

    it("overwrites existing config", () => {
      const configPath = join(testConfigDir, ".certman", "config.json");
      mkdirSync(join(testConfigDir, ".certman"), { recursive: true });
      writeFileSync(configPath, JSON.stringify({ apiKey: "old-key" }));

      saveConfigFile({ apiKey: "new-key", apiUrl: "https://test.com" });

      const content = JSON.parse(readFileSync(configPath, "utf-8"));
      expect(content).toEqual({ apiKey: "new-key", apiUrl: "https://test.com" });
    });
  });

  describe("getApiKey", () => {
    it("returns CLI flag when provided", () => {
      vi.stubEnv("CERTMAN_API_KEY", "env-key");
      mkdirSync(join(testConfigDir, ".certman"), { recursive: true });
      writeFileSync(
        join(testConfigDir, ".certman", "config.json"),
        JSON.stringify({ apiKey: "file-key" })
      );

      const key = getApiKey("cli-key");
      expect(key).toBe("cli-key");
    });

    it("returns env var when CLI flag not provided", () => {
      vi.stubEnv("CERTMAN_API_KEY", "env-key");
      mkdirSync(join(testConfigDir, ".certman"), { recursive: true });
      writeFileSync(
        join(testConfigDir, ".certman", "config.json"),
        JSON.stringify({ apiKey: "file-key" })
      );

      const key = getApiKey(undefined);
      expect(key).toBe("env-key");
    });

    it("returns file config when env var not set", () => {
      mkdirSync(join(testConfigDir, ".certman"), { recursive: true });
      writeFileSync(
        join(testConfigDir, ".certman", "config.json"),
        JSON.stringify({ apiKey: "file-key" })
      );

      const key = getApiKey(undefined);
      expect(key).toBe("file-key");
    });

    it("returns undefined when no config exists", () => {
      const key = getApiKey(undefined);
      expect(key).toBeUndefined();
    });
  });

  describe("getApiUrl", () => {
    it("returns CLI flag when provided", () => {
      vi.stubEnv("CERTMAN_API_URL", "https://env.com");

      const url = getApiUrl("https://cli.com");
      expect(url).toBe("https://cli.com");
    });

    it("returns env var when CLI flag not provided", () => {
      vi.stubEnv("CERTMAN_API_URL", "https://env.com");

      const url = getApiUrl(undefined);
      expect(url).toBe("https://env.com");
    });

    it("returns file config when env var not set", () => {
      mkdirSync(join(testConfigDir, ".certman"), { recursive: true });
      writeFileSync(
        join(testConfigDir, ".certman", "config.json"),
        JSON.stringify({ apiUrl: "https://file.com" })
      );

      const url = getApiUrl(undefined);
      expect(url).toBe("https://file.com");
    });
  });
});
