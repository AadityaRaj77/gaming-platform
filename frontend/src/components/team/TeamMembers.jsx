import { useEffect, useState } from "react";
import API from "../../api";

export default function TeamMembers({ teamId, onTeamUpdated }) {
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLeader, setIsLeader] = useState(false);

  // Decode userId safely
  const token = localStorage.getItem("token");
  const myUserId = token
    ? Number(JSON.parse(atob(token.split(".")[1])).userId)
    : null;

  //  LOAD MEMBERS
  const loadMembers = async () => {
    try {
      const { data } = await API.get(`/teams/${teamId}`);

      setMembers(data.members || []);
      setIsLeader(data.leaderId === myUserId);
    } catch (err) {
      console.error("loadMembers:", err);
    }
  };

  //LOAD REQUESTS (LEADER ONLY)
  const loadRequests = async () => {
    if (!isLeader) return;

    try {
      const { data } = await API.get(`/teams/${teamId}/requests`);
      setRequests(data || []);
    } catch (err) {
      console.error("loadRequests:", err);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [teamId]);

  useEffect(() => {
    loadRequests();
  }, [isLeader, teamId]);

  const handleAccept = async (userId) => {
    try {
      await API.post(`/teams/${teamId}/accept/${userId}`);
      await loadMembers();
      await loadRequests();
      onTeamUpdated();
    } catch (err) {
      console.error("handleAccept:", err);
      alert("Failed to accept request");
    }
  };

  const handleReject = async (userId) => {
    try {
      await API.post(`/teams/${teamId}/reject/${userId}`);
      await loadRequests();
    } catch (err) {
      console.error("handleReject:", err);
      alert("Failed to reject request");
    }
  };
  return (
    <div className="h-full bg-[#0f0f1a]/90 p-4 rounded-2xl border border-purple-700/40 flex flex-col">

      <h3 className="font-semibold mb-3 text-violet-400">Team Members</h3>

      <div className="space-y-2 text-sm flex-1 overflow-y-auto">
        {members.map((m) => (
          <div key={m.id} className="flex justify-between items-center">
            <span className="text-white">{m.user.username}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-violet-700 text-white">
              {m.role}
            </span>
          </div>
        ))}

        {!members.length && (
          <div className="text-gray-400 text-xs">No members yet</div>
        )}
      </div>

      {/* JOIN REQUESTS (LEADER ONLY) */}
      {isLeader && requests.length > 0 && (
        <div className="mt-4 border-t border-purple-700/40 pt-3">
          <h4 className="text-sm text-yellow-400 mb-2">Join Requests</h4>

          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="flex justify-between items-center text-sm">
                <span className="text-white">{r.user.username}</span>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(r.userId)}
                    className="px-2 py-0.5 bg-green-600 rounded text-xs"
                  >
                    Accept
                  </button>

                  <button
                    onClick={() => handleReject(r.userId)}
                    className="px-2 py-0.5 bg-red-600 rounded text-xs"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
