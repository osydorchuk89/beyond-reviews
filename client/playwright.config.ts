import { defineConfig, devices } from "@playwright/test";

if (
    process.env.CI &&
    process.argv.some(
        (argument) =>
            argument === "-u" || argument.startsWith("--update-snapshots"),
    )
) {
    throw new Error(
        "Accessibility baselines must be reviewed locally, not updated in CI.",
    );
}

export default defineConfig({
    testDir: "./tests/accessibility",
    testMatch: "**/*.spec.ts",
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    workers: 2,
    timeout: 45_000,
    expect: { timeout: 10_000 },
    updateSnapshots: "none",
    snapshotPathTemplate: "{testDir}/baselines/{arg}{ext}",
    reporter: [
        [process.env.CI ? "github" : "list"],
        ["html", { open: "never" }],
        ["json", { outputFile: "test-results/results.json" }],
    ],
    use: {
        baseURL: "http://127.0.0.1:5174",
        serviceWorkers: "block",
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
    },
    projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
    webServer: {
        command: "npm run dev -- --host 127.0.0.1 --port 5174 --strictPort",
        url: "http://127.0.0.1:5174",
        reuseExistingServer: false,
        timeout: 60_000,
    },
});
