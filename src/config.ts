import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";

export interface Config {
  apiKey?: string;
  apiUrl?: string;
}

const CONFIG_DIR = join(homedir(), ".certman");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

export function loadConfigFile(): Config {
  if (!existsSync(CONFIG_PATH)) {
    return {};
  }
  try {
    const content = readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(content) as Config;
  } catch {
    return {};
  }
}

export function saveConfigFile(config: Config): void {
  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n");
}

export function getApiKey(cliFlag?: string): string | undefined {
  // Priority: CLI flag > env var > config file
  if (cliFlag) {
    return cliFlag;
  }
  if (process.env.CERTMAN_API_KEY) {
    return process.env.CERTMAN_API_KEY;
  }
  const config = loadConfigFile();
  return config.apiKey;
}

export function getApiUrl(cliFlag?: string): string | undefined {
  if (cliFlag) {
    return cliFlag;
  }
  if (process.env.CERTMAN_API_URL) {
    return process.env.CERTMAN_API_URL;
  }
  const config = loadConfigFile();
  return config.apiUrl;
}
