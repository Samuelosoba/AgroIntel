import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { AuthResponse, User } from "@agrointel/shared";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../lib/http-error.js";
import { currentUser, requireAuth, signToken } from "../../middleware/auth.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
  countryCode: z.string().length(2).default("NG"),
  language: z.string().default("en"),
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

const toUser = (u: User): User => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  countryCode: u.countryCode,
  language: u.language,
});

router.post("/register", async (req, res) => {
  const { password, ...data } = registerSchema.parse(req.body);
  if (await prisma.user.findUnique({ where: { email: data.email } })) {
    throw new HttpError(409, "An account with this email already exists");
  }
  const user = await prisma.user.create({ data: { ...data, passwordHash: await bcrypt.hash(password, 10) } });
  const body: AuthResponse = { token: signToken({ id: user.id, role: user.role }), user: toUser(user) };
  res.status(201).json(body);
});

router.post("/login", async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, "Wrong email or password");
  }
  const body: AuthResponse = { token: signToken({ id: user.id, role: user.role }), user: toUser(user) };
  res.json(body);
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: currentUser(req).id } });
  res.json(toUser(user));
});

export default router;
