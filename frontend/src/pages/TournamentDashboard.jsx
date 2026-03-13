import { useEffect, useState } from "react";
import API from "../api";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  LogOut,
  Home,
  AlertTriangle,
  Crown,
  Loader2,
  Users,
  Share2,
  Edit,
  Radio
} from "lucide-react";

export default function TournamentDashboard() {
  const { id } = useParams();
  const nav = useNavigate();

  const [data, setData] = useState(null);
  const [publishing, setPublishing] = useState(false);

  const load = async () => {
    try {
      const { data } = await API.get(`/tournaments/${id}`);
      setData(data);
    } catch (err) {
      alert("Failed to load tournament");
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  // ---------------- LOADING ----------------
  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-cyan-500">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 mb-4" />
        </motion.div>
        <p className="font-mono tracking-widest text-sm animate-pulse">
          CONNECTING TO SERVER...
        </p>
      </div>
    );
  }

  const { isOrganizer, isHosted, shareSlug } = data;

  // ---------------- ACTIONS ----------------
  const disband = async () => {
    if (!confirm("Disband tournament permanently? This cannot be undone.")) return;
    await API.delete(`/tournaments/${id}/disband`);
    nav("/");
  };

  const exit = async () => {
    if (!confirm("Exit tournament?")) return;
    await API.post(`/tournaments/${id}/exit`);
    nav("/");
  };

  const goToFormBuilder = () => {
    nav(`/tournaments/${id}/form-builder`);
  };

  const publish = async () => {
    try {
      setPublishing(true);
      const { data } = await API.post(`/tournaments/${id}/publish`);
      alert("Tournament hosted successfully!");
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const unpublish = async () => {
    if (!confirm("Unlist this tournament from public listing?")) return;
    await API.post(`/tournaments/${id}/unpublish`);
    await load();
  };

  const shareUrl =
    isHosted && shareSlug
      ? `${window.location.origin}/tournaments/${id}/register/${shareSlug}`
      : null;

  // ---------------- ANIMATIONS ----------------
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-cyan-50 relative overflow-x-hidden">
      {/* Background FX */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-900/30 to-slate-950 pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative max-w-5xl mx-auto p-6 pt-12"
      >
        {/* ---------------- HERO ---------------- */}
        <motion.div variants={itemVariants} className="relative group mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-2xl blur opacity-25" />
          <div className="relative h-64 md:h-80 w-full rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl">
            {data.bannerUrl ? (
              <img
                src={data.bannerUrl}
                alt="Tournament Banner"
                className="w-full h-full object-cover opacity-80"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Shield className="w-24 h-24 text-slate-700" />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

            <div className="absolute bottom-6 left-6 z-10">
              <span className="inline-block px-3 py-1 mb-2 text-xs font-bold tracking-widest text-black bg-cyan-400 rounded-sm">
                {isHosted ? "LIVE TOURNAMENT" : "PRIVATE TOURNAMENT"}
              </span>
              <h1 className="text-4xl md:text-6xl font-black uppercase italic">
                {data.name}
              </h1>
              <p className="text-purple-300 font-mono mt-2 border-l-4 border-purple-500 pl-4 bg-black/30 inline-block pr-4 py-1">
                {data.tagline}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ---------------- GRID ---------------- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* -------- ORGANIZERS -------- */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold uppercase text-cyan-400 flex gap-2 mb-6">
                <Users /> Organizers
              </h2>

              <div className="space-y-3">
                {data.organizers.map(o => (
                  <div
                    key={o.id}
                    className="flex items-center gap-4 bg-slate-950 border border-slate-800 p-4 rounded-lg"
                  >
                    <Crown className="text-yellow-500" />
                    <div className="font-bold text-lg">{o.user.username}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* -------- CONTROLS -------- */}
          <motion.div variants={itemVariants} className="space-y-4">
            {/* Organizer controls */}
            {isOrganizer && (
              <div className="bg-slate-900/70 border border-slate-800 p-6 rounded-xl space-y-3">
                <button
                  onClick={goToFormBuilder}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded font-bold flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" /> Edit Registration Form
                </button>

                {!isHosted ? (
                  <button
                    onClick={publish}
                    disabled={publishing}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded font-bold flex items-center justify-center gap-2"
                  >
                    <Radio className="w-4 h-4" />
                    {publishing ? "Hosting..." : "Host Tournament"}
                  </button>
                ) : (
                  <>
                    <div className="text-xs text-gray-400">Shareable link</div>
                    <div className="flex gap-2">
                      <input
                        value={shareUrl}
                        readOnly
                        className="w-full bg-black border border-slate-700 px-2 py-1 rounded text-xs"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(shareUrl)}
                        className="px-3 bg-cyan-500 text-black rounded"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={unpublish}
                      className="w-full bg-yellow-600/20 border border-yellow-600 text-yellow-400 py-2 rounded"
                    >
                      Unlist Tournament
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Danger zone */}
            {isOrganizer && (
              <div className="bg-slate-900/80 border border-red-900/30 p-6 rounded-xl">
                <h3 className="text-red-500 font-bold uppercase text-sm mb-3">
                  Danger Zone
                </h3>
                <button
                  onClick={disband}
                  className="w-full bg-red-600/10 border border-red-600 hover:bg-red-600 hover:text-white text-red-500 py-3 rounded font-bold"
                >
                  <AlertTriangle className="inline w-4 h-4 mr-2" />
                  Disband Tournament
                </button>
              </div>
            )}

            {/* Navigation */}
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
              <button
                onClick={() => nav("/")}
                className="w-full bg-slate-800 hover:bg-cyan-600 py-3 rounded font-bold flex gap-2 justify-center"
              >
                <Home className="w-4 h-4" /> Home
              </button>

              {!isOrganizer && (
                <button
                  onClick={exit}
                  className="w-full mt-3 bg-slate-950 border border-slate-700 py-3 rounded"
                >
                  <LogOut className="w-4 h-4 inline mr-2" />
                  Leave Tournament
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
