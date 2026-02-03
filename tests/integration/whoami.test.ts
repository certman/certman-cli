import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, readFileSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { runCli, runCliWithApiKey, parseJsonOutput } from "./helpers.js";

describe("whoami command", () => {
  const configDir = join(homedir(), ".certman");
  const configPath = join(configDir, "config.json");
  let originalConfig: string | null = null;

  beforeEach(() => {
    if (existsSync(configPath)) {
      originalConfig = readFileSync(configPath, "utf-8");
    } else {
      originalConfig = null;
    }
  });

  afterEach(() => {
    if (originalConfig !== null) {
      mkdirSync(configDir, { recursive: true });
      writeFileSync(configPath, originalConfig);
    } else if (existsSync(configPath)) {
      rmSync(configPath);
    }
  });

  it("fails when no API key is configured", () => {
    // Remove config file to ensure no API key is available
    if (existsSync(configPath)) {
      rmSync(configPath);
    }

    const result = runCli(["whoami"], { env: { CERTMAN_API_KEY: "" } });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("No API key configured");
  });

  it("returns identity information", () => {
    const result = runCliWithApiKey(["whoami"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("User:");
    expect(result.stdout).toContain("Workspace:");
    expect(result.stdout).toContain("API Key:");
  });

  it("returns JSON when --json flag is set", () => {
    const result = runCliWithApiKey(["whoami", "--json"]);

    expect(result.exitCode).toBe(0);

    const data = parseJsonOutput(result.stdout) as {
      user: { id: string; email: string };
      workspace: { id: string; name: string; slug: string };
      apiKey: { id: string; name: string; prefix: string };
      permissions: Record<string, { canRead: boolean; canIssue: boolean; canRevoke: boolean }>;
    };

    expect(data.user).toBeDefined();
    expect(data.workspace).toBeDefined();
    expect(data.apiKey).toBeDefined();
    expect(data.permissions).toBeDefined();
  });

  it("accepts --api-key flag", () => {
    const apiKey = process.env.CERTMAN_API_KEY!;
    const result = runCli(["whoami", "--json", `--api-key=${apiKey}`]);

    expect(result.exitCode).toBe(0);

    const data = parseJsonOutput(result.stdout) as { user: { id: string } };
    expect(data.user).toBeDefined();
  });

  it("fails with invalid API key", () => {
    const result = runCli(["whoami"], {
      env: { CERTMAN_API_KEY: "invalid-key" },
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Invalid API key");
  });
});
