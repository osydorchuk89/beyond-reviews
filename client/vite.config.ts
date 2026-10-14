import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        watch: {
            // Test snapshots and reports must not reload pages during browser checks.
            ignored: [
                "**/tests/**",
                "**/test-results/**",
                "**/playwright-report/**",
            ],
        },
    },
});
