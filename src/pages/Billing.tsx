import { useEffect, useState } from "react";
import axios from "axios";

const API = "https://katata-rasata-backend.onrender.com/api";

interface Item {
  _id: string;
  name: string;
  price: number;
  category: string;
}

interface CartItem extends Item {
  qty: number;
}

export default function Billing() {
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  // Track if mobile cart is visible
  const [showMobileCart, setShowMobileCart] = useState(false);
  const generateInvoiceId = () => {
    const datePart = new Date().getTime().toString().slice(-4);
    // eslint-disable-next-line react-hooks/purity
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `INV-${datePart}-${randomPart}`;
  };

  useEffect(() => {
    axios.get(`${API}/items`).then((res) => setItems(res.data));
  }, []);

  const categories = [
    "ALL",
    ...Array.from(new Set(items.map((i) => i.category))),
  ];

  const filtered = items.filter(
    (i) =>
      (activeCategory === "ALL" || i.category === activeCategory) &&
      i.name.toLowerCase().includes(search.toLowerCase()),
  );

  const addToCart = (item: Item) => {
    setCart((prev) => {
      const exist = prev.find((c) => c._id === item._id);
      return exist
        ? prev.map((c) => (c._id === item._id ? { ...c, qty: c.qty + 1 } : c))
        : [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c._id === id ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0),
    );
  };

  const removeItem = (id: string) =>
    setCart((prev) => prev.filter((c) => c._id !== id));

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const itemCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const checkout = async () => {
    if (!cart.length) return;
    setLoading(true);
    await axios.post(`${API}/sales`, { items: cart, totalAmount: total });
    setSaved(true);
    setCart([]);
    setLoading(false);
    setShowMobileCart(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const printBill = () => window.print();

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-56px)] bg-zinc-950 text-zinc-100 overflow-hidden relative">
      {/* ── LEFT: Item Grid ── */}
      <div
        className={`flex flex-1 flex-col overflow-hidden border-r border-white/10 print:hidden ${showMobileCart ? "hidden lg:flex" : "flex"}`}
      >
        {/* Search + Categories */}
        <div className="border-b border-white/10 bg-zinc-900/60 px-4 py-3 space-y-3">
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2.5 font-mono text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-400/40 transition"
          />
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 font-mono text-[10px] tracking-widest uppercase transition-all border
                  ${
                    activeCategory === cat
                      ? "bg-amber-400 border-amber-400 text-zinc-900 font-bold"
                      : "border-white/10 text-zinc-400"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-3 lg:p-4">
          {filtered.length === 0 ? (
            <div className="flex h-full items-center justify-center font-mono text-xs tracking-widest text-zinc-600 uppercase">
              No items found
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filtered.map((item) => {
                const inCart = cart.find((c) => c._id === item._id);
                return (
                  <button
                    key={item._id}
                    onClick={() => addToCart(item)}
                    className="group relative flex flex-col items-start rounded-lg border border-white/10 bg-zinc-900 p-3 lg:p-4 text-left transition-all hover:border-amber-400/40 active:scale-[0.97]"
                  >
                    {inCart && (
                      <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 font-mono text-[10px] font-bold text-zinc-900 animate-in zoom-in">
                        {inCart.qty}
                      </span>
                    )}
                    <span className="mb-1 font-mono text-[9px] tracking-widest text-amber-400/60 uppercase">
                      {item.category}
                    </span>
                    <span className="mb-2 font-mono text-xs lg:text-sm leading-snug text-zinc-100 line-clamp-2">
                      {item.name}
                    </span>
                    <span className="mt-auto font-mono text-sm lg:text-base font-bold text-amber-400">
                      Rs.{item.price}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Bill Panel ── */}
      <div
        className={`
        ${showMobileCart ? "flex" : "hidden lg:flex"}
        fixed inset-0 z-[60] flex w-full flex-col bg-zinc-950 lg:relative lg:inset-auto lg:z-0 lg:w-80 lg:bg-zinc-900 print:hidden
      `}
      >
        {/* Mobile Close Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 lg:py-4">
          <div>
            <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
              Current Bill
            </p>
            <p className="font-mono text-xs text-zinc-400">
              {itemCount} items added
            </p>
          </div>
          <button
            onClick={() => setShowMobileCart(false)}
            className="rounded border border-white/10 p-2 font-mono text-xs text-zinc-400 lg:hidden"
          >
            CLOSE ✕
          </button>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center opacity-30">
              <p className="font-mono text-[10px] tracking-widest uppercase">
                Cart is empty
              </p>
            </div>
          ) : (
            cart.map((c) => (
              <div
                key={c._id}
                className="rounded-lg border border-white/10 bg-zinc-800/40 px-3 py-2.5"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="font-mono text-xs text-zinc-200">
                    {c.name}
                  </span>
                  <button
                    onClick={() => removeItem(c._id)}
                    className="text-zinc-600 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQty(c._id, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-zinc-400"
                    >
                      −
                    </button>
                    <span className="font-mono text-xs text-zinc-200">
                      {c.qty}
                    </span>
                    <button
                      onClick={() => updateQty(c._id, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-zinc-400"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-400">
                    Rs.{c.price * c.qty}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-zinc-900/80 px-5 py-6 space-y-4 backdrop-blur-md">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
              Total
            </span>
            <span className="font-mono text-3xl font-bold text-amber-400">
              Rs.{total.toLocaleString()}
            </span>
          </div>

          {saved && (
            <div className="rounded border border-emerald-500/30 bg-emerald-500/10 py-2 font-mono text-[10px] text-emerald-400 text-center uppercase">
              Success: Order Saved
            </div>
          )}

          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={checkout}
              disabled={!cart.length || loading}
              className="w-full rounded-lg bg-amber-400 py-4 font-mono text-sm font-bold text-zinc-900 hover:bg-amber-300 disabled:opacity-40 uppercase"
            >
              {loading ? "Saving..." : "Confirm & Save"}
            </button>
            <button
              onClick={printBill}
              disabled={!cart.length}
              className="w-full rounded-lg border border-white/10 py-3 font-mono text-[10px] tracking-widest text-zinc-400 uppercase"
            >
              Print Receipt
            </button>
          </div>
        </div>
      </div>

      {/* ── MOBILE: Floating Cart Bar ── */}
      {!showMobileCart && cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50 lg:hidden">
          <button
            onClick={() => setShowMobileCart(true)}
            className="flex w-full items-center justify-between rounded-xl bg-amber-400 p-4 shadow-2xl shadow-amber-400/20 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-zinc-900 text-[10px] font-bold text-amber-400">
                {itemCount}
              </span>
              <span className="font-mono text-xs font-bold uppercase text-zinc-900">
                View Cart
              </span>
            </div>
            <span className="font-mono text-sm font-bold text-zinc-900">
              Rs.{total.toLocaleString()}
            </span>
          </button>
        </div>
      )}

      {/* ── PRINT STYLES & AREA (REMAINS SAME) ── */}
      <div className="hidden print:block print-area w-full p-8 bg-white text-black font-mono">
        <div className="text-center border-b border-black pb-4 mb-4 border-dotted">
          <h1 className="text-xl font-bold uppercase">කටට රසට</h1>
          <p className="text-xs">Private Bustand - Panadura</p>
          <span>072-2838281</span>
          <p className="text-xs">{new Date().toLocaleString()}</p>
          <p>ID: {generateInvoiceId()}</p>
        </div>
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="border-b border-black text-left">
              <th className="py-1">Item</th>
              <th className="py-1 text-center">Qty</th>
              <th className="py-1 text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((c) => (
              <tr key={c._id} className="border-b border-gray-200">
                <td className="py-2">{c.name}</td>
                <td className="py-2 text-center">{c.qty}</td>
                <td className="py-2 text-right">Rs.{c.price * c.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between items-center pt-2 border-t border-black">
          <span className="font-bold">TOTAL</span>
          <span className="text-xl font-bold">Rs.{total.toLocaleString()}</span>
        </div>
        <footer>
          <div className="text-center border-t border-black pt-4 mt-4">
            <h1 className="text-xl font-bold uppercase">
              Thank You Visit Again!
            </h1>
            <p className="text-xs">Powered by Trovix Tech</p>
            <p className="text-xs">0756519837/0764726820</p>
            <p className="text-xs">
              Copyright &copy; {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}
