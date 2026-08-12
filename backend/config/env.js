import dotenv from "dotenv";

dotenv.config();

export const ENV = {
  PORT: Number(process.env.PORT) || 4000,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173"
};

if (!ENV.JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}
