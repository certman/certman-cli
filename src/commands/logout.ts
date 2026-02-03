import { defineCommand } from "citty";
import { loadConfigFile, saveConfigFile } from "../config.js";

export default defineCommand({
  meta: {
    name: "logout",
    description: "Remove stored API key",
  },
  async run() {
    const config = loadConfigFile();
    delete config.apiKey;
    saveConfigFile(config);

    console.log("API key removed from ~/.certman/config.json");
  },
});
