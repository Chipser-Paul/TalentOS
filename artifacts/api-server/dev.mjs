import { config } from "dotenv";
import { spawnSync } from "node:child_process";
import path from "node:path";

const rootEnvPath = path.resolve(import.meta.dirname, "..", "..", ".env");
config({ path: rootEnvPath });

const mode = process.argv[2] ?? "build-and-start";

if (mode === "build") {
  spawnSync("pnpm", ["run", "build"], { stdio: "inherit", env: process.env });
} else if (mode === "start") {
  process.env.NODE_ENV = process.env.NODE_ENV || "development";
  spawnSync("node", ["--enable-source-maps", "./dist/index.mjs"], { stdio: "inherit", env: process.env });
} else {
  spawnSync("pnpm", ["run", "build"], { stdio: "inherit", env: process.env });
  process.env.NODE_ENV = process.env.NODE_ENV || "development";
  spawnSync("node", ["--enable-source-maps", "./dist/index.mjs"], { stdio: "inherit", env: process.env });
}
