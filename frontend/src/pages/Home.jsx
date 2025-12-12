import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Search, Users, Shield, Zap, LogOut, User, 
  Crosshair, Plus, ArrowRight, Cpu, Activity,
  X, MapPin, Gamepad2, Share2, Award
} from "lucide-react";
import API from "../api";

const ProfileModal = ({ profile, username, isOpen, onClose }) => {
  if (!isOpen) 
    return null;

  // Robust Fallback data
  const user = profile?.user || { username: username || "Agent" };
  const details = profile || {};
  const displayChar = (user.username && user.username.length > 0) ? user.username.charAt(0).toUpperCase() : "A";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative bg-[#0f0f16] border border-purple-500/30 w-full max-w-md rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Header */}
        <div className="h-24 bg-linear-to-r from-purple-900/50 via-blue-900/50 to-purple-900/50 relative">
          <div className="absolute inset-0 opacity-30 bg-[radiag-linear(circle_at_center,_var(--tg-linear-stops))] from-black/20 to-transparent"></div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-red-500/20 text-gray-400 hover:text-white rounded-full transition-all border border-white/5 hover:border-red-500/50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Avatar & Basic Info */}
        <div className="px-8 pb-8 -mt-12 relative">
          <div className="flex justify-between items-end mb-4">
            <div className="w-24 h-24 rounded-2xl bg-black border-2 border-purple-500 p-1 shadow-lg shadow-purple-500/20">
              <div className="w-full h-full bg-linear-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center text-3xl font-bold text-white">
                {displayChar}
              </div>
            </div>
            <span className="mb-2 px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-mono font-bold tracking-widest rounded uppercase">
              OPERATIVE
            </span>
          </div>

          <h2 className="text-2xl font-black text-white uppercase tracking-tight">{user.username}</h2>
          <p className="text-sm text-purple-400 font-mono mb-6 flex items-center gap-2">
            <Activity size={12} /> STATUS: ONLINE
          </p>

          {/* Details Grid */}
          <div className="space-y-4 bg-white/5 rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-3 text-gray-300 text-sm">
              <MapPin className="h-4 w-4 text-purple-500" />
              <span className="font-mono">{details.location || "Location: Classified"}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300 text-sm">
              <Gamepad2 className="h-4 w-4 text-blue-500" />
              <span className="font-mono">
                {details.games && details.games.length > 0 
                  ? details.games.map(g => g.game).join(", ") 
                  : "No Active Assignments"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-gray-300 text-sm">
              <Share2 className="h-4 w-4 text-pink-500" />
              <span className="font-mono italic text-xs text-gray-500">
                {details.about || "No bio established."}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <button className="py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase text-xs tracking-wider rounded border border-purple-400 transition-colors">
              Edit Data
            </button>
            <button 
              onClick={onClose}
              className="py-2 bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-bold uppercase text-xs tracking-wider rounded border border-white/10 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
 );
};

