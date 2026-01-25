#!/usr/bin/env node
import { config } from "dotenv";
import { resolve } from "path";
import { spawn } from "child_process";

// Load .env.test
config({ path: resolve(process.cwd(), ".env.test") });

// Start Astro dev server
const astro = spawn("npm", ["run", "dev"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

astro.on("exit", (code) => {
  process.exit(code);
});
