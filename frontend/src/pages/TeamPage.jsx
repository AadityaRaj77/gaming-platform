import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api";
import TeamChat from "../components/chat/TeamChat";
import TeamMembers from "../components/team/TeamMembers";
import TeamInfo from "../components/team/TeamInfo";

export default function TeamPage() {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const myUserId = token
    ? Number(JSON.parse(atob(token.split(".")[1])).userId)
    : null;

  const loadTeam = async () => {
    try {
      const { data } = await API.get(`/teams/${teamId}`);
      setTeam(data);
    } catch (err) {
      console.error("loadTeam error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  
    const interval = setInterval(() => {
      loadTeam();
    }, 3000); 
  
    return () => clearInterval(interval);
  }, [teamId]);
  

  if (loading) return <div className="p-6">Loading team...</div>;
  if (!team) return <div className="p-6 text-red-500">Team not found</div>;

  const isMember = team.members?.some(
    (m) => m.userId === myUserId
  );

  if (!isMember) {
    return (
      <div className="flex justify-center items-center h-screen text-yellow-400 text-lg">
        Join request sent. Waiting for leader approval…
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 h-screen p-4">
      <div className="col-span-3">
        <TeamInfo team={team} onTeamUpdated={loadTeam} />
      </div>

      <div className="col-span-6">
        <TeamChat teamId={Number(teamId)} />
      </div>

      <div className="col-span-3">
        <TeamMembers teamId={Number(teamId)} onTeamUpdated={loadTeam} />
      </div>
    </div>
  );
}
