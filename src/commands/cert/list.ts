import { defineCommand } from "citty";
import { createCertmanClient } from "@certman/sdk";
import { getApiKey, getApiUrl } from "../../config.js";
import { handleError, requireApiKey } from "../../errors.js";
import { output, formatTable } from "../../output.js";

export default defineCommand({
  meta: {
    name: "list",
    description: "List certificates",
  },
  args: {
    "ca-id": {
      type: "string",
      description: "Filter by CA ID",
    },
    status: {
      type: "string",
      description: "Filter by status (active, revoked, all)",
    },
    search: {
      type: "string",
      description: "Search by common name",
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
      const params: {
        caId?: string;
        status?: "active" | "revoked" | "all";
        search?: string;
      } = {};

      if (args["ca-id"]) {
        params.caId = args["ca-id"];
      }
      if (args.status) {
        params.status = args.status as "active" | "revoked" | "all";
      }
      if (args.search) {
        params.search = args.search;
      }

      const result = await client.certificates.list(params);

      if (args.json) {
        output(result, { json: true });
      } else {
        const table = formatTable(result.certificates, [
          { key: "id", header: "ID" },
          { key: "common_name", header: "COMMON NAME" },
          { key: "key_algorithm", header: "ALGORITHM" },
          { key: "valid_to", header: "VALID TO" },
          { key: "revoked_at", header: "REVOKED" },
        ]);
        console.log(table);
        console.log(`\nTotal: ${result.total} (Page ${result.page}/${result.totalPages})`);
      }
    } catch (error) {
      handleError(error);
    }
  },
});