/* --- MAIN COMPONENT --- */
export default function Home() {
  // --- STATE MANAGEMENT ---
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [username, setUsername] = useState("Agent"); // default to Agent so UI never shows Unknown
  
  // UI State for Modal
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Search States
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Team States
  const [teamName, setTeamName] = useState("");
  const [teamPassword, setTeamPassword] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinPassword, setJoinPassword] = useState("");

  const nav = useNavigate();

  // --- HELPER: Username from Token (Real Logic) ---
  const usernameFromToken = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return "Agent"; // fallback
      const payload = JSON.parse(atob(token.split(".")[1]));
      // prefer explicit username; if not present, use id-based fallback
      if (payload?.username && payload.username.trim()) return payload.username;
      if (payload?.userId) return `User#${payload.userId}`;
      return "Agent";
    } catch {
      return "Agent"; // never Unknown
    }
  };

  // --- LOAD PROFILE ---
  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      
      const { data } = await API.get("/profile/me");
      
      setProfile(data);
      if (data?.user?.username) {
        setUsername(data.user.username);
      } else {
        setUsername(usernameFromToken());
      }

    } catch (err) {
      console.error("loadProfile error:", err);
      setUsername(usernameFromToken());
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // --- SEARCH PLAYERS ---
  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }
  
    const delay = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const { data } = await API.get(
          `/profile/search?username=${encodeURIComponent(search)}`
        );
        setResults(data || []);
      } catch (err) {
        console.error("searchProfiles error:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 400); 
  
    return () => clearTimeout(delay);
  }, [search]);

  // --- CREATE TEAM ---
  const createTeam = async () => {
    if (!teamName || !teamPassword) {
      alert("Team name & password required");
      return;
    }
  
    try {
      const payload = {
        name: teamName,
        game: "VALORANT",       
        password: teamPassword
      };
      
      const { data } = await API.post("/teams/create", payload);
      
      alert(`Team created!\nCode: ${data.teamCode}`);
      nav(`/teams/${data.teamId}`);
    } catch (err) {
      console.error("createTeam error:", err);
      alert(err?.response?.data?.message || "Create team failed");
    }
  };
  
  // --- JOIN TEAM ---
  const joinTeam = async () => {
    if (!joinCode || !joinPassword) {
      alert("Fill all fields");
      return;
    }
  
    try {
      const { data } = await API.post("/teams/join", {
        teamCode: joinCode,
        password: joinPassword
      });
  
      const teamId = data.teamId || data.reqEntry?.teamId || data.reqEntry?.team?.id;
  
      if (!teamId) {
        alert("Join request sent. Waiting for approval.");
        return;
      }
  
      alert("Join request sent. Redirecting to team page…");
      nav(`/teams/${teamId}`);
    } catch (err) {
      if (err.response?.data?.message === "Already in team") {
         alert("You are already in this team."); 
         return;
      }
      alert(err.response?.data?.message || "Join failed");
    }
  };

  // --- LOGOUT ---
  const handleLogout = () => {
    localStorage.removeItem("token");
    nav("/login");
  };

  // --- RENDER ---
  return (
    <div className="relative min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden selection:bg-purple-500/40 flex flex-col">
      
      {/* BACKGROUND FX */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radiag-linear(ellipse_at_top,_var(--tg-linear-stops))] from-[#1a0b2e] via-[#000000] to-[#000000] opacity-80"></div>
        <div className="absolute top-0 left-0 w-full h-[1px] bg-linear-to-r from-transparent via-purple-500/50 to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]"></div>
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[lineag-linear(rgba(255,255,255,0.02)_1px,transparent_1px),lineag-linear(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radiag-linear(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 md:p-8 flex-1 w-full">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 border-b border-white/10 pb-6 bg-black/20 backdrop-blur-sm rounded-xl px-6">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="p-3 bg-purple-600/20 border border-purple-500 rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.4)] relative overflow-hidden group">
               <div className="absolute inset-0 bg-purple-500/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
               <Crosshair size={32} className="text-purple-400 relative z-10" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-linear-to-r from-white via-gray-200 to-gray-500">
                Nexus<span className="text-purple-500">Command</span>
              </h1>
              <div className="text-xs text-purple-400 font-mono tracking-widest uppercase flex items-center gap-2">
                <Activity size={12} className="animate-pulse" />
                System Online
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded uppercase font-bold text-sm tracking-wider"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

        {/* --- MAIN GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">
          
          {/* LEFT: SEARCH & DISCOVERY (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#0a0a10]/80 border border-white/10 rounded-2xl p-1 overflow-hidden backdrop-blur-md shadow-2xl">
              <div className="bg-linear-to-r from-purple-900/20 to-transparent p-6 rounded-xl border-b border-white/5">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white mb-1">
                  <Search className="text-blue-400" /> GLOBAL SEARCH
                </h2>
                <p className="text-xs text-gray-400 font-mono">DATABASE_ACCESS_GRANTED</p>
              </div>

              <div className="p-6">
                <div className="relative group">
                  <input
                    className="w-full bg-black/50 border-2 border-white/10 text-white p-4 pl-12 rounded-xl focus:border-blue-500 focus:shadow-[0_0_20px_rgba(59,130,246,0.3)] outline-none transition-all placeholder-gray-600 font-medium font-mono"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ENTER AGENT NAME..."
                  />
                  <Search className="absolute left-4 top-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                  
                  {searchLoading && (
                    <div className="absolute right-4 top-4">
                      <Zap size={20} className="text-yellow-400 animate-pulse" />
                    </div>
                  )}
                </div>

                {/* RESULTS AREA */}
                <div className="mt-6 space-y-3 min-h-[100px]">
                  {results.length === 0 && search.trim() && !searchLoading && (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-600 font-mono text-sm border border-dashed border-white/10 rounded-lg bg-black/20">
                      <Cpu size={24} className="mb-2 opacity-50" />
                      NO SIGNALS DETECTED
                    </div>
                  )}

                  {results.map(r => (
                    <div key={r.id} className="group relative bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/50 p-4 rounded-xl transition-all cursor-pointer flex items-center justify-between overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center border border-white/10">
                          <User size={20} className="text-gray-400 group-hover:text-blue-400"/>
                        </div>
                        <div>
                          <Link to={`/${r.user.username}`} className="font-bold text-lg text-white group-hover:text-blue-300 transition-colors">
                            {r.user?.username}
                          </Link>
                          <div className="text-xs text-gray-400 font-mono flex gap-2">
                             <span>{r.location || "UNKNOWN LOC"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                          <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Main Game</div>
                          <div className="text-sm text-blue-200 font-mono">
                            {r.games?.[0]?.game || "N/A"}
                          </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => nav("/tournaments/create")}
              className="w-full py-3 bg-purple-700 rounded-lg text-white mt-4">
               Organize Tournament
            </button>

          </div>

          {/* RIGHT: SQUAD OPERATIONS (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* CREATE TEAM CARD */}
            <div className="bg-[#0a0a10]/80 border border-t-4 border-t-green-500 border-white/10 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group hover:shadow-[0_0_30px_rgba(34,197,94,0.1)] transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Shield size={100} />
              </div>

              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Plus className="text-green-500" /> CREATE SQUAD
              </h3>
              
              <div className="space-y-4 relative z-10">
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase ml-1">Squad Name</label>
                  <input 
                    className="w-full mt-1 p-3 bg-black/60 border border-white/10 rounded-lg text-white focus:border-green-500 outline-none transition-colors" 
                    onChange={e => setTeamName(e.target.value)} 
                    placeholder="e.g. DARK KNIGHTS" 
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase ml-1">Secret Key</label>
                  <input 
                    className="w-full mt-1 p-3 bg-black/60 border border-white/10 rounded-lg text-white focus:border-green-500 outline-none transition-colors" 
                    onChange={e => setTeamPassword(e.target.value)} 
                    placeholder="••••••••" 
                    type="password"
                  />
                </div>
                <button 
                  onClick={createTeam} 
                  className="w-full py-3 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-black font-black uppercase tracking-widest rounded-lg shadow-lg shadow-green-900/20 transform active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Shield size={16} /> Initialize Squad
                </button>
              </div>
            </div>

            {/* JOIN TEAM CARD */}
            <div className="bg-[#0a0a10]/80 border border-t-4 border-t-orange-500 border-white/10 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group hover:shadow-[0_0_30px_rgba(249,115,22,0.1)] transition-all">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users size={100} />
               </div>

               <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                 <Users className="text-orange-500" /> JOIN OPERATION
               </h3>
               
               <div className="space-y-4 relative z-10">
                 <div className="flex gap-2">
                   <div className="flex-1">
                      <label className="text-xs text-gray-500 font-bold uppercase ml-1">Access Code</label>
                      <input 
                        className="w-full mt-1 p-3 bg-black/60 border border-white/10 rounded-lg text-white focus:border-orange-500 outline-none font-mono tracking-widest" 
                        onChange={e => setJoinCode(e.target.value)} 
                        placeholder="X9-B2" 
                      />
                   </div>
                   <div className="flex-1">
                      <label className="text-xs text-gray-500 font-bold uppercase ml-1">Password</label>
                      <input 
                        className="w-full mt-1 p-3 bg-black/60 border border-white/10 rounded-lg text-white focus:border-orange-500 outline-none" 
                        onChange={e => setJoinPassword(e.target.value)} 
                        placeholder="••••" 
                        type="password"
                      />
                   </div>
                 </div>

                 <button 
                   onClick={joinTeam} 
                   className="w-full py-3 bg-linear-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-black font-black uppercase tracking-widest rounded-lg shadow-lg shadow-orange-900/20 transform active:scale-95 transition-all flex items-center justify-center gap-2"
                 >
                   <ArrowRight size={16} /> Deploy
                 </button>
               </div>
            </div>

          </div>
        </div>
      </div>

      {/* --- FOOTER: USER INFO --- */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a12]/90 backdrop-blur-lg border-t border-white/10 px-6 py-3 flex justify-between items-center">
        <div className="text-xs text-gray-500 font-mono flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          SECURE CONNECTION ESTABLISHED
        </div>
        
        {/* Primary: Navigate to public player profile */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => nav(`/${username}`)}
            title="Go to your public profile"
            className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/50 transition-all group"
          >
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Logged in as</span>
              <span className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                {loadingProfile ? "Identifying..." : username}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center border border-white/20">
              <User size={16} className="text-white" />
            </div>
          </button>
        </div>
      </footer>
    </div>
  );
}
