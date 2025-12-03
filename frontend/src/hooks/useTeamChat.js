import { useEffect, useState } from "react";
import { connectTeamSocket, getTeamSocket } from "../socket/teamSocket";

export const useTeamChat = (teamId) => {
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const socket = connectTeamSocket(token);

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("joinTeam", { teamId });
      socket.emit("loadHistory", { teamId, limit: 50 });
    });

    socket.on("history", ({ messages }) => {
      setMessages(messages);
    });

    socket.on("newMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("error", (err) => {
      console.error("Socket error:", err);
    });

    return () => {
      socket.disconnect();
    };
  }, [teamId]);

  const sendMessage = (content) => {
    const socket = getTeamSocket();
    if (!socket) return;
    socket.emit("sendMessage", { teamId, content });
  };

  return { messages, sendMessage, connected };
};
