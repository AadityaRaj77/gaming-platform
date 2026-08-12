import express from "express";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { registerTeamChatNamespace } from "./socketBus.js";

import { ENV } from "./config/env.js";

import authRoutes from "./auth/auth.routes.js";
import profileRoutes from "./profile/profile.route.js";
import teamRoutes from "./team/team.routes.js";
import tournamentRoutes from "./tournament/tournament.routes.js";

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: ENV.FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
};

const io = new SocketIOServer(server, {
  cors: corsOptions
});

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  req.io = io;
  next();
});

// REST routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/tournaments", tournamentRoutes);

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// TEAM CHAT (Socket.IO)
// Authentication, membership checks, persistence and events live in socketBus.js.
const teamChatNsp = io.of("/team-chat");
registerTeamChatNamespace(teamChatNsp);

const PORT = ENV.PORT;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});