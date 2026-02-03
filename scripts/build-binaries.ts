import { $ } from "bun";
import { mkdirSync, existsSync } from "node:fs";

const targets = [
  { name: "linux-x64", target: "bun-linux-x64" },
  { name: "linux-arm64", target: "bun-linux-arm64" },
  { name: "darwin-x64", target: "bun-darwin-x64" },
  { name: "darwin-arm64", target: "bun-darwin-arm64" },
  { name: "windows-x64", target: "bun-windows-x64" },
];

const outDir = "bin";

async function build() {
  // Ensure output directory exists
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  console.log("Building binaries...\n");

  for (const { name, target } of targets) {
    const ext = name.startsWith("windows") ? ".exe" : "";
    const outFile = `${outDir}/certman-${name}${ext}`;

    console.log(`Building ${name}...`);

    try {
      await $`bun build dist/index.js --compile --target=${target} --outfile=${outFile}`;
      console.log(`  -> ${outFile}`);
    } catch (error) {
      console.error(`  Failed to build ${name}:`, error);
    }
  }

  console.log("\nDone!");
}

build();
