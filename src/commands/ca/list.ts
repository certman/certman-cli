import { defineCommand } from "citty";
import { createCertmanClient } from "@certman/sdk";
import { getApiKey, getApiUrl } from "../../config.js";
import { handleError, requireApiKey } from "../../errors.js";
import { output, formatTable } from "../../output.js";

export default defineCommand({
  meta: {
    name: "list",
    description: "List Certificate Authorities",
  },
  args: {
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
      const { cas } = await client.cas.list();

      if (args.json) {
        output(cas, { json: true });
      } else {
        const table = formatTable(cas, [
          { key: "id", header: "ID" },
          { key: "name", header: "NAME" },
          { key: "common_name", header: "COMMON NAME" },
          { key: "key_algorithm", header: "ALGORITHM" },
          { key: "valid_to", header: "VALID TO" },
        ]);
        console.log(table);
      }
    } catch (error) {
      handleError(error);
    }
  },
});
