import { defineCommand } from "citty";
import { stdin, stdout } from "node:process";
import { createCertmanClient, CertmanAuthenticationError } from "@certman/sdk";
import { loadConfigFile, saveConfigFile, getApiUrl } from "../config.js";

function readSecretInput(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    stdout.write(prompt);
    let input = "";

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    const onData = (char: string) => {
      if (char === "\r" || char === "\n") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        stdout.write("\n");
        resolve(input);
      } else if (char === "\u0003") {
        // Ctrl+C
        stdin.setRawMode(false);
        stdin.pause();
        process.exit(1);
      } else if (char === "\u007F" || char === "\b") {
        // Backspace
        if (input.length > 0) {
          input = input.slice(0, -1);
        }
      } else {
        input += char;
      }
    };

    stdin.on("data", onData);
  });
}

export default defineCommand({
  meta: {
    name: "login",
    description: "Authenticate with your API key",
  },
  args: {
    "api-key": {
      type: "string",
      description: "API key (will prompt if not provided)",
    },
    "api-url": {
      type: "string",
      description: "API URL",
    },
  },
  async run({ args }) {
    let apiKey = args["api-key"];

    if (!apiKey) {
      apiKey = await readSecretInput("Enter your API key: ");
    }

    if (!apiKey || apiKey.trim() === "") {
      console.error("Error: API key cannot be empty");
      process.exit(1);
    }

    apiKey = apiKey.trim();

    const client = createCertmanClient({
      apiKey,
      baseUrl: getApiUrl(args["api-url"]),
    });

    try {
      await client.whoami();
    } catch (error) {
      if (error instanceof CertmanAuthenticationError) {
        console.error("Error: Invalid API key");
        process.exit(1);
      }
      throw error;
    }

    const config = loadConfigFile();
    config.apiKey = apiKey;
    saveConfigFile(config);

    console.log("API key saved to ~/.certman/config.json");
  },
});
