import { defineCommand } from "citty";
import { createCertmanClient } from "@certman/sdk";
import { getApiKey, getApiUrl } from "../config.js";
import { handleError, requireApiKey } from "../errors.js";
import { output } from "../output.js";

export default defineCommand({
  meta: {
    name: "whoami",
    description: "Show current identity",
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
      const identity = await client.whoami();

      if (args.json) {
        output(identity, { json: true });
      } else {
        if (identity.user) {
          console.log(`User:      ${identity.user.email ?? identity.user.id}`);
        }
        if (identity.workspace) {
          console.log(`Workspace: ${identity.workspace.name} (${identity.workspace.slug})`);
        }
        if (identity.apiKey) {
          console.log(`API Key:   ${identity.apiKey.name} (${identity.apiKey.prefix}...)`);
        }
      }
    } catch (error) {
      handleError(error);
    }
  },
});
