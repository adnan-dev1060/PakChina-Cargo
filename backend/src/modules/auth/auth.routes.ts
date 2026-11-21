import { Router, type Response } from "express";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
  requireAuth,
} from "../../middleware/auth.js";
import { loginLimiter } from "../../middleware/security.js";
import { AdminUser } from "../../models/system.models.js";
import { HttpError, ok } from "../../utils/http.js";
import { changePasswordSchema, loginSchema } from "./auth.schemas.js";
import * as auth from "./auth.service.js";

export const authRouter = Router();

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_COOKIE, accessToken, accessCookieOptions);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);
}

function clearAuthCookies(res: Response) {
  const { maxAge: _a, ...access } = accessCookieOptions;
  const { maxAge: _r, ...refresh } = refreshCookieOptions;
  res.clearCookie(ACCESS_COOKIE, access);
  res.clearCookie(REFRESH_COOKIE, refresh);
}

authRouter.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const { user, accessToken, refreshToken } = await auth.login(email, password, req.get("user-agent"));
  setAuthCookies(res, accessToken, refreshToken);
  res.json(ok({ user }));
});

authRouter.post("/refresh", async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (!token) throw new HttpError(401, "Session expired");
  try {
    const { user, accessToken, refreshToken } = await auth.refresh(token, req.get("user-agent"));
    setAuthCookies(res, accessToken, refreshToken);
    res.json(ok({ user }));
  } catch (err) {
    clearAuthCookies(res);
    throw err;
  }
});

authRouter.post("/logout", async (req, res) => {
  await auth.logout(req.cookies?.[REFRESH_COOKIE]);
  clearAuthCookies(res);
  res.json(ok({ loggedOut: true }));
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await AdminUser.findById(req.user!.id);
  res.json(ok({ user }));
});

authRouter.post("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  await auth.changePassword(req.user!.id, currentPassword, newPassword);
  clearAuthCookies(res);
  res.json(ok({ changed: true, message: "Password changed. Please sign in again." }));
});
