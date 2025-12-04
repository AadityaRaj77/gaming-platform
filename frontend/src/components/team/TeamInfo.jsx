import { useState } from "react";
import API from "../../api";
import { useNavigate } from "react-router-dom";

export default function TeamInfo({ team, onTeamUpdated, doLeaveTeam }) {
  const token = localStorage.getItem("token");
  const myUserId = token ? Number(JSON.parse(atob(token.split(".")[1])).userId) : null;
  const [leaving, setLeaving] = useState(false);
  const nav = useNavigate();

  const isLeader = team.leaderId === myUserId;

  const handleLeaveClick = async () => {
    const confirm = window.confirm("Are you sure you want to leave this team?");
    if (!confirm) return;

    setLeaving(true);
    try {
      if (isLeader) {
        const others = team.members.filter((m) => m.userId !== myUserId);
        if (others.length === 0) {
          alert("You are the only member. Assign a leader before leaving.");
          setLeaving(false);
          return;
        }
        // show simple choice prompt
        const list = others.map((o, i) => `${i + 1}. ${o.user.username} (id:${o.userId})`).join("\n");
        const choice = window.prompt(`You are the leader. Choose new leader by number:\n${list}`);
        if (!choice) {
          setLeaving(false);
          return;
        }
        const idx = Number(choice) - 1;
        if (isNaN(idx) || idx < 0 || idx >= others.length) {
          alert("Invalid selection.");
          setLeaving(false);
          return;
        }
        const newLeaderId = others[idx].userId;
        await API.post(`/teams/${team.id}/leave`, { newLeaderId });
      } else {
        await API.post(`/teams/${team.id}/leave`);
      }

      // optionally notify parent to refresh
      onTeamUpdated?.();
      onLeaveSuccess?.();
      nav("/"); 
    } catch (err) {
      console.error("handleLeaveClick:", err);
      alert(err?.response?.data?.message || "Leave failed");
    } finally {
      setLeaving(false);
    }
  };

  return (
    <div className="bg-[#0f0f1a]/90 p-4 rounded-2xl border border-purple-700/40">
      <h3 className="text-xl font-semibold mb-2">{team.name}</h3>
      <div className="text-sm mb-3">
        <div><b>Game:</b> {team.game}</div>
        <div><b>Team Code:</b> <span className="font-mono">{team.teamCode}</span></div>
        <div><b>Leader:</b> {team.leader?.username || team.leaderId}</div>
        <div><b>Members:</b> {team.members?.length || 0}/{team.maxMembers}</div>
      </div>

      <div className="flex gap-2">
      <button
  onClick={async () => {
    const ok = window.confirm("Leave this team?");
    if (!ok) return;

    const success = await doLeaveTeam();
    if (!success) return;
    onTeamUpdated();
  }}
  className="w-full mt-4 bg-red-600 py-2 rounded"
>
  Exit Team
</button>

        <button
          className="px-3 py-1 bg-violet-600 rounded text-white"
          onClick={() => navigator.clipboard?.writeText(team.teamCode)}
        >
          Copy Code
        </button>
      </div>
    </div>
  );
}
