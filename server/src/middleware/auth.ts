import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@agrointel/shared";
import { env } from "../config/env.js";
import { HttpError } from "../lib/http-error.js";

export interface AuthUser {
  id: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, env.JWT_SECRET, { expiresIn: "30d" });
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace(/^Bearer /, "");
  if (!token) throw new HttpError(401, "Sign in required");
  try {
    const { id, role } = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    req.user = { id, role };
  } catch {
    throw new HttpError(401, "Session expired, please sign in again");
  }
  next();
}

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) throw new HttpError(403, "Not allowed");
    next();
  };

/** The authenticated user. Only call behind `requireAuth`. */
export const currentUser = (req: Request): AuthUser => req.user!;
