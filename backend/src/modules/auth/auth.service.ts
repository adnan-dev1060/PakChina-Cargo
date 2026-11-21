import bcrypt from "bcryptjs";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { AdminUser, Session, type Role } from "../../models/system.models.js";
import { HttpError } from "../../utils/http.js";

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
const BCRYPT_ROUNDS = 12;

export interface AccessTokenPayload {
  sub: string;
  role: Role;
}

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_ROUNDS);
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export function signAccessToken(userId: string, role: Role) {
  return jwt.sign({ sub: userId, role } satisfies AccessTokenPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: `${env.ACCESS_TOKEN_TTL_MIN}m`,
    algorithm: "HS256",
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ["HS256"] }) as AccessTokenPayload;
}

async function createSession(userId: string, userAgent: string | undefined, family: string = randomUUID()) {
  const refreshToken = randomBytes(48).toString("base64url");
  await Session.create({
    user: userId,
    tokenHash: sha256(refreshToken),
    family,
    userAgent: userAgent?.slice(0, 300),
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000),
  });
  return refreshToken;
}

// Compared against when the email doesn't exist, so response time doesn't reveal valid accounts.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);

export async function login(email: string, password: string, userAgent?: string) {
  const user = await AdminUser.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash +failedLogins +lockUntil");

  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    throw new HttpError(401, "Invalid email or password");
  }
  if (user.lockUntil && user.lockUntil > new Date()) {
    throw new HttpError(429, "Too many failed attempts. Please try again in a few minutes.");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid || !user.active) {
    if (!valid) {
      user.failedLogins = (user.failedLogins ?? 0) + 1;
      if (user.failedLogins >= MAX_FAILED_LOGINS) {
        user.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60_000);
        user.failedLogins = 0;
      }
      await user.save();
    }
    throw new HttpError(401, "Invalid email or password");
  }

  user.failedLogins = 0;
  user.lockUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = signAccessToken(String(user._id), user.role as Role);
  const refreshToken = await createSession(String(user._id), userAgent);
  return { user, accessToken, refreshToken };
}

/**
 * Rotates a refresh token. Re-using an already-rotated token revokes the whole
 * session family (likely theft), forcing a fresh login.
 */
export async function refresh(refreshToken: string, userAgent?: string) {
  const session = await Session.findOne({ tokenHash: sha256(refreshToken) });
  if (!session || session.expiresAt < new Date()) throw new HttpError(401, "Session expired");

  if (session.revokedAt) {
    await Session.updateMany({ family: session.family, revokedAt: null }, { revokedAt: new Date() });
    throw new HttpError(401, "Session expired");
  }

  const user = await AdminUser.findById(session.user);
  if (!user || !user.active) {
    session.revokedAt = new Date();
    await session.save();
    throw new HttpError(401, "Session expired");
  }

  session.revokedAt = new Date();
  await session.save();

  const accessToken = signAccessToken(String(user._id), user.role as Role);
  const newRefreshToken = await createSession(String(user._id), userAgent, session.family);
  return { user, accessToken, refreshToken: newRefreshToken };
}

export async function logout(refreshToken: string | undefined) {
  if (!refreshToken) return;
  const session = await Session.findOne({ tokenHash: sha256(refreshToken) });
  if (session) await Session.updateMany({ family: session.family, revokedAt: null }, { revokedAt: new Date() });
}

export async function revokeAllSessions(userId: string) {
  await Session.updateMany({ user: userId, revokedAt: null }, { revokedAt: new Date() });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await AdminUser.findById(userId).select("+passwordHash");
  if (!user) throw new HttpError(404, "User not found");
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new HttpError(400, "Current password is incorrect");
  }
  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  await revokeAllSessions(userId);
}
