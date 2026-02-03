import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    testTimeout: 30000,
    hookTimeout: 30000,
    setupFiles: ["tests/integration/setup.ts"],
    // Run tests serially to avoid config file conflicts
    fileParallelism: false,
    sequence: {
      shuffle: false,
    },
  },
});
