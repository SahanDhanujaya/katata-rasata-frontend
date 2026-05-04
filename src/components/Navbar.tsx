import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { to: "/", label: "Billing" },
  { to: "/add", label: "Items" }, // Shortened for mobile space
  { to: "/report", label: "Report" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        
        {/* Left: Logo & Mobile Toggle */}
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleMenu}
            className="flex h-8 w-8 items-center justify-center rounded border border-white/10 bg-zinc-900 text-zinc-400 md:hidden"
          >
            {isOpen ? "✕" : "☰"}
          </button>

          <Link
            to="/"
            className="flex items-center gap-2 font-mono text-sm font-bold tracking-widest text-amber-400 uppercase"
          >
            <span className="hidden h-7 w-7 items-center justify-center rounded border border-amber-400/40 bg-amber-400/10 text-xs sm:flex">
              POS
            </span>
            <span className="sm:inline">SYSTEM</span>
          </Link>
        </div>

        {/* Center: Desktop Links (Hidden on Mobile) */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ to, label }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`relative px-4 py-1.5 font-mono text-xs tracking-wider uppercase transition-colors duration-150
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

        {/* Right: Theme Toggle */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Drawer (Visible only when isOpen is true) */}
      <div 
        className={`absolute left-0 top-14 w-full border-b border-white/10 bg-zinc-950 p-4 transition-all duration-300 md:hidden ${
          isOpen ? "translate-y-0 opacity-100" : "-translate-y-5 opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col gap-2">
          {navLinks.map(({ to, label }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setIsOpen(false)}
                className={`flex w-full items-center rounded-md px-4 py-3 font-mono text-xs tracking-widest uppercase transition-all
                  ${active 
                    ? "bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20" 
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                  }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}