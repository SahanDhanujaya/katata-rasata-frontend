/* eslint-disable react-hooks/immutability */
import { useState, useEffect } from "react";
import axios from "axios";

const API = "https://katata-rasata-backend.onrender.com/api";
const CATEGORIES = ["BEVERAGE", "FOOD", "DESSERT", "SNACK", "OTHER"];
const ITEMS_PER_PAGE = 8; // Adjust this number as needed

interface Item {
  _id: string;
  name: string;
  price: number;
  category: string;
}

export default function AddItem() {
  const [items, setItems] = useState<Item[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", price: "", category: "" });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // New Search and Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { fetchItems(); }, []);

  // Reset to page 1 when searching
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API}/items`);
      setItems(res.data);
    } catch (err) { console.error("Error fetching items:", err); }
  };

  // --- Logic for Search & Pagination ---
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  const handleEdit = (item: Item) => {
    setEditingId(item._id);
    setForm({ name: item.name, price: item.price.toString(), category: item.category });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", price: "", category: "" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) return;
    setLoading(true);
    try {
      const payload = { ...form, price: Number(form.price) };
      if (editingId) await axios.put(`${API}/items/${editingId}`, payload);
      else await axios.post(`${API}/items`, payload);
      setSaved(true);
      setForm({ name: "", price: "", category: "" });
      setEditingId(null);
      fetchItems();
      setTimeout(() => setSaved(false), 3000);
    } catch (error) { console.error("Error saving item:", error); }
    finally { setLoading(false); }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await axios.delete(`${API}/items/${id}`);
      setItems(items.filter((item) => item._id !== id));
      if (editingId === id) cancelEdit();
    } catch (err) { console.error("Error deleting:", err); }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-56px)] lg:h-[calc(100vh-56px)] bg-zinc-950 text-zinc-100 overflow-x-hidden">
      
      {/* ── LEFT: Add/Edit Form ── */}
      <div className="w-full lg:w-96 bg-zinc-900 p-6 lg:p-8 shadow-2xl border-b lg:border-b-0 lg:border-r border-white/10 order-1 lg:order-2">
        <div className="mb-6 lg:mb-8 text-center lg:text-left">
          <h2 className="font-mono text-xl font-bold tracking-tighter text-amber-400 uppercase">
            {editingId ? "Update Item" : "New Registration"}
          </h2>
          <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
            {editingId ? "Modify existing record" : "Enter item details below"}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 lg:space-y-5">
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase px-1">Item Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded border border-white/10 bg-zinc-800 px-4 py-3 font-mono text-sm outline-none focus:border-amber-400/40 transition"
              required
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase px-1">Price (Rs.)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full rounded border border-white/10 bg-zinc-800 px-4 py-3 font-mono text-sm outline-none focus:border-amber-400/40 transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase px-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded border border-white/10 bg-zinc-800 px-4 py-3 font-mono text-sm outline-none focus:border-amber-400/40 transition appearance-none cursor-pointer"
                required
              >
                <option value="" disabled>SELECT</option>
                {CATEGORIES.map((cat) => <option key={cat} value={cat} className="bg-zinc-900">{cat}</option>)}
              </select>
            </div>
          </div>

          <div className="h-6">
            {saved && (
              <div className="rounded border border-emerald-500/30 bg-emerald-500/10 py-1 font-mono text-[10px] text-emerald-400 text-center uppercase">
                Database Updated
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-400 py-3 lg:py-4 font-mono text-sm font-bold tracking-widest text-zinc-900 hover:bg-amber-300 transition-all active:scale-[0.98] uppercase"
            >
              {loading ? "Processing..." : editingId ? "Update" : "Register"}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="w-full py-2 font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── RIGHT: Manage List ── */}
      <div className="flex-1 flex flex-col overflow-hidden order-2 lg:order-1">
        <div className="border-b border-white/10 bg-zinc-900/60 px-4 lg:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-left">
            <h2 className="font-mono text-lg font-bold tracking-tighter text-amber-400 uppercase">Inventory</h2>
            <p className="font-mono text-[9px] tracking-widest text-zinc-500 uppercase">{filteredItems.length} Result(s)</p>
          </div>
          
          {/* Search Input */}
          <div className="w-full sm:w-64">
            <input 
              type="text"
              placeholder="SEARCH INVENTORY..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full border border-white/10 bg-zinc-800 px-4 py-1.5 font-mono text-[10px] outline-none focus:border-amber-400/40 transition uppercase"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2 lg:p-4">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full font-mono text-[11px] lg:text-xs">
              <thead className="sticky top-0 bg-zinc-950 text-zinc-500 uppercase tracking-widest border-b border-white/10">
                <tr>
                  <th className="px-2 lg:px-4 py-3 text-left">Item</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left">Cat</th>
                  <th className="px-2 lg:px-4 py-3 text-right">Price</th>
                  <th className="px-2 lg:px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {currentItems.length > 0 ? (
                  currentItems.map((item) => (
                    <tr key={item._id} className={`group hover:bg-white/5 transition-colors ${editingId === item._id ? 'bg-amber-400/10' : ''}`}>
                      <td className="px-2 lg:px-4 py-3">
                        <div className="text-zinc-200 font-bold sm:font-normal">{item.name}</div>
                        <div className="sm:hidden text-[9px] text-amber-400/60">{item.category}</div>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3">
                        <span className="rounded-full border border-amber-400/20 bg-amber-400/5 px-2 py-0.5 text-[9px] text-amber-400/70">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-2 lg:px-4 py-3 text-right text-amber-400 whitespace-nowrap">
                        Rs.{item.price}
                      </td>
                      <td className="px-2 lg:px-4 py-3 text-center">
                        <div className="flex justify-center gap-3">
                          <button onClick={() => handleEdit(item)} className="text-amber-400/60 hover:text-amber-400 uppercase text-[10px]">Edit</button>
                          <button onClick={() => deleteItem(item._id)} className="text-zinc-600 hover:text-red-400 uppercase text-[10px]">Del</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-zinc-600 font-mono text-xs uppercase tracking-widest">
                      No matching records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── PAGINATION FOOTER ── */}
        <div className="border-t border-white/10 bg-zinc-900/60 px-6 py-3 flex justify-between items-center">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="font-mono text-[10px] text-zinc-500 hover:text-amber-400 disabled:opacity-20 uppercase tracking-widest transition"
          >
            Previous
          </button>
          
          <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
            Page <span className="text-amber-400">{currentPage}</span> of {totalPages || 1}
          </div>

          <button 
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(p => p + 1)}
            className="font-mono text-[10px] text-zinc-500 hover:text-amber-400 disabled:opacity-20 uppercase tracking-widest transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}