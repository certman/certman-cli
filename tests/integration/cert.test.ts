import { describe, it, expect, beforeAll } from "vitest";
import { existsSync, unlinkSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runCliWithApiKey, parseJsonOutput } from "./helpers.js";

describe("cert commands", () => {
  let caId: string;
  let _issuedCertId: string;

  beforeAll(() => {
    // Get CA ID for issuing certificates
    const listResult = runCliWithApiKey(["ca", "list", "--json"]);
    const cas = parseJsonOutput(listResult.stdout) as Array<{ id: string }>;
    caId = cas[0].id;
  });

  describe("cert list", () => {
    it("lists certificates", () => {
      const result = runCliWithApiKey(["cert", "list"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("ID");
      expect(result.stdout).toContain("COMMON NAME");
    });

    it("returns JSON when --json flag is set", () => {
      const result = runCliWithApiKey(["cert", "list", "--json"]);

      expect(result.exitCode).toBe(0);

      const data = parseJsonOutput(result.stdout) as {
        certificates: Array<{ id: string }>;
        total: number;
        page: number;
      };

      expect(data.certificates).toBeDefined();
      expect(typeof data.total).toBe("number");
      expect(typeof data.page).toBe("number");
    });

    it("filters by CA ID", () => {
      const result = runCliWithApiKey([
        "cert",
        "list",
        "--json",
        `--ca-id=${caId}`,
      ]);

      expect(result.exitCode).toBe(0);

      const data = parseJsonOutput(result.stdout) as {
        certificates: Array<{ ca_id: string }>;
      };

      for (const cert of data.certificates) {
        expect(cert.ca_id).toBe(caId);
      }
    });

    it("filters by status", () => {
      const result = runCliWithApiKey([
        "cert",
        "list",
        "--json",
        "--status=active",
      ]);

      expect(result.exitCode).toBe(0);

      const data = parseJsonOutput(result.stdout) as {
        certificates: Array<{ revoked_at: string | null }>;
      };

      for (const cert of data.certificates) {
        expect(cert.revoked_at).toBeNull();
      }
    });
  });

  describe("cert issue", () => {
    it("issues a certificate with common name", () => {
      const cn = `test-${Date.now()}.example.com`;
      const result = runCliWithApiKey([
        "cert",
        "issue",
        `--ca-id=${caId}`,
        `--common-name=${cn}`,
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("id");
      expect(result.stdout).toContain("commonName");
      expect(result.stdout).toContain(cn);
    });

    it("issues a certificate with JSON output", () => {
      const cn = `test-json-${Date.now()}.example.com`;
      const result = runCliWithApiKey([
        "cert",
        "issue",
        `--ca-id=${caId}`,
        `--common-name=${cn}`,
        "--json",
      ]);

      expect(result.exitCode).toBe(0);

      const data = parseJsonOutput(result.stdout) as {
        certificate: {
          id: string;
          common_name: string;
          certificate_pem: string;
        };
        privateKey: string;
      };

      expect(data.certificate.id).toBeDefined();
      expect(data.certificate.common_name).toBe(cn);
      expect(data.certificate.certificate_pem).toContain(
        "-----BEGIN CERTIFICATE-----"
      );
      expect(data.privateKey).toContain("-----BEGIN");

      // Save for later tests
      _issuedCertId = data.certificate.id;
    });

    it("issues certificate with SANs", () => {
      const cn = `test-san-${Date.now()}.example.com`;
      const result = runCliWithApiKey([
        "cert",
        "issue",
        `--ca-id=${caId}`,
        `--common-name=${cn}`,
        "--san-dns=www.example.com,api.example.com",
        "--san-ip=192.168.1.1",
        "--json",
      ]);

      expect(result.exitCode).toBe(0);

      const data = parseJsonOutput(result.stdout) as {
        certificate: {
          san_dns: string[];
          san_ip: string[];
        };
      };

      expect(data.certificate.san_dns).toContain("www.example.com");
      expect(data.certificate.san_dns).toContain("api.example.com");
      expect(data.certificate.san_ip).toContain("192.168.1.1");
    });

    it("writes certificate to file", () => {
      const cn = `test-file-${Date.now()}.example.com`;
      const certPath = join(tmpdir(), `test-cert-${Date.now()}.crt`);
      const keyPath = join(tmpdir(), `test-key-${Date.now()}.key`);

      try {
        const result = runCliWithApiKey([
          "cert",
          "issue",
          `--ca-id=${caId}`,
          `--common-name=${cn}`,
          `--out-cert=${certPath}`,
          `--out-key=${keyPath}`,
        ]);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain(`Certificate written to ${certPath}`);
        expect(result.stdout).toContain(`Private key written to ${keyPath}`);

        expect(existsSync(certPath)).toBe(true);
        expect(existsSync(keyPath)).toBe(true);

        const certContent = readFileSync(certPath, "utf-8");
        const keyContent = readFileSync(keyPath, "utf-8");

        expect(certContent).toContain("-----BEGIN CERTIFICATE-----");
        expect(keyContent).toContain("-----BEGIN");
      } finally {
        if (existsSync(certPath)) unlinkSync(certPath);
        if (existsSync(keyPath)) unlinkSync(keyPath);
      }
    });

    it("fails without required --ca-id", () => {
      const result = runCliWithApiKey([
        "cert",
        "issue",
        "--common-name=test.example.com",
      ]);

      expect(result.exitCode).toBe(1);
    });
  });

  describe("cert revoke", () => {
    let certToRevoke: string;

    beforeAll(() => {
      // Issue a certificate to revoke
      const cn = `revoke-test-${Date.now()}.example.com`;
      const result = runCliWithApiKey([
        "cert",
        "issue",
        `--ca-id=${caId}`,
        `--common-name=${cn}`,
        "--json",
      ]);

      const data = parseJsonOutput(result.stdout) as {
        certificate: { id: string };
      };
      certToRevoke = data.certificate.id;
    });

    it("revokes a certificate", () => {
      const result = runCliWithApiKey(["cert", "revoke", certToRevoke]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("revoked successfully");
    });

    it("revokes with reason", () => {
      // Issue another certificate
      const cn = `revoke-reason-${Date.now()}.example.com`;
      const issueResult = runCliWithApiKey([
        "cert",
        "issue",
        `--ca-id=${caId}`,
        `--common-name=${cn}`,
        "--json",
      ]);

      const data = parseJsonOutput(issueResult.stdout) as {
        certificate: { id: string };
      };

      const result = runCliWithApiKey([
        "cert",
        "revoke",
        data.certificate.id,
        "--reason=keyCompromise",
      ]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("keyCompromise");
    });

    it("returns JSON when --json flag is set", () => {
      // Issue another certificate
      const cn = `revoke-json-${Date.now()}.example.com`;
      const issueResult = runCliWithApiKey([
        "cert",
        "issue",
        `--ca-id=${caId}`,
        `--common-name=${cn}`,
        "--json",
      ]);

      const issueData = parseJsonOutput(issueResult.stdout) as {
        certificate: { id: string };
      };

      const result = runCliWithApiKey([
        "cert",
        "revoke",
        issueData.certificate.id,
        "--json",
      ]);

      expect(result.exitCode).toBe(0);

      const data = parseJsonOutput(result.stdout) as {
        message: string;
        certificate: { id: string; revoked_at: string };
      };

      expect(data.certificate.id).toBe(issueData.certificate.id);
      expect(data.certificate.revoked_at).toBeDefined();
    });

    it("fails for invalid certificate ID", () => {
      const result = runCliWithApiKey(["cert", "revoke", "non-existent-id"]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Validation error");
    });

    it("fails for non-existent certificate with valid UUID", () => {
      const result = runCliWithApiKey([
        "cert",
        "revoke",
        "00000000-0000-0000-0000-000000000000",
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Not found");
    });
  });

  describe("cert renew", () => {
    let certToRenew: string;

    beforeAll(() => {
      // Issue a certificate to renew
      const cn = `renew-test-${Date.now()}.example.com`;
      const result = runCliWithApiKey([
        "cert",
        "issue",
        `--ca-id=${caId}`,
        `--common-name=${cn}`,
        "--json",
      ]);

      const data = parseJsonOutput(result.stdout) as {
        certificate: { id: string };
      };
      certToRenew = data.certificate.id;
    });

    it("renews a certificate", () => {
      const result = runCliWithApiKey(["cert", "renew", certToRenew]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("id");
      expect(result.stdout).toContain("commonName");
    });

    it("renews with custom validity", () => {
      // Issue another certificate
      const cn = `renew-validity-${Date.now()}.example.com`;
      const issueResult = runCliWithApiKey([
        "cert",
        "issue",
        `--ca-id=${caId}`,
        `--common-name=${cn}`,
        "--json",
      ]);

      const issueData = parseJsonOutput(issueResult.stdout) as {
        certificate: { id: string };
      };

      const result = runCliWithApiKey([
        "cert",
        "renew",
        issueData.certificate.id,
        "--validity-days=90",
        "--json",
      ]);

      expect(result.exitCode).toBe(0);

      const data = parseJsonOutput(result.stdout) as {
        certificate: { valid_from: string; valid_to: string };
      };

      // Verify validity is approximately 90 days
      const validFrom = new Date(data.certificate.valid_from);
      const validTo = new Date(data.certificate.valid_to);
      const diffDays = Math.round(
        (validTo.getTime() - validFrom.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(diffDays).toBe(90);
    });

    it("writes renewed certificate to file", () => {
      // Issue another certificate
      const cn = `renew-file-${Date.now()}.example.com`;
      const issueResult = runCliWithApiKey([
        "cert",
        "issue",
        `--ca-id=${caId}`,
        `--common-name=${cn}`,
        "--json",
      ]);

      const issueData = parseJsonOutput(issueResult.stdout) as {
        certificate: { id: string };
      };

      const certPath = join(tmpdir(), `renewed-cert-${Date.now()}.crt`);

      try {
        const result = runCliWithApiKey([
          "cert",
          "renew",
          issueData.certificate.id,
          `--out-cert=${certPath}`,
        ]);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain(`Certificate written to ${certPath}`);

        expect(existsSync(certPath)).toBe(true);

        const certContent = readFileSync(certPath, "utf-8");
        expect(certContent).toContain("-----BEGIN CERTIFICATE-----");
      } finally {
        if (existsSync(certPath)) unlinkSync(certPath);
      }
    });

    it("fails for invalid certificate ID", () => {
      const result = runCliWithApiKey(["cert", "renew", "non-existent-id"]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Validation error");
    });

    it("fails for non-existent certificate with valid UUID", () => {
      const result = runCliWithApiKey([
        "cert",
        "renew",
        "00000000-0000-0000-0000-000000000000",
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Not found");
    });
  });
});
