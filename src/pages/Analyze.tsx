import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Backend contract this page expects:
 *
 * GET /sales/report?startDate&endDate&limit=all
 *   -> { bills: Bill[], totalRevenue: number }
 *   Bill.items: { name, price, qty }[]
 *
 * GET /expenses/report?startDate&endDate
 *   -> { expenses: Expense[], totalExpenses: number }
 *   Expense: { category: string, amount: number, date: string }
 *
 * If your expenses route doesn't exist yet, this page still renders
 * the revenue pie chart and shows an empty state for expenses.
 */

interface BillItem {
  name: string;
  price: number;
  qty: number;
}

interface Bill {
  _id: string;
  date: string;
  totalAmount: number;
  items: BillItem[];
}

interface Expense {
  _id: string;
  category: string;
  amount: number;
  date: string;
}

interface SliceDatum {
  name: string;
  value: number;
}

// Amber-forward palette that stays legible on zinc-950
const REVENUE_COLORS = ["#fbbf24", "#f59e0b", "#d97706", "#92400e", "#78350f", "#fde68a"];
const EXPENSE_COLORS = ["#f87171", "#ef4444", "#dc2626", "#991b1b", "#7f1d1d", "#fca5a5"];

function groupTopN(data: SliceDatum[], n: number): SliceDatum[] {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  if (sorted.length <= n) return sorted;
  const top = sorted.slice(0, n - 1);
  const restTotal = sorted.slice(n - 1).reduce((acc, d) => acc + d.value, 0);
  return [...top, { name: "Other", value: restTotal }];
}

