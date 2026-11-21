/**
 * The in-memory MongoDB used by the tests and `npm run dev:memory` still writes its data files
 * (~200 MB per run) to a temporary folder. By default that is the Windows temp folder on C:,
 * and runs that are stopped abruptly leave their folder behind.
 *
 * Call this before MongoMemoryServer.create() to:
 *  - keep those files inside this project (node_modules/.cache/mongo-tmp, ignored by git), and
 *  - delete folders left over from earlier runs.
 */
import { mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** Older than this, a leftover folder is assumed to belong to a run that has ended. */
const STALE_AFTER_MS = 6 * 60 * 60 * 1000;

export function useProjectTempDir() {
  const dir = fileURLToPath(new URL("../../node_modules/.cache/mongo-tmp", import.meta.url));
  mkdirSync(dir, { recursive: true });

  for (const name of readdirSync(dir)) {
    if (!name.startsWith("mongo-mem-")) continue;
    const path = join(dir, name);
    try {
      if (Date.now() - statSync(path).mtimeMs > STALE_AFTER_MS) rmSync(path, { recursive: true, force: true });
    } catch {
      // Still in use by another run, or already gone — leave it.
    }
  }

  // os.tmpdir() reads these, and mongodb-memory-server creates its folders there.
  process.env.TEMP = dir;
  process.env.TMP = dir;
  process.env.TMPDIR = dir;
  return dir;
}
