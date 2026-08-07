import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Update the path if needed
import { toast } from "react-toastify";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const login = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        credentials: "include", // Important: Send/receive cookies
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }

      if (data.success) {
        const freshUser = await checkAuth(); // use the returned value, not the closed-over `user`

        if (freshUser?.role === "admin") {
          navigate("/superadmin", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
        toast("✅ Login successful!");
      } else {
        toast(data.message || "❌ Login failed");
      }

    } catch (error) {
      console.error(error);
      toast("ℹ Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 px-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-xl shadow-2xl p-6">
        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="font-mono text-xl font-bold tracking-tighter text-amber-400 uppercase">
            System Access
          </h2>

          <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
            Enter credentials to continue
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase px-1">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-white/10 bg-zinc-800 px-4 py-3 font-mono text-sm outline-none focus:border-amber-400 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase px-1">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  login();
                }
              }}
              className="w-full rounded border border-white/10 bg-zinc-800 px-4 py-3 font-mono text-sm outline-none focus:border-amber-400 transition"
            />
          </div>

          {/* Login Button */}
          <button
            onClick={login}
            disabled={loading}
            className="w-full rounded-lg bg-amber-400 py-3 font-mono text-sm font-bold tracking-widest text-zinc-900 hover:bg-amber-300 disabled:opacity-50 transition-all active:scale-[0.98] uppercase"
          >
            {loading ? "Logging In..." : "Login"}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
          POS Billing System
        </div>
      </div>
    </div>
  );
}
