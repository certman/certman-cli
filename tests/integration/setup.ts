import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// Load .env.local if it exists
const envPath = join(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join("=").trim();
    }
  }
}

// Verify API key is available
if (!process.env.CERTMAN_API_KEY) {
  console.error(
    "CERTMAN_API_KEY environment variable is required for integration tests"
  );
  console.error("Create a .env.local file with CERTMAN_API_KEY=<your-key>");
  process.exit(1);
}
