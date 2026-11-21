import dns from "node:dns";
import mongoose from "mongoose";

mongoose.set("strictQuery", true);

/**
 * Every model returns `id` instead of `_id`, hides `__v`, and never serialises
 * fields marked `select: false` (password hashes, lockout counters) — even when a
 * query explicitly selected them.
 */
mongoose.plugin((schema) => {
  const hidden = Object.entries(schema.paths)
    .filter(([, type]) => (type.options as { select?: boolean }).select === false)
    .map(([path]) => path);

  schema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = String(ret._id);
      delete ret._id;
      for (const path of hidden) delete ret[path];
      return ret;
    },
  });
});

export async function connectDB(uri: string, dnsServers: string[] = []) {
  if (dnsServers.length) dns.setServers(dnsServers);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  console.log(`MongoDB connected (${mongoose.connection.name})`);
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
