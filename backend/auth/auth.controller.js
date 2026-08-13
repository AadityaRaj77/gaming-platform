import bcrypt from "bcrypt";
import { prisma } from "../db/prisma.js";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";

const validateCredentials = (username, password) => {
  if (typeof username !== "string" || typeof password !== "string") return false;
  const normalizedUsername = username.trim();
  return normalizedUsername.length >= 3 && normalizedUsername.length <= 50 && password.length >= 8;
};

export const register = async (req, res) => {
  try {
    const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
    const password = req.body?.password;

    if (!validateCredentials(username, password)) {
      return res.status(400).json({ message: "Username must be 3-50 characters and password must be at least 8 characters" });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(400).json({ message: "Username already taken" });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { username, passwordHash: hash } });

    const token = jwt.sign({ userId: user.id }, ENV.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token });
  } catch (err) {
    console.error("register:", err);
    res.status(500).json({ message: "Register failed" });
  }
};

export const login = async (req, res) => {
  try {
    const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
    const password = req.body?.password;

    if (!validateCredentials(username, password)) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id }, ENV.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token });
  } catch (err) {
    console.error("login:", err);
    res.status(500).json({ message: "Login failed" });
  }
};
