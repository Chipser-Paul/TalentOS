import { getAuth } from "@clerk/express";
import type { RequestHandler } from "express";

export const requireAuth: RequestHandler = (req, res, next) => {
  const auth = getAuth(req);
  const userId = auth.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.locals.userId = userId;
  next();
};

export function getAuthenticatedUserId(res: { locals: Record<string, unknown> }): string {
  const userId = res.locals.userId;
  if (typeof userId !== "string") {
    throw new Error("Authenticated user id is missing");
  }
  return userId;
}