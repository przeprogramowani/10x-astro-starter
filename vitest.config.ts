import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Use happy-dom for DOM testing (lighter and more compatible than jsdom)
    environment: "happy-dom",
    
    // Global setup
    globals: true,
    
    // Setup files
    setupFiles: ["./src/test/setup.ts"],
    
    // Use threads pool instead of forks to avoid ES module issues
    pool: "threads",
    
    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData",
        "dist/",
      ],
    },
    
    // Test file patterns
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    
    // Exclude patterns
    exclude: [
      "node_modules",
      "dist",
      ".astro",
      "e2e",
    ],
  },
  
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
