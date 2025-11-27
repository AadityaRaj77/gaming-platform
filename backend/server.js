import express from "express";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from "socket.io";

import { ENV } from "./config/env.js";
import authRoutes from "./auth/auth.routes.js";
import profileRoutes from "./profile/profile.route.js";

const app = express();
const server = http.createServer(app);

// Socket.IO (future use)
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// ---------- MIDDLEWARE ----------
app.use(cors());
app.use(express.json());

// ---------- ROUTES ----------
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);

// ---------- HEALTH ----------
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// ---------- SOCKET ----------
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
});

// ---------- START ----------
const PORT = ENV.PORT || 4000;

server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
