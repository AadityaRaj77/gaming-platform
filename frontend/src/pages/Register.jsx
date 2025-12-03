import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async () => {
    if (!username || !password) {
      alert("Username and password required");
      return;
    }

    try {
      setLoading(true);
      const { data } = await API.post("/auth/register", { username, password });
      localStorage.setItem("token", data.token);
      nav("/");
    } catch (err) {
      alert(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#0b0014] via-[#1a0033] to-[#2b001a]">
      
      <div className="w-full max-w-md bg-[#0f0f1a]/90 backdrop-blur border border-purple-700/40 rounded-2xl p-8 shadow-[0_0_40px_rgba(168,85,247,0.25)]">
        
        {/* Title */}
        <h2 className="text-3xl font-bold text-center bg-linear-to-r from-violet-400 to-red-500 bg-clip-text text-transparent mb-6">
          Create Account
        </h2>

        {/* Username */}
        <div className="mb-4">
          <label className="text-sm text-gray-300 mb-1 block">Username</label>
          <input
            className="w-full px-4 py-2 rounded-lg bg-[#08080f] border border-purple-700/40 text-white focus:outline-none focus:border-red-500 transition"
            placeholder="Choose your gamer tag"
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="text-sm text-gray-300 mb-1 block">Password</label>
          <input
            type="password"
            className="w-full px-4 py-2 rounded-lg bg-[#08080f] border border-purple-700/40 text-white focus:outline-none focus:border-red-500 transition"
            placeholder="••••••••"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Register Button */}
        <button
          onClick={submit}
          disabled={loading}
          className="w-full py-2 rounded-lg font-semibold tracking-wide bg-linear-to-r from-violet-600 to-red-600 hover:from-violet-500 hover:to-red-500 transition text-white shadow-lg disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-purple-700/40" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-purple-700/40" />
        </div>

        {/* Login Redirect */}
        <p className="text-sm text-center text-gray-300">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-red-400 hover:text-red-300 font-semibold underline underline-offset-4"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
