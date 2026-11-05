import { join } from "node:path";

export function monorepoRoot() {
  const cwd = process.cwd().replace(/\\/g, "/");
  if (cwd.endsWith("/apps/api") || cwd.endsWith("/apps/web")) {
    return join(process.cwd(), "../..");
  }
  return process.cwd();
}

export function storageRoot() {
  return join(monorepoRoot(), process.env.STORAGE_PATH ?? "storage/uploads");
}
