import { defineConfig } from "@playwright/test";

import { WEB_PORT } from "./e2e/ports.ts";

const baseURL = `http://127.0.0.1:${WEB_PORT}`;

export default defineConfig({
  testDir: "e2e",
  testMatch: "*.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  outputDir: "test-results",
  use: {
    baseURL,
    acceptDownloads: true,
  },
  webServer: {
    command: "node e2e/serve.ts",
    url: baseURL,
    timeout: 180_000,
    reuseExistingServer: false,
  },
});
