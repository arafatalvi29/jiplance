"use client";

import { FormEvent, useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/components/LanguageProvider";
import { supabase } from "@/lib/supabase";

type Language = "en" | "bn";

type RecentGuestOrder = {
  orderNumber: string;
  phone: string;
  createdAt: string;
};

type OrderItem = {
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  variant_size: string | null;
  variant_color: string | null;
};

type HistoryItem = {
  status: string;
  created_at: string;
};

type GuestOrderDetails = {
  order_number: number;
  display_order_number: string;
  customer_name: string;
  status: string;
  payment_status: string;
  payment_method: string;
  subtotal: number;
  delivery_charge: number;
  coupon_code: string | null;
  discount_amount: number;
  total: number;
  claimed_amount: number;
  due_amount: number;
  created_at: string;
  items: OrderItem[];
  status_history: HistoryItem[];
};

const RECENT_ORDERS_KEY = "jiplance-recent-guest-orders";
const LAST_ORDER_KEY = "jiplance-last-order-number";
const LAST_PHONE_KEY = "jiplance-last-order-phone";

export default function MyOrdersPage() {
  const { lang } = useLanguage();

  const [recentOrders, setRecentOrders] = useState<RecentGuestOrder[]>([]);
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<GuestOrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const collected: RecentGuestOrder[] = [];

    try {
      const raw = localStorage.getItem(RECENT_ORDERS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];

      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (
            item &&
            typeof item.orderNumber === "string" &&
            typeof item.phone === "string"
          ) {
            collected.push({
              orderNumber: item.orderNumber,
              phone: item.phone,
              createdAt:
                typeof item.createdAt === "string"
                  ? item.createdAt
                  : new Date().toISOString(),
            });
          }
        }
      }
    } catch {
      // Ignore damaged local history and keep the page usable.
    }

    const lastOrder =
      localStorage.getItem(LAST_ORDER_KEY) ||
      sessionStorage.getItem(LAST_ORDER_KEY);

    const lastPhone =
      localStorage.getItem(LAST_PHONE_KEY) ||
      sessionStorage.getItem(LAST_PHONE_KEY);

    if (lastOrder && lastPhone && lastOrder.startsWith("JIP-")) {
      const alreadySaved = collected.some(
        (entry) => entry.orderNumber === lastOrder
      );

      if (!alreadySaved) {
        collected.unshift({
          orderNumber: lastOrder,
          phone: lastPhone,
          createdAt: new Date().toISOString(),
        });
      }
    }

    const unique = collected
      .filter(
        (entry, index, array) =>
          array.findIndex(
            (candidate) => candidate.orderNumber === entry.orderNumber
          ) === index
      )
      .slice(0, 5);

    setRecentOrders(unique);

    if (unique.length > 0) {
      setOrderNumber(unique[0].orderNumber);
      setPhone(unique[0].phone);
    }
  }, []);

  const saveRecentOrder = (
    nextOrderNumber: string,
    nextPhone: string,
    createdAt?: string
  ) => {
    if (typeof window === "undefined") return;

    const entry: RecentGuestOrder = {
      orderNumber: nextOrderNumber,
      phone: nextPhone.trim(),
      createdAt: createdAt || new Date().toISOString(),
    };

    setRecentOrders((current) => {
      const next = [
        entry,
        ...current.filter(
          (item) => item.orderNumber !== entry.orderNumber
        ),
      ].slice(0, 5);

      localStorage.setItem(RECENT_ORDERS_KEY, JSON.stringify(next));
      localStorage.setItem(LAST_ORDER_KEY, entry.orderNumber);
      localStorage.setItem(LAST_PHONE_KEY, entry.phone);
      sessionStorage.setItem(LAST_ORDER_KEY, entry.orderNumber);
      sessionStorage.setItem(LAST_PHONE_KEY, entry.phone);

      return next;
    });
  };

  const parseOrderNumber = (value: string) => {
    const normalized = value.trim().toUpperCase().replace(/\s/g, "");
    const match = /^JIP-(\d+)$/.exec(normalized);

    if (!match) return null;

    const displayNumber = Number(match[1]);
    const databaseOrderNumber = displayNumber - 1000;

    if (
      !Number.isFinite(displayNumber) ||
      displayNumber < 1001 ||
      databaseOrderNumber < 1
    ) {
      return null;
    }

    return {
      display: `JIP-${displayNumber}`,
      database: databaseOrderNumber,
    };
  };

  const fetchOrder = async (
    requestedOrderNumber: string,
    requestedPhone: string
  ) => {
    setMessage("");
    setSelectedOrder(null);

    if (!supabase) {
      setMessage(
        lang === "en"
          ? "Order service is currently unavailable."
          : "অর্ডার সেবা বর্তমানে পাওয়া যাচ্ছে না।"
      );
      return;
    }

    const parsedOrderNumber = parseOrderNumber(requestedOrderNumber);

    if (!parsedOrderNumber) {
      setMessage(
        lang === "en"
          ? "Enter a valid order code, for example JIP-1008."
          : "সঠিক অর্ডার কোড লিখুন, যেমন JIP-1008।"
      );
      return;
    }

    if (!requestedPhone.trim()) {
      setMessage(
        lang === "en"
          ? "Enter the phone number used during checkout."
          : "চেকআউটের সময় ব্যবহৃত ফোন নম্বরটি লিখুন।"
      );
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc(
        "get_guest_order_details",
        {
          p_order_number: parsedOrderNumber.database,
          p_phone: requestedPhone.trim(),
        }
      );

      if (error) {
        console.error("Guest order details error:", error.message);
        setMessage(
          lang === "en"
            ? "We could not load this order right now. Please try again."
            : "এই মুহূর্তে অর্ডারটি লোড করা যায়নি। আবার চেষ্টা করুন।"
        );
        return;
      }

      if (!data) {
        setMessage(
          lang === "en"
            ? "Order not found. Check the order code and checkout phone number."
            : "অর্ডার পাওয়া যায়নি। অর্ডার কোড ও চেকআউট ফোন নম্বর যাচাই করুন।"
        );
        return;
      }

      const details = data as GuestOrderDetails;

      const safeDetails: GuestOrderDetails = {
        ...details,
        items: Array.isArray(details.items) ? details.items : [],
        status_history: Array.isArray(details.status_history)
          ? details.status_history
          : [],
      };

      setSelectedOrder(safeDetails);
      setOrderNumber(safeDetails.display_order_number);
      setPhone(requestedPhone.trim());

      saveRecentOrder(
        safeDetails.display_order_number,
        requestedPhone.trim(),
        safeDetails.created_at
      );
    } catch (error) {
      console.error("Unexpected My Orders error:", error);
      setMessage(
        lang === "en"
          ? "Something went wrong while loading your order."
          : "আপনার অর্ডার লোড করার সময় সমস্যা হয়েছে।"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await fetchOrder(orderNumber, phone);
  };

  const handleRecentOrder = async (entry: RecentGuestOrder) => {
    setOrderNumber(entry.orderNumber);
    setPhone(entry.phone);
    await fetchOrder(entry.orderNumber, entry.phone);
  };

  const handleTrack = (order: RecentGuestOrder) => {
    if (typeof window === "undefined") return;

    sessionStorage.setItem(LAST_ORDER_KEY, order.orderNumber);
    sessionStorage.setItem(LAST_PHONE_KEY, order.phone);
    localStorage.setItem(LAST_ORDER_KEY, order.orderNumber);
    localStorage.setItem(LAST_PHONE_KEY, order.phone);

    window.location.href = `/track-order?order=${encodeURIComponent(
      order.orderNumber
    )}`;
  };

  const copyOrderCode = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      window.setTimeout(() => setCopied(""), 1500);
    } catch {
      setCopied("");
    }
  };

  return (
    <>
      <Header />

      <main className="my-orders-page">
        <section className="my-orders-hero">
          <div className="hero-orb hero-orb-one" />
          <div className="hero-orb hero-orb-two" />

          <div className="hero-content">
            <div className="orders-eyebrow">
              {lang === "en" ? "JIPLANCE ORDERS" : "JIPLANCE অর্ডার"}
            </div>

            <h1>
              {lang === "en" ? (
                <>
                  Your orders,
                  <br />
                  in one place.
                </>
              ) : (
                <>
                  আপনার অর্ডার,
                  <br />
                  এক জায়গায়।
                </>
              )}
            </h1>

            <p>
              {lang === "en"
                ? "Guest customers can reopen recent orders on this device or securely find any order using the JIPLANCE order code and checkout phone number."
                : "গেস্ট কাস্টমার এই ডিভাইসে সাম্প্রতিক অর্ডার আবার দেখতে পারবেন অথবা JIPLANCE অর্ডার কোড ও চেকআউট ফোন নম্বর দিয়ে নিরাপদে যেকোনো অর্ডার খুঁজতে পারবেন।"}
            </p>

            <div className="hero-trust">
              <span>✓ {lang === "en" ? "No login required" : "লগইন প্রয়োজন নেই"}</span>
              <span>✓ {lang === "en" ? "Secure lookup" : "নিরাপদ খোঁজ"}</span>
              <span>✓ {lang === "en" ? "No UUID shown" : "UUID দেখানো হবে না"}</span>
            </div>
          </div>
        </section>

        <section className="orders-layout">
          <div className="orders-main-column">
            <section className="find-order-card">
              <div className="section-heading">
                <div>
                  <div className="orders-eyebrow">
                    {lang === "en" ? "FIND AN ORDER" : "অর্ডার খুঁজুন"}
                  </div>
                  <h2>{lang === "en" ? "Open your order" : "আপনার অর্ডার খুলুন"}</h2>
                  <p>
                    {lang === "en"
                      ? "Use the JIP code and the same phone number used at checkout."
                      : "JIP কোড এবং চেকআউটের সময় ব্যবহৃত একই ফোন নম্বর দিন।"}
                  </p>
                </div>
              </div>

              <form className="find-order-form" onSubmit={handleSubmit}>
                <label>
                  <span>{lang === "en" ? "Order Code" : "অর্ডার কোড"}</span>
                  <input
                    value={orderNumber}
                    onChange={(event) => setOrderNumber(event.target.value)}
                    placeholder="JIP-1008"
                    autoComplete="off"
                    required
                  />
                </label>

                <label>
                  <span>{lang === "en" ? "Checkout Phone" : "চেকআউট ফোন"}</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="01XXXXXXXXX"
                    autoComplete="tel"
                    required
                  />
                </label>

                <button className="open-order-button" type="submit" disabled={loading}>
                  {loading
                    ? lang === "en"
                      ? "Loading Order..."
                      : "অর্ডার লোড হচ্ছে..."
                    : lang === "en"
                    ? "View Order Details →"
                    : "অর্ডার বিস্তারিত দেখুন →"}
                </button>
              </form>

              {message && <div className="orders-message">{message}</div>}
            </section>

            {selectedOrder && (
              <OrderDetails
                order={selectedOrder}
                lang={lang}
                copied={copied}
                onCopy={copyOrderCode}
                onTrack={() =>
                  handleTrack({
                    orderNumber: selectedOrder.display_order_number,
                    phone,
                    createdAt: selectedOrder.created_at,
                  })
                }
              />
            )}
          </div>

          <aside className="recent-orders-card">
            <div className="section-heading compact">
              <div>
                <div className="orders-eyebrow">
                  {lang === "en" ? "THIS DEVICE" : "এই ডিভাইস"}
                </div>
                <h2>{lang === "en" ? "Recent Guest Orders" : "সাম্প্রতিক গেস্ট অর্ডার"}</h2>
                <p>
                  {lang === "en"
                    ? "Up to 5 recent guest orders saved in this browser."
                    : "এই ব্রাউজারে সর্বশেষ ৫টি গেস্ট অর্ডার সংরক্ষিত থাকবে।"}
                </p>
              </div>
            </div>

            {recentOrders.length === 0 ? (
              <div className="recent-empty">
                <div>◎</div>
                <strong>{lang === "en" ? "No saved guest orders" : "কোনো সংরক্ষিত গেস্ট অর্ডার নেই"}</strong>
                <p>
                  {lang === "en"
                    ? "After a guest checkout, the order code will appear here on this device."
                    : "গেস্ট চেকআউটের পর এই ডিভাইসে অর্ডার কোড এখানে দেখা যাবে।"}
                </p>
              </div>
            ) : (
              <div className="recent-order-list">
                {recentOrders.map((entry) => (
                  <article className="recent-order-item" key={entry.orderNumber}>
                    <div className="recent-order-top">
                      <div>
                        <span>{lang === "en" ? "ORDER" : "অর্ডার"}</span>
                        <strong>{entry.orderNumber}</strong>
                      </div>
                      <small>{formatDate(entry.createdAt, lang)}</small>
                    </div>

                    <div className="recent-order-phone">
                      {lang === "en" ? "Phone" : "ফোন"}: {maskPhone(entry.phone)}
                    </div>

                    <div className="recent-order-actions">
                      <button type="button" onClick={() => handleRecentOrder(entry)}>
                        {lang === "en" ? "View Details" : "বিস্তারিত"}
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => handleTrack(entry)}
                      >
                        {lang === "en" ? "Track" : "ট্র্যাক"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="privacy-note">
              <strong>{lang === "en" ? "Privacy note" : "প্রাইভেসি নোট"}</strong>
              <p>
                {lang === "en"
                  ? "Recent orders are saved only in this browser. Clearing browser data removes this local list, but you can still recover an order above using its JIP code and phone number."
                  : "সাম্প্রতিক অর্ডার শুধু এই ব্রাউজারে সংরক্ষিত থাকে। ব্রাউজার ডেটা মুছে দিলে এই তালিকা চলে যাবে, তবে JIP কোড ও ফোন নম্বর দিয়ে উপরের ফর্ম থেকে অর্ডার আবার খুঁজে পাওয়া যাবে।"}
              </p>
            </div>
          </aside>
        </section>
      </main>

      <Footer />
      <MyOrdersStyles />
    </>
  );
}

function OrderDetails({
  order,
  lang,
  copied,
  onCopy,
  onTrack,
}: {
  order: GuestOrderDetails;
  lang: Language;
  copied: string;
  onCopy: (value: string) => void;
  onTrack: () => void;
}) {
  return (
    <section className="order-details-card">
      <div className="order-details-header">
        <div>
          <div className="orders-eyebrow">
            {lang === "en" ? "ORDER DETAILS" : "অর্ডারের বিস্তারিত"}
          </div>
          <h2>{order.display_order_number}</h2>
          <p>
            {lang === "en" ? "Order for" : "অর্ডার করেছেন"} <strong>{order.customer_name}</strong>
          </p>
        </div>

        <div className="order-header-actions">
          <StatusBadge status={order.status} lang={lang} />
          <button type="button" onClick={() => onCopy(order.display_order_number)}>
            {copied === order.display_order_number
              ? lang === "en"
                ? "Copied ✓"
                : "কপি হয়েছে ✓"
              : lang === "en"
              ? "Copy Code"
              : "কোড কপি"}
          </button>
          <button type="button" className="track-detail-button" onClick={onTrack}>
            {lang === "en" ? "Track Order →" : "অর্ডার ট্র্যাক করুন →"}
          </button>
        </div>
      </div>

      <div className="summary-grid">
        <SummaryCard label={lang === "en" ? "Order Total" : "অর্ডারের মোট"} value={`৳${number(order.total)}`} />
        <SummaryCard label={lang === "en" ? "Claimed Sent" : "পাঠানো দাবি"} value={`৳${number(order.claimed_amount)}`} />
        <SummaryCard label={lang === "en" ? "Due on Delivery" : "ডেলিভারিতে বাকি"} value={`৳${number(order.due_amount)}`} />
        <SummaryCard label={lang === "en" ? "Payment" : "পেমেন্ট"} value={order.payment_method} small={formatPaymentStatus(order.payment_status, lang)} />
      </div>

      <div className="items-section">
        <div className="items-heading">
          <div>
            <div className="orders-eyebrow">
              {lang === "en" ? "ORDERED ITEMS" : "অর্ডার করা পণ্য"}
            </div>
            <h3>{lang === "en" ? "What you ordered" : "আপনি যা অর্ডার করেছেন"}</h3>
          </div>
          <span>{order.items.length} {lang === "en" ? "item type(s)" : "ধরনের পণ্য"}</span>
        </div>

        {order.items.length === 0 ? (
          <div className="items-empty">{lang === "en" ? "No item details found." : "পণ্যের বিস্তারিত পাওয়া যায়নি।"}</div>
        ) : (
          <div className="item-list">
            {order.items.map((item, index) => (
              <article className="order-item" key={`${item.product_id ?? item.product_name}-${index}`}>
                <div className="item-number">{String(index + 1).padStart(2, "0")}</div>
                <div className="item-main">
                  <strong>{item.product_name}</strong>
                  <div className="item-meta">
                    {item.variant_size && <span>{lang === "en" ? "Size" : "সাইজ"}: {item.variant_size}</span>}
                    {item.variant_color && <span>{lang === "en" ? "Color" : "রং"}: {item.variant_color}</span>}
                    <span>{lang === "en" ? "Qty" : "পরিমাণ"}: {number(item.quantity)}</span>
                  </div>
                </div>
                <div className="item-price">
                  <span>৳{number(item.unit_price)} × {number(item.quantity)}</span>
                  <strong>৳{number(item.line_total)}</strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="payment-breakdown">
        <div className="breakdown-row">
          <span>{lang === "en" ? "Subtotal" : "সাবটোটাল"}</span>
          <strong>৳{number(order.subtotal)}</strong>
        </div>

        {Number(order.discount_amount) > 0 && (
          <div className="breakdown-row discount-row">
            <span>
              {lang === "en" ? "Discount" : "ডিসকাউন্ট"}
              {order.coupon_code ? ` (${order.coupon_code})` : ""}
            </span>
            <strong>-৳{number(order.discount_amount)}</strong>
          </div>
        )}

        <div className="breakdown-row">
          <span>{lang === "en" ? "Delivery" : "ডেলিভারি"}</span>
          <strong>৳{number(order.delivery_charge)}</strong>
        </div>

        <div className="breakdown-row total-row">
          <span>{lang === "en" ? "Total" : "মোট"}</span>
          <strong>৳{number(order.total)}</strong>
        </div>
      </div>

      <div className="order-footer-info">
        <div>
          <span>{lang === "en" ? "ORDER PLACED" : "অর্ডারের সময়"}</span>
          <strong>{formatDateTime(order.created_at, lang)}</strong>
        </div>

        <p>
          ✓ {lang === "en"
            ? "This order was securely opened using the JIPLANCE order code and checkout phone number."
            : "JIPLANCE অর্ডার কোড ও চেকআউট ফোন নম্বর ব্যবহার করে এই অর্ডারটি নিরাপদে খোলা হয়েছে।"}
        </p>
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: string;
}) {
  return (
    <div className="summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {small && <small>{small}</small>}
    </div>
  );
}

function StatusBadge({ status, lang }: { status: string; lang: Language }) {
  return (
    <span className={`my-orders-status status-${status}`}>
      <i />
      {formatOrderStatus(status, lang)}
    </span>
  );
}

function maskPhone(phone: string) {
  const clean = phone.replace(/\s/g, "");
  if (clean.length <= 6) return clean;
  return `${clean.slice(0, 3)}••••${clean.slice(-3)}`;
}

function number(value: number | string | null | undefined) {
  const next = Number(value ?? 0);
  return Number.isInteger(next) ? String(next) : next.toFixed(2);
}

function formatOrderStatus(status: string, lang: Language) {
  const labels: Record<string, [string, string]> = {
    pending: ["Order Placed", "অর্ডার গ্রহণ করা হয়েছে"],
    confirmed: ["Confirmed", "নিশ্চিত হয়েছে"],
    processing: ["Processing", "প্রস্তুত করা হচ্ছে"],
    shipped: ["Shipped", "পাঠানো হয়েছে"],
    delivered: ["Delivered", "ডেলিভারি সম্পন্ন"],
    cancelled: ["Cancelled", "বাতিল"],
  };

  return labels[status]?.[lang === "en" ? 0 : 1] ?? status;
}

function formatPaymentStatus(status: string, lang: Language) {
  if (status === "pending_verification") {
    return lang === "en" ? "Pending Verification" : "যাচাই অপেক্ষমাণ";
  }
  if (status === "verified") {
    return lang === "en" ? "Payment Verified" : "পেমেন্ট যাচাই হয়েছে";
  }
  if (status === "rejected") {
    return lang === "en" ? "Payment Rejected" : "পেমেন্ট প্রত্যাখ্যাত";
  }
  return status;
}

function formatDate(date: string, lang: Language) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-BD", {
    timeZone: "Asia/Dhaka",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: string, lang: Language) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString(lang === "bn" ? "bn-BD" : "en-BD", {
    timeZone: "Asia/Dhaka",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function MyOrdersStyles() {
  return (
    <style jsx global>{`
      .my-orders-page {
        width: min(1180px, calc(100% - 32px));
        margin: 0 auto;
        padding: 54px 0 90px;
      }

      .orders-eyebrow {
        font-size: 10px;
        font-weight: 850;
        letter-spacing: 0.19em;
        opacity: 0.56;
      }

      .my-orders-hero {
        min-height: 390px;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        padding: clamp(32px, 7vw, 74px);
        border: 1px solid rgba(128,128,128,.2);
        border-radius: 32px;
        background:
          radial-gradient(circle at 88% 18%, rgba(99,102,241,.14), transparent 31%),
          radial-gradient(circle at 8% 92%, rgba(14,165,233,.1), transparent 34%);
        animation: ordersFadeUp .5s ease both;
      }

      .hero-content { position: relative; z-index: 2; max-width: 760px; }
      .my-orders-hero h1 {
        margin: 12px 0 18px;
        font-size: clamp(48px, 8vw, 86px);
        line-height: .94;
        letter-spacing: -.055em;
      }
      .my-orders-hero p { max-width: 680px; margin: 0; line-height: 1.75; opacity: .67; }
      .hero-trust { margin-top: 28px; display: flex; flex-wrap: wrap; gap: 12px 20px; font-size: 12px; font-weight: 750; }

      .hero-orb { position: absolute; border-radius: 50%; border: 1px solid rgba(128,128,128,.15); pointer-events: none; }
      .hero-orb-one { width: 230px; height: 230px; right: -80px; top: -75px; animation: ordersFloat 7s ease-in-out infinite; }
      .hero-orb-two { width: 105px; height: 105px; right: 155px; bottom: 32px; animation: ordersFloat 5s ease-in-out infinite reverse; }

      .orders-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.55fr) minmax(300px, .75fr);
        gap: 22px;
        margin-top: 24px;
        align-items: start;
      }

      .orders-main-column { display: grid; gap: 22px; }
      .find-order-card, .recent-orders-card, .order-details-card {
        border: 1px solid rgba(128,128,128,.2);
        border-radius: 27px;
        background: var(--background, #fff);
        box-shadow: 0 22px 65px rgba(0,0,0,.05);
      }
      .find-order-card { padding: clamp(24px, 4vw, 38px); }
      .recent-orders-card { padding: 25px; position: sticky; top: 22px; }
      .order-details-card { padding: clamp(24px, 4vw, 38px); animation: ordersFadeUp .42s ease both; }

      .section-heading h2 { margin: 7px 0 5px; font-size: clamp(28px, 4vw, 38px); letter-spacing: -.035em; }
      .section-heading p { margin: 0; opacity: .6; line-height: 1.6; font-size: 13px; }
      .section-heading.compact h2 { font-size: 25px; }

      .find-order-form { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 26px; }
      .find-order-form label { display: grid; gap: 8px; }
      .find-order-form label span { font-size: 12px; font-weight: 800; }
      .find-order-form input {
        width: 100%; min-height: 55px; padding: 0 15px;
        border: 1px solid rgba(128,128,128,.28); border-radius: 14px;
        background: transparent; color: inherit; font: inherit; outline: none;
        transition: border .18s ease, box-shadow .18s ease, transform .18s ease;
      }
      .find-order-form input:focus { border-color: currentColor; box-shadow: 0 0 0 3px rgba(128,128,128,.1); transform: translateY(-1px); }
      .open-order-button {
        grid-column: 1 / -1; min-height: 56px; border: 0; border-radius: 14px;
        background: #1f294d; color: #fff; font: inherit; font-weight: 800; cursor: pointer;
        transition: transform .18s ease, box-shadow .18s ease, opacity .18s ease;
      }
      .open-order-button:hover { transform: translateY(-2px); box-shadow: 0 14px 34px rgba(31,41,77,.2); }
      .open-order-button:disabled { opacity: .68; cursor: wait; }
      .orders-message { margin-top: 15px; padding: 13px 14px; border-radius: 12px; background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.16); font-size: 13px; }

      .recent-order-list { display: grid; gap: 11px; margin-top: 22px; }
      .recent-order-item { padding: 16px; border-radius: 17px; border: 1px solid rgba(128,128,128,.18); transition: transform .18s ease, box-shadow .18s ease; }
      .recent-order-item:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(0,0,0,.05); }
      .recent-order-top { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
      .recent-order-top > div { display: grid; gap: 3px; }
      .recent-order-top span { font-size: 9px; font-weight: 800; letter-spacing: .12em; opacity: .5; }
      .recent-order-top strong { font-size: 18px; }
      .recent-order-top small { opacity: .52; font-size: 10px; }
      .recent-order-phone { margin-top: 10px; font-size: 11px; opacity: .58; }
      .recent-order-actions { display: flex; gap: 8px; margin-top: 13px; }
      .recent-order-actions button {
        flex: 1; min-height: 38px; border: 0; border-radius: 10px; background: #1f294d; color: #fff;
        font: inherit; font-size: 11px; font-weight: 800; cursor: pointer;
      }
      .recent-order-actions button.secondary { background: transparent; color: inherit; border: 1px solid rgba(128,128,128,.25); }
      .recent-empty { margin-top: 22px; padding: 28px 15px; text-align: center; border: 1px dashed rgba(128,128,128,.25); border-radius: 17px; }
      .recent-empty > div { font-size: 30px; opacity: .45; margin-bottom: 8px; }
      .recent-empty p { margin: 7px 0 0; font-size: 11px; line-height: 1.6; opacity: .55; }
      .privacy-note { margin-top: 20px; padding-top: 18px; border-top: 1px solid rgba(128,128,128,.14); }
      .privacy-note strong { font-size: 11px; }
      .privacy-note p { margin: 5px 0 0; font-size: 10px; line-height: 1.6; opacity: .5; }

      .order-details-header { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; padding-bottom: 26px; border-bottom: 1px solid rgba(128,128,128,.15); }
      .order-details-header h2 { margin: 6px 0 4px; font-size: clamp(34px, 6vw, 52px); letter-spacing: -.045em; }
      .order-details-header p { margin: 0; opacity: .62; }
      .order-header-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
      .order-header-actions button {
        min-height: 38px; padding: 0 13px; border-radius: 999px; border: 1px solid rgba(128,128,128,.25);
        background: transparent; color: inherit; font: inherit; font-size: 11px; font-weight: 800; cursor: pointer;
      }
      .order-header-actions .track-detail-button { background: #1f294d; color: #fff; border-color: #1f294d; }

      .my-orders-status { min-height: 38px; padding: 0 13px; border-radius: 999px; border: 1px solid rgba(128,128,128,.22); display: inline-flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 800; }
      .my-orders-status i { width: 7px; height: 7px; border-radius: 50%; background: currentColor; animation: ordersPulse 1.7s ease infinite; }
      .status-pending { background: rgba(234,179,8,.09); }
      .status-confirmed, .status-processing, .status-shipped { background: rgba(59,130,246,.08); }
      .status-delivered { background: rgba(34,197,94,.09); }
      .status-cancelled { background: rgba(239,68,68,.08); }

      .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 11px; margin-top: 24px; }
      .summary-card { min-height: 112px; padding: 16px; border: 1px solid rgba(128,128,128,.16); border-radius: 16px; display: flex; flex-direction: column; justify-content: space-between; }
      .summary-card > span { font-size: 10px; font-weight: 800; opacity: .55; }
      .summary-card strong { font-size: 19px; }
      .summary-card small { font-size: 9px; opacity: .55; }

      .items-section { margin-top: 30px; padding-top: 28px; border-top: 1px solid rgba(128,128,128,.15); }
      .items-heading { display: flex; justify-content: space-between; gap: 15px; align-items: flex-end; }
      .items-heading h3 { margin: 6px 0 0; font-size: 24px; }
      .items-heading > span { font-size: 10px; opacity: .52; }
      .item-list { display: grid; gap: 10px; margin-top: 18px; }
      .order-item { display: grid; grid-template-columns: 42px minmax(0, 1fr) auto; gap: 14px; align-items: center; padding: 15px; border: 1px solid rgba(128,128,128,.15); border-radius: 15px; }
      .item-number { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 11px; background: rgba(128,128,128,.08); font-size: 10px; font-weight: 850; }
      .item-main { min-width: 0; }
      .item-main strong { display: block; overflow-wrap: anywhere; }
      .item-meta { display: flex; flex-wrap: wrap; gap: 6px 10px; margin-top: 6px; font-size: 10px; opacity: .57; }
      .item-price { text-align: right; display: grid; gap: 4px; }
      .item-price span { font-size: 10px; opacity: .52; }
      .item-price strong { font-size: 16px; }
      .items-empty { margin-top: 17px; padding: 20px; border-radius: 14px; background: rgba(128,128,128,.05); opacity: .6; }

      .payment-breakdown { margin-top: 24px; margin-left: auto; width: min(420px, 100%); padding: 18px; border-radius: 17px; background: rgba(128,128,128,.045); }
      .breakdown-row { display: flex; justify-content: space-between; gap: 20px; padding: 8px 0; font-size: 12px; }
      .discount-row { color: #2f7549; }
      .total-row { margin-top: 5px; padding-top: 13px; border-top: 1px solid rgba(128,128,128,.16); font-size: 15px; }

      .order-footer-info { margin-top: 27px; padding-top: 23px; border-top: 1px solid rgba(128,128,128,.14); display: flex; justify-content: space-between; gap: 24px; align-items: center; }
      .order-footer-info > div { display: grid; gap: 4px; }
      .order-footer-info span { font-size: 9px; font-weight: 800; letter-spacing: .12em; opacity: .5; }
      .order-footer-info p { max-width: 430px; margin: 0; font-size: 10px; line-height: 1.55; opacity: .52; }

      @keyframes ordersFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes ordersFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
      @keyframes ordersPulse { 0%,100% { opacity: .45; transform: scale(.9); } 50% { opacity: 1; transform: scale(1.15); } }

      @media (max-width: 920px) {
        .orders-layout { grid-template-columns: 1fr; }
        .recent-orders-card { position: static; }
        .summary-grid { grid-template-columns: repeat(2, 1fr); }
      }

      @media (max-width: 640px) {
        .my-orders-page { width: min(100% - 22px, 1180px); padding: 30px 0 60px; }
        .my-orders-hero { min-height: 350px; padding: 27px 22px 62px; border-radius: 23px; }
        .my-orders-hero h1 { font-size: 51px; }
        .find-order-card, .recent-orders-card, .order-details-card { border-radius: 21px; }
        .find-order-form { grid-template-columns: 1fr; }
        .order-details-header, .order-footer-info, .items-heading { flex-direction: column; align-items: flex-start; }
        .order-header-actions { justify-content: flex-start; }
        .order-item { grid-template-columns: 38px 1fr; }
        .item-price { grid-column: 2; text-align: left; }
      }

      @media (max-width: 430px) {
        .summary-grid { grid-template-columns: 1fr; }
        .hero-trust { display: grid; }
      }
    `}</style>
  );
}
