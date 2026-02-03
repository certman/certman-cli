import { defineCommand } from "citty";
import { createCertmanClient } from "@certman/sdk";
import { getApiKey, getApiUrl } from "../../config.js";
import { handleError, requireApiKey } from "../../errors.js";
import { output } from "../../output.js";

export default defineCommand({
  meta: {
    name: "get",
    description: "Get Certificate Authority details",
  },
  args: {
    id: {
      type: "positional",
      description: "CA ID",
      required: true,
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
      const { ca } = await client.cas.get(args.id);
      output(ca, { json: args.json });
    } catch (error) {
      handleError(error);
    }
  },
});
