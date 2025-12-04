import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import API from "../api";

export default function Home() {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [username, setUsername] = useState("Loading...");

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  const [teamName, setTeamName] = useState("");
  const [teamPassword, setTeamPassword] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinPassword, setJoinPassword] = useState("");

  // profile fields
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

  // Fallback username extractor (only if backend doesn't return username)
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

  // load profile
  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      const { data } = await API.get("/profile/me");
      // backend returns full profile object (or 404)
      setProfile(data);

      if (data?.user?.username) setUsername(data.user.username);
      else setUsername(usernameFromToken());

      // ensure lists are arrays for display and fallback
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

  //save profile
  const saveProfile = async () => {
    try {
      const finalGame = selectedGame === "OTHERS" ? otherGame || "OTHERS" : selectedGame;

      // Build socialLinks array to send (must match schema: provider required)
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

      // Build achievements array (title required)
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

  //search players 
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

  // teams 
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
  
      console.log("▶️ createTeam payload:", payload);
  
      const { data } = await API.post("/teams/create", payload);
  
      console.log("createTeam response:", data);
  
      alert(`Team created!\nCode: ${data.teamCode}`);
      nav(`/teams/${data.teamId}`);
    } catch (err) {
      console.error("createTeam error:", err);
      console.error("createTeam response data:", err?.response?.data);
  
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
  
      const teamId =
        data.teamId || data.reqEntry?.teamId || data.reqEntry?.team?.id;
  
      if (!teamId) {
        alert("Join request sent. Waiting for approval.");
        return;
      }
  
      alert("Join request sent. Redirecting to team page…");
      nav(`/teams/${teamId}`);
    } catch (err) {
      if (err.response?.data?.message === "Already in team") {
        const resolvedTeamId = joinCode && teamCodeToId[joinCode];
        nav(`/teams/${resolvedTeamId}`);
        return;
      }
  
      alert(err.response?.data?.message || "Join failed");
    }
  };

  //logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    nav("/login");
  };
  return (
    <div className="min-h-screen bg-linear-to-br from-[#0b0014] via-[#1a0033] to-[#2b001a] text-white p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-linear-to-r from-violet-400 to-red-500 bg-clip-text text-transparent">
          Esports Dashboard
        </h1>

        <div className="flex items-center gap-4 text-sm text-gray-300">
        <div>
           Logged in as{" "}
           <Link to={`/${username}`} className="text-red-400 font-semibold hover:underline">
              {username}
           </Link>
        </div>

          <button
            onClick={handleLogout}
            className="px-4 py-1.5 rounded bg-linear-to-r from-red-600 to-violet-600"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* SEARCH */}
        <div className="col-span-4 bg-[#0f0f1a]/90 p-5 rounded-2xl">
          <h2 className="text-lg mb-3">Search Players</h2>
          <input className="w-full p-2 bg-black border rounded mb-2" onChange={e => setSearch(e.target.value)} />
          <button onClick={searchProfiles} className="w-full bg-red-600 p-2 rounded">Search</button>

          <div className="mt-3 space-y-2">
  {results.map(r => (
    <div key={r.id} className="p-2 bg-black/30 rounded">
      <div className="font-semibold">
        <Link to={`/${r.user.username}`} className="text-violet-300 hover:underline">
          {r.user?.username}
        </Link>
      </div>
      <div className="text-xs text-gray-300">{r.location || ""}</div>
      <div className="text-xs text-gray-400">
        {r.games?.[0]?.game ? `${r.games[0].game} (${r.games[0].playerIdOnGame || "—"})` : ""}
      </div>
    </div>
  ))}
          </div>
         </div>

        {/* TEAMS */}
        <div className="col-span-4 space-y-4">
          <div className="bg-[#0f0f1a]/90 p-5 rounded-2xl">
            <h3>Create Team</h3>
            <input className="w-full p-2 bg-black border rounded" onChange={e => setTeamName(e.target.value)} placeholder="Team name" />
            <input className="w-full p-2 bg-black border rounded mt-2" onChange={e => setTeamPassword(e.target.value)} placeholder="Team password" />
            <button onClick={createTeam} className="w-full mt-2 bg-violet-600 p-2 rounded">Create</button>
          </div>

          <div className="bg-[#0f0f1a]/90 p-5 rounded-2xl">
            <h3>Join Team</h3>
            <input className="w-full p-2 bg-black border rounded" onChange={e => setJoinCode(e.target.value)} placeholder="Team code" />
            <input className="w-full p-2 bg-black border rounded mt-2" onChange={e => setJoinPassword(e.target.value)} placeholder="Team password" />
            <button onClick={joinTeam} className="w-full mt-2 bg-violet-600 p-2 rounded">Join</button>
          </div>
        </div>
      </div>
    </div>
  );
}
