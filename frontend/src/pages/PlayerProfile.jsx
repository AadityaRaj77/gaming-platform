import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api";

export default function PlayerProfile() {
  const { username } = useParams(); // route: /:username
  const nav = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState("");
  const [gender, setGender] = useState("MALE");
  const [age, setAge] = useState("");
  const [about, setAbout] = useState("");
  const [selectedGame, setSelectedGame] = useState("VALORANT");
  const [gameId, setGameId] = useState("");
  const [otherGame, setOtherGame] = useState("");

  const [socialProvider, setSocialProvider] = useState("OTHER");
  const [socialLink, setSocialLink] = useState("");
  const [achievement, setAchievement] = useState("");

  const [socialLinksList, setSocialLinksList] = useState([]);
  const [achievementsList, setAchievementsList] = useState([]);

  // parse token helper (get current userId)
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

  const myUserId = getMyUserId();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // use search endpoint to find the profile by username
        const { data } = await API.get(`/profile/search?username=${encodeURIComponent(username)}`);
        // search returns array — find exact match case-insensitive
        const found = (data || []).find(
          p => p.user && p.user.username.toLowerCase() === username.toLowerCase()
        );

        if (!found) {
          setError("Profile not found");
          setProfile(null);
          return;
        }

        // To be safe, fetch the public profile by userId (ensures relations)
        const userId = found.user.id;
        const { data: publicProfile } = await API.get(`/profile/public/${userId}`);
        setProfile(publicProfile);

        // prepare form values (for editing if allowed)
        setLocation(publicProfile.location || "");
        setGender(publicProfile.gender || "MALE");
        setAge(publicProfile.age ?? "");
        setAbout(publicProfile.about || "");
        setSelectedGame(publicProfile.games?.[0]?.game || "VALORANT");
        setGameId(publicProfile.games?.[0]?.playerIdOnGame || "");
        setOtherGame("");

        setSocialLinksList(publicProfile.socialLinks || []);
        setAchievementsList(publicProfile.achievements || []);
      } catch (err) {
        console.error("load profile:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [username]);

  // only allow editing if viewing your own profile
  const isMine = Boolean(profile && myUserId && profile.user && profile.user.id === myUserId);

  const save = async () => {
    if (!isMine) return alert("You can only edit your own profile.");

    try {
      const finalGame = selectedGame === "OTHERS" ? otherGame || "OTHERS" : selectedGame;

      const socialPayload = socialLinksList.length
        ? socialLinksList.map(s => ({ provider: s.provider || "OTHER", url: s.url, label: s.label || null }))
        : socialLink.trim()
        ? [{ provider: socialProvider || "OTHER", url: socialLink.trim(), label: "Main" }]
        : [];

      const achievementPayload = achievementsList.length
        ? achievementsList.map(a => ({ title: a.title, description: a.description || null, proofUrl: a.proofUrl || null }))
        : achievement.trim()
        ? [{ title: achievement.trim(), description: null, proofUrl: null }]
        : [];

      const payload = {
        location,
        gender,
        age: age ? Number(age) : null,
        about,
        games: [{ game: finalGame, playerIdOnGame: gameId || null }],
        socialLinks: socialPayload,
        achievements: achievementPayload
      };

      const { data } = await API.put("/profile/me", payload);

      if (data?.profile) {
        setProfile(data.profile);
        setSocialLinksList(data.profile.socialLinks || []);
        setAchievementsList(data.profile.achievements || []);
      } else {
        const { data: re } = await API.get(`/profile/public/${profile.user.id}`);
        setProfile(re);
      }

      setEditing(false);
      alert("Profile saved");
    } catch (err) {
      console.error("save:", err);
      alert(err?.response?.data?.message || "Save failed");
    }
  };

  if (loading) return <div className="p-6">Loading profile...</div>;
  if (error) return <div className="p-6 text-red-400">{error}</div>;
  if (!profile) return <div className="p-6">No profile</div>;

  return (
    <div className="p-6 min-h-screen bg-linear-to-br from-[#07000d] to-[#200018] text-white">
      <div className="max-w-3xl mx-auto bg-[#0f0f1a]/90 p-6 rounded-2xl shadow-md">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold">{profile.user.username}</h1>
            <div className="text-sm text-gray-300">{profile.location || ""}</div>
          </div>

          <div>
            {isMine ? (
              <button onClick={() => setEditing(v => !v)} className="px-3 py-1 bg-violet-600 rounded">
                {editing ? "Cancel" : "Edit"}
              </button>
            ) : (
              <button onClick={() => nav(-1)} className="px-3 py-1 bg-gray-600 rounded">Back</button>
            )}
          </div>
        </div>

        {!editing ? (
          <>
            <div className="space-y-3 text-sm">
              <div><b>About:</b> {profile.about || "—"}</div>
              <div><b>Age:</b> {profile.age ?? "—"}</div>
              <div><b>Game:</b> {profile.games?.[0]?.game || "—"} {profile.games?.[0]?.playerIdOnGame && <span className="text-gray-400">({profile.games[0].playerIdOnGame})</span>}</div>

              <div>
                <b>Social:</b>
                {profile.socialLinks?.length ? (
                  <ul className="list-disc list-inside mt-1 text-xs">
                    {profile.socialLinks.map((s, i) => <li key={i}>{s.provider} — <a className="text-blue-300" href={s.url} target="_blank" rel="noreferrer">{s.url}</a></li>)}
                  </ul>
                ) : <span className="ml-1 text-gray-400">—</span>}
              </div>

              <div>
                <b>Achievements:</b>
                {profile.achievements?.length ? (
                  <ul className="list-disc list-inside mt-1 text-xs">
                    {profile.achievements.map((a, i) => <li key={i}>{a.title}</li>)}
                  </ul>
                ) : <span className="ml-1 text-gray-400">—</span>}
              </div>
            </div>
          </>
        ) : (
          // EDIT UI — only visible if isMine true (button to enable)
          <div className="space-y-3">
            <input className="w-full p-2 bg-black border rounded" value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" />
            <select className="w-full p-2 bg-black border rounded" value={gender} onChange={e => setGender(e.target.value)}>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
            <input className="w-full p-2 bg-black border rounded" value={age} onChange={e => setAge(e.target.value)} placeholder="Age" />
            <textarea className="w-full p-2 bg-black border rounded" value={about} onChange={e => setAbout(e.target.value)} placeholder="About" />
            <select className="w-full p-2 bg-black border rounded" value={selectedGame} onChange={e => setSelectedGame(e.target.value)}>
              <option value="BGMI">BGMI</option>
              <option value="FREEFIRE">Free Fire</option>
              <option value="VALORANT">Valorant</option>
              <option value="CALL_OF_DUTY">Call of Duty</option>
              <option value="CSGO">CSGO</option>
              <option value="CHESS_DOT_COM">Chess.com</option>
              <option value="OTHERS">Others</option>
            </select>
            {selectedGame === "OTHERS" && <input className="w-full p-2 bg-black border rounded" value={otherGame} onChange={e => setOtherGame(e.target.value)} placeholder="Enter game name" />}
            <input className="w-full p-2 bg-black border rounded" value={gameId} onChange={e => setGameId(e.target.value)} placeholder="Player ID" />

            {/* social provider + link */}
            <select className="w-full p-2 bg-black border rounded" value={socialProvider} onChange={e => setSocialProvider(e.target.value)}>
              <option value="TWITCH">Twitch</option>
              <option value="YOUTUBE">YouTube</option>
              <option value="TWITTER">Twitter</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="DISCORD">Discord</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="OTHER">Other</option>
            </select>
            <input className="w-full p-2 bg-black border rounded" value={socialLink} onChange={e => setSocialLink(e.target.value)} placeholder="Social link (url)" />

            <input className="w-full p-2 bg-black border rounded" value={achievement} onChange={e => setAchievement(e.target.value)} placeholder="Achievement title" />

            <div className="flex gap-3">
              <button onClick={save} className="px-4 py-1 bg-green-600 rounded">Save</button>
              <button onClick={() => setEditing(false)} className="px-4 py-1 bg-gray-600 rounded">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
