import { createApp } from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { cloudinaryConfigured, env } from "./config/env.js";

async function main() {
  await connectDB(env.MONGODB_URI, env.DNS_SERVERS);
  if (!cloudinaryConfigured) console.warn("Cloudinary is not configured — image uploads will return 503.");

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`Pak China Cargo API listening on http://localhost:${env.PORT}/api/v1`);
  });

  const shutdown = () => server.close(() => disconnectDB().finally(() => process.exit(0)));
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Failed to start server:", err instanceof Error ? err.message : err);
  process.exit(1);
});
