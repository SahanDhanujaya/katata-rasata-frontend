import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Static login
  const login = () => {
    if (email === "admin@gmail.com" && password === "1234") {
      localStorage.setItem("isAuth", "true");
      navigate("/");
    } else if (email === "superadmin@gmail.com" && password === "5678") {
      localStorage.setItem("isSuperAuth", "true");
      navigate("/superadmin");
    } else {
      alert("Invalid credentials");
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-white/10 bg-zinc-800 px-4 py-3 font-mono text-sm outline-none focus:border-amber-400/40 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase px-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-white/10 bg-zinc-800 px-4 py-3 font-mono text-sm outline-none focus:border-amber-400/40 transition"
            />
          </div>

          {/* Button */}
          <button
            onClick={login}
            className="w-full rounded-lg bg-amber-400 py-3 font-mono text-sm font-bold tracking-widest text-zinc-900 hover:bg-amber-300 transition-all active:scale-[0.98] uppercase"
          >
            Login
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