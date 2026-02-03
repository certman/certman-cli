import { describe, it, expect } from "vitest";
import { runCliWithApiKey, parseJsonOutput } from "./helpers.js";

describe("ca commands", () => {
  describe("ca list", () => {
    it("lists Certificate Authorities", () => {
      const result = runCliWithApiKey(["ca", "list"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("ID");
      expect(result.stdout).toContain("NAME");
      expect(result.stdout).toContain("COMMON NAME");
    });

    it("returns JSON when --json flag is set", () => {
      const result = runCliWithApiKey(["ca", "list", "--json"]);

      expect(result.exitCode).toBe(0);

      const data = parseJsonOutput(result.stdout) as Array<{
        id: string;
        name: string;
        common_name: string;
      }>;

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].id).toBeDefined();
      expect(data[0].name).toBeDefined();
    });
  });

  describe("ca get", () => {
    it("gets CA details by ID", async () => {
      // First get the CA ID from the list
      const listResult = runCliWithApiKey(["ca", "list", "--json"]);
      const cas = parseJsonOutput(listResult.stdout) as Array<{ id: string }>;
      const caId = cas[0].id;

      const result = runCliWithApiKey(["ca", "get", caId]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("id");
      expect(result.stdout).toContain(caId);
    });

    it("returns JSON when --json flag is set", () => {
      const listResult = runCliWithApiKey(["ca", "list", "--json"]);
      const cas = parseJsonOutput(listResult.stdout) as Array<{ id: string }>;
      const caId = cas[0].id;

      const result = runCliWithApiKey(["ca", "get", caId, "--json"]);

      expect(result.exitCode).toBe(0);

      const data = parseJsonOutput(result.stdout) as {
        id: string;
        name: string;
        common_name: string;
        certificate_pem: string;
      };

      expect(data.id).toBe(caId);
      expect(data.certificate_pem).toContain("-----BEGIN CERTIFICATE-----");
    });

    it("fails for invalid CA ID", () => {
      const result = runCliWithApiKey(["ca", "get", "non-existent-id"]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Validation error");
    });

    it("fails for non-existent CA with valid UUID", () => {
      const result = runCliWithApiKey([
        "ca",
        "get",
        "00000000-0000-0000-0000-000000000000",
      ]);

      expect(result.exitCode).toBe(1);
      // API returns permission denied for UUIDs user doesn't have access to
      expect(
        result.stderr.includes("Not found") ||
          result.stderr.includes("Permission denied")
      ).toBe(true);
    });
  });
});
