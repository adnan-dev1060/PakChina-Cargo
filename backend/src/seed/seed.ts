/**
 * Seeds the database with starting content and the first admin account.
 *
 *   npm run seed            -> fills only empty collections / missing documents (safe to re-run)
 *   npm run seed -- --reset -> REPLACES all website content with the seed (admins, media and inquiries are kept)
 */
import "dotenv/config";
import { z } from "zod";
import { connectDB, disconnectDB } from "../config/db.js";
import { env } from "../config/env.js";
import { Singleton, type SingletonKey } from "../models/content.models.js";
import { AdminUser } from "../models/system.models.js";
import { passwordSchema } from "../modules/auth/auth.schemas.js";
import { hashPassword } from "../modules/auth/auth.service.js";
import { COLLECTIONS, SINGLETONS } from "../modules/content/content.routes.js";
import * as data from "./data.js";

const reset = process.argv.includes("--reset");

const collectionData: Record<keyof typeof COLLECTIONS, unknown[]> = {
  offices: data.offices,
  "shipping-modes": data.shippingModes,
  services: data.services,
  routes: data.cargoRoutes,
  commodities: data.commodities,
  "process-steps": data.processSteps,
  highlights: data.highlights,
  testimonials: data.testimonials,
  faqs: data.faqs,
  updates: data.updates,
};

const singletonData: Record<SingletonKey, unknown> = {
  settings: data.siteSettings,
  home: data.home,
  about: data.about,
};

async function seedContent() {
  for (const [segment, items] of Object.entries(collectionData) as [keyof typeof COLLECTIONS, unknown[]][]) {
    const { model, schema } = COLLECTIONS[segment];
    if (reset) await model.deleteMany({});
    const existing = await model.countDocuments();
    if (existing > 0) {
      console.log(`  ${segment}: ${existing} existing — skipped`);
      continue;
    }
    const docs = items.map((item) => schema.parse(item));
    if (docs.length) await model.insertMany(docs);
    console.log(`  ${segment}: inserted ${docs.length}`);
  }

  for (const [key, value] of Object.entries(singletonData) as [SingletonKey, unknown][]) {
    if (!reset && (await Singleton.exists({ key }))) {
      console.log(`  ${key}: exists — skipped`);
      continue;
    }
    await Singleton.findOneAndUpdate({ key }, { data: JSON.parse(JSON.stringify(SINGLETONS[key].parse(value))) }, { upsert: true });
    console.log(`  ${key}: saved`);
  }
}

async function seedAdmin() {
  if (await AdminUser.exists({ role: "super_admin" })) {
    console.log("  admin: a super admin already exists — skipped");
    return;
  }
  const input = z
    .object({
      SEED_ADMIN_NAME: z.string().trim().min(2).default("Administrator"),
      SEED_ADMIN_EMAIL: z.email(),
      SEED_ADMIN_PASSWORD: passwordSchema,
    })
    .safeParse({ ...process.env, SEED_ADMIN_NAME: process.env.SEED_ADMIN_NAME || undefined });

  if (!input.success) {
    console.warn("  admin: NOT created — set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (10+ chars, letter + number) in .env");
    console.warn("    " + z.prettifyError(input.error).replace(/\n/g, "\n    "));
    return;
  }
  await AdminUser.create({
    name: input.data.SEED_ADMIN_NAME,
    email: input.data.SEED_ADMIN_EMAIL,
    passwordHash: await hashPassword(input.data.SEED_ADMIN_PASSWORD),
    role: "super_admin",
  });
  console.log(`  admin: created super admin ${input.data.SEED_ADMIN_EMAIL}`);
}

async function main() {
  await connectDB(env.MONGODB_URI, env.DNS_SERVERS);
  console.log(reset ? "Resetting website content..." : "Seeding (empty collections only)...");
  await seedContent();
  await seedAdmin();
  // Ensure unique indexes exist before the app starts taking writes.
  await Promise.all(Object.values(COLLECTIONS).map((c) => c.model.init()));
  console.log("Done.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());

