import express from "express";
import http from "http";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import { ENV } from "./config/env.js";

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

io.of("/team-chat").on("connection", (socket) => {
  console.log("team-chat connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("team-chat disconnected:", socket.id);
  });
});

server.listen(ENV.PORT, () => {
  console.log(`Server running on port ${ENV.PORT}`);
});
