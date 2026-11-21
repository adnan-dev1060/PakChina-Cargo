import "../config/db.js";
/**
 * Mongoose models for admin-managed content.
 * Writes are validated with the Zod schemas in modules/content/content.schemas.ts first;
 * the Mongoose schemas add storage-level guarantees (required fields, unique slugs, indexes).
 */
import mongoose, { Schema, type SchemaDefinition } from "mongoose";

const str = (required = true) => ({ type: String, trim: true, required });
const strList = { type: [String], default: [] };
const modeEnum = { type: String, enum: ["sea", "air", "road"], required: true };

function collection(name: string, fields: SchemaDefinition, indexes: Record<string, 1 | -1>[] = []) {
  const schema = new Schema(
    {
      ...fields,
      order: { type: Number, default: 0, index: true },
      published: { type: Boolean, default: true, index: true },
    },
    { timestamps: true },
  );
  for (const idx of indexes) schema.index(idx);
  return mongoose.model(name, schema);
}

export const Office = collection("Office", {
  city: str(),
  label: str(),
  address: str(false),
  phone: str(false),
  mapQuery: str(),
});

export const ShippingMode = collection("ShippingMode", {
  mode: modeEnum,
  title: str(),
  transitTime: str(),
  summary: str(),
  bestFor: strList,
  imageUrl: str(),
});

export const Service = collection("Service", {
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  title: str(),
  summary: str(),
  description: strList,
  icon: str(),
  imageUrl: str(),
  features: strList,
});

export const CargoRoute = collection("CargoRoute", {
  origin: str(),
  originCountry: str(),
  destination: str(),
  destinationCountry: str(),
  legs: {
    type: [new Schema({ mode: modeEnum, transitTime: str() }, { _id: false })],
    validate: [(v: unknown[]) => v.length > 0, "At least one leg is required"],
  },
  description: str(),
});

export const Commodity = collection("Commodity", {
  title: str(),
  titleUrdu: str(false),
  icon: str(),
  note: str(false),
});

export const ProcessStep = collection("ProcessStep", { title: str(), description: str(), icon: str() });

export const Highlight = collection("Highlight", { title: str(), description: str(), icon: str() });

export const Testimonial = collection("Testimonial", {
  name: str(),
  company: str(false),
  city: str(false),
  quote: str(),
  rating: { type: Number, min: 1, max: 5 },
  avatarUrl: str(false),
  /** Reviews sent from the website wait for an admin; ones the admin adds are approved straight away. */
  status: { type: String, enum: ["approved", "pending", "rejected"], default: "approved", index: true },
  source: { type: String, enum: ["admin", "website"], default: "admin" },
  /** Phone or email the client left with a website review. Admin only, never public. */
  contact: str(false),
});

export const Faq = collection("Faq", { question: str(), answer: str(), category: str(false) });

export const UpdatePost = collection(
  "UpdatePost",
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: str(),
    excerpt: str(),
    imageUrl: str(false),
    publishedAt: { type: Date, required: true },
    externalUrl: str(false),
  },
  [{ publishedAt: -1 }],
);

/**
 * Single-document content (site settings, homepage, about page), stored by key.
 * The `data` shape is enforced by the Zod schema for that key on every write.
 */
const singletonSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, enum: ["settings", "home", "about"] },
    data: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true, minimize: false },
);
export const Singleton = mongoose.model("Singleton", singletonSchema);
export type SingletonKey = "settings" | "home" | "about";
