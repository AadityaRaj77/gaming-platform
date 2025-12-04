import express from "express";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { registerTeamChatNamespace } from "./socketBus.js";
import jwt from "jsonwebtoken";

import { ENV } from "./config/env.js";
import { prisma } from "./config/db.js";

import authRoutes from "./auth/auth.routes.js";
import profileRoutes from "./profile/profile.route.js";
import teamRoutes from "./team/team.routes.js";

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});
app.use((req, res, next) => {
  req.io = io;
  next();
});


app.use(cors());
app.use(express.json());

// REST routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/teams", teamRoutes);

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});


// TEAM CHAT (Socket.IO)

const teamChatNsp = io.of("/team-chat");
registerTeamChatNamespace(teamChatNsp);


// Auth middleware for sockets
teamChatNsp.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers.authorization || "").replace("Bearer ", "");

    if (!token) {
      return next(new Error("No auth token"));
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    console.error("socket auth error:", err.message);
    next(new Error("Unauthorized"));
  }
});

// Helper: check membership
const isMemberOfTeam = async (teamId, userId) => {
  const member = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId: Number(teamId),
        userId: Number(userId)
      }
    }
  });

  console.log("MEMBER CHECK:", { teamId, userId, found: !!member });
  return !!member;
};


teamChatNsp.on("connection", (socket) => {
  console.log("team-chat connected:", socket.id, "user:", socket.userId);
  socket.join(`user:${socket.userId}`);

  // JOIN TEAM ROOM
  socket.on("joinTeam", async ({ teamId }) => {
    try {
      const idNum = Number(teamId);
      if (isNaN(idNum)) return socket.emit("error", { message: "Invalid teamId" });

      const isMember = await isMemberOfTeam(idNum, socket.userId);
      if (!isMember) {
        return socket.emit("error", { message: "Not a member of this team" });
      }

      const room = `team:${idNum}`;
      socket.join(room);
      socket.emit("joinedTeam", { teamId: idNum });
    } catch (err) {
      console.error("joinTeam error:", err);
      socket.emit("error", { message: "Failed to join team" });
    }
  });

  // SEND MESSAGE
  socket.on("sendMessage", async ({ teamId, content }) => {
    console.log("SEND RECEIVED:", { teamId, content, from: socket.userId });
  
    const idNum = Number(teamId);
  
    const isMember = await isMemberOfTeam(idNum, socket.userId);
    console.log(" MEMBER CHECK RESULT:", isMember);
  
    const msg = await prisma.teamMessage.create({
      data: {
        teamId: idNum,
        senderId: socket.userId,
        content: content.trim()
      },
      include: { sender: { select: { username: true } } }
    });
  
    console.log("DB MESSAGE CREATED:", msg);
  
    const room = `team:${idNum}`;
    teamChatNsp.to(room).emit("newMessage", msg);
  });
  

  // LOAD HISTORY
  socket.on("loadHistory", async ({ teamId, limit = 50 }) => {
    try {
      const idNum = Number(teamId);
      console.log("LOAD HISTORY FOR:", idNum, "USER:", socket.userId);
  
      if (isNaN(idNum)) {
        console.log("INVALID TEAM ID");
        return socket.emit("error", { message: "Invalid teamId" });
      }
  
      const isMember = await isMemberOfTeam(idNum, socket.userId);
      console.log("MEMBER?", isMember);
  
      if (!isMember) {
        return socket.emit("error", { message: "Not a member of this team" });
      }
  
      const messages = await prisma.teamMessage.findMany({
        where: { teamId: idNum },
        include: {
          sender: { select: { id: true, username: true } }
        },
        orderBy: { createdAt: "asc" },
        take: limit
      });
  
      console.log("HISTORY FOUND:", messages.length);
      socket.emit("history", { teamId: idNum, messages });
    } catch (err) {
      console.error("loadHistory error:", err);
      socket.emit("error", { message: "Failed to load history" });
    }
  });
  

  socket.on("disconnect", () => {
    console.log("team-chat disconnected:", socket.id);
  });
});


const PORT = ENV.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
