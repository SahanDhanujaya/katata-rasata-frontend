import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const SOURCES = [
  "Uber Eats",
  "PickMe Food",
  "Bank Deposit",
  "Card Settlement",
  "Cash Deposit",
  "Other",
];

const STATUSES = ["pending", "settled"];

interface Deposit {
  _id: string;
  source: string;
  amount: number;
  date: string;
  referenceId?: string;
  status: "pending" | "settled";
  notes?: string;
}

interface FormState {
  source: string;
  amount: string;
  date: string;
  referenceId: string;
  status: string;
  notes: string;
}

const emptyForm = (): FormState => ({
  source: SOURCES[0],
  amount: "",
  date: new Date().toISOString().split("T")[0],
  referenceId: "",
  status: "pending",
  notes: "",
});

export default function ManageDeposits() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const [sourceFilter, setSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  const [dateRange, setDateRange] = useState({
    start: firstOfMonth.toISOString().split("T")[0],
    end: today,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchDeposits = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/deposits`, {
          params: {
            startDate: dateRange.start,
            endDate: dateRange.end,
            source: sourceFilter || undefined,
            status: statusFilter || undefined,
            page: targetPage,
            limit,
          },
        });

        setDeposits(res.data.deposits || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.totalCount || 0);
      } catch (err) {
        console.error("Fetch deposits error:", err);
        toast.error("Failed to load deposits");
      } finally {
        setLoading(false);
      }
    },
    [dateRange, sourceFilter, statusFilter],
  );

  useEffect(() => {
    fetchDeposits(page);
  }, [page, fetchDeposits]);

  const handleApplyFilters = () => {
    if (page !== 1) {
      setPage(1);
    } else {
      fetchDeposits(1);
    }
  };

  const totalVisible = deposits.reduce((acc, d) => acc + (d.amount || 0), 0);
  const pendingCount = deposits.filter((d) => d.status === "pending").length;

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEditModal = (deposit: Deposit) => {
    setEditingId(deposit._id);
    setForm({
      source: deposit.source,
      amount: String(deposit.amount),
      date: deposit.date.split("T")[0],
      referenceId: deposit.referenceId || "",
      status: deposit.status || "pending",
      notes: deposit.notes || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleSubmit = async () => {
    const amountNum = parseFloat(form.amount);

    if (!form.source) {
      toast.error("Select a source");
      return;
    }
    if (Number.isNaN(amountNum) || amountNum < 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        source: form.source,
        amount: amountNum,
        date: form.date,
        referenceId: form.referenceId,
        status: form.status,
        notes: form.notes,
      };

      if (editingId) {
        await axios.put(`${BASE_URL}/deposits/${editingId}`, payload);
        toast.success("Deposit updated");
      } else {
        await axios.post(`${BASE_URL}/deposits`, payload);
        toast.success("Deposit added");
      }

      closeModal();
      fetchDeposits(page);
    } catch (err: any) {
      console.error("Save deposit error:", err);
      toast.error(err?.response?.data?.message || "Failed to save deposit");
    } finally {
      setSaving(false);
    }
  };

  // Quick toggle: mark a pending deposit as settled without opening the modal
  const handleToggleStatus = async (deposit: Deposit) => {
    const nextStatus = deposit.status === "pending" ? "settled" : "pending";
    try {
      await axios.put(`${BASE_URL}/deposits/${deposit._id}`, { status: nextStatus });
      toast.success(nextStatus === "settled" ? "Marked as settled" : "Marked as pending");
      fetchDeposits(page);
    } catch (err) {
      console.error("Toggle status error:", err);
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${BASE_URL}/deposits/${id}`);
      toast.success("Deposit deleted");
      setConfirmDeleteId(null);

      if (deposits.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchDeposits(page);
      }
    } catch (err) {
      console.error("Delete deposit error:", err);
      toast.error("Failed to delete deposit");
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-zinc-950 p-4 sm:p-6 text-zinc-100">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* HEADER */}
        <div className="flex flex-col gap-6 border-b border-white/10 pb-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="font-mono text-xl sm:text-2xl font-bold tracking-tighter text-amber-400 uppercase">
                Deposits
              </h2>
              <p className="font-mono text-[9px] sm:text-[10px] tracking-widest text-zinc-500 uppercase">
                Third-Party Payouts & Bank Deposits
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="w-full md:w-auto rounded bg-emerald-400 px-6 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-950 hover:bg-emerald-300 transition-all active:scale-95"
            >
              + Add Deposit
            </button>
          </div>

          {/* FILTERS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 rounded-lg bg-zinc-900/50 p-4 border border-white/5">
            <div className="space-y-1">
              <label className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block px-1">
                From
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-emerald-400/40"
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
                className="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-emerald-400/40"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block px-1">
                Source
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-emerald-400/40"
              >
                <option value="">All</option>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block px-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-emerald-400/40 capitalize"
              >
                <option value="">All</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleApplyFilters}
              className="h-8 self-end rounded bg-zinc-800 border border-white/10 px-6 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-200 hover:bg-zinc-700 transition-all active:scale-95"
            >
              Filter
            </button>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-6 py-4">
            <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
              Visible Page Total
            </p>
            <p className="font-mono text-xl font-bold text-emerald-400">
              Rs. {totalVisible.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-zinc-900/50 px-6 py-4">
            <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
              Records in Range
            </p>
            <p className="font-mono text-xl font-bold text-zinc-300">
              {totalCount} Deposits
            </p>
          </div>
          <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-6 py-4">
            <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
              Pending (This Page)
            </p>
            <p className="font-mono text-xl font-bold text-amber-400">
              {pendingCount}
            </p>
          </div>
        </div>

        {/* LIST */}
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent"></div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Loading Deposits...
            </p>
          </div>
        ) : deposits.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-white/10 font-mono text-xs uppercase tracking-widest text-zinc-600">
            No deposits found for this filter
          </div>
        ) : (
          <>
            <div className="grid gap-3">
              {deposits.map((deposit) => (
                <div
                  key={deposit._id}
                  className="rounded-lg border border-white/10 bg-zinc-900 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex flex-wrap gap-4 items-center">
                    <span className="rounded border border-emerald-400/20 bg-emerald-400/5 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-emerald-300">
                      {deposit.source}
                    </span>

                    <button
                      onClick={() => handleToggleStatus(deposit)}
                      title="Click to toggle status"
                      className={`rounded px-2 py-1 font-mono text-[9px] uppercase tracking-widest transition active:scale-95 ${
                        deposit.status === "settled"
                          ? "border border-zinc-600 bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                          : "border border-amber-400/30 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20"
                      }`}
                    >
                      {deposit.status}
                    </button>

                    <div className="flex flex-col">
                      <span className="font-mono text-[9px] text-zinc-500 uppercase">
                        Date
                      </span>
                      <span className="font-mono text-xs text-zinc-200">
                        {new Date(deposit.date).toLocaleDateString()}
                      </span>
                    </div>
                    {deposit.referenceId && (
                      <div className="flex flex-col">
                        <span className="font-mono text-[9px] text-zinc-500 uppercase">
                          Reference
                        </span>
                        <span className="font-mono text-xs text-zinc-400">
                          {deposit.referenceId}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <p className="font-mono text-md font-bold text-emerald-400">
                      Rs. {deposit.amount.toLocaleString()}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(deposit)}
                        className="rounded border border-white/10 bg-zinc-800 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest text-zinc-300 hover:bg-zinc-700 transition active:scale-95"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(deposit._id)}
                        className="rounded border border-red-500/30 bg-red-500/10 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest text-red-400 hover:bg-red-500/20 transition active:scale-95"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* PAGINATION */}
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-zinc-900/60 px-6 py-4 mt-2">
              <button
                disabled={page === 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 transition hover:text-emerald-400 disabled:opacity-20 active:scale-95"
              >
                ← Prev
              </button>

              <div className="flex items-center gap-3">
                <span className="h-px w-4 bg-zinc-800"></span>
                <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  Page <span className="text-emerald-400 font-bold">{page}</span> of{" "}
                  <span className="text-zinc-300">{totalPages}</span>
                </p>
                <span className="h-px w-4 bg-zinc-800"></span>
              </div>

              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 transition hover:text-emerald-400 disabled:opacity-20 active:scale-95"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-zinc-900 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-emerald-400">
                {editingId ? "Edit Deposit" : "Add Deposit"}
              </h3>
              <button
                onClick={closeModal}
                className="text-zinc-500 hover:text-zinc-200 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block">
                    Source
                  </label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-emerald-400/40"
                  >
                    {SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block">
                    Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-emerald-400/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block">
                    Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-emerald-400/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-emerald-400/40 capitalize"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s} className="capitalize">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block">
                  Reference ID
                </label>
                <input
                  type="text"
                  value={form.referenceId}
                  onChange={(e) => setForm({ ...form, referenceId: e.target.value })}
                  placeholder="e.g. Uber batch #, bank txn id"
                  className="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-emerald-400/40"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Optional"
                  className="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-emerald-400/40 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 border-t border-white/10 px-5 py-4">
              <button
                onClick={closeModal}
                className="flex-1 rounded border border-white/10 bg-zinc-800 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-300 hover:bg-zinc-700 transition active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 rounded bg-emerald-400 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-950 hover:bg-emerald-300 transition active:scale-95 disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Save Changes" : "Add Deposit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-lg border border-white/10 bg-zinc-900 shadow-xl p-5 space-y-4">
            <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-red-400">
              Delete Deposit?
            </h3>
            <p className="font-mono text-xs text-zinc-400">
              This action can't be undone. The deposit record will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 rounded border border-white/10 bg-zinc-800 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-300 hover:bg-zinc-700 transition active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 rounded bg-red-500 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-white hover:bg-red-600 transition active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}