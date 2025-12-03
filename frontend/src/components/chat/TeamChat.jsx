import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function TeamChat({ teamId }) {
  const [socket, setSocket] = useState(null);
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const s = io("http://localhost:4000/team-chat", {
      auth: { token }
    });

    s.on("connect", () => {
      console.log("socket connected:", s.id);
      s.emit("joinTeam", { teamId });
      s.emit("loadHistory", { teamId });
    });

    s.on("joinedTeam", () => {
      console.log("Successfully joined team room");
    });

    s.on("history", ({ messages }) => {
      setMessages(messages || []);
    });

    s.on("newMessage", (payload) => {
      setMessages((prev) => [...prev, payload]);
    });

    s.on("error", (err) => {
      console.error("socket error:", err);
    });

    setSocket(s);
    return () => s.disconnect();
  }, [teamId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!socket || !msg.trim()) return;

    socket.emit("sendMessage", {
      teamId,
      content: msg.trim()
    });

    setMsg("");
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0f1a] rounded-xl border border-purple-700/40">

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="font-semibold text-violet-400">
              {m.sender?.username || "Unknown"}
            </span>
            <span className="mx-1 text-white">:</span>
            <span>{m.content}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex p-2 border-t border-purple-700/40 gap-2">
        <input
          className="flex-1 px-3 py-2 rounded bg-black border border-purple-700/40 text-white"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type message..."
        />
        <button
          className="px-4 py-2 bg-violet-600 rounded"
          onClick={send}
        >
          Send
        </button>
      </div>
    </div>
  );
}
