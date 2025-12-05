import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { 
  Search, Users, Shield, Zap, LogOut, User, 
  Crosshair, Plus, ArrowRight 
} from "lucide-react";
import API from "../api";

export default function Home() {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [username, setUsername] = useState("Loading...");

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [teamName, setTeamName] = useState("");
  const [teamPassword, setTeamPassword] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinPassword, setJoinPassword] = useState("");

  const [location, setLocation] = useState("");
  const [gender, setGender] = useState("MALE");
  const [age, setAge] = useState("");
  const [about, setAbout] = useState("");
  const [gameId, setGameId] = useState("");
  const [selectedGame, setSelectedGame] = useState("VALORANT");
  const [otherGame, setOtherGame] = useState("");

  const [socialProvider, setSocialProvider] = useState("OTHER");
  const [socialLink, setSocialLink] = useState("");
  const [achievement, setAchievement] = useState("");

  const [socialLinksList, setSocialLinksList] = useState([]);
  const [achievementsList, setAchievementsList] = useState([]);

  const [editing, setEditing] = useState(false);

  const nav = useNavigate();

  const usernameFromToken = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return "Unknown";
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.username || `User#${payload.userId}`;
    } catch {
      return "Unknown";
    }
  };

  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      const { data } = await API.get("/profile/me");
      setProfile(data);

      if (data?.user?.username) setUsername(data.user.username);
      else setUsername(usernameFromToken());

      setSocialLinksList(Array.isArray(data?.socialLinks) ? data.socialLinks : []);
      setAchievementsList(Array.isArray(data?.achievements) ? data.achievements : []);

      setLocation(data?.location || "");
      setGender(data?.gender || "MALE");
      setAge(data?.age ?? "");
      setAbout(data?.about || "");
      setGameId(data?.games?.[0]?.playerIdOnGame || "");
      setSelectedGame(data?.games?.[0]?.game || "VALORANT");
    } catch (err) {
      console.error("loadProfile:", err);
      setUsername(usernameFromToken());
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const saveProfile = async () => {
    try {
      const finalGame = selectedGame === "OTHERS" ? otherGame || "OTHERS" : selectedGame;

      let socialPayload = [];
      if (socialLinksList.length) {
        socialPayload = socialLinksList.map(s => ({
          provider: s.provider || "OTHER",
          url: s.url,
          label: s.label || null
        }));
      } else if (socialLink.trim()) {
        socialPayload = [{
          provider: socialProvider || "OTHER",
          url: socialLink.trim(),
          label: "Main"
        }];
      }

      let achievementPayload = [];
      if (achievementsList.length) {
        achievementPayload = achievementsList.map(a => ({
          title: a.title,
          description: a.description || null,
          proofUrl: a.proofUrl || null,
          achievedAt: a.achievedAt || null
        }));
      } else if (achievement.trim()) {
        achievementPayload = [{
          title: achievement.trim(),
          description: null,
          proofUrl: null,
          achievedAt: null
        }];
      }

      const payload = {
        location,
        gender,
        age: age ? Number(age) : null,
        about,
        games: [{
          game: finalGame,
          customName: null,
          playerIdOnGame: gameId || null
        }],
        socialLinks: socialPayload,
        achievements: achievementPayload
      };

      const { data } = await API.put("/profile/me", payload);

      if (data?.profile) {
        setProfile(data.profile);
        setSocialLinksList(data.profile.socialLinks || []);
        setAchievementsList(data.profile.achievements || []);
      } else {
        await loadProfile();
      }

      alert("Profile updated");
      setEditing(false);
      setSocialLink("");
      setAchievement("");
    } catch (err) {
      console.error("saveProfile:", err);
      alert(err?.response?.data?.message || err?.message || "Profile update failed");
    }
  };

  const searchProfiles = async () => {
    if (!search.trim()) return;
    try {
      const { data } = await API.get(`/profile/search?username=${encodeURIComponent(search)}`);
      setResults(data || []);
    } catch (err) {
      console.error("searchProfiles:", err);
      alert("Search failed");
    }
  };

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
        setResults(data);
      } catch (err) {
        console.error("live search failed:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 400); 
  
    return () => clearTimeout(delay);
  }, [search]);

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    nav("/login");
  };

  return (
    <div className="relative min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden selection:bg-purple-500/40">
      
      {/* BACKGROUND FX */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a0b2e] via-[#000000] to-[#000000] opacity-80"></div>
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 md:p-8">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 border-b border-white/10 pb-6 bg-black/20 backdrop-blur-sm rounded-xl px-6">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="p-3 bg-purple-600/20 border border-purple-500 rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.4)]">
               <Crosshair size={32} className="text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
                Nexus<span className="text-purple-500">Command</span>
              </h1>
              <div className="text-xs text-purple-400 font-mono tracking-widest uppercase flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                System Online
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
              <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">Operator</div>
              <Link to={`/${username}`} className="text-lg font-bold text-white hover:text-purple-400 transition-colors flex items-center justify-end gap-2 group">
                {username} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
              </Link>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded uppercase font-bold text-sm tracking-wider"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

        {/* --- MAIN GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: SEARCH & DISCOVERY (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#0a0a10]/80 border border-white/10 rounded-2xl p-1 overflow-hidden backdrop-blur-md shadow-2xl">
              <div className="bg-gradient-to-r from-purple-900/20 to-transparent p-6 rounded-xl border-b border-white/5">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white mb-1">
                  <Search className="text-blue-400" /> GLOBAL SEARCH
                </h2>
                <p className="text-xs text-gray-400 font-mono">DATABASE_ACCESS_GRANTED</p>
              </div>

              <div className="p-6">
                <div className="relative group">
                  <input
                    className="w-full bg-black/50 border-2 border-white/10 text-white p-4 pl-12 rounded-xl focus:border-blue-500 focus:shadow-[0_0_20px_rgba(59,130,246,0.3)] outline-none transition-all placeholder-gray-600 font-medium"
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
                     <div className="text-center py-8 text-gray-600 font-mono text-sm border border-dashed border-white/10 rounded-lg">
                        NO SIGNALS DETECTED
                     </div>
                  )}

                  {results.map(r => (
                    <div key={r.id} className="group relative bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/50 p-4 rounded-xl transition-all cursor-pointer flex items-center justify-between overflow-hidden">
                      {/* Decorative accent */}
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
          </div>

          {/* RIGHT: SQUAD OPERATIONS (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* CREATE TEAM CARD */}
            <div className="bg-[#0a0a10]/80 border border-t-4 border-t-green-500 border-white/10 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group">
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
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-black font-black uppercase tracking-widest rounded-lg shadow-lg shadow-green-900/20 transform active:scale-95 transition-all"
                >
                  Initialize Squad
                </button>
              </div>
            </div>

            {/* JOIN TEAM CARD */}
            <div className="bg-[#0a0a10]/80 border border-t-4 border-t-orange-500 border-white/10 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group">
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
                  className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-black font-black uppercase tracking-widest rounded-lg shadow-lg shadow-orange-900/20 transform active:scale-95 transition-all"
                >
                  Deploy
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}