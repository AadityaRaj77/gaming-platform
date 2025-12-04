import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";

export default function TeamMembers({ teamId, onTeamUpdated }) {
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLeader, setIsLeader] = useState(false);
  const nav = useNavigate();

  const token = localStorage.getItem("token");
  const myUserId = token
    ? Number(JSON.parse(atob(token.split(".")[1])).userId)
    : null;

  const load = async () => {
    try {
      const { data } = await API.get(`/teams/${teamId}`);
      setMembers(data.members || []);
      setIsLeader(data.leaderId === myUserId);
    } catch (err) {
      console.error("load members:", err);
    }
  };

  const loadRequests = async () => {
    try {
      const { data } = await API.get(`/teams/${teamId}/requests`);
      setRequests(data || []);
    } catch (err) {
      console.error("load requests:", err);
    }
  };

  useEffect(() => {
    load();
    loadRequests();
  }, [teamId]);

  // KICK MEMBER
  const handleKick = async (userId) => {
    const ok = window.confirm("Kick this member?");
    if (!ok) return;

    try {
      await API.delete(`/teams/${teamId}/kick/${userId}`);

      // if somehow you kick yourself (edge / future use)
      if (userId === myUserId) {
        alert("You were removed from the team");
        nav("/", { replace: true });
        return;
      }

      await load();
      onTeamUpdated && onTeamUpdated();
    } catch (err) {
      console.error("kick error:", err);
      alert(err?.response?.data?.message || "Kick failed");
    }
  };

  const handleAccept = async (userId) => {
    try {
      await API.post(`/teams/${teamId}/accept/${userId}`);
      await load();
      await loadRequests();
      onTeamUpdated && onTeamUpdated();
    } catch (err) {
      console.error("accept error:", err);
      alert("Accept failed");
    }
  };

  const handleReject = async (userId) => {
    try {
      await API.post(`/teams/${teamId}/reject/${userId}`);
      await loadRequests();
    } catch (err) {
      console.error("reject error:", err);
      alert("Reject failed");
    }
  };

  return (
    <div className="h-full bg-[#0f0f1a]/90 p-4 rounded-2xl border border-purple-700/40">
      <h3 className="font-semibold mb-3">Members</h3>

      <div className="space-y-1 text-sm">
        {members.map((m) => (
          <div key={m.id} className="flex justify-between items-center">
            <span>
              {m.user.username}
              {m.role === "LEADER" && (
                <span className="ml-2 text-xs text-yellow-400">
                  (Leader)
                </span>
              )}
            </span>

            {isLeader && m.user.id !== myUserId && (
              <button
                onClick={() => handleKick(m.user.id)}
                className="text-red-500 text-xs"
              >
                Kick
              </button>
            )}
          </div>
        ))}
      </div>

      {isLeader && requests.length > 0 && (
        <>
          <h3 className="mt-4 text-sm text-yellow-400">Join Requests</h3>

          {requests.map((r) => (
            <div key={r.id} className="flex justify-between text-sm mt-2">
              <span>{r.user.username}</span>

              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(r.userId)}
                  className="text-green-500 text-xs"
                >
                  Accept
                </button>

                <button
                  onClick={() => handleReject(r.userId)}
                  className="text-red-500 text-xs"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
