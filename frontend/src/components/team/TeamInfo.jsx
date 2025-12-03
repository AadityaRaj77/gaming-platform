export default function TeamInfo({ team }) {
  const leaderName = team?.leader?.username || "Unknown";

  return (
    <div className="bg-[#0f0f1a]/90 p-4 rounded-2xl border border-purple-700/40 h-full">
      <h2 className="text-lg font-semibold">{team?.name || "Team"}</h2>

      <div className="text-sm mt-1 text-gray-300">
        Game: <span className="text-violet-300">{team?.game}</span>
      </div>

      <div className="text-sm mt-1 text-gray-300">
        Team Code:{" "}
        <span className="text-yellow-400 font-mono tracking-wide">
          {team?.teamCode || "—"}
        </span>
      </div>

      <div className="text-sm mt-1 text-gray-300">
        Region: {team?.region || "—"}
      </div>

      <div className="text-xs mt-3 text-gray-400">
        Leader: {leaderName}
      </div>
    </div>
  );
}
