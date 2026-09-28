import { defineConfig } from "@playwright/test";

const production = process.env.CI === "true";

export default defineConfig({
  testDir: "./tests",
  workers: 1,
  fullyParallel: false,
  use: { baseURL: "http://localhost:3100" },
  webServer: {
    command: production
      ? "npm run start -- --port 3100"
      : "npm run dev -- --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      NEXT_DIST_DIR: production ? ".next" : ".next-test",
      DATABASE_PATH: `/tmp/offday-test-${Date.now()}.db`,
      // The test server is local HTTP, including when testing the production build.
      COOKIE_SECURE: "false",
    },
  },
});
