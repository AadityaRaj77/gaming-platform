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
  const [editing, setEditing] = useState(false);

  // lists
  const [gamesList, setGamesList] = useState([]);
  const [socialsList, setSocialsList] = useState([]);
  const [achievementsList, setAchievementsList] = useState([]);

  // form fields
  const [location, setLocation] = useState("");
  const [gender, setGender] = useState("MALE");
  const [age, setAge] = useState("");
  const [about, setAbout] = useState("");

  // games
  const [availableGames, setAvailableGames] = useState([]);
  const [tempGameId, setTempGameId] = useState("");
  const [tempPlayerTag, setTempPlayerTag] = useState("");

  // socials
  const [tempSocialProvider, setTempSocialProvider] = useState("DISCORD");
  const [tempSocialLink, setTempSocialLink] = useState("");

  // achievements
  const [tempAchievement, setTempAchievement] = useState("");

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

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const { data: games } = await API.get("/games");
        setAvailableGames(games || []);

        const { data } = await API.get(`/profile/search?username=${encodeURIComponent(username)}`);
        const found = (data || []).find(
          p => p.user?.username?.toLowerCase() === username.toLowerCase()
        );
        if (!found) {
          setError("Player not found.");
          return;
        }

        const myId = getMyUserId();
        setIsMine(found.user.id === myId);

        const { data: publicProfile } = await API.get(`/profile/public/${found.user.id}`);
        setProfile(publicProfile);

        setLocation(publicProfile.location || "");
        setGender(publicProfile.gender || "MALE");
        setAge(publicProfile.age ?? "");
        setAbout(publicProfile.about || "");

        setGamesList(
          (publicProfile.games || []).map(g => ({
            gameId: g.game.id,
            gameName: g.game.name,
            playerTag: g.playerTag
          }))
        );

        setSocialsList(publicProfile.socialLinks || []);
        setAchievementsList(publicProfile.achievements || []);
      } catch (e) {
        console.error(e);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [username]);

  /* ================= HANDLERS ================= */

  const addGame = () => {
    if (!tempGameId) return alert("Select a game");
    if (!tempPlayerTag.trim()) return alert("Enter Player ID");

    const game = availableGames.find(g => g.id === Number(tempGameId));
    if (!game) return alert("Invalid game");

    setGamesList(prev => [
      ...prev,
      {
        gameId: game.id,
        gameName: game.name,
        playerTag: tempPlayerTag
      }
    ]);

    setTempGameId("");
    setTempPlayerTag("");
  };

  const removeGame = (i) =>
    setGamesList(gamesList.filter((_, idx) => idx !== i));

  const addSocial = () => {
    if (!tempSocialLink.trim()) return alert("Enter URL");
    setSocialsList(prev => [
      ...prev,
      { provider: tempSocialProvider, url: tempSocialLink, label: "Main" }
    ]);
    setTempSocialLink("");
  };

  const removeSocial = (i) =>
    setSocialsList(socialsList.filter((_, idx) => idx !== i));

  const addAchievement = () => {
    if (!tempAchievement.trim()) return alert("Enter title");
    setAchievementsList(prev => [
      ...prev,
      { title: tempAchievement, description: null, proofUrl: null }
    ]);
    setTempAchievement("");
  };

  const removeAchievement = (i) =>
    setAchievementsList(achievementsList.filter((_, idx) => idx !== i));

  const save = async () => {
    try {
      const payload = {
        location,
        gender,
        age: age ? Number(age) : null,
        about,
        games: gamesList.map(g => ({
          gameId: g.gameId,
          playerTag: g.playerTag
        })),
        socialLinks: socialsList,
        achievements: achievementsList
      };

      const { data } = await API.put("/profile/me", payload);
      setProfile(data.profile);
      setEditing(false);
      alert("Profile saved");
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Save failed");
    }
  };

  /* ================= UI ================= */

  if (loading)
    return <div className="min-h-screen flex items-center justify-center text-cyan-400">LOADING…</div>;

  if (error)
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-5xl mx-auto">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">{profile.user.username}</h1>
        {isMine && (
          editing ? (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)}><X /></button>
              <button onClick={save}><Save /></button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)}><Edit3 /></button>
          )
        )}
      </header>

      {/* GAMES */}
      <section className="mb-6">
        <h2 className="flex items-center gap-2 text-xl font-bold"><Gamepad2 /> Games</h2>

        <div className="grid grid-cols-2 gap-3 mt-3">
          {gamesList.map((g, i) => (
            <div key={i} className="border p-3 rounded">
              <div className="flex justify-between">
                <span className="font-bold">{g.gameName}</span>
                {editing && <button onClick={() => removeGame(i)}><X size={14} /></button>}
              </div>
              <div className="text-sm text-cyan-400">{g.playerTag}</div>
            </div>
          ))}
        </div>

        {editing && (
          <div className="flex gap-2 mt-4">
            <select
              value={tempGameId}
              onChange={e => setTempGameId(e.target.value)}
              className="bg-black border p-2"
            >
              <option value="">Select Game</option>
              {availableGames.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>

            <input
              className="bg-black border p-2 flex-1"
              placeholder="Player ID"
              value={tempPlayerTag}
              onChange={e => setTempPlayerTag(e.target.value)}
            />

            <button onClick={addGame}><Plus /></button>
          </div>
        )}
      </section>

      {/* SOCIALS */}
      <section className="mb-6">
        <h2 className="flex items-center gap-2 text-xl font-bold"><Share2 /> Socials</h2>
        {socialsList.map((s, i) => (
          <div key={i} className="flex items-center gap-2 mt-2">
            <span>{s.provider}</span>
            <a href={s.url} className="text-cyan-400">{s.url}</a>
            {editing && <button onClick={() => removeSocial(i)}><X size={12} /></button>}
          </div>
        ))}
        {editing && (
          <div className="flex gap-2 mt-3">
            <select value={tempSocialProvider} onChange={e => setTempSocialProvider(e.target.value)}>
              <option value="DISCORD">Discord</option>
              <option value="TWITCH">Twitch</option>
              <option value="YOUTUBE">YouTube</option>
            </select>
            <input
              value={tempSocialLink}
              onChange={e => setTempSocialLink(e.target.value)}
              placeholder="https://"
              className="bg-black border p-2 flex-1"
            />
            <button onClick={addSocial}><Plus /></button>
          </div>
        )}
      </section>

      {/* ACHIEVEMENTS */}
      <section>
        <h2 className="flex items-center gap-2 text-xl font-bold"><Trophy /> Achievements</h2>
        {achievementsList.map((a, i) => (
          <div key={i} className="flex justify-between mt-2">
            <span>{a.title}</span>
            {editing && <button onClick={() => removeAchievement(i)}><X size={12} /></button>}
          </div>
        ))}
        {editing && (
          <div className="flex gap-2 mt-3">
            <input
              value={tempAchievement}
              onChange={e => setTempAchievement(e.target.value)}
              placeholder="Achievement"
              className="bg-black border p-2 flex-1"
            />
            <button onClick={addAchievement}><Plus /></button>
          </div>
        )}
      </section>
    </div>
  );
}
