import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";

export const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    req.user = { userId: decoded.userId };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
