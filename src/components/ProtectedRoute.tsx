import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { isAuth, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-5">
          {/* Animated Logo Ring */}
          <div className="relative flex h-24 w-24 items-center justify-center">
            {/* Outer Ring */}
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-zinc-800 border-t-amber-400"></div>

            {/* Inner Glow */}
            <div className="absolute h-16 w-16 rounded-full bg-amber-400/10 blur-xl"></div>

            {/* Center */}
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/30 bg-zinc-900">
              <span className="font-mono text-xl font-bold text-amber-400">
                $
              </span>
            </div>
          </div>

          {/* Loading Text */}
          <div className="text-center">
            <p className="font-mono text-sm font-bold tracking-[0.3em] text-zinc-200 uppercase">
              Loading
            </p>

            <p className="mt-2 font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
              Preparing Billing System
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex gap-2">
            <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400"></span>

            <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400 [animation-delay:150ms]"></span>

            <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400 [animation-delay:300ms]"></span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
