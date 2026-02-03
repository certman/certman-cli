import { readFileSync, writeFileSync } from "fs";
import { createHash } from "crypto";

function calculateSha256FromFile(path: string): string {
  const buffer = readFileSync(path);
  const hash = createHash("sha256");
  hash.update(buffer);
  return hash.digest("hex");
}

function generateFormula(version: string, binaries: Record<string, string>): string {
  // Note: #{version} and #{bin} are Ruby string interpolation, not JS template literals
  return `# typed: false
# frozen_string_literal: true

class Certman < Formula
  desc "Create and manage your own Certificate Authority for internal HTTPS - simply, securely, and under your control."
  homepage "https://certman.app"
  version "${version}"
  license "MIT"

  on_macos do
    on_arm do
      url "https://github.com/certman/certman-cli/releases/download/v#{version}/certman-darwin-arm64.tar.gz"
      sha256 "${binaries["darwin-arm64"]}"

      def install
        bin.install "certman-darwin-arm64" => "certman"
      end
    end

    on_intel do
      url "https://github.com/certman/certman-cli/releases/download/v#{version}/certman-darwin-amd64.tar.gz"
      sha256 "${binaries["darwin-amd64"]}"

      def install
        bin.install "certman-darwin-amd64" => "certman"
      end
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/certman/certman-cli/releases/download/v#{version}/certman-linux-arm64.tar.gz"
      sha256 "${binaries["linux-arm64"]}"

      def install
        bin.install "certman-linux-arm64" => "certman"
      end
    end

    on_intel do
      url "https://github.com/certman/certman-cli/releases/download/v#{version}/certman-linux-amd64.tar.gz"
      sha256 "${binaries["linux-amd64"]}"

      def install
        bin.install "certman-linux-amd64" => "certman"
      end
    end
  end

  test do
    assert_match "certman", shell_output("#{bin}/certman --help")
  end
end
`;
}

function main() {
  const version = process.env.VERSION;
  const artifactsDir = process.env.ARTIFACTS_DIR || "artifacts";

  if (!version) {
    console.error("VERSION environment variable is required");
    process.exit(1);
  }

  console.log(`Updating Homebrew formula for version ${version}`);

  const targets = ["darwin-arm64", "darwin-amd64", "linux-arm64", "linux-amd64"];
  const binaries: Record<string, string> = {};

  for (const target of targets) {
    const artifactName = `certman-${target}.tar.gz`;
    const filePath = `${artifactsDir}/${artifactName}/${artifactName}`;

    console.log(`Calculating SHA256 for ${artifactName}...`);
    binaries[target] = calculateSha256FromFile(filePath);
    console.log(`  ${target}: ${binaries[target]}`);
  }

  const formula = generateFormula(version, binaries);
  writeFileSync("certman.rb", formula);

  console.log("Formula written to certman.rb");
}

main();
