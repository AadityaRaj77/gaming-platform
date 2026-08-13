import jwt from "jsonwebtoken";
import { prisma } from "./db/prisma.js";
import { ENV } from "./config/env.js";

let teamChatNsp = null;

const getTeamId = (teamId) => {
  const id = Number(teamId);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const isMemberOfTeam = async (teamId, userId) => {
  const member = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: Number(userId)
      }
    }
  });

  return Boolean(member);
};

const getOrCreateTeamRoom = async (teamId) => {
  let room = await prisma.chatRoom.findFirst({
    where: {
      type: "TEAM",
      teamId
    }
  });

  if (!room) {
    room = await prisma.chatRoom.create({
      data: {
        type: "TEAM",
        teamId
      }
    });
  }

  return room;
};

export const registerTeamChatNamespace = (nsp) => {
  teamChatNsp = nsp;

  nsp.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization || "").replace("Bearer ", "");

      if (!token) return next(new Error("No auth token"));

      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      socket.userId = Number(decoded.userId);

      if (!socket.userId) return next(new Error("Invalid auth token"));

      next();
    } catch (err) {
      console.error("socket auth error:", err.message);
      next(new Error("Unauthorized"));
    }
  });

  nsp.on("connection", (socket) => {
    console.log("team-chat connected:", socket.id, "user:", socket.userId);
    socket.join(`user:${socket.userId}`);

    socket.on("joinTeam", async ({ teamId }) => {
      try {
        const id = getTeamId(teamId);
        if (!id) {
          return socket.emit("error", { message: "Invalid teamId" });
        }

        if (!(await isMemberOfTeam(id, socket.userId))) {
          return socket.emit("error", { message: "Not a member of this team" });
        }

        await getOrCreateTeamRoom(id);
        socket.join(`team:${id}`);
        socket.emit("joinedTeam", { teamId: id });
      } catch (err) {
        console.error("joinTeam error:", err);
        socket.emit("error", { message: "Failed to join team" });
      }
    });

    socket.on("sendMessage", async ({ teamId, content }) => {
      try {
        const id = getTeamId(teamId);
        const text = typeof content === "string" ? content.trim() : "";

        if (!id) {
          return socket.emit("error", { message: "Invalid teamId" });
        }

        if (!text) {
          return socket.emit("error", { message: "Message cannot be empty" });
        }

        if (!(await isMemberOfTeam(id, socket.userId))) {
          return socket.emit("error", { message: "Not a member of this team" });
        }

        const room = await getOrCreateTeamRoom(id);
        const message = await prisma.chatMessage.create({
          data: {
            roomId: room.id,
            senderId: socket.userId,
            content: text
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true
              }
            }
          }
        });

        nsp.to(`team:${id}`).emit("newMessage", {
          ...message,
          teamId: id
        });
      } catch (err) {
        console.error("sendMessage error:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("loadHistory", async ({ teamId, limit = 50 }) => {
      try {
        const id = getTeamId(teamId);
        if (!id) {
          return socket.emit("error", { message: "Invalid teamId" });
        }

        if (!(await isMemberOfTeam(id, socket.userId))) {
          return socket.emit("error", { message: "Not a member of this team" });
        }

        const room = await getOrCreateTeamRoom(id);
        const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

        const messages = await prisma.chatMessage.findMany({
          where: { roomId: room.id },
          include: {
            sender: {
              select: {
                id: true,
                username: true
              }
            }
          },
          orderBy: { createdAt: "asc" },
          take: safeLimit
        });

        socket.emit("history", {
          teamId: id,
          messages
        });
      } catch (err) {
        console.error("loadHistory error:", err);
        socket.emit("error", { message: "Failed to load history" });
      }
    });

    socket.on("disconnect", () => {
      console.log("team-chat disconnected:", socket.id);
    });
  });
};

export const emitToUser = (userId, event, payload) => {
  if (!teamChatNsp) return;
  teamChatNsp.to(`user:${userId}`).emit(event, payload);
};

export const emitToTeam = (teamId, event, payload) => {
  if (!teamChatNsp) return;
  teamChatNsp.to(`team:${teamId}`).emit(event, payload);
};
