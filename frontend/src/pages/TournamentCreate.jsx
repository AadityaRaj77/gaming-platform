import { useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Calendar, MapPin, DollarSign, Users, Gamepad2, Target, Trophy } from "lucide-react";

export default function TournamentCreate() {
  const nav = useNavigate();

  // --- LOGIC STARTS HERE (UNCHANGED) ---
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [venueType, setVenueType] = useState("ONLINE");
  const [location, setLocation] = useState("");

  const [startDate, setStart] = useState("");
  const [endDate, setEnd] = useState("");

  const [games, setGames] = useState([""]);
  const [requirements, setReqs] = useState([""]);

  const [feeType, setFeeType] = useState("FREE");
  const [feeAmount, setFeeAmount] = useState("");

  const [organizers, setOrganizers] = useState([""]);

  const handleCreate = async () => {
    const payload = {
      name,
      tagline,
      venueType,
      location,
      startDate,
      endDate,
      games: games.filter(Boolean),
      requirements: requirements.filter(Boolean),
      feeType,
      feeAmount,
      organizers: organizers.filter(Boolean),
      bannerUrl: null, // As per original logic
    };

    try {
      const { data } = await API.post("/tournaments/create", payload);
      alert("Tournament created!");
      nav(`/tournaments/${data.tournamentId}`);
    } catch (err) {
      alert(err.response?.data?.message || "Create failed");
      console.error(err);
    }
  };
  // --- LOGIC ENDS HERE ---

  // --- ANIMATION VARIANTS ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-cyan-50 p-6 flex justify-center items-center overflow-hidden relative">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-slate-950 to-cyan-900/20 pointer-events-none"></div>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-4xl bg-slate-900/80 backdrop-blur-md border border-slate-700 p-8 rounded-xl shadow-2xl shadow-cyan-500/10"
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 95%, 95% 100%, 0 100%)" }}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8 border-b border-slate-700 pb-4 flex items-center gap-3">
          <Trophy className="text-yellow-400 w-8 h-8" />
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              Initialize Tournament
            </h1>
            <p className="text-slate-400 text-sm font-mono tracking-widest">SETUP_WIZARD_V1.0</p>
          </div>
        </motion.div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Basic Info */}
          <div className="space-y-6">
            <motion.div variants={itemVariants} className="space-y-4">
              <h3 className="text-cyan-400 font-bold uppercase text-sm tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4" /> Core Intel
              </h3>
              
              <div className="group relative">
                <input 
                  className="w-full bg-slate-950 border border-slate-700 p-4 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-bold tracking-wide placeholder-slate-600"
                  placeholder="TOURNAMENT NAME" 
                  onChange={(e) => setName(e.target.value)} 
                />
              </div>

              <input 
                className="w-full bg-slate-950 border border-slate-700 p-4 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder-slate-600"
                placeholder="Catchy Tagline..." 
                onChange={(e) => setTagline(e.target.value)} 
              />
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
               <label className="text-xs text-slate-500 font-mono uppercase">Venue Configuration</label>
               <div className="flex gap-4">
                 <select 
                    className="flex-1 bg-slate-950 border border-slate-700 p-3 rounded-lg text-cyan-50 focus:border-cyan-500 outline-none"
                    value={venueType} 
                    onChange={(e) => setVenueType(e.target.value)}
                  >
                   <option value="ONLINE">ONLINE SERVER</option>
                   <option value="OFFLINE">LAN / ONSITE</option>
                 </select>
               </div>
               
               <AnimatePresence>
                 {venueType === "OFFLINE" && (
                   <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pt-2"
                   >
                     <div className="flex items-center bg-slate-950 border border-yellow-600/50 rounded-lg p-3">
                       <MapPin className="text-yellow-500 w-5 h-5 mr-3" />
                       <input 
                         className="bg-transparent w-full outline-none text-yellow-50 placeholder-yellow-700" 
                         placeholder="Physical Location Address" 
                         onChange={(e) => setLocation(e.target.value)} 
                       />
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-xs text-slate-500 font-mono uppercase">Start Sequence</label>
                 <div className="relative">
                   <Calendar className="absolute left-3 top-3 text-slate-500 w-4 h-4" />
                   <input type="datetime-local" className="w-full bg-slate-950 border border-slate-700 p-2 pl-10 rounded text-sm text-slate-300 focus:border-cyan-500 outline-none" onChange={(e) => setStart(e.target.value)} />
                 </div>
               </div>
               <div className="space-y-1">
                 <label className="text-xs text-slate-500 font-mono uppercase">End Sequence</label>
                 <div className="relative">
                   <Calendar className="absolute left-3 top-3 text-slate-500 w-4 h-4" />
                   <input type="datetime-local" className="w-full bg-slate-950 border border-slate-700 p-2 pl-10 rounded text-sm text-slate-300 focus:border-purple-500 outline-none" onChange={(e) => setEnd(e.target.value)} />
                 </div>
               </div>
            </motion.div>
          </div>

          {/* Right Column: Dynamic Lists */}
          <div className="space-y-6">
            
            {/* Games Section */}
            <motion.div variants={itemVariants} className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-purple-400 font-bold uppercase text-sm flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4" /> Active Games
                </h3>
                <button onClick={() => setGames([...games, ""])} className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded transition-colors flex items-center gap-1">
                  <Plus className="w-3 h-3" /> ADD
                </button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                {games.map((g, i) => (
                  <motion.input
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    key={i}
                    className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-sm focus:border-purple-500 outline-none"
                    placeholder={`Game Title #${i + 1}`}
                    value={g}
                    onChange={(e) => {
                      const arr = [...games];
                      arr[i] = e.target.value;
                      setGames(arr);
                    }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Requirements Section */}
            <motion.div variants={itemVariants} className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-cyan-400 font-bold uppercase text-sm flex items-center gap-2">
                  <Target className="w-4 h-4" /> Entry Criteria
                </h3>
                <button onClick={() => setReqs([...requirements, ""])} className="text-xs bg-cyan-700 hover:bg-cyan-600 text-white px-2 py-1 rounded transition-colors flex items-center gap-1">
                  <Plus className="w-3 h-3" /> ADD
                </button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                {requirements.map((r, i) => (
                  <motion.input
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    key={i}
                    className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-sm focus:border-cyan-500 outline-none"
                    placeholder={`Requirement #${i + 1}`}
                    value={r}
                    onChange={(e) => {
                      const arr = [...requirements];
                      arr[i] = e.target.value;
                      setReqs(arr);
                    }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Organizers Section */}
            <motion.div variants={itemVariants} className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-green-400 font-bold uppercase text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" /> Admins
                </h3>
                <button onClick={() => setOrganizers([...organizers, ""])} className="text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded transition-colors flex items-center gap-1">
                  <Plus className="w-3 h-3" /> ADD
                </button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                {organizers.map((o, i) => (
                  <motion.input
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    key={i}
                    className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-sm focus:border-green-500 outline-none"
                    placeholder="Admin Username"
                    value={o}
                    onChange={(e) => {
                      const arr = [...organizers];
                      arr[i] = e.target.value;
                      setOrganizers(arr);
                    }}
                  />
                ))}
              </div>
            </motion.div>

          </div>
        </div>

        {/* Footer: Fee & Submit */}
        <motion.div variants={itemVariants} className="mt-8 pt-6 border-t border-slate-800 flex flex-col md:flex-row gap-6 items-end justify-between">
          <div className="flex gap-4 items-end w-full md:w-auto">
             <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-500 font-mono uppercase">Entry Cost</label>
                <select 
                  className="bg-slate-950 border border-slate-700 p-3 rounded-lg text-white focus:border-pink-500 outline-none"
                  value={feeType} 
                  onChange={(e) => setFeeType(e.target.value)}
                >
                  <option value="FREE">FREE ENTRY</option>
                  <option value="PAID">PAID ENTRY</option>
                </select>
             </div>
             
             <AnimatePresence>
               {feeType === "PAID" && (
                 <motion.div 
                    initial={{ width: 0, opacity: 0 }} 
                    animate={{ width: "120px", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="overflow-hidden"
                 >
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-3 text-pink-500 w-4 h-4" />
                      <input 
                        className="w-full bg-slate-950 border border-pink-900/50 p-3 pl-8 rounded-lg text-pink-50 placeholder-pink-800 focus:border-pink-500 outline-none"
                        placeholder="0.00" 
                        type="number"
                        onChange={(e) => setFeeAmount(e.target.value)} 
                      />
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          <motion.button 
            whileHover={{ scale: 1.05, textShadow: "0px 0px 8px rgb(34, 211, 238)" }}
            whileTap={{ scale: 0.95 }}
            className="w-full md:w-auto px-12 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black italic tracking-widest uppercase rounded skew-x-[-10deg] shadow-[0_0_20px_rgba(8,145,178,0.5)] transition-all"
            onClick={handleCreate}
          >
            <span className="block skew-x-[10deg]">Launch Tournament</span>
          </motion.button>
        </motion.div>

      </motion.div>
    </div>
  );
}