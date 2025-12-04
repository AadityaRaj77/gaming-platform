import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import TeamChat from "../components/chat/TeamChat";
import TeamMembers from "../components/team/TeamMembers";
import TeamInfo from "../components/team/TeamInfo";

export default function TeamPage() {
  const { teamId } = useParams();
  const nav = useNavigate();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);

  const leavingRef = useRef(false);

  const token = localStorage.getItem("token");
  const myUserId = token
    ? Number(JSON.parse(atob(token.split(".")[1])).userId)
    : null;

  // ================= LOAD TEAM =================
  const loadTeam = useCallback(async () => {
    try {
      const { data } = await API.get(`/teams/${teamId}`);
      setTeam(data);

      const memberFlag = data.members?.some(
        (m) => m.userId === myUserId
      );
      setIsMember(memberFlag);
    } catch (err) {
      console.error("loadTeam:", err);
      setTeam(null);
      setIsMember(false);
    } finally {
      setLoading(false);
    }
  }, [teamId, myUserId]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  // ================= POLLING (FOR KICK / REALTIME) =================
  useEffect(() => {
    const id = setInterval(() => {
      if (!leavingRef.current) loadTeam();
    }, 3000);

    return () => clearInterval(id);
  }, [loadTeam]);

  // ================= LEAVE TEAM =================
  const doLeaveTeam = useCallback(async () => {
    if (!team || !myUserId) return;

    try {
      leavingRef.current = true;

      const isLeader = team.leaderId === myUserId;
      const members = team.members || [];

      // ONLY MEMBER → DISBAND
      if (isLeader && members.length === 1) {
        const ok = window.confirm(
          "You are the only member.\nLeaving will permanently DELETE this team.\n\nContinue?"
        );
        if (!ok) {
          leavingRef.current = false;
          return;
        }

        await API.post(`/teams/${teamId}/leave`);
        nav("/", { replace: true });
        return;
      }

      // LEADER WITH MEMBERS → TRANSFER
      if (isLeader && members.length > 1) {
        const others = members.filter(
          (m) => m.userId !== myUserId
        );

        const names = others.map(o => o.user.username).join(", ");
        const chosenName = window.prompt(
          `Assign new leader:\n${names}`
        );

        if (!chosenName) {
          leavingRef.current = false;
          return;
        }

        const chosen = others.find(
          o => o.user.username === chosenName.trim()
        );

        if (!chosen) {
          alert("Invalid username");
          leavingRef.current = false;
          return;
        }

        await API.post(`/teams/${teamId}/leave`, {
          newLeaderId: chosen.userId
        });

        nav("/", { replace: true });
        return;
      }

      // NORMAL MEMBER
      await API.post(`/teams/${teamId}/leave`);
      nav("/", { replace: true });

    } catch (err) {
      leavingRef.current = false;
      console.error("leaveTeam:", err);
      alert(err?.response?.data?.message || "Leave failed");
    }
  }, [team, myUserId, teamId, nav]);

  // ================= KICK AUTO REDIRECT =================
  useEffect(() => {
    if (!loading && team && !isMember && !leavingRef.current) {
      alert("You were removed from the team");
      nav("/", { replace: true });
    }
  }, [isMember, loading, team, nav]);

  // ================= RENDER STATES =================
  if (loading) return <div className="p-4">Loading team...</div>;

  if (!team) {
    return (
      <div className="p-4 text-red-500">
        Team not found
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="flex items-center justify-center h-screen text-yellow-400 text-lg">
        Join request sent. Waiting for approval…
      </div>
    );
  }

  // ================= MAIN UI =================
  return (
    <div className="grid grid-cols-12 gap-4 h-screen p-4">
      <div className="col-span-3">
        <TeamInfo
          team={team}
          onTeamUpdated={loadTeam}
          doLeaveTeam={doLeaveTeam}
        />
      </div>

      <div className="col-span-6">
        <TeamChat teamId={Number(teamId)} />
      </div>

      <div className="col-span-3">
        <TeamMembers
          teamId={Number(teamId)}
          onTeamUpdated={loadTeam}
        />
      </div>
    </div>
  );
}
