import { Router } from "express";
import { z } from "zod";
import { AdminUser, ROLES } from "../../models/system.models.js";
import { HttpError, ok } from "../../utils/http.js";
import { passwordSchema } from "../auth/auth.schemas.js";
import { hashPassword, revokeAllSessions } from "../auth/auth.service.js";

/** Admin account management — mounted behind requireRole("super_admin"). */
export const userRouter = Router();

const createInput = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(160),
  password: passwordSchema,
  role: z.enum(ROLES).default("editor"),
});

const updateInput = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  role: z.enum(ROLES).optional(),
  active: z.boolean().optional(),
  password: passwordSchema.optional(),
});

async function assertNotLastSuperAdmin(userId: string) {
  const others = await AdminUser.countDocuments({ _id: { $ne: userId }, role: "super_admin", active: true });
  if (others === 0) throw new HttpError(400, "There must always be at least one active super admin");
}

userRouter.get("/", async (_req, res) => {
  res.json(ok(await AdminUser.find().sort({ createdAt: 1 })));
});

userRouter.post("/", async (req, res) => {
  const { password, ...data } = createInput.parse(req.body);
  if (await AdminUser.exists({ email: data.email.toLowerCase() })) {
    throw new HttpError(409, "An admin with this email already exists");
  }
  const user = await AdminUser.create({ ...data, passwordHash: await hashPassword(password) });
  res.status(201).json(ok(user));
});

userRouter.patch("/:id", async (req, res) => {
  const { password, ...data } = updateInput.parse(req.body);
  const user = await AdminUser.findById(req.params.id);
  if (!user) throw new HttpError(404, "Admin not found");

  const losingSuperAdmin =
    user.role === "super_admin" && ((data.role && data.role !== "super_admin") || data.active === false);
  if (losingSuperAdmin) await assertNotLastSuperAdmin(String(user._id));

  user.set(data);
  if (password) user.passwordHash = await hashPassword(password);
  await user.save();
  if (password || data.active === false) await revokeAllSessions(String(user._id));
  res.json(ok(user));
});

userRouter.delete("/:id", async (req, res) => {
  if (req.params.id === req.user!.id) throw new HttpError(400, "You can't delete your own account");
  const user = await AdminUser.findById(req.params.id);
  if (!user) throw new HttpError(404, "Admin not found");
  if (user.role === "super_admin") await assertNotLastSuperAdmin(String(user._id));
  await revokeAllSessions(String(user._id));
  await user.deleteOne();
  res.json(ok({ id: req.params.id, deleted: true }));
});
