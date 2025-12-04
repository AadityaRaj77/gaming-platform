import { useEffect } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";

export default function NotificationsSocket() {
  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const s = io("http://localhost:4000/team-chat", {
      auth: { token },
      transports: ["websocket"]
    });

    s.on("connect", () => {
      console.log(" notifications socket connected:", s.id);
    });

    s.on("joinAccepted", ({ teamId }) => {
      console.log(" joinAccepted for team:", teamId);
      nav(`/teams/${teamId}`);
    });


    s.on("error", (err) => {
      console.error("🔔 notifications error:", err);
    });
    s.on("leaderChanged", (payload) => {
        loadTeam();
      });
      
      s.on("memberLeft", ({ userId }) => {
        loadTeam();
      });

    return () => s.disconnect();
  }, [nav]);

  return null; 
}
