import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(
    () => localStorage.getItem("theme") !== "light"
  );

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      aria-label="Toggle theme"
      className="group flex h-8 w-16 items-center rounded-full border border-white/10 bg-zinc-800 p-1 transition-colors duration-300 hover:border-amber-400/30 dark:bg-zinc-900"
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs transition-all duration-300
          ${dark
            ? "translate-x-0 bg-zinc-700 text-zinc-300"
            : "translate-x-8 bg-amber-400 text-zinc-900"
          }`}
      >
        {dark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}