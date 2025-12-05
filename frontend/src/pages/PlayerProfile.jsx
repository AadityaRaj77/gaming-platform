import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Gamepad2, MapPin, User, Hash, Edit3, Save, X, Plus, 
  Trophy, Share2, Monitor, Globe 
} from "lucide-react";
import API from "../api";

export default function PlayerProfile() {
  const { username } = useParams();
  const nav = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMine, setIsMine] = useState(false);
  
  // UI States
  const [editing, setEditing] = useState(false);

  // Form States (Lists)
  const [gamesList, setGamesList] = useState([]);
  const [socialsList, setSocialsList] = useState([]);
  const [achievementsList, setAchievementsList] = useState([]);

  // Form States (Single Fields)
  const [location, setLocation] = useState("");
  const [gender, setGender] = useState("MALE");
  const [age, setAge] = useState("");
  const [about, setAbout] = useState("");

  // Temporary Input States for "Adding" items
  const [tempGameName, setTempGameName] = useState("VALORANT");
  const [tempGameId, setTempGameId] = useState("");
  
  const [tempSocialProvider, setTempSocialProvider] = useState("DISCORD");
  const [tempSocialLink, setTempSocialLink] = useState("");
  
  const [tempAchievement, setTempAchievement] = useState("");

  // Helper: Get User ID
  const getMyUserId = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.userId || null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // 1. Search for user ID by username
        const { data } = await API.get(`/profile/search?username=${encodeURIComponent(username)}`);
        const found = (data || []).find(
          p => p.user && p.user.username.toLowerCase() === username.toLowerCase()
        );

        if (!found) {
          setError("Player not found in the database.");
          setProfile(null);
          return;
        }

        // 2. Fetch full public profile
        const userId = found.user.id;
        const myId = getMyUserId();
        setIsMine(userId === myId);

        const { data: publicProfile } = await API.get(`/profile/public/${userId}`);
        setProfile(publicProfile);

        // 3. Initialize Form Data
        setLocation(publicProfile.location || "");
        setGender(publicProfile.gender || "MALE");
        setAge(publicProfile.age ?? "");
        setAbout(publicProfile.about || "");
        setGamesList(publicProfile.games || []);
        setSocialsList(publicProfile.socialLinks || []);
        setAchievementsList(publicProfile.achievements || []);

      } catch (err) {
        console.error("Profile Load Error:", err);
        setError("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [username]);

  // --- Handlers for Lists ---

  const addGame = () => {
    if (!tempGameId.trim()) return alert("Enter a Player ID");
    const newGame = { game: tempGameName, playerIdOnGame: tempGameId };
    setGamesList([...gamesList, newGame]);
    setTempGameId(""); // Reset ID input
  };

  const removeGame = (index) => {
    setGamesList(gamesList.filter((_, i) => i !== index));
  };

  const addSocial = () => {
    if (!tempSocialLink.trim()) return alert("Enter a URL");
    const newSocial = { provider: tempSocialProvider, url: tempSocialLink, label: "Main" };
    setSocialsList([...socialsList, newSocial]);
    setTempSocialLink("");
  };

  const removeSocial = (index) => {
    setSocialsList(socialsList.filter((_, i) => i !== index));
  };

  const addAchievement = () => {
    if (!tempAchievement.trim()) return alert("Enter a title");
    const newAch = { title: tempAchievement, description: null, proofUrl: null };
    setAchievementsList([...achievementsList, newAch]);
    setTempAchievement("");
  };

  const removeAchievement = (index) => {
    setAchievementsList(achievementsList.filter((_, i) => i !== index));
  };

  // --- Save Handler ---

  const save = async () => {
    try {
      // 1. Construct Payload
      const payload = {
        location,
        gender,
        age: age ? Number(age) : null,
        about,
        games: gamesList, // Ensure this isn't empty if backend requires it
        socialLinks: socialsList,
        achievements: achievementsList
      };

      console.log("Sending Payload:", payload); // Check your browser console (F12) for this

      const { data } = await API.put("/profile/me", payload);
      
      if (data?.profile) {
        setProfile(data.profile);
      } else {
        const { data: re } = await API.get(`/profile/public/${profile.user.id}`);
        setProfile(re);
      }
      setEditing(false);
      alert("Profile Saved Successfully!");

    } catch (err) {
      console.error("Save Error Details:", err);
      
      // 2. Extract the exact error message
      const serverMessage = err?.response?.data?.message;
      const serverError = err?.response?.data?.error;
      const status = err?.response?.status;

      // 3. Alert the specific error
      alert(`Save Failed (${status}):\n${serverMessage || serverError || "Check Console for details"}`);
    }
  };

  // --- Render Helpers ---

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-cyan-500 font-mono animate-pulse">
      INITIALIZING SYSTEM...
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-red-500 font-bold">
      ERROR: {error}
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#050505] text-gray-100 font-sans selection:bg-cyan-500/30">
      
      {/* Animated Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px] animate-pulse" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600 rounded-full blur-[120px] animate-pulse" style={{animationDelay: "1s"}} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto p-4 md:p-8">
        
        {/* --- Header Section --- */}
        <header className="flex flex-col md:flex-row justify-between items-end border-b border-white/10 pb-6 mb-8 backdrop-blur-sm">
          <div className="flex items-center gap-6">
            {/* Avatar Placeholder */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-gray-800 to-black border-2 border-white/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,255,0.15)]">
              <User size={48} className="text-gray-500" />
            </div>
            
            <div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-gray-400">
                {profile.user.username}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-cyan-400 font-mono">
                {location && <span className="flex items-center gap-1"><MapPin size={14}/> {location}</span>}
                {profile.age && <span className="flex items-center gap-1"><Hash size={14}/> Lvl {profile.age}</span>}
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-gray-400">
                  {gender}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 md:mt-0">
            {isMine ? (
              !editing ? (
                <button 
                  onClick={() => setEditing(true)} 
                  className="flex items-center gap-2 px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-full transition-all shadow-[0_0_15px_rgba(8,145,178,0.4)]"
                >
                  <Edit3 size={18} /> EDIT PROFILE
                </button>
              ) : (
                <div className="flex gap-3">
                  <button onClick={() => setEditing(false)} className="p-2 rounded-full bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20"><X size={20} /></button>
                  <button onClick={save} className="flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-400 text-black font-bold rounded-full transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                    <Save size={18} /> SAVE CHANGES
                  </button>
                </div>
              )
            ) : (
              <button onClick={() => nav(-1)} className="px-6 py-2 border border-white/20 rounded-full hover:bg-white/5 transition-colors">
                Back
              </button>
            )}
          </div>
        </header>

        {/* --- Main Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: About & Edit Fields */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#0f0f15]/80 border border-white/5 backdrop-blur-md">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Monitor size={20} className="text-purple-400"/> BIO
              </h3>
              
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">About Me</label>
                    <textarea 
                      className="w-full mt-1 p-3 bg-black/50 border border-white/10 rounded-xl focus:border-cyan-500 outline-none text-sm min-h-[100px]"
                      value={about} onChange={e => setAbout(e.target.value)} 
                      placeholder="Write something cool..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider">Location</label>
                      <input className="w-full mt-1 p-2 bg-black/50 border border-white/10 rounded-lg text-sm" value={location} onChange={e => setLocation(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider">Age</label>
                      <input className="w-full mt-1 p-2 bg-black/50 border border-white/10 rounded-lg text-sm" value={age} onChange={e => setAge(e.target.value)} />
                    </div>
                  </div>
                  <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider">Gender</label>
                      <select className="w-full mt-1 p-2 bg-black/50 border border-white/10 rounded-lg text-sm text-gray-300" value={gender} onChange={e => setGender(e.target.value)}>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">
                  {profile.about || "No bio yet."}
                </p>
              )}
            </div>

            {/* Achievements Section */}
            <div className="p-6 rounded-2xl bg-[#0f0f15]/80 border border-white/5 backdrop-blur-md">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Trophy size={20} className="text-yellow-500"/> ACHIEVEMENTS
              </h3>
              
              <ul className="space-y-3">
                {achievementsList.map((ach, idx) => (
                  <li key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-sm font-medium text-yellow-100">{ach.title}</span>
                    {editing && <button onClick={() => removeAchievement(idx)} className="text-red-400 hover:text-red-300"><X size={14}/></button>}
                  </li>
                ))}
              </ul>
              
              {editing && (
                <div className="mt-4 flex gap-2">
                  <input 
                    className="flex-1 p-2 bg-black/50 border border-white/10 rounded-lg text-sm"
                    placeholder="New Achievement"
                    value={tempAchievement}
                    onChange={e => setTempAchievement(e.target.value)}
                  />
                  <button onClick={addAchievement} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"><Plus size={18}/></button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Games & Socials */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* GAMES CARD */}
            <div className="p-6 rounded-2xl bg-[#0f0f15]/80 border border-white/5 backdrop-blur-md relative overflow-hidden">
               {/* Decorative glow */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] pointer-events-none"/>

              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Gamepad2 size={24} className="text-cyan-400"/> GAME ROSTER
              </h3>

              {/* Display Games List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gamesList.length === 0 && !editing && <div className="text-gray-500 italic">No games linked.</div>}
                
                {gamesList.map((g, idx) => (
                  <div key={idx} className="group relative p-4 bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-xl hover:border-cyan-500/50 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-lg text-white group-hover:text-cyan-400 transition-colors">{g.game}</h4>
                        <p className="text-xs text-gray-500 uppercase mt-1">Player ID</p>
                        <div className="font-mono text-cyan-200/80 bg-cyan-900/20 px-2 py-1 rounded mt-1 inline-block select-all">
                          {g.playerIdOnGame}
                        </div>
                      </div>
                      {editing && (
                        <button onClick={() => removeGame(idx)} className="text-gray-600 hover:text-red-500 transition-colors"><X size={16}/></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Edit Mode: Add Game */}
              {editing && (
                <div className="mt-6 p-4 bg-cyan-900/10 border border-cyan-500/20 border-dashed rounded-xl">
                  <h4 className="text-sm font-bold text-cyan-400 mb-3 uppercase tracking-wider">Add New Game</h4>
                  <div className="flex flex-col md:flex-row gap-3">
                    <select 
                      className="p-2 bg-black border border-white/10 rounded-lg text-gray-300 outline-none focus:border-cyan-500"
                      value={tempGameName} onChange={e => setTempGameName(e.target.value)}
                    >
                      <option value="BGMI">BGMI</option>
                      <option value="VALORANT">VALORANT</option>
                      <option value="FREEFIRE">FREE FIRE</option>
                      <option value="CALL_OF_DUTY">COD MOBILE</option>
                      <option value="CSGO">CS:GO</option>
                      <option value="MINECRAFT">MINECRAFT</option>
                      <option value="OTHERS">OTHERS</option>
                    </select>
                    
                    <input 
                      className="flex-1 p-2 bg-black border border-white/10 rounded-lg text-gray-200 placeholder-gray-600 outline-none focus:border-cyan-500"
                      placeholder="In-Game ID / Gamer Tag"
                      value={tempGameId}
                      onChange={e => setTempGameId(e.target.value)}
                    />
                    
                    <button onClick={addGame} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-lg transition-colors">
                      ADD
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SOCIALS CARD */}
            <div className="p-6 rounded-2xl bg-[#0f0f15]/80 border border-white/5 backdrop-blur-md">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Share2 size={20} className="text-pink-500"/> CONNECT
              </h3>

              <div className="flex flex-wrap gap-3">
                 {socialsList.length === 0 && !editing && <div className="text-gray-500 italic">No social links.</div>}

                 {socialsList.map((s, idx) => (
                   <div key={idx} className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors">
                     <Globe size={14} className="text-gray-400"/>
                     <a href={s.url} target="_blank" rel="noreferrer" className="text-sm text-gray-300 hover:text-white hover:underline truncate max-w-[150px]">
                       {s.provider}
                     </a>
                     {editing && (
                       <button onClick={() => removeSocial(idx)} className="ml-2 p-1 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500 hover:text-white">
                         <X size={10}/>
                       </button>
                     )}
                   </div>
                 ))}
              </div>

              {editing && (
                <div className="mt-6 pt-4 border-t border-white/5">
                   <div className="flex flex-col md:flex-row gap-3">
                    <select 
                      className="p-2 bg-black border border-white/10 rounded-lg text-gray-300 text-sm"
                      value={tempSocialProvider} onChange={e => setTempSocialProvider(e.target.value)}
                    >
                      <option value="DISCORD">Discord</option>
                      <option value="TWITCH">Twitch</option>
                      <option value="YOUTUBE">YouTube</option>
                      <option value="INSTAGRAM">Instagram</option>
                      <option value="TWITTER">X (Twitter)</option>
                    </select>
                    
                    <input 
                      className="flex-1 p-2 bg-black border border-white/10 rounded-lg text-gray-200 text-sm placeholder-gray-600"
                      placeholder="https://..."
                      value={tempSocialLink}
                      onChange={e => setTempSocialLink(e.target.value)}
                    />
                    
                    <button onClick={addSocial} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg text-sm transition-colors">
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}