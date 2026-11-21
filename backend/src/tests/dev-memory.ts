/**
 * Runs the API against a throwaway in-memory MongoDB, seeded with the starting content
 * and a test admin — for trying the admin dashboard without touching the real database.
 *
 *   npm run dev:memory
 *   Test admin: admin@example.test / TestPassw0rd!
 *
 * Note: Cloudinary keys from .env are still used, so uploads go to the real Cloudinary account.
 */
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { MongoMemoryServer } from "mongodb-memory-server";
import { useProjectTempDir } from "./memory-temp.js";

const TEST_ADMIN = { email: "admin@example.test", password: "TestPassw0rd!" };

// Resolve paths from this file so it works no matter which folder it is launched from.
const backendDir = fileURLToPath(new URL("../../", import.meta.url));
process.env.MONGOMS_DOWNLOAD_DIR ??= fileURLToPath(new URL("../../node_modules/.cache/mongodb-memory-server", import.meta.url));
process.chdir(backendDir);
useProjectTempDir();

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri("pcc_dev");

const seed = await promisify(execFile)(process.execPath, ["--import", "tsx", "src/seed/seed.ts"], {
  env: { ...process.env, SEED_ADMIN_NAME: "Test Admin", SEED_ADMIN_EMAIL: TEST_ADMIN.email, SEED_ADMIN_PASSWORD: TEST_ADMIN.password },
});
process.stdout.write(seed.stdout);

const { connectDB } = await import("../config/db.js");
const { createApp } = await import("../app.js");
const { env } = await import("../config/env.js");
await connectDB(env.MONGODB_URI);
createApp().listen(env.PORT, () => {
  console.log(`In-memory API on http://localhost:${env.PORT}/api/v1 — sign in as ${TEST_ADMIN.email}`);
});

const stop = async () => {
  await mongo.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
