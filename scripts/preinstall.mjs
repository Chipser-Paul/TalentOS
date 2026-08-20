import { unlink } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
  await unlink(join(__dirname, "..", "package-lock.json"));
} catch {
  // ignore if missing
}

try {
  await unlink(join(__dirname, "..", "yarn.lock"));
} catch {
  // ignore if missing
}

const userAgent = process.env.npm_config_user_agent ?? "";

if (!userAgent.startsWith("pnpm/")) {
  console.error(`Use pnpm instead (detected: ${userAgent || "(unknown)"})`);
  process.exit(1);
}
