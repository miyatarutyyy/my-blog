import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: {
    command: "pnpm exec next start -H 127.0.0.1 -p 3001",
    url: "http://127.0.0.1:3001",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  use: {
    baseURL: "http://127.0.0.1:3001",
  },
});
