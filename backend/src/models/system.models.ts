import "../config/db.js";
import mongoose, { Schema, type InferSchemaType } from "mongoose";

/* --------------------------------- Admins --------------------------------- */

export const ROLES = ["super_admin", "editor"] as const;
export type Role = (typeof ROLES)[number];

const adminUserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "editor" },
    active: { type: Boolean, default: true },
    lastLoginAt: Date,
    failedLogins: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
  },
  { timestamps: true },
);
// password hash and lockout fields are hidden from JSON by the global plugin in config/db.ts (select: false).
export const AdminUser = mongoose.model("AdminUser", adminUserSchema);
export type AdminUserDoc = InferSchemaType<typeof adminUserSchema> & { _id: mongoose.Types.ObjectId };

/* -------------------------------- Sessions -------------------------------- */
/** One row per refresh token (stored hashed). Rotated on every refresh. */
const sessionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    family: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: Date,
    userAgent: String,
  },
  { timestamps: true },
);
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const Session = mongoose.model("Session", sessionSchema);

/* ---------------------------------- Media --------------------------------- */

const mediaSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true, unique: true },
    folder: { type: String, default: "general", index: true },
    alt: { type: String, default: "", trim: true },
    width: Number,
    height: Number,
    format: String,
    bytes: Number,
    uploadedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true },
);
export const Media = mongoose.model("Media", mediaSchema);

/* -------------------------------- Inquiries ------------------------------- */

export const INQUIRY_STATUSES = ["new", "in_progress", "replied", "closed"] as const;

const inquirySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    city: { type: String, required: true, trim: true },
    mode: { type: String, enum: ["sea", "air", "road", "not-sure"], default: "not-sure" },
    cargoType: { type: String, required: true, trim: true },
    message: { type: String, default: "", trim: true },
    status: { type: String, enum: INQUIRY_STATUSES, default: "new", index: true },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);
inquirySchema.index({ createdAt: -1 });
export const Inquiry = mongoose.model("Inquiry", inquirySchema);
