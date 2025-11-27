import bcrypt from "bcrypt";
import { prisma } from "../config/db.js";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";

export const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    const existing = await prisma.user.findUnique({
      where: { username }
    });

    if (existing) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { username, passwordHash: hash }
    });

    const token = jwt.sign({ userId: user.id }, ENV.JWT_SECRET, {
      expiresIn: "7d"
    });

    res.status(201).json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Register failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id }, ENV.JWT_SECRET, {
      expiresIn: "7d"
    });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};
