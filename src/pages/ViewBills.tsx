import { useEffect, useState, useCallback } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ViewBills() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [, setTotalRangeSales] = useState(0); // For total revenue across all pages
  const limit = 10;

  const today = new Date().toISOString().split("T")[0];
  const [dateRange, setDateRange] = useState({ start: today, end: today });

  /**
   * REUSABLE FETCH FUNCTION
   * We pass 'targetPage' manually to avoid waiting for state updates
   */
  const fetchData = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/sales/report`, {
          params: {
            startDate: dateRange.start,
            endDate: dateRange.end,
            page: targetPage,
            limit,
          },
        });

        // Assuming backend returns { data: bills[], totalRevenue: number }
        // If your backend only returns the array, use: setBills(res.data)
        const fetchedBills = Array.isArray(res.data)
          ? res.data
          : res.data.bills;
        setBills(fetchedBills);

        // Update pagination status
        setHasMore(fetchedBills.length === limit);

        // Optional: If your backend calculates range total
        if (res.data.totalRevenue) setTotalRangeSales(res.data.totalRevenue);
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    },
    [dateRange, limit],
  );

  // Sync effect: Trigger whenever page changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(page);
  }, [page, fetchData]);

  // Manual Trigger: Reset to page 1 and fetch
  const handleUpdateView = () => {
    if (page !== 1) {
      setPage(1); // This triggers the useEffect automatically
    } else {
      fetchData(1); // Force refresh if already on page 1
    }
  };

  // Local calculation for the visible page
  const pageSales = bills.reduce(
    (sum, bill) => sum + (bill.totalAmount || 0),
    0,
  );

  function printBill(bill: any): void {
  if (!bill?._id) {
    alert("Invalid bill ID");
    return;
  }

  // Backend route:
  // GET /api/print/bill/:saleId
  const responseUrl = `${BASE_URL}/print/bill/${bill._id}`;

  console.log("Printing bill:", responseUrl);

  // Android Bluetooth Print app
  const bluetoothPrintUrl =
    `my.bluetoothprint.scheme://${responseUrl}`;

  // Detect Android
  const isAndroid = /Android/i.test(navigator.userAgent);

  if (isAndroid) {
    // eslint-disable-next-line react-hooks/immutability
    window.location.href = bluetoothPrintUrl;
    return;
  }

  // Desktop fallback
  window.print();
}

  return (
    <div className="min-h-[calc(100vh-56px)] bg-zinc-950 p-4 sm:p-6 text-zinc-100 print:bg-white print:p-0 print:text-black">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* HEADER & FILTERS */}
        <div className="flex flex-col gap-6 border-b border-white/10 pb-6 print:hidden">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="font-mono text-xl sm:text-2xl font-bold tracking-tighter text-amber-400 uppercase">
                Billing History
              </h2>
              <p className="font-mono text-[9px] sm:text-[10px] tracking-widest text-zinc-500 uppercase">
                Transaction Archive & Pagination
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="w-full md:w-auto rounded border border-zinc-700 bg-zinc-800 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-300 hover:bg-zinc-700 active:scale-95 transition-all"
            >
              Export PDF
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 rounded-lg bg-zinc-900/50 p-4 border border-white/5">
            <div className="space-y-1">
              <label className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block px-1">
                From
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-amber-400/40"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block px-1">
                To
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-amber-400/40"
              />
            </div>
            <button
              onClick={handleUpdateView}
              className="h-8 self-end sm:col-span-2 lg:col-span-1 rounded bg-amber-400 px-6 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-950 hover:bg-amber-300 transition-all active:scale-95"
            >
              Filter Records
            </button>
          </div>
        </div>

        {/* SUMMARY STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-6 py-4">
            <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
              Visible Page Total
            </p>
            <p className="font-mono text-xl font-bold text-amber-400">
              Rs. {pageSales.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-zinc-900/50 px-6 py-4">
            <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
              Records in Batch
            </p>
            <p className="font-mono text-xl font-bold text-zinc-300">
              {bills.length} Bills
            </p>
          </div>
        </div>

        {/* BILLS LIST */}
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent"></div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Retrieving Archive...
            </p>
          </div>
        ) : bills.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-white/10 font-mono text-xs uppercase tracking-widest text-zinc-600">
            Zero transactions found for this period
          </div>
        ) : (
          <>
            <div className="grid gap-4 print:block">
              {bills.map((bill) => (
                <div
                  key={bill._id}
                  className="group rounded-lg border border-white/10 bg-zinc-900 transition-colors hover:border-white/20"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-white/5">
                    <div className="flex flex-wrap gap-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-[9px] text-zinc-500 uppercase">
                          Date/Time
                        </span>
                        <span className="font-mono text-xs text-zinc-200">
                          {new Date(bill.date).toLocaleDateString()} —{" "}
                          {new Date(bill.date).toLocaleTimeString([], {
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
                          #{bill.orderId?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="font-mono text-[9px] text-zinc-500 uppercase">
                        Grand Total
                      </span>
                      <p className="font-mono text-md font-bold text-amber-400">
                        Rs. {bill.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    {/* print button  */}
                    <div>
                      <button
                        onClick={() => printBill(bill)}
                        className="border border-amber-400/20 mask-b-from-orange-950 bg-amber-400/5  rounded px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-widest text-white hover:bg-amber-300 hover:text-black hover:cursor-pointer transition-all active:scale-95"
                      >
                        Print Recipt
                      </button>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-zinc-800/10">
                    <div className="space-y-1.5">
                      {bill.items.map((item: any, idx: number) => (
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
                </div>
              ))}
            </div>

            {/* PAGINATION CONTROLS */}
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-zinc-900/60 px-6 py-4 mt-6 print:hidden">
              <button
                disabled={page === 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 transition hover:text-amber-400 disabled:opacity-20 active:scale-95"
              >
                ← Prev
              </button>

              <div className="flex items-center gap-3">
                <span className="h-px w-4 bg-zinc-800"></span>
                <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  Batch <span className="text-amber-400 font-bold">{page}</span>
                </p>
                <span className="h-px w-4 bg-zinc-800"></span>
              </div>

              <button
                disabled={!hasMore || loading}
                onClick={() => setPage((p) => p + 1)}
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
