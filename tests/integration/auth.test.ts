import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  existsSync,
  readFileSync,
  rmSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { runCli } from "./helpers.js";

describe("auth commands", () => {
  const configDir = join(homedir(), ".certman");
  const configPath = join(configDir, "config.json");
  let originalConfig: string | null = null;

  beforeEach(() => {
    // Backup existing config if present
    if (existsSync(configPath)) {
      originalConfig = readFileSync(configPath, "utf-8");
    } else {
      originalConfig = null;
    }
  });

  afterEach(() => {
    // Restore original config
    if (originalConfig !== null) {
      mkdirSync(configDir, { recursive: true });
      writeFileSync(configPath, originalConfig);
    } else if (existsSync(configPath)) {
      rmSync(configPath);
    }
  });

  describe("login", () => {
    it("saves API key with --api-key flag", () => {
      const apiKey = process.env.CERTMAN_API_KEY!;
      const result = runCli(["login", `--api-key=${apiKey}`]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("API key saved");

      const config = JSON.parse(readFileSync(configPath, "utf-8"));
      expect(config.apiKey).toBe(apiKey);
    });

    it("creates config directory if not exists", () => {
      // Remove config directory
      if (existsSync(configDir)) {
        rmSync(configDir, { recursive: true });
      }

      const apiKey = process.env.CERTMAN_API_KEY!;
      const result = runCli(["login", `--api-key=${apiKey}`]);

      expect(result.exitCode).toBe(0);
      expect(existsSync(configPath)).toBe(true);
    });

    it("rejects invalid API key", () => {
      const result = runCli(["login", "--api-key=invalid-key"]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Invalid API key");
    });
  });

  describe("logout", () => {
    it("removes API key from config", () => {
      // First login
      const testKey = "test-api-key-logout";
      runCli(["login", `--api-key=${testKey}`]);

      // Then logout
      const result = runCli(["logout"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("API key removed");

      const config = JSON.parse(readFileSync(configPath, "utf-8"));
      expect(config.apiKey).toBeUndefined();
    });

    it("preserves other config values", () => {
      // Login with a valid key
      const apiKey = process.env.CERTMAN_API_KEY!;
      runCli(["login", `--api-key=${apiKey}`]);

      // Manually add another config value
      const config = JSON.parse(readFileSync(configPath, "utf-8"));
      config.apiUrl = "https://custom.api.com";
      writeFileSync(configPath, JSON.stringify(config));

      // Logout
      runCli(["logout"]);

      const updatedConfig = JSON.parse(readFileSync(configPath, "utf-8"));
      expect(updatedConfig.apiKey).toBeUndefined();
      expect(updatedConfig.apiUrl).toBe("https://custom.api.com");
    });
  });

  describe("auth flow", () => {
    it("login -> whoami -> logout -> whoami fails", () => {
      const apiKey = process.env.CERTMAN_API_KEY!;

      // Login
      const loginResult = runCli(["login", `--api-key=${apiKey}`]);
      expect(loginResult.exitCode).toBe(0);

      // Whoami should work (reads from config file)
      const whoamiResult = runCli(["whoami"]);
      expect(whoamiResult.exitCode).toBe(0);
      expect(whoamiResult.stdout).toContain("User:");

      // Logout
      const logoutResult = runCli(["logout"]);
      expect(logoutResult.exitCode).toBe(0);

      // Whoami should fail (no API key)
      const failResult = runCli(["whoami"], { env: { CERTMAN_API_KEY: "" } });
      expect(failResult.exitCode).toBe(1);
      expect(failResult.stderr).toContain("No API key configured");
    });
  });
});