export default function Analyze() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [expensesAvailable, setExpensesAvailable] = useState(true);

  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  const [dateRange, setDateRange] = useState({
    start: firstOfMonth.toISOString().split("T")[0],
    end: today,
  });

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, expensesRes] = await Promise.allSettled([
        axios.get(`${BASE_URL}/sales/report`, {
          params: {
            startDate: dateRange.start,
            endDate: dateRange.end,
            page: 1,
            limit: 100000, // pull the full range for analysis, not one page
          },
        }),
        axios.get(`${BASE_URL}/expenses/report`, {
          params: { startDate: dateRange.start, endDate: dateRange.end },
        }),
      ]);

      if (salesRes.status === "fulfilled") {
        const data = salesRes.value.data;
        setBills(Array.isArray(data) ? data : data.bills || []);
      } else {
        setBills([]);
      }

      if (expensesRes.status === "fulfilled") {
        const data = expensesRes.value.data;
        setExpenses(Array.isArray(data) ? data : data.expenses || []);
        setExpensesAvailable(true);
      } else {
        setExpenses([]);
        setExpensesAvailable(false);
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Revenue grouped by item name (what's actually selling)
  const revenueByItem = useMemo<SliceDatum[]>(() => {
    const map = new Map<string, number>();
    bills.forEach((bill) => {
      bill.items?.forEach((item) => {
        const key = item.name || "Unnamed";
        const value = (item.price || 0) * (item.qty || 0);
        map.set(key, (map.get(key) || 0) + value);
      });
    });
    return groupTopN(
      Array.from(map.entries()).map(([name, value]) => ({ name, value })),
      6
    );
  }, [bills]);

  // Expenses grouped by category
  const expensesByCategory = useMemo<SliceDatum[]>(() => {
    const map = new Map<string, number>();
    expenses.forEach((exp) => {
      const key = exp.category || "Uncategorized";
      map.set(key, (map.get(key) || 0) + (exp.amount || 0));
    });
    return groupTopN(
      Array.from(map.entries()).map(([name, value]) => ({ name, value })),
      6
    );
  }, [expenses]);

  const totalRevenue = useMemo(
    () => bills.reduce((acc, b) => acc + (b.totalAmount || 0), 0),
    [bills]
  );
  const totalExpenses = useMemo(
    () => expenses.reduce((acc, e) => acc + (e.amount || 0), 0),
    [expenses]
  );
  const netProfit = totalRevenue - totalExpenses;

  const handleApply = () => fetchAnalytics();

  return (
    <div className="min-h-[calc(100vh-56px)] bg-zinc-950 p-4 sm:p-6 text-zinc-100">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* HEADER & FILTERS */}
        <div className="flex flex-col gap-6 border-b border-white/10 pb-6">
          <div>
            <h2 className="font-mono text-xl sm:text-2xl font-bold tracking-tighter text-amber-400 uppercase">
              Revenue & Expense Analysis
            </h2>
            <p className="font-mono text-[9px] sm:text-[10px] tracking-widest text-zinc-500 uppercase">
              Breakdown by Source & Category
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 rounded-lg bg-zinc-900/50 p-4 border border-white/5">
            <div className="space-y-1">
              <label className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block px-1">
                From
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
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
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-amber-400/40"
              />
            </div>
            <button
              onClick={handleApply}
              className="h-8 self-end sm:col-span-2 lg:col-span-1 rounded bg-amber-400 px-6 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-950 hover:bg-amber-300 transition-all active:scale-95"
            >
              Apply Range
            </button>
          </div>
        </div>

        {/* SUMMARY STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-6 py-4">
            <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
              Total Revenue
            </p>
            <p className="font-mono text-xl font-bold text-amber-400">
              Rs. {totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-red-400/20 bg-red-400/5 px-6 py-4">
            <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
              Total Expenses
            </p>
            <p className="font-mono text-xl font-bold text-red-400">
              Rs. {totalExpenses.toLocaleString()}
            </p>
          </div>
          <div
            className={`rounded-lg border px-6 py-4 ${
              netProfit >= 0
                ? "border-emerald-400/20 bg-emerald-400/5"
                : "border-red-400/20 bg-red-400/5"
            }`}
          >
            <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
              Net Profit
            </p>
            <p
              className={`font-mono text-xl font-bold ${
                netProfit >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              Rs. {netProfit.toLocaleString()}
            </p>
          </div>
        </div>

        {/* CHARTS */}
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent"></div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Crunching Numbers...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* REVENUE PIE */}
            <div className="rounded-lg border border-white/10 bg-zinc-900/50 p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
                Revenue by Item
              </p>
              {revenueByItem.length === 0 ? (
                <div className="flex h-72 items-center justify-center font-mono text-xs uppercase tracking-widest text-zinc-600">
                  No sales in this range
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={revenueByItem}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={2}
                    >
                      {revenueByItem.map((_, idx) => (
                        <Cell
                          key={`rev-${idx}`}
                          fill={REVENUE_COLORS[idx % REVENUE_COLORS.length]}
                          stroke="#09090b"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => {
                        const numericValue = Number(Array.isArray(value) ? value[0] : value ?? 0);
                        return [`Rs. ${numericValue.toLocaleString()}`, "Revenue"];
                      }}
                      contentStyle={{
                        background: "#18181b",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 6,
                        fontFamily: "monospace",
                        fontSize: 11,
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontFamily: "monospace", fontSize: 10 }}
                      formatter={(value) => <span style={{ color: "#a1a1aa" }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* EXPENSES PIE */}
            <div className="rounded-lg border border-white/10 bg-zinc-900/50 p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
                Expenses by Category
              </p>
              {!expensesAvailable ? (
                <div className="flex h-72 flex-col items-center justify-center gap-1 font-mono text-xs uppercase tracking-widest text-zinc-600 text-center px-4">
                  <span>Expenses endpoint not connected</span>
                  <span className="text-[9px] normal-case tracking-normal text-zinc-700">
                    Add GET /expenses/report to enable this chart
                  </span>
                </div>
              ) : expensesByCategory.length === 0 ? (
                <div className="flex h-72 items-center justify-center font-mono text-xs uppercase tracking-widest text-zinc-600">
                  No expenses in this range
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={2}
                    >
                      {expensesByCategory.map((_, idx) => (
                        <Cell
                          key={`exp-${idx}`}
                          fill={EXPENSE_COLORS[idx % EXPENSE_COLORS.length]}
                          stroke="#09090b"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`Rs. ${value!.toLocaleString()}`, "Expense"]}
                      contentStyle={{
                        background: "#18181b",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 6,
                        fontFamily: "monospace",
                        fontSize: 11,
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontFamily: "monospace", fontSize: 10 }}
                      formatter={(value) => <span style={{ color: "#a1a1aa" }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}