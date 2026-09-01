import { useEffect, useState } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
// const API = "https://katata-rasata-backend.onrender.com/api";
// const API = "http://localhost:5000/api";

interface Item {
  _id: string;
  name: string;
  display_name: string;
  price: number;
  category: string;
}

interface CartItem extends Item {
  qty: number;
}

interface SaleResponse {
  _id: string;
  orderId: string;
  items: CartItem[];
  totalAmount: number;
  date: string;
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

  const generateInvoiceId = async () => {
    const datePart = new Date().getTime().toString().slice(-4);

    try {
      const lastInvoiceRes = await axios.get(`${BASE_URL}/sales/last-invoice`);
      const lastInvoiceId = lastInvoiceRes.data?.orderId;

      if (lastInvoiceId) {
        const parts = lastInvoiceId.split("-");
        const lastSeq = parseInt(parts[2], 10);

        if (lastSeq >= 0) {
          // Same date batch — increment, roll over to 000 after 999
          const nextSeq = lastSeq >= 999 ? 0 : lastSeq + 1;
          const seqStr = nextSeq.toString().padStart(3, "0");
          return `INV-${datePart}-${seqStr}`;
        }
      }
    } catch (err) {
      console.error("Failed to fetch last invoice, falling back:", err);
    }

    // First invoice of this date batch (or fetch failed) — start at 001
    return `INV-${datePart}-001`;
  };

  useEffect(() => {
    const getItems = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/items`);
        setItems(res.data);
      } catch (err) {
        console.error("Error fetching items:", err);
      }
    };
    getItems();
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

  const [printSnapshot, setPrintSnapshot] = useState<{
    invoiceId: string;
    cart: CartItem[];
    total: number;
  } | null>(null);

  // Sends the tablet's browser to the Bluetooth Print app, which fetches
  // /api/print/bill/:saleId from our own backend and prints the result.
  const printBillViaBluetooth = (saleId: string) => {
    const responseUrl = `${BASE_URL}/print/bill/${saleId}`;
    // eslint-disable-next-line react-hooks/immutability
    window.location.href = `my.bluetoothprint.scheme://${responseUrl}`;
  };

  // Manual fallback in case the Bluetooth Print app isn't available/working —
  // uses the hidden .print-area block further down via the browser's own print dialog.
  const printBillViaBrowser = () => {
    if (!printSnapshot) return;
    window.print();
  };

  const checkout = async () => {
    if (!cart.length) return;
    setLoading(true);

    // Generate ONE invoice ID and snapshot the cart/total before anything changes
    const invoiceId = await generateInvoiceId();
    const orderSnapshot = [...cart];
    const totalSnapshot = total;

    try {
      const res = await axios.post<SaleResponse>(`${BASE_URL}/sales`, {
        orderId: invoiceId,
        items: orderSnapshot,
        totalAmount: totalSnapshot,
      });

      const savedSaleId = res.data?._id;

      if (savedSaleId) {
        setPrintSnapshot({
          invoiceId,
          cart: orderSnapshot,
          total: totalSnapshot,
        });
        printBillViaBluetooth(savedSaleId);
        setSaved(true);
        setCart([]);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert("Order saved, but no ID was returned — check the receipt manually.");
      }
    } catch (err) {
      console.error("Checkout failed:", err);
      alert("Error saving the order. Please try again.");
    } finally {
      setLoading(false);
      setShowMobileCart(false);
    }
  };

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
            className="w-full rounded border border-white/10 bg-zinc-800 px-3 py-2.5 font-mono text-md text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-400/40 transition"
          />
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 font-mono text-[13px] tracking-widest uppercase transition-all border
                  ${activeCategory === cat
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
            <div className="flex h-full items-center justify-center font-mono text-md tracking-widest text-zinc-600 uppercase">
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
                      <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 font-mono text-[14px] font-bold text-zinc-900 animate-in zoom-in">
                        {inCart.qty}
                      </span>
                    )}
                    <span className="mb-1 font-mono text-[10px] tracking-widest text-amber-400/60 uppercase">
                      {item.category}
                    </span>
                    <span className="mb-2 font-mono text-lg lg:text-xl leading-snug text-zinc-100 line-clamp-2">
                      {item.display_name}
                    </span>
                    <span className="mt-auto font-mono text-xl lg:text-xl font-bold text-amber-400">
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
                  <span className="font-mono text-lg text-zinc-200">
                    {c.display_name}
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
                  <span className="font-mono text-sm font-bold text-amber-400">
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
              className="bg-amber-300 w-full rounded-lg border border-white/10 py-3 font-mono text-[12px] tracking-widest text-black uppercase disabled:opacity-40"
            >
              {loading ? "Saving..." : "Save & Print Receipt"}
            </button>

            {printSnapshot && (
              <button
                onClick={printBillViaBrowser}
                className="w-full rounded-lg border border-white/10 py-2 font-mono text-[10px] tracking-widest text-zinc-500 uppercase"
              >
                Print via Browser (fallback)
              </button>
            )}
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

      {/* ── PRINT STYLES & AREA (browser-print fallback) ── */}
      <div className="hidden print:block print-area w-full p-8 bg-white text-black font-mono">
        <div className="text-center border-b border-black pb-4 mb-4 border-dotted">
          <h1 className="text-xl font-bold uppercase">HOTEL KATATA RASATA</h1>
          <p className="text-xs">No:20/7/8/9 Private Bus Stand, Panadura</p>
          <span>0722838281</span>
          <p className="text-xs">{new Date().toLocaleString()}</p>
          <p>ID: {printSnapshot?.invoiceId}</p>
        </div>
        <table className="w-full text-sm mb-4">
          <tbody>
            {printSnapshot?.cart.map((c) => (
              <tr key={c._id} className="border-b border-gray-200">
                <td className="py-2">{c.display_name}</td>
                <td className="py-2 text-center">{c.qty}</td>
                <td className="py-2 text-right">Rs.{c.price * c.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between items-center pt-2 border-t border-black">
          <span className="font-bold">TOTAL</span>
          <span className="text-xl font-bold">
            Rs.{printSnapshot?.total.toLocaleString()}
          </span>
        </div>
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