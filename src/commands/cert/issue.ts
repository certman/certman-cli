import { defineCommand } from "citty";
import { readFileSync, writeFileSync } from "node:fs";
import { createCertmanClient, type IssueCertificateRequest } from "@certman/sdk";
import { getApiKey, getApiUrl } from "../../config.js";
import { handleError, requireApiKey } from "../../errors.js";
import { output } from "../../output.js";

export default defineCommand({
  meta: {
    name: "issue",
    description: "Issue a new certificate",
  },
  args: {
    "ca-id": {
      type: "string",
      description: "CA to issue from (required)",
      required: true,
    },
    "common-name": {
      type: "string",
      description: "Certificate common name",
    },
    "san-dns": {
      type: "string",
      description: "DNS SANs (comma-separated)",
    },
    "san-ip": {
      type: "string",
      description: "IP SANs (comma-separated)",
    },
    "key-algorithm": {
      type: "string",
      description: "Key algorithm (RSA-2048, RSA-4096, ECDSA-P256, ECDSA-P384)",
    },
    "validity-days": {
      type: "string",
      description: "Validity period in days (default: 365)",
    },
    csr: {
      type: "string",
      description: "Path to CSR file (for CSR mode)",
    },
    "ca-passphrase": {
      type: "string",
      description: "CA passphrase (if CA is passphrase-protected)",
    },
    "out-cert": {
      type: "string",
      description: "Write certificate to file",
    },
    "out-key": {
      type: "string",
      description: "Write private key to file",
    },
    json: {
      type: "boolean",
      description: "Output as JSON",
    },
    "api-key": {
      type: "string",
      description: "API key",
    },
    "api-url": {
      type: "string",
      description: "API URL",
    },
  },
  async run({ args }) {
    const apiKey = getApiKey(args["api-key"]);
    requireApiKey(apiKey);

    const client = createCertmanClient({
      apiKey,
      baseUrl: getApiUrl(args["api-url"]),
    });

    try {
      const request: IssueCertificateRequest = {
        caId: args["ca-id"],
      };

      if (args.csr) {
        request.mode = "csr";
        request.csrPem = readFileSync(args.csr, "utf-8");
      } else {
        request.mode = "managed";
        if (args["common-name"]) {
          request.commonName = args["common-name"];
        }
      }

      if (args["san-dns"]) {
        request.sanDns = args["san-dns"].split(",").map((s) => s.trim());
      }

      if (args["san-ip"]) {
        request.sanIp = args["san-ip"].split(",").map((s) => s.trim());
      }

      if (args["key-algorithm"]) {
        request.keyAlgorithm = args["key-algorithm"] as IssueCertificateRequest["keyAlgorithm"];
      }

      if (args["validity-days"]) {
        request.validityDays = parseInt(args["validity-days"], 10);
      }

      if (args["ca-passphrase"]) {
        request.caPassphrase = args["ca-passphrase"];
      }

      const result = await client.certificates.issue(request);

      if (args.json) {
        output(result, { json: true });
      } else if (args["out-cert"] || args["out-key"]) {
        // Write files if requested
        if (args["out-cert"]) {
          writeFileSync(args["out-cert"], result.certificate.certificate_pem);
          console.log(`Certificate written to ${args["out-cert"]}`);
        }

        if (args["out-key"] && result.privateKey) {
          writeFileSync(args["out-key"], result.privateKey, { mode: 0o600 });
          console.log(`Private key written to ${args["out-key"]}`);
        }
      } else {
        // Print PEM to stdout
        console.log(result.certificate.certificate_pem);
        if (result.privateKey) {
          console.log(result.privateKey);
        }
      }
    } catch (error) {
      handleError(error);
    }
  },
});
