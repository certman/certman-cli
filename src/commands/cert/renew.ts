import { defineCommand } from "citty";
import { readFileSync, writeFileSync } from "node:fs";
import { createCertmanClient, type RenewCertificateRequest } from "@certman/sdk";
import { getApiKey, getApiUrl } from "../../config.js";
import { handleError, requireApiKey } from "../../errors.js";
import { output } from "../../output.js";

export default defineCommand({
  meta: {
    name: "renew",
    description: "Renew a certificate",
  },
  args: {
    id: {
      type: "positional",
      description: "Certificate ID",
      required: true,
    },
    "validity-days": {
      type: "string",
      description: "New validity period in days",
    },
    csr: {
      type: "string",
      description: "Path to new CSR file (required for CSR-based certificates)",
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
      const request: RenewCertificateRequest = {};

      if (args["validity-days"]) {
        request.validityDays = parseInt(args["validity-days"], 10);
      }

      if (args.csr) {
        request.csrPem = readFileSync(args.csr, "utf-8");
      }

      if (args["ca-passphrase"]) {
        request.caPassphrase = args["ca-passphrase"];
      }

      const result = await client.certificates.renew(args.id, request);

      // Write files if requested
      if (args["out-cert"]) {
        writeFileSync(args["out-cert"], result.certificate.certificate_pem);
        console.log(`Certificate written to ${args["out-cert"]}`);
      }

      if (args["out-key"] && result.privateKey) {
        writeFileSync(args["out-key"], result.privateKey, { mode: 0o600 });
        console.log(`Private key written to ${args["out-key"]}`);
      }

      if (args.json) {
        output(result, { json: true });
      } else if (!args["out-cert"]) {
        output(
          {
            id: result.certificate.id,
            commonName: result.certificate.common_name,
            validFrom: result.certificate.valid_from,
            validTo: result.certificate.valid_to,
            serialNumber: result.certificate.serial_number,
          },
          { json: false }
        );
      }
    } catch (error) {
      handleError(error);
    }
  },
});
