import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api";

export default function ViewBills() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10; // Items per page

  const today = new Date().toISOString().split("T")[0];
  const [dateRange, setDateRange] = useState({ start: today, end: today });

  const fetchReport = async (resetPage = false) => {
    setLoading(true);
    const currentPage = resetPage ? 1 : page;
    try {
      const res = await axios.get(`${API}/sales/report`, {
        params: { 
          startDate: dateRange.start, 
          endDate: dateRange.end,
          page: currentPage,
          limit
        }
      });
      
      setBills(res.data);
      // If we received fewer items than the limit, we've reached the end
      setHasMore(res.data.length === limit);
      if (resetPage) setPage(1);
    } catch (err) {
      console.error("Error fetching report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [page]); // Re-fetch when page changes

  const totalSales = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);

  return (
    <div className="min-h-[calc(100vh-56px)] bg-zinc-950 p-4 sm:p-6 text-zinc-100 print:bg-white print:p-0 print:text-black">
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col gap-6 border-b border-white/10 pb-6 print:hidden">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="font-mono text-xl sm:text-2xl font-bold tracking-tighter text-amber-400 uppercase">
                Revenue Intelligence
              </h2>
              <p className="font-mono text-[9px] sm:text-[10px] tracking-widest text-zinc-500 uppercase">
                Inventory / Sales Reporting Engine
              </p>
            </div>
            <button 
              onClick={() => window.print()}
              className="w-full md:w-auto rounded border border-zinc-700 bg-zinc-800 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-300 hover:bg-zinc-700 active:scale-95 transition-all"
            >
              Export Report (PDF)
            </button>
          </div>

          {/* Date Picker Section - Fully Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 rounded-lg bg-zinc-900/50 p-4 border border-white/5">
            <div className="space-y-1">
              <label className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block px-1">Start Date</label>
              <input 
                type="date" 
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-amber-400/40"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block px-1">End Date</label>
              <input 
                type="date" 
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-amber-400/40"
              />
            </div>
            <button 
              onClick={() => fetchReport(true)}
              className="h-8 self-end sm:col-span-2 lg:col-span-1 rounded bg-amber-400 px-6 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-950 hover:bg-amber-300 transition-all active:scale-95"
            >
              Update View
            </button>
          </div>
        </div>

        {/* Stats Summary Card */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-lg border border-amber-400/20 bg-amber-400/5 px-6 py-4 print:border-zinc-300">
          <div className="text-center sm:text-left">
            <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">Page Revenue</p>
            <p className="font-mono text-xl sm:text-2xl font-bold text-amber-400 print:text-black">
              Rs. {totalSales.toLocaleString()}
            </p>
          </div>
          <div className="text-center sm:text-right">
            <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">Current Batch</p>
            <p className="font-mono text-lg sm:text-xl font-bold text-zinc-300 print:text-black">{bills.length} Items</p>
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="flex h-64 items-center justify-center font-mono text-xs tracking-widest text-zinc-600 uppercase animate-pulse">
            Loading Log...
          </div>
        ) : bills.length === 0 ? (
          <div className="flex h-64 items-center justify-center font-mono text-xs tracking-widest text-zinc-600 uppercase border border-dashed border-white/10 rounded-lg">
            No records found
          </div>
        ) : (
          <>
            <div className="grid gap-4 print:block">
              {bills.map((bill, i) => (
                <div key={bill._id || i} className="group rounded-lg border border-white/10 bg-zinc-900 print:border-zinc-200 print:mb-4">
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-white/5">
                    <div className="flex flex-wrap gap-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-[9px] text-zinc-500 uppercase">Timestamp</span>
                        <span className="font-mono text-xs text-zinc-200">
                          {new Date(bill.date).toLocaleDateString()} — {new Date(bill.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-mono text-[9px] text-zinc-500 uppercase">ID</span>
                        <span className="font-mono text-xs text-zinc-500">#{bill._id?.slice(-6).toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="font-mono text-[9px] text-zinc-500 uppercase">Amount</span>
                      <p className="font-mono text-md font-bold text-amber-400 print:text-black">Rs. {bill.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Card Items */}
                  <div className="px-4 py-3 bg-zinc-800/20">
                    <div className="space-y-2">
                      {bill.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between font-mono text-[11px] text-zinc-400">
                          <span>{item.name} <span className="text-zinc-600 ml-1">×{item.qty}</span></span>
                          <span className="text-zinc-300">Rs. {(item.price * item.qty).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls - Hidden on Print */}
            <div className="flex items-center justify-center gap-4 py-8 print:hidden">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="rounded border border-white/10 bg-zinc-900 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-100 disabled:opacity-20 transition-all"
              >
                Previous
              </button>
              <span className="font-mono text-xs text-amber-400/60 uppercase">Page {page}</span>
              <button 
                disabled={!hasMore}
                onClick={() => setPage(p => p + 1)}
                className="rounded border border-white/10 bg-zinc-900 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-100 disabled:opacity-20 transition-all"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}