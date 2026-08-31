import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface BillItem {
  name: string;
  qty: number;
  price: number;
}

interface Bill {
  _id: string;
  orderId: string;
  date: string;
  totalAmount: number;
  items: BillItem[];
}

export default function SuperAdminPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  const navigate = useNavigate();

  const today = new Date().toISOString().split("T")[0];
  const [dateRange, setDateRange] = useState({ start: today, end: today });

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Edit state
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

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

        const fetchedBills = Array.isArray(res.data)
          ? res.data
          : res.data.bills;
        setBills(fetchedBills);
        setHasMore(fetchedBills.length === limit);
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    },
    [dateRange, limit],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(page);
  }, [page, fetchData]);

  const handleUpdateView = () => {
    if (page !== 1) {
      setPage(1);
    } else {
      fetchData(1);
    }
  };

  // ── DELETE ──
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await axios.delete(`${BASE_URL}/sales/${id}`);
      setBills((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      console.error("Delete Error:", err);
      alert("Failed to delete order. Please try again.");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  // ── EDIT ──
  const openEdit = (bill: Bill) => {
    // Clone so in-modal edits don't mutate list state directly
    setEditingBill({ ...bill, items: bill.items.map((i) => ({ ...i })) });
  };

  const updateEditItemQty = (idx: number, delta: number) => {
    if (!editingBill) return;
    const items = editingBill.items
      .map((it, i) => (i === idx ? { ...it, qty: it.qty + delta } : it))
      .filter((it) => it.qty > 0);
    const totalAmount = items.reduce((sum, it) => sum + it.price * it.qty, 0);
    setEditingBill({ ...editingBill, items, totalAmount });
  };

  const removeEditItem = (idx: number) => {
    if (!editingBill) return;
    const items = editingBill.items.filter((_, i) => i !== idx);
    const totalAmount = items.reduce((sum, it) => sum + it.price * it.qty, 0);
    setEditingBill({ ...editingBill, items, totalAmount });
  };

  const saveEdit = async () => {
    if (!editingBill) return;
    setSavingEdit(true);
    try {
      await axios.put(`${BASE_URL}/sales/${editingBill._id}`, {
        items: editingBill.items,
        totalAmount: editingBill.totalAmount,
      });
      setBills((prev) =>
        prev.map((b) => (b._id === editingBill._id ? editingBill : b)),
      );
      setEditingBill(null);
    } catch (err) {
      console.error("Edit Save Error:", err);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  };

  const pageSales = bills.reduce(
    (sum, bill) => sum + (bill.totalAmount || 0),
    0,
  );

  async function logout() {
    await axios.post(
      `${BASE_URL}/auth/logout`,
      {},
      {
        withCredentials: true,
      },
    );
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-zinc-950 p-4 sm:p-6 text-zinc-100">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* HEADER */}
        <div className="flex flex-col gap-1 border-b border-white/10 pb-6">
          <div className="flex items-center gap-2">
            <span
              onDoubleClick={() => navigate("/superadmin/comis")}
              className="rounded bg-red-500/10 border border-red-500/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-red-400"
            >
              Super Admin
            </span>
            <span
              onDoubleClick={() =>
                logout().then(() => navigate("/login", { replace: true }))
              }
              className="font-mono text-[9px] uppercase tracking-widest text-zinc-500"
            >
              Hotel Katata Rasata — Order Management
            </span>
          </div>
          <h2 className="font-mono text-xl sm:text-2xl font-bold tracking-tighter text-amber-400 uppercase">
            Manage Orders
          </h2>
          <p className="font-mono text-[9px] sm:text-[10px] tracking-widest text-zinc-500 uppercase">
            Edit or delete billing records
          </p>
        </div>

        {/* FILTERS */}
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

        {/* SUMMARY */}
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

        {/* LIST */}
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
            <div className="grid gap-4">
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
                          #{bill.orderId.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-mono text-[9px] text-zinc-500 uppercase">
                          Grand Total
                        </span>
                        <p className="font-mono text-md font-bold text-amber-400">
                          Rs. {bill.totalAmount.toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => openEdit(bill)}
                        className="rounded border border-white/10 bg-zinc-800 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest text-zinc-300 hover:bg-zinc-700 active:scale-95 transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(bill._id)}
                        disabled={deletingId === bill._id}
                        className="rounded border border-red-500/30 bg-red-500/10 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest text-red-400 hover:bg-red-500/20 active:scale-95 transition-all disabled:opacity-40"
                      >
                        {deletingId === bill._id ? "..." : "Delete"}
                      </button>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-zinc-800/10">
                    <div className="space-y-1.5">
                      {bill.items.map((item, idx) => (
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

            {/* PAGINATION */}
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-zinc-900/60 px-6 py-4 mt-6">
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

      {/* DELETE CONFIRM MODAL */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-lg border border-white/10 bg-zinc-900 p-6 space-y-4">
            <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-red-400">
              Delete Order?
            </h3>
            <p className="font-mono text-xs text-zinc-400">
              This will permanently remove receipt #
              {confirmDeleteId.slice(-6).toUpperCase()}. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 rounded border border-white/10 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 rounded bg-red-500 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-950"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-zinc-900 p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-amber-400">
                Edit Order #{editingBill._id.slice(-6).toUpperCase()}
              </h3>
              <button
                onClick={() => setEditingBill(null)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {editingBill.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded border border-white/10 bg-zinc-800/40 px-3 py-2"
                >
                  <span className="font-mono text-xs text-zinc-200 flex-1 truncate">
                    {item.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateEditItemQty(idx, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 text-zinc-400"
                    >
                      −
                    </button>
                    <span className="font-mono text-xs text-zinc-200 w-4 text-center">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateEditItemQty(idx, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 text-zinc-400"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeEditItem(idx)}
                      className="ml-1 text-zinc-600 hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                New Total
              </span>
              <span className="font-mono text-lg font-bold text-amber-400">
                Rs. {editingBill.totalAmount.toLocaleString()}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEditingBill(null)}
                className="flex-1 rounded border border-white/10 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={savingEdit}
                className="flex-1 rounded bg-amber-400 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-950 disabled:opacity-40"
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
