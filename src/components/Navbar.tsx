import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { to: "/", label: "Billing" },
  { to: "/add", label: "Items" },
  { to: "/report", label: "Report" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("isAuth");
    localStorage.removeItem("isSuperAuth");
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">

        {/* LEFT: Logo + Mobile Toggle */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded border border-white/10 bg-zinc-900 text-zinc-400"
          >
            {open ? "✕" : "☰"}
          </button>

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 font-mono text-sm font-bold tracking-widest text-amber-400 uppercase"
          >
            <span className="hidden sm:flex h-7 w-7 items-center justify-center rounded border border-amber-400/40 bg-amber-400/10 text-xs">
              POS
            </span>
            <span>SYSTEM</span>
          </Link>
        </div>

        {/* CENTER: Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`relative px-4 py-1.5 font-mono text-xs tracking-wider uppercase transition
                ${active ? "text-amber-400" : "text-zinc-400 hover:text-zinc-100"}`}
              >
                {active && (
                  <span className="absolute inset-0 rounded bg-amber-400/10 ring-1 ring-amber-400/30" />
                )}
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}
        </div>

        {/* RIGHT: Theme + Logout */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          <button
            onClick={logout}
            className="hidden sm:block rounded border border-red-500/30 bg-red-500/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-red-400 hover:bg-red-500/20 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* 🔽 Mobile Dropdown */}
      <div
        className={`md:hidden transition-all duration-300 ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="border-t border-white/10 bg-zinc-950 px-4 py-3 flex flex-col gap-2">

          {navLinks.map(({ to, label }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`rounded px-3 py-2 font-mono text-xs uppercase tracking-widest transition
                ${
                  active
                    ? "bg-amber-400/10 text-amber-400"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                }`}
              >
                {label}
              </Link>
            );
          })}

          {/* Mobile Logout */}
          <button
            onClick={logout}
            className="mt-2 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-red-400 hover:bg-red-500/20 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}