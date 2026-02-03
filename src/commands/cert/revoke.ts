import { defineCommand } from "citty";
import { createCertmanClient, type RevokeCertificateRequest } from "@certman/sdk";
import { getApiKey, getApiUrl } from "../../config.js";
import { handleError, requireApiKey } from "../../errors.js";

export default defineCommand({
  meta: {
    name: "revoke",
    description: "Revoke a certificate",
  },
  args: {
    id: {
      type: "positional",
      description: "Certificate ID",
      required: true,
    },
    reason: {
      type: "string",
      description: "Revocation reason (unspecified, keyCompromise, caCompromise, affiliationChanged, superseded, cessationOfOperation, certificateHold, privilegeWithdrawn)",
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
      const reason = args.reason as RevokeCertificateRequest["reason"];
      const result = await client.certificates.revoke(args.id, reason);

      if (args.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`Certificate ${result.certificate.id} revoked successfully`);
        console.log(`Reason: ${result.certificate.revocation_reason}`);
        console.log(`Revoked at: ${result.certificate.revoked_at}`);
      }
    } catch (error) {
      handleError(error);
    }
  },
});
