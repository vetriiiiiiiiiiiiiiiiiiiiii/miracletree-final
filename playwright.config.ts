import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against a production build, not the dev server, because
 * dev-only behaviour (StrictMode double-mounting, Fast Refresh) produces noise
 * that has nothing to do with what ships.
 *
 * WebGL is forced through SwiftShader so the Moringa World renders identically
 * on a CI box with no GPU as it does on a laptop.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100",
    trace: "off",
    screenshot: "off",
    video: "off",
    launchOptions: {
      args: [
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
        "--disable-lcd-text",
      ],
    },
  },

  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "desktop",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        storageState: "e2e/.auth/admin.json",
      },
    },
    {
      name: "mobile",
      dependencies: ["setup"],
      use: { ...devices["Pixel 7"], storageState: "e2e/.auth/admin.json" },
    },
  ],

  webServer: {
    command: "npm run start -- --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
