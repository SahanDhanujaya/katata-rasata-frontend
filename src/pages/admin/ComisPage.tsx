import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface BackupRecord {
  _id: string;
  order: {
    _id: string;
    totalAmount: number;
    items: { name: string; qty: number; price: number }[];
    date: string;
  };
  deletedAt: string;
}

interface MonthGroup {
  monthKey: string; // e.g. "2026-08"
  label: string; // e.g. "August 2026"
  records: BackupRecord[];
  monthTotal: number;
}

const PAGE_SIZE = 5;

export default function ComisPage() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchBackups = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/sales/backups`, {
          withCredentials: true,
        });
        setBackups(res.data);
      } catch (err) {
        console.error("Error fetching backups:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBackups();
  }, []);

  // Overall total comis (all-time, unaffected by the month filter)
  const totalComis = useMemo(
    () => backups.reduce((sum, b) => sum + (b.order?.totalAmount || 0), 0),
    [backups],
  );

  // Group everything into months
  const monthGroups: MonthGroup[] = useMemo(() => {
    const groups = backups.reduce((acc: Record<string, MonthGroup>, b) => {
      const d = new Date(b.deletedAt);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      if (!acc[monthKey]) {
        acc[monthKey] = {
          monthKey,
          label: d.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          }),
          records: [],
          monthTotal: 0,
        };
      }

      acc[monthKey].records.push(b);
      acc[monthKey].monthTotal += b.order?.totalAmount || 0;

      return acc;
    }, {});

    return Object.values(groups).sort((a, b) =>
      a.monthKey < b.monthKey ? 1 : -1,
    );
  }, [backups]);

  // Reset to page 1 whenever the month filter changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [selectedMonth]);

  // Records to actually display: either everything, or just the selected month
  const activeRecords: BackupRecord[] =
    selectedMonth === "ALL"
      ? backups
      : monthGroups.find((g) => g.monthKey === selectedMonth)?.records || [];

  const activeTotal =
    selectedMonth === "ALL"
      ? totalComis
      : monthGroups.find((g) => g.monthKey === selectedMonth)?.monthTotal || 0;

  const activeLabel =
    selectedMonth === "ALL"
      ? "All Time"
      : monthGroups.find((g) => g.monthKey === selectedMonth)?.label || "";

  // Pagination over activeRecords
  const totalPages = Math.max(1, Math.ceil(activeRecords.length / PAGE_SIZE));
  const paginatedRecords = activeRecords.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return (
    <div className="min-h-[calc(100vh-56px)] bg-zinc-950 p-4 sm:p-6 text-zinc-100">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* HEADER */}
        <div className="flex flex-col gap-1 border-b border-white/10 pb-6">
          <nav className="flex items-center gap-2 text-zinc-400 font-mono text-[10px] uppercase tracking-widest">
            <button
              className="hover:text-zinc-100 border border-white/10 p-1"
              onClick={() => window.history.back()}
            >
              {" "}
              ⬅ Go to Back
            </button>
          </nav>
          <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">
            Laka's Take away — Deleted Order Ledger
          </span>
          <h2 className="font-mono text-xl sm:text-2xl font-bold tracking-tighter text-amber-400 uppercase">
            Comis
          </h2>
          <p className="font-mono text-[9px] sm:text-[10px] tracking-widest text-zinc-500 uppercase">
            Total & monthly value of deleted orders
          </p>
        </div>

        {/* MONTH FILTER */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 rounded-lg bg-zinc-900/50 p-4 border border-white/5">
          <div className="space-y-1 flex-1">
            <label className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block px-1">
              Filter by Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-amber-400/40"
            >
              <option value="ALL">All Time</option>
              {monthGroups.map((g) => (
                <option key={g.monthKey} value={g.monthKey}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-6 py-4">
            <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
              Total Comis (All Time)
            </p>
            <p className="font-mono text-xl font-bold text-amber-400">
              Rs. {totalComis.toLocaleString()}
            </p>
            <p className="font-mono text-[9px] tracking-widest text-zinc-600 uppercase mt-1">
              {backups.length} deleted order{backups.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-zinc-900/50 px-6 py-4">
            <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
              {activeLabel} Comis
            </p>
            <p className="font-mono text-xl font-bold text-zinc-300">
              Rs. {activeTotal.toLocaleString()}
            </p>
            <p className="font-mono text-[9px] tracking-widest text-zinc-600 uppercase mt-1">
              {activeRecords.length} deleted order
              {activeRecords.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* LIST */}
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent"></div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Loading records...
            </p>
          </div>
        ) : activeRecords.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-white/10 font-mono text-xs uppercase tracking-widest text-zinc-600">
            No deleted orders found for this period
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {paginatedRecords.map((b) => (
                <div
                  key={b._id}
                  className="rounded-lg border border-white/10 bg-zinc-900"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-white/5">
                    <div className="flex flex-wrap gap-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-[9px] text-zinc-500 uppercase">
                          Deleted On
                        </span>
                        <span className="font-mono text-xs text-zinc-200">
                          {new Date(b.deletedAt).toLocaleDateString()} —{" "}
                          {new Date(b.deletedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-mono text-[9px] text-zinc-500 uppercase">
                          Receipt #
                        </span>
                        <span className="font-mono text-xs text-zinc-500">
                          #{b.order?._id?.slice(-6).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[9px] text-zinc-500 uppercase">
                        Order Total
                      </span>
                      <p className="font-mono text-md font-bold text-amber-400">
                        Rs. {(b.order?.totalAmount || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-zinc-800/10 space-y-1.5">
                    {b.order?.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between font-mono text-[11px]"
                      >
                        <span className="text-zinc-400">
                          {item.name}{" "}
                          <span className="text-zinc-600 ml-1">
                            ×{item.qty}
                          </span>
                        </span>
                        <span className="text-zinc-300">
                          Rs. {(item.price * item.qty).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* PAGINATION CONTROLS */}
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-zinc-900/60 px-6 py-4 mt-6">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 transition hover:text-amber-400 disabled:opacity-20 active:scale-95"
              >
                ← Prev
              </button>

              <div className="flex items-center gap-3">
                <span className="h-px w-4 bg-zinc-800"></span>
                <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  Page <span className="text-amber-400 font-bold">{page}</span>{" "}
                  of {totalPages}
                </p>
                <span className="h-px w-4 bg-zinc-800"></span>
              </div>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 transition hover:text-amber-400 disabled:opacity-20 active:scale-95"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
