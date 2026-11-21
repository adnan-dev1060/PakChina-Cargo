import type { CookieOptions, RequestHandler } from "express";
import { cookieSecure, env } from "../config/env.js";
import { AdminUser, type Role } from "../models/system.models.js";
import { verifyAccessToken } from "../modules/auth/auth.service.js";
import { HttpError } from "../utils/http.js";

export const ACCESS_COOKIE = "pcc_at";
export const REFRESH_COOKIE = "pcc_rt";

const base: CookieOptions = { httpOnly: true, secure: cookieSecure, sameSite: env.COOKIE_SAMESITE };

export const accessCookieOptions: CookieOptions = { ...base, path: "/", maxAge: env.ACCESS_TOKEN_TTL_MIN * 60_000 };
/** The refresh token is only ever sent to the auth routes. */
export const refreshCookieOptions: CookieOptions = {
  ...base,
  path: "/api/v1/auth",
  maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86_400_000,
};

export interface AuthUser {
  id: string;
  role: Role;
  name: string;
  email: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

/** Verifies the access-token cookie and loads the admin (so deactivated accounts lose access immediately). */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = req.cookies?.[ACCESS_COOKIE] as string | undefined;
  if (!token) throw new HttpError(401, "Authentication required");

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new HttpError(401, "Session expired");
  }

  const user = await AdminUser.findById(payload.sub).lean();
  if (!user || !user.active) throw new HttpError(401, "Authentication required");

  req.user = { id: String(user._id), role: user.role as Role, name: user.name, email: user.email };
  next();
};

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) throw new HttpError(403, "You don't have permission to do this");
    next();
  };
