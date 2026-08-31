import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const CATEGORIES = [
  "Ingredients",
  "Utilities",
  "Rent",
  "Salaries",
  "Maintenance",
  "Packaging",
  "Transport",
  "Other",
];

const PAYMENT_METHODS = ["cash", "card", "bank_transfer", "other"];

interface Expense {
  _id: string;
  category: string;
  amount: number;
  description?: string;
  date: string;
  paymentMethod: string;
  notes?: string;
}

interface FormState {
  category: string;
  amount: string;
  description: string;
  date: string;
  paymentMethod: string;
  notes: string;
}

const emptyForm = (): FormState => ({
  category: CATEGORIES[0],
  amount: "",
  description: "",
  date: new Date().toISOString().split("T")[0],
  paymentMethod: "cash",
  notes: "",
});

export default function ManageExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const [categoryFilter, setCategoryFilter] = useState("");
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

  const fetchExpenses = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/expenses`, {
          params: {
            startDate: dateRange.start,
            endDate: dateRange.end,
            category: categoryFilter || undefined,
            page: targetPage,
            limit,
          },
          withCredentials: true,
        });

        setExpenses(res.data.expenses || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.totalCount || 0);
      } catch (err) {
        console.error("Fetch expenses error:", err);
        toast.error("Failed to load expenses");
      } finally {
        setLoading(false);
      }
    },
    [dateRange, categoryFilter],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchExpenses(page);
  }, [page, fetchExpenses]);

  const handleApplyFilters = () => {
    if (page !== 1) {
      setPage(1);
    } else {
      fetchExpenses(1);
    }
  };

  const totalVisible = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEditModal = (expense: Expense) => {
    setEditingId(expense._id);
    setForm({
      category: expense.category,
      amount: String(expense.amount),
      description: expense.description || "",
      date: expense.date.split("T")[0],
      paymentMethod: expense.paymentMethod || "cash",
      notes: expense.notes || "",
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

    if (!form.category) {
      toast.error("Select a category");
      return;
    }
    if (Number.isNaN(amountNum) || amountNum < 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        category: form.category,
        amount: amountNum,
        description: form.description,
        date: form.date,
        paymentMethod: form.paymentMethod,
        notes: form.notes,
      };

      if (editingId) {
        await axios.put(`${BASE_URL}/expenses/${editingId}`, payload, { withCredentials: true });
        toast.success("Expense updated");
      } else {
        await axios.post(`${BASE_URL}/expenses`, payload, { withCredentials: true });
        toast.success("Expense added");
      }

      closeModal();
      fetchExpenses(page);
    } catch (err: any) {
      console.error("Save expense error:", err);
      toast.error(err?.response?.data?.message || "Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${BASE_URL}/expenses/${id}`, { withCredentials: true });
      toast.success("Expense deleted");
      setConfirmDeleteId(null);

      // If this was the last item on the page, step back a page
      if (expenses.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchExpenses(page);
      }
    } catch (err) {
      console.error("Delete expense error:", err);
      toast.error("Failed to delete expense");
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
                Manage Expenses
              </h2>
              <p className="font-mono text-[9px] sm:text-[10px] tracking-widest text-zinc-500 uppercase">
                Track Outgoing Costs
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="w-full md:w-auto rounded bg-amber-400 px-6 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-950 hover:bg-amber-300 transition-all active:scale-95"
            >
              + Add Expense
            </button>
          </div>

          {/* FILTERS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 rounded-lg bg-zinc-900/50 p-4 border border-white/5">
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
            <div className="space-y-1">
              <label className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block px-1">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-amber-400/40"
              >
                <option value="">All</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-red-400/20 bg-red-400/5 px-6 py-4">
            <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
              Visible Page Total
            </p>
            <p className="font-mono text-xl font-bold text-red-400">
              Rs. {totalVisible.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-zinc-900/50 px-6 py-4">
            <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
              Records in Range
            </p>
            <p className="font-mono text-xl font-bold text-zinc-300">
              {totalCount} Expenses
            </p>
          </div>
        </div>

        {/* LIST */}
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent"></div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Loading Expenses...
            </p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-white/10 font-mono text-xs uppercase tracking-widest text-zinc-600">
            No expenses found for this filter
          </div>
        ) : (
          <>
            <div className="grid gap-3">
              {expenses.map((expense) => (
                <div
                  key={expense._id}
                  className="rounded-lg border border-white/10 bg-zinc-900 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex flex-wrap gap-4 items-center">
                    <span className="rounded border border-red-400/20 bg-red-400/5 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-red-300">
                      {expense.category}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-mono text-[9px] text-zinc-500 uppercase">
                        Date
                      </span>
                      <span className="font-mono text-xs text-zinc-200">
                        {new Date(expense.date).toLocaleDateString()}
                      </span>
                    </div>
                    {expense.description && (
                      <div className="flex flex-col">
                        <span className="font-mono text-[9px] text-zinc-500 uppercase">
                          Description
                        </span>
                        <span className="font-mono text-xs text-zinc-400">
                          {expense.description}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-mono text-[9px] text-zinc-500 uppercase">
                        Payment
                      </span>
                      <span className="font-mono text-xs text-zinc-400 capitalize">
                        {expense.paymentMethod?.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <p className="font-mono text-md font-bold text-red-400">
                      Rs. {expense.amount.toLocaleString()}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(expense)}
                        className="rounded border border-white/10 bg-zinc-800 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest text-zinc-300 hover:bg-zinc-700 transition active:scale-95"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(expense._id)}
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
                className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 transition hover:text-amber-400 disabled:opacity-20 active:scale-95"
              >
                ← Prev
              </button>

              <div className="flex items-center gap-3">
                <span className="h-px w-4 bg-zinc-800"></span>
                <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  Page <span className="text-amber-400 font-bold">{page}</span> of{" "}
                  <span className="text-zinc-300">{totalPages}</span>
                </p>
                <span className="h-px w-4 bg-zinc-800"></span>
              </div>

              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 transition hover:text-amber-400 disabled:opacity-20 active:scale-95"
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
              <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-amber-400">
                {editingId ? "Edit Expense" : "Add Expense"}
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
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-amber-400/40"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
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
                    className="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-amber-400/40"
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
                    className="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-amber-400/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block">
                    Payment
                  </label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-amber-400/40 capitalize"
                  >
                    {PAYMENT_METHODS.map((p) => (
                      <option key={p} value={p} className="capitalize">
                        {p.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 block">
                  Description
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Weekly vegetable order"
                  className="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-amber-400/40"
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
                  className="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-amber-400/40 resize-none"
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
                className="flex-1 rounded bg-amber-400 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-950 hover:bg-amber-300 transition active:scale-95 disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Save Changes" : "Add Expense"}
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
              Delete Expense?
            </h3>
            <p className="font-mono text-xs text-zinc-400">
              This action can't be undone. The expense record will be permanently removed.
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