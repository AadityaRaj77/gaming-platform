import { useEffect, useState } from "react";
import API from "../api";
import { Link } from "react-router-dom";

export default function TournamentList() {
  const [list, setList] = useState([]);
  useEffect(() => {
    API.get("/tournaments/list").then(r => setList(r.data));
  }, []);

  return (
    <div className="p-6 min-h-screen bg-[#05060a] text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Live Tournaments</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {list.map(t => (
            <Link to={`/tournaments/${t.id}`} key={t.id} className="block bg-[#0f0f14]/70 p-4 rounded-lg border border-white/5 hover:shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-lg font-bold">{t.name}</div>
                  <div className="text-sm text-gray-400">{t.tagline}</div>
                </div>
                <div className="text-sm font-mono text-cyan-400">{t.feeType === "PAID" ? (`₹${t.feeAmount}`) : "Free"}</div>
              </div>
              <div className="mt-3 text-xs text-gray-300">{t.location || "Online"}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
