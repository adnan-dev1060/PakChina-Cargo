import { Router } from "express";
import { ok } from "../../utils/http.js";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json(ok({ status: "ok", uptime: Math.round(process.uptime()), timestamp: new Date().toISOString() }));
});
