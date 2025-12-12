import { useEffect, useState } from "react";
import API from "../api";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, LogOut, Home, AlertTriangle, Crown, Loader2, Users } from "lucide-react";

export default function TournamentDashboard() {
  const { id } = useParams();
  const nav = useNavigate();

  const [data, setData] = useState(null);

  const load = async () => {
    const { data } = await API.get(`/tournaments/${id}`);
    setData(data);
  };

  useEffect(() => {
    load();
  }, [id]);

  // --- LOADING STATE ANIMATION ---
  if (!data) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-cyan-500">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className="w-12 h-12 mb-4" />
      </motion.div>
      <p className="font-mono tracking-widest text-sm animate-pulse">CONNECTING TO SERVER...</p>
    </div>
  );

  const { isOrganizer } = data;

  const disband = async () => {
    if (!confirm("Disband tournament permanently?")) return;
    await API.delete(`/tournaments/${id}/disband`);
    nav("/");
  };

  const exit = async () => {
    if (!confirm("Exit tournament?")) return;
    await API.post(`/tournaments/${id}/exit`);
    nav("/");
  };

  // --- ANIMATION VARIANTS ---
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
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-900/30 to-slate-950 pointer-events-none"></div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative max-w-5xl mx-auto p-6 pt-12"
      >
        
        {/* HERO SECTION: Banner & Title */}
        <motion.div variants={itemVariants} className="relative group mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative h-64 md:h-80 w-full rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl">
             {data.bannerUrl ? (
               <img src={data.bannerUrl} alt="Tournament Banner" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
             ) : (
               <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black flex items-center justify-center">
                 <Shield className="w-24 h-24 text-slate-700" />
               </div>
             )}
             
             {/* Gradient Overlay for Text Readability */}
             <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>

             <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 z-10">
               <motion.span 
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="inline-block px-3 py-1 mb-2 text-xs font-bold tracking-widest text-black bg-cyan-400 rounded-sm"
               >
                 LIVE TOURNAMENT
               </motion.span>
               <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">
                 {data.name}
               </h1>
               <p className="text-lg md:text-xl text-purple-300 font-mono mt-2 tracking-wide border-l-4 border-purple-500 pl-4 bg-black/30 backdrop-blur-sm inline-block pr-4 py-1">
                 {data.tagline}
               </p>
             </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Organizers */}
          <motion.div variants={itemVariants} className="md:col-span-2">
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-lg relative overflow-hidden">
               {/* Decorative Top Bar */}
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
               
               <h2 className="text-xl font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 mb-6">
                 <Users className="w-5 h-5" /> Staff Command
               </h2>

               <div className="space-y-3">
                 {data.organizers.map((o) => (
                   <motion.div 
                     whileHover={{ x: 10, backgroundColor: "rgba(168, 85, 247, 0.1)" }}
                     key={o.id} 
                     className="flex items-center gap-4 bg-slate-950 border border-slate-800 p-4 rounded-lg transition-colors group"
                   >
                     <div className="p-2 bg-slate-900 rounded-full border border-slate-700 group-hover:border-purple-500 transition-colors">
                       <Crown className="w-5 h-5 text-yellow-500" />
                     </div>
                     <div>
                       <div className="text-sm text-slate-500 font-mono text-[10px] uppercase">Organizer</div>
                       <div className="font-bold text-lg text-white group-hover:text-purple-300 transition-colors">{o.user.username}</div>
                     </div>
                   </motion.div>
                 ))}
               </div>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: Controls */}
          <motion.div variants={itemVariants} className="space-y-4">
             
             {isOrganizer && (
               <div className="bg-slate-900/80 border border-red-900/30 p-6 rounded-xl relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 text-red-900/20 rotate-12">
                    <AlertTriangle className="w-32 h-32" />
                  </div>
                  <h3 className="text-red-500 font-bold uppercase text-sm mb-4 relative z-10">Danger Zone</h3>
                  
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full mb-3 bg-red-600/10 border border-red-600/50 hover:bg-red-600 hover:text-white text-red-500 py-3 px-4 rounded font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 relative z-10"
                    onClick={disband}
                  >
                    <AlertTriangle className="w-4 h-4" /> Disband Event
                  </motion.button>
               </div>
             )}

             <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
                <h3 className="text-slate-400 font-bold uppercase text-sm mb-4">Navigation</h3>
                
                <div className="space-y-3">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 border border-slate-700 py-3 px-4 rounded font-bold transition-all flex items-center justify-center gap-2"
                    onClick={() => nav("/")}
                  >
                    <Home className="w-4 h-4" /> Return to Hub
                  </motion.button>

                  {!isOrganizer && (
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-slate-950 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white py-3 px-4 rounded font-medium transition-all flex items-center justify-center gap-2"
                      onClick={exit}
                    >
                      <LogOut className="w-4 h-4" /> Leave Tournament
                    </motion.button>
                  )}
                </div>
             </div>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}