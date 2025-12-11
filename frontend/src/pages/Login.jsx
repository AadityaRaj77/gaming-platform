import { useState, useEffect } from "react";
import { useNavigate, Link, BrowserRouter, Routes, Route } from "react-router-dom";
import { Gamepad2, Lock, User, Zap, ChevronRight, Cpu } from "lucide-react";
import API from "../api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async () => {
    if (!username || !password) {
      alert("Username and Password required");
      return;
    }
    try {
      setLoading(true);
      const { data } = await API.post("/auth/login", { username, password });
      localStorage.setItem("token", data.token);
      nav("/");
    } catch (err) {
      alert(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden font-sans selection:bg-red-500/30 text-white">
      {/* ANIMATED BACKGROUND */}
      <div className="absolute inset-0 z-0">
        {/* Deep Space linear */}
        <div className="absolute inset-0 bg-[radial-linear(circle_at_center,_var(--tw-linear-stops))] from-[#1a0b2e] via-[#000000] to-[#000000]"></div>
        {/* Moving Grid Floor */}
        <div 
          className="absolute bottom-0 left-[-50%] right-[-50%] h-[50vh] bg-[linear-linear(to_right,rgba(124,58,237,0.1)_1px,transparent_1px),linear-linear(to_bottom,rgba(124,58,237,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem] [transform:perspective(500px)_rotateX(60deg)] animate-[grid-move_20s_linear_infinite]"
          style={{ transformOrigin: 'bottom' }}
        ></div>
        {/* Ambient Glow Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* MAIN LOGIN HUD */}
      <div className="relative z-10 w-full max-w-md p-1">
        {/* Decorative HUD Elements outside the box */}
        <div className="absolute -top-12 left-0 text-xs font-mono text-purple-500/50 tracking-[0.2em]">
          SYSTEM_SECURE_ACCESS // V.2.0.4
        </div>
        <div className="absolute -bottom-12 right-0 flex items-center gap-2 text-xs font-mono text-red-500/50">
          <Cpu size={14} className="animate-spin-slow" /> SERVER STATUS: ONLINE
        </div>

        {/* The Card */}
        <div className="relative bg-[#0a0a12]/80 backdrop-blur-xl border border-white/10 p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden group">
          {/* Animated Border linear */}
          <div className="absolute inset-0 p-[1px] bg-linear-to-br from-transparent via-purple-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          
          {/* Scanning Line Effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-red-500 to-transparent opacity-20 animate-[scan_3s_ease-in-out_infinite]"></div>

          {/* Corner Clips (Sci-Fi Look) */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-purple-500"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-purple-500"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500"></div>

          {/* Header */}
          <div className="text-center mb-10 relative">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-xl bg-linear-to-br from-purple-900/50 to-black border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Gamepad2 size={32} className="text-purple-400" />
            </div>
            <h2 className="text-3xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-linear-to-r from-white via-purple-200 to-gray-400">
              Nexus<span className="text-red-500">Login</span>
            </h2>
            <p className="text-xs text-gray-500 font-mono tracking-widest mt-1">ENTER THE ARENA</p>
          </div>

          {/* Inputs */}
          <div className="space-y-6">
            
            {/* Username Input */}
            <div className="group/input relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={18} className="text-gray-500 group-focus-within/input:text-purple-400 transition-colors" />
              </div>
              <input
                className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-600 outline-none focus:border-purple-500 focus:bg-purple-900/10 focus:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all font-mono text-sm"
                placeholder="OPERATOR ID"
                onChange={(e) => setUsername(e.target.value)}
              />
              {/* Corner accent on focus */}
              <div className="absolute bottom-0 right-0 w-0 h-[2px] bg-purple-500 group-focus-within/input:w-full transition-all duration-500"></div>
            </div>

            {/* Password Input */}
            <div className="group/input relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-500 group-focus-within/input:text-red-400 transition-colors" />
              </div>
              <input
                type="password"
                className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-600 outline-none focus:border-red-500 focus:bg-red-900/10 focus:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all font-mono text-sm"
                placeholder="ACCESS CODE"
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="absolute bottom-0 right-0 w-0 h-[2px] bg-red-500 group-focus-within/input:w-full transition-all duration-500"></div>
            </div>

          </div>

          {/* Action Button */}
          <button
            onClick={submit}
            disabled={loading}
            className="w-full mt-8 relative group/btn overflow-hidden rounded-lg"
          >
            <div className="absolute inset-0 w-full h-full bg-linear-to-r from-purple-600 to-red-600 opacity-80 group-hover/btn:opacity-100 transition-opacity"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-linears.vercel.app/noise.svg')] opacity-20"></div>
            
            <div className="relative px-6 py-4 flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-sm">
              {loading ? (
                <>
                  <Cpu size={18} className="animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Initialize <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </div>
            
            {/* Hover Glow */}
            <div className="absolute -inset-1 bg-linear-to-r from-purple-600 to-red-600 blur-lg opacity-0 group-hover/btn:opacity-50 transition-opacity duration-500 -z-10"></div>
          </button>

          {/* Footer */}
          <div className="mt-8 flex items-center justify-between text-xs font-mono text-gray-500">
            <span className="flex items-center gap-1 hover:text-white cursor-pointer transition-colors">
              <Zap size={12} /> HELP_CENTER
            </span>
            <Link 
              to="/register" 
              className="flex items-center gap-1 text-purple-400 hover:text-red-400 hover:underline transition-all"
            >
              NEW_RECRUIT? <ChevronRight size={12} />
            </Link>
          </div>

        </div>
      </div>

      {/* Global CSS for custom animations without external file */}
      <style>{`
        @keyframes grid-move {
          0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
          100% { transform: perspective(500px) rotateX(60deg) translateY(4rem); }
        }
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          50% { opacity: 0.5; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
      `}</style>
    </div>
  );
}