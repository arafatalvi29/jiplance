"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/components/LanguageProvider";
import { supabase } from "@/lib/supabase";

type Language = "en" | "bn";

type HistoryItem = {
  status: string;
  created_at: string;
};

type TrackingOrder = {
  order_number: number;
  customer_name: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total: number;
  claimed_amount: number;
  due_amount: number;
  created_at: string;
  status_history: HistoryItem[];
};

const TRACKING_STEPS = [
  {
    key: "pending",
    enLabel: "Order Placed",
    bnLabel: "অর্ডার গ্রহণ করা হয়েছে",
    enDescription:
      "We received your order.",
    bnDescription:
      "আমরা আপনার অর্ডারটি পেয়েছি।",
  },
  {
    key: "confirmed",
    enLabel: "Confirmed",
    bnLabel: "নিশ্চিত হয়েছে",
    enDescription:
      "Your order has been confirmed.",
    bnDescription:
      "আপনার অর্ডারটি নিশ্চিত করা হয়েছে।",
  },
  {
    key: "processing",
    enLabel: "Processing",
    bnLabel: "প্রস্তুত করা হচ্ছে",
    enDescription:
      "Your order is being prepared.",
    bnDescription:
      "আপনার অর্ডার প্রস্তুত করা হচ্ছে।",
  },
  {
    key: "shipped",
    enLabel: "Shipped",
    bnLabel: "পাঠানো হয়েছে",
    enDescription:
      "Your order is on the way.",
    bnDescription:
      "আপনার অর্ডারটি ডেলিভারির পথে রয়েছে।",
  },
  {
    key: "delivered",
    enLabel: "Delivered",
    bnLabel: "ডেলিভারি সম্পন্ন",
    enDescription:
      "Your order has been delivered.",
    bnDescription:
      "আপনার অর্ডারটি ডেলিভারি করা হয়েছে।",
  },
];

export default function TrackOrderPage() {
  const { lang } =
    useLanguage();

  const [
    orderNumber,
    setOrderNumber,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    order,
    setOrder,
  ] =
    useState<TrackingOrder | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    const params =
      new URLSearchParams(
        window.location.search
      );

    const orderFromUrl =
      params.get("order");

    const savedOrder =
      sessionStorage.getItem(
        "jiplance-last-order-number"
      );

    const savedPhone =
      sessionStorage.getItem(
        "jiplance-last-order-phone"
      );

    if (orderFromUrl) {
      setOrderNumber(
        orderFromUrl
      );
    } else if (savedOrder) {
      setOrderNumber(
        savedOrder
      );
    }

    if (savedPhone) {
      setPhone(
        savedPhone
      );
    }
  }, []);

  const handleTrack =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      setMessage("");
      setOrder(null);

      if (!supabase) {
        setMessage(
          lang === "en"
            ? "Tracking service is currently unavailable."
            : "অর্ডার ট্র্যাকিং সেবা বর্তমানে পাওয়া যাচ্ছে না।"
        );

        return;
      }

      const cleanOrderNumber =
        orderNumber
          .trim()
          .toUpperCase()
          .replace(
            /^JIP-/,
            ""
          )
          .replace(
            /\s/g,
            ""
          );

      const displayNumber =
        Number(
          cleanOrderNumber
        );

      if (
        !Number.isFinite(
          displayNumber
        ) ||
        displayNumber < 1000
      ) {
        setMessage(
          lang === "en"
            ? "Please enter a valid JIPLANCE order number, for example JIP-1008."
            : "সঠিক JIPLANCE অর্ডার নম্বর লিখুন, যেমন JIP-1008।"
        );

        return;
      }

      /*
        Customers see:
        JIP-(database order_number + 1000)

        Example:
        database order_number = 8
        customer sees JIP-1008
      */
      const databaseOrderNumber =
        displayNumber - 1000;

      if (
        databaseOrderNumber <
        1
      ) {
        setMessage(
          lang === "en"
            ? "Please enter a valid JIPLANCE order number."
            : "সঠিক JIPLANCE অর্ডার নম্বর লিখুন।"
        );

        return;
      }

      if (
        !phone.trim()
      ) {
        setMessage(
          lang === "en"
            ? "Please enter the phone number used during checkout."
            : "চেকআউটের সময় ব্যবহৃত ফোন নম্বরটি লিখুন।"
        );

        return;
      }

      setLoading(true);

      const {
        data,
        error,
      } =
        await supabase.rpc(
          "track_guest_order",
          {
            p_order_number:
              databaseOrderNumber,

            p_phone:
              phone.trim(),
          }
        );

      setLoading(false);

      if (error) {
        console.error(
          "Tracking error:",
          error.message
        );

        setMessage(
          lang === "en"
            ? "We could not check this order right now. Please try again."
            : "এই মুহূর্তে অর্ডারটি পরীক্ষা করা যায়নি। আবার চেষ্টা করুন।"
        );

        return;
      }

      if (
        !data ||
        data.length === 0
      ) {
        setMessage(
          lang === "en"
            ? "Order not found. Please check your order number and phone number."
            : "অর্ডার পাওয়া যায়নি। অর্ডার নম্বর ও ফোন নম্বর আবার যাচাই করুন।"
        );

        return;
      }

      const foundOrder =
        data[0] as TrackingOrder;

      setOrder({
        ...foundOrder,

        status_history:
          Array.isArray(
            foundOrder.status_history
          )
            ? foundOrder.status_history
            : [],
      });
    };

  const resetTracking =
    () => {
      setOrder(null);
      setMessage("");
      setOrderNumber("");
      setPhone("");
    };

  return (
    <>
      <Header />

      <main className="tracking-page">
        <section className="tracking-hero">
          <div className="tracking-glow tracking-glow-one" />

          <div className="tracking-glow tracking-glow-two" />

          <div className="tracking-hero-content">
            <div className="tracking-eyebrow">
              {lang === "en"
                ? "JIPLANCE DELIVERY"
                : "JIPLANCE ডেলিভারি"}
            </div>

            <h1>
              {lang === "en" ? (
                <>
                  Track your
                  <br />
                  order.
                </>
              ) : (
                <>
                  আপনার অর্ডার
                  <br />
                  ট্র্যাক করুন।
                </>
              )}
            </h1>

            <p>
              {lang === "en"
                ? "Enter your JIPLANCE order number and the phone number used during checkout to see the latest progress."
                : "অর্ডারের সর্বশেষ অবস্থা দেখতে আপনার JIPLANCE অর্ডার নম্বর এবং চেকআউটের সময় ব্যবহৃত ফোন নম্বর লিখুন।"}
            </p>

            <div className="tracking-trust">
              <span>
                <i>✓</i>

                {lang === "en"
                  ? "No login required"
                  : "লগইন প্রয়োজন নেই"}
              </span>

              <span>
                <i>✓</i>

                {lang === "en"
                  ? "Secure tracking"
                  : "নিরাপদ ট্র্যাকিং"}
              </span>

              <span>
                <i>✓</i>

                {lang === "en"
                  ? "Live order status"
                  : "সর্বশেষ অর্ডার স্ট্যাটাস"}
              </span>
            </div>
          </div>
        </section>

        {!order ? (
          <section className="tracking-search-card">
            <div className="tracking-card-heading">
              <div className="tracking-eyebrow">
                {lang === "en"
                  ? "FIND YOUR ORDER"
                  : "আপনার অর্ডার খুঁজুন"}
              </div>

              <h2>
                {lang === "en"
                  ? "Order Tracking"
                  : "অর্ডার ট্র্যাকিং"}
              </h2>

              <p>
                {lang === "en"
                  ? "Use the information from your order confirmation."
                  : "আপনার অর্ডার কনফার্মেশনের তথ্য ব্যবহার করুন।"}
              </p>
            </div>

            <form
              className="tracking-form"
              onSubmit={
                handleTrack
              }
            >
              <label>
                <span>
                  {lang === "en"
                    ? "JIPLANCE Order Number"
                    : "JIPLANCE অর্ডার নম্বর"}
                </span>

                <div className="tracking-input-wrap">
                  <div className="input-icon">
                    #
                  </div>

                  <input
                    type="text"
                    value={
                      orderNumber
                    }
                    onChange={(
                      event
                    ) =>
                      setOrderNumber(
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="JIP-1008"
                    autoComplete="off"
                    required
                  />
                </div>
              </label>

              <label>
                <span>
                  {lang === "en"
                    ? "Checkout Phone Number"
                    : "চেকআউট ফোন নম্বর"}
                </span>

                <div className="tracking-input-wrap">
                  <div className="input-icon">
                    ☎
                  </div>

                  <input
                    type="tel"
                    value={
                      phone
                    }
                    onChange={(
                      event
                    ) =>
                      setPhone(
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="01XXXXXXXXX"
                    autoComplete="tel"
                    required
                  />
                </div>
              </label>

              {message && (
                <div className="tracking-message">
                  <span>
                    !
                  </span>

                  <p>
                    {
                      message
                    }
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="tracking-button"
                disabled={
                  loading
                }
              >
                {loading ? (
                  <>
                    <span className="tracking-spinner" />

                    {lang === "en"
                      ? "Finding Order..."
                      : "অর্ডার খোঁজা হচ্ছে..."}
                  </>
                ) : (
                  <>
                    {lang === "en"
                      ? "Track My Order"
                      : "আমার অর্ডার ট্র্যাক করুন"}

                    <span className="button-arrow">
                      →
                    </span>
                  </>
                )}
              </button>
            </form>

            <div className="tracking-help">
              <strong>
                {lang === "en"
                  ? "Where is my order number?"
                  : "আমার অর্ডার নম্বর কোথায় পাব?"}
              </strong>

              <p>
                {lang === "en" ? (
                  <>
                    Your JIPLANCE
                    order number
                    looks like{" "}
                    <strong>
                      JIP-1008
                    </strong>
                    . Use the same
                    phone number you
                    entered during
                    checkout.
                  </>
                ) : (
                  <>
                    আপনার JIPLANCE
                    অর্ডার নম্বর দেখতে{" "}
                    <strong>
                      JIP-1008
                    </strong>
                    -এর মতো হবে।
                    চেকআউটের সময় যে
                    ফোন নম্বর দিয়েছিলেন,
                    সেটিই ব্যবহার করুন।
                  </>
                )}
              </p>
            </div>
          </section>
        ) : (
          <TrackingResult
            order={
              order
            }
            onReset={
              resetTracking
            }
            lang={
              lang
            }
          />
        )}
      </main>

      <Footer />

      <TrackingStyles />
    </>
  );
}

function TrackingResult({
  order,
  onReset,
  lang,
}: {
  order: TrackingOrder;
  onReset: () => void;
  lang: Language;
}) {
  const displayOrderNumber =
    `JIP-${
      order.order_number +
      1000
    }`;

  const cancelled =
    order.status ===
    "cancelled";

  return (
    <section className="tracking-result">
      <div className="tracking-result-top">
        <div>
          <div className="tracking-eyebrow">
            {lang === "en"
              ? "TRACKING RESULT"
              : "ট্র্যাকিং ফলাফল"}
          </div>

          <h2>
            {
              displayOrderNumber
            }
          </h2>

          <p>
            {lang === "en"
              ? "Order for "
              : "অর্ডার করেছেন "}

            <strong>
              {
                order.customer_name
              }
            </strong>
          </p>
        </div>

        <div className="result-top-actions">
          <OrderStatusBadge
            status={
              order.status
            }
            lang={
              lang
            }
          />

          <button
            type="button"
            onClick={
              onReset
            }
            className="track-another-button"
          >
            {lang === "en"
              ? "Track Another"
              : "অন্য অর্ডার ট্র্যাক করুন"}
          </button>
        </div>
      </div>

      {cancelled ? (
        <CancelledOrder
          order={
            order
          }
          lang={
            lang
          }
        />
      ) : (
        <OrderTimeline
          order={
            order
          }
          lang={
            lang
          }
        />
      )}

      <div className="tracking-details-grid">
        <div className="tracking-detail-card">
          <span>
            {lang === "en"
              ? "Order Total"
              : "অর্ডারের মোট"}
          </span>

          <strong>
            ৳
            {Number(
              order.total
            )}
          </strong>
        </div>

        <div className="tracking-detail-card">
          <span>
            {lang === "en"
              ? "Amount Claimed Sent"
              : "পাঠানো হয়েছে বলে উল্লেখিত পরিমাণ"}
          </span>

          <strong>
            ৳
            {Number(
              order.claimed_amount
            )}
          </strong>
        </div>

        <div className="tracking-detail-card">
          <span>
            {lang === "en"
              ? "Due on Delivery"
              : "ডেলিভারিতে বাকি"}
          </span>

          <strong>
            ৳
            {Number(
              order.due_amount
            )}
          </strong>
        </div>

        <div className="tracking-detail-card">
          <span>
            {lang === "en"
              ? "Payment"
              : "পেমেন্ট"}
          </span>

          <strong>
            {
              order.payment_method
            }
          </strong>

          <small>
            {formatPaymentStatus(
              order.payment_status,
              lang
            )}
          </small>
        </div>
      </div>

      <div className="tracking-order-footer">
        <div>
          <span>
            {lang === "en"
              ? "ORDER PLACED"
              : "অর্ডারের সময়"}
          </span>

          <strong>
            {formatDateTime(
              order.created_at,
              lang
            )}
          </strong>
        </div>

        <div className="tracking-secure-note">
          <span>
            ✓
          </span>

          <p>
            {lang === "en"
              ? "Tracking information is protected by your order number and checkout phone number."
              : "আপনার অর্ডার নম্বর ও চেকআউট ফোন নম্বরের মাধ্যমে ট্র্যাকিং তথ্য সুরক্ষিত রাখা হয়।"}
          </p>
        </div>
      </div>
    </section>
  );
}

function OrderTimeline({
  order,
  lang,
}: {
  order: TrackingOrder;
  lang: Language;
}) {
  const currentIndex =
    TRACKING_STEPS.findIndex(
      (
        step
      ) =>
        step.key ===
        order.status
    );

  return (
    <div className="premium-timeline">
      <div className="timeline-heading">
        <div>
          <div className="tracking-eyebrow">
            {lang === "en"
              ? "DELIVERY JOURNEY"
              : "ডেলিভারি অগ্রগতি"}
          </div>

          <h3>
            {lang === "en"
              ? "Your order progress"
              : "আপনার অর্ডারের অগ্রগতি"}
          </h3>
        </div>

        <span className="live-indicator">
          <i />

          {lang === "en"
            ? "Current Status"
            : "বর্তমান অবস্থা"}
        </span>
      </div>

      <div className="timeline-list">
        {TRACKING_STEPS.map(
          (
            step,
            index
          ) => {
            const history =
              getHistoryForStatus(
                order.status_history,
                step.key
              );

            const completed =
              index <=
              currentIndex;

            const current =
              index ===
              currentIndex;

            return (
              <div
                className={`timeline-step ${
                  completed
                    ? "completed"
                    : ""
                } ${
                  current
                    ? "current"
                    : ""
                }`}
                key={
                  step.key
                }
                style={{
                  animationDelay:
                    `${
                      index *
                      90
                    }ms`,
                }}
              >
                <div className="timeline-marker-column">
                  <div className="timeline-marker">
                    {completed
                      ? "✓"
                      : index +
                        1}
                  </div>

                  {index <
                    TRACKING_STEPS.length -
                      1 && (
                    <div className="timeline-line">
                      <div
                        className={
                          index <
                          currentIndex
                            ? "timeline-line-fill filled"
                            : "timeline-line-fill"
                        }
                      />
                    </div>
                  )}
                </div>

                <div className="timeline-content">
                  <div>
                    <h4>
                      {lang ===
                      "en"
                        ? step.enLabel
                        : step.bnLabel}

                      {current && (
                        <span className="current-pill">
                          {lang ===
                          "en"
                            ? "CURRENT"
                            : "বর্তমান"}
                        </span>
                      )}
                    </h4>

                    <p>
                      {lang ===
                      "en"
                        ? step.enDescription
                        : step.bnDescription}
                    </p>
                  </div>

                  <div className="timeline-time">
                    {history ? (
                      <>
                        <strong>
                          {formatTime(
                            history.created_at,
                            lang
                          )}
                        </strong>

                        <span>
                          {formatDate(
                            history.created_at,
                            lang
                          )}
                        </span>
                      </>
                    ) : completed ? (
                      <span>
                        {lang ===
                        "en"
                          ? "Completed"
                          : "সম্পন্ন"}
                      </span>
                    ) : (
                      <span>
                        {lang ===
                        "en"
                          ? "Waiting"
                          : "অপেক্ষমাণ"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}

function CancelledOrder({
  order,
  lang,
}: {
  order: TrackingOrder;
  lang: Language;
}) {
  const cancellation =
    getHistoryForStatus(
      order.status_history,
      "cancelled"
    );

  return (
    <div className="cancelled-order-box">
      <div className="cancelled-symbol">
        ×
      </div>

      <div>
        <div className="tracking-eyebrow">
          {lang === "en"
            ? "ORDER UPDATE"
            : "অর্ডার আপডেট"}
        </div>

        <h3>
          {lang === "en"
            ? "This order was cancelled"
            : "এই অর্ডারটি বাতিল করা হয়েছে"}
        </h3>

        <p>
          {lang === "en"
            ? "This order is no longer being processed. If you need help, please contact JIPLANCE support."
            : "এই অর্ডারটি আর প্রক্রিয়াধীন নেই। কোনো সহায়তা প্রয়োজন হলে JIPLANCE সাপোর্টের সঙ্গে যোগাযোগ করুন।"}
        </p>

        {cancellation && (
          <small>
            {lang === "en"
              ? "Cancelled "
              : "বাতিল হয়েছে "}

            {formatDateTime(
              cancellation.created_at,
              lang
            )}
          </small>
        )}
      </div>
    </div>
  );
}

function OrderStatusBadge({
  status,
  lang,
}: {
  status: string;
  lang: Language;
}) {
  return (
    <span
      className={`tracking-status-badge tracking-status-${status}`}
    >
      <i />

      {formatOrderStatus(
        status,
        lang
      )}
    </span>
  );
}

function getHistoryForStatus(
  history: HistoryItem[],
  status: string
) {
  const matches =
    history.filter(
      (
        item
      ) =>
        item.status ===
        status
    );

  return matches.length >
    0
    ? matches[
        matches.length -
          1
      ]
    : null;
}

function formatOrderStatus(
  status: string,
  lang: Language
) {
  if (
    status === "pending"
  ) {
    return lang === "en"
      ? "Order Placed"
      : "অর্ডার গ্রহণ করা হয়েছে";
  }

  if (
    status ===
    "confirmed"
  ) {
    return lang === "en"
      ? "Confirmed"
      : "নিশ্চিত হয়েছে";
  }

  if (
    status ===
    "processing"
  ) {
    return lang === "en"
      ? "Processing"
      : "প্রস্তুত করা হচ্ছে";
  }

  if (
    status ===
    "shipped"
  ) {
    return lang === "en"
      ? "Shipped"
      : "পাঠানো হয়েছে";
  }

  if (
    status ===
    "delivered"
  ) {
    return lang === "en"
      ? "Delivered"
      : "ডেলিভারি সম্পন্ন";
  }

  if (
    status ===
    "cancelled"
  ) {
    return lang === "en"
      ? "Cancelled"
      : "বাতিল";
  }

  return status;
}

function formatPaymentStatus(
  status: string,
  lang: Language
) {
  if (
    status ===
    "pending_verification"
  ) {
    return lang === "en"
      ? "Pending Verification"
      : "যাচাই অপেক্ষমাণ";
  }

  if (
    status ===
    "verified"
  ) {
    return lang === "en"
      ? "Payment Verified"
      : "পেমেন্ট যাচাই হয়েছে";
  }

  if (
    status ===
    "rejected"
  ) {
    return lang === "en"
      ? "Payment Rejected"
      : "পেমেন্ট প্রত্যাখ্যাত";
  }

  return status;
}

function formatDateTime(
  date: string,
  lang: Language
) {
  return new Date(
    date
  ).toLocaleString(
    lang === "bn"
      ? "bn-BD"
      : "en-BD",
    {
      timeZone:
        "Asia/Dhaka",

      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  );
}

function formatDate(
  date: string,
  lang: Language
) {
  return new Date(
    date
  ).toLocaleDateString(
    lang === "bn"
      ? "bn-BD"
      : "en-BD",
    {
      timeZone:
        "Asia/Dhaka",

      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",
    }
  );
}

function formatTime(
  date: string,
  lang: Language
) {
  return new Date(
    date
  ).toLocaleTimeString(
    lang === "bn"
      ? "bn-BD"
      : "en-BD",
    {
      timeZone:
        "Asia/Dhaka",

      hour:
        "numeric",

      minute:
        "2-digit",
    }
  );
}

function TrackingStyles() {
  return (
    <style jsx global>{`
      .tracking-page {
        width: min(
          1180px,
          calc(100% - 32px)
        );
        margin: 0 auto;
        padding: 56px 0 96px;
      }

      .tracking-eyebrow {
        font-size: 11px;
        font-weight: 850;
        letter-spacing: 0.2em;
        opacity: 0.58;
      }

      .tracking-hero {
        min-height: 400px;
        position: relative;
        overflow: hidden;
        border: 1px solid
          rgba(
            128,
            128,
            128,
            0.2
          );
        border-radius: 32px;
        display: flex;
        align-items: center;
        padding: clamp(
          32px,
          7vw,
          76px
        );
        background:
          radial-gradient(
            circle at 85% 20%,
            rgba(
              99,
              102,
              241,
              0.14
            ),
            transparent 30%
          ),
          radial-gradient(
            circle at 10% 90%,
            rgba(
              14,
              165,
              233,
              0.1
            ),
            transparent 35%
          );
        animation:
          trackingFadeUp
          0.55s ease both;
      }

      .tracking-hero-content {
        position: relative;
        z-index: 2;
        max-width: 720px;
      }

      .tracking-hero h1 {
        margin: 12px 0 18px;
        font-size: clamp(
          48px,
          8vw,
          88px
        );
        line-height: 0.92;
        letter-spacing: -0.055em;
      }

      .tracking-hero p {
        max-width: 650px;
        margin: 0;
        font-size: 16px;
        line-height: 1.75;
        opacity: 0.68;
      }

      .tracking-trust {
        margin-top: 30px;
        display: flex;
        gap: 18px;
        flex-wrap: wrap;
      }

      .tracking-trust span {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        font-size: 12px;
        font-weight: 700;
      }

      .tracking-trust i {
        width: 21px;
        height: 21px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        border: 1px solid
          rgba(
            128,
            128,
            128,
            0.35
          );
        font-style: normal;
        font-size: 10px;
      }

      .tracking-glow {
        position: absolute;
        border-radius: 50%;
        filter: blur(1px);
        pointer-events: none;
      }

      .tracking-glow-one {
        width: 230px;
        height: 230px;
        right: -80px;
        top: -80px;
        border: 1px solid
          rgba(
            128,
            128,
            128,
            0.16
          );
        animation:
          trackingFloat
          7s ease-in-out
          infinite;
      }

      .tracking-glow-two {
        width: 110px;
        height: 110px;
        right: 150px;
        bottom: 35px;
        border: 1px solid
          rgba(
            128,
            128,
            128,
            0.13
          );
        animation:
          trackingFloat
          5s ease-in-out
          infinite reverse;
      }

      .tracking-search-card {
        width: min(
          650px,
          100%
        );
        margin: -50px auto 0;
        position: relative;
        z-index: 5;
        padding: clamp(
          26px,
          5vw,
          46px
        );
        border: 1px solid
          rgba(
            128,
            128,
            128,
            0.24
          );
        border-radius: 28px;
        background:
          var(
            --background,
            #ffffff
          );
        box-shadow:
          0 28px 80px
          rgba(
            0,
            0,
            0,
            0.08
          );
        animation:
          trackingFadeUp
          0.6s 0.08s
          ease both;
      }

      .tracking-card-heading h2 {
        margin: 8px 0;
        font-size: clamp(
          30px,
          5vw,
          42px
        );
        letter-spacing: -0.03em;
      }

      .tracking-card-heading p {
        margin: 0;
        opacity: 0.62;
      }

      .tracking-form {
        display: grid;
        gap: 20px;
        margin-top: 30px;
      }

      .tracking-form label {
        display: grid;
        gap: 8px;
      }

      .tracking-form
        label
        > span {
        font-size: 13px;
        font-weight: 750;
      }

      .tracking-input-wrap {
        position: relative;
      }

      .input-icon {
        position: absolute;
        left: 16px;
        top: 50%;
        transform:
          translateY(-50%);
        width: 29px;
        height: 29px;
        border-radius: 9px;
        background:
          rgba(
            128,
            128,
            128,
            0.08
          );
        display: grid;
        place-items: center;
        font-size: 12px;
        font-weight: 850;
        pointer-events: none;
      }

      .tracking-input-wrap input {
        width: 100%;
        min-height: 58px;
        padding:
          0 16px 0 57px;
        border-radius: 15px;
        border: 1px solid
          rgba(
            128,
            128,
            128,
            0.28
          );
        background: transparent;
        color: inherit;
        outline: none;
        font: inherit;
        transition:
          border 0.18s ease,
          box-shadow 0.18s ease,
          transform 0.18s ease;
      }

      .tracking-input-wrap
        input:focus {
        border-color:
          currentColor;
        box-shadow:
          0 0 0 3px
          rgba(
            128,
            128,
            128,
            0.11
          );
        transform:
          translateY(-1px);
      }

      .tracking-button {
        min-height: 58px;
        border: 0;
        border-radius: 15px;
        background: #1f294d;
        color: #ffffff;
        font: inherit;
        font-weight: 800;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 12px;
        transition:
          transform 0.18s ease,
          box-shadow 0.18s ease,
          opacity 0.18s ease;
      }

      .tracking-button:hover {
        transform:
          translateY(-2px);
        box-shadow:
          0 15px 35px
          rgba(
            31,
            41,
            77,
            0.2
          );
      }

      .tracking-button:active {
        transform:
          scale(0.985);
      }

      .tracking-button:disabled {
        cursor: wait;
        opacity: 0.7;
      }

      .button-arrow {
        font-size: 19px;
        transition:
          transform 0.18s ease;
      }

      .tracking-button:hover
        .button-arrow {
        transform:
          translateX(5px);
      }

      .tracking-spinner {
        width: 18px;
        height: 18px;
        border: 2px solid
          rgba(
            255,
            255,
            255,
            0.35
          );
        border-top-color:
          #ffffff;
        border-radius: 50%;
        animation:
          trackingSpin
          0.7s linear
          infinite;
      }

      .tracking-message {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 13px 14px;
        border-radius: 13px;
        background:
          rgba(
            239,
            68,
            68,
            0.08
          );
        border: 1px solid
          rgba(
            239,
            68,
            68,
            0.18
          );
      }

      .tracking-message
        > span {
        width: 21px;
        height: 21px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        border: 1px solid
          currentColor;
        font-size: 11px;
        font-weight: 850;
        flex: 0 0 auto;
      }

      .tracking-message p {
        margin: 0;
        font-size: 13px;
        line-height: 1.5;
      }

      .tracking-help {
        margin-top: 25px;
        padding-top: 22px;
        border-top: 1px solid
          rgba(
            128,
            128,
            128,
            0.16
          );
      }

      .tracking-help strong {
        font-size: 13px;
      }

      .tracking-help p {
        margin:
          6px 0 0;
        opacity: 0.6;
        font-size: 12px;
        line-height: 1.6;
      }

      .tracking-result {
        margin-top: 24px;
        border: 1px solid
          rgba(
            128,
            128,
            128,
            0.22
          );
        border-radius: 28px;
        padding: clamp(
          24px,
          5vw,
          44px
        );
        animation:
          trackingFadeUp
          0.5s ease both;
      }

      .tracking-result-top {
        display: flex;
        justify-content:
          space-between;
        align-items:
          flex-start;
        gap: 20px;
        flex-wrap: wrap;
        padding-bottom: 28px;
        border-bottom: 1px solid
          rgba(
            128,
            128,
            128,
            0.16
          );
      }

      .tracking-result-top h2 {
        margin: 6px 0;
        font-size: clamp(
          32px,
          5vw,
          50px
        );
        letter-spacing: -0.04em;
      }

      .tracking-result-top p {
        margin: 0;
        opacity: 0.65;
      }

      .result-top-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .tracking-status-badge {
        min-height: 38px;
        padding: 0 14px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: 1px solid
          rgba(
            128,
            128,
            128,
            0.25
          );
        font-size: 12px;
        font-weight: 800;
      }

      .tracking-status-badge i {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background:
          currentColor;
        animation:
          statusPulse
          1.7s ease
          infinite;
      }

      .tracking-status-delivered {
        background:
          rgba(
            34,
            197,
            94,
            0.1
          );
      }

      .tracking-status-cancelled {
        background:
          rgba(
            239,
            68,
            68,
            0.1
          );
      }

      .tracking-status-processing,
      .tracking-status-shipped,
      .tracking-status-confirmed {
        background:
          rgba(
            59,
            130,
            246,
            0.09
          );
      }

      .tracking-status-pending {
        background:
          rgba(
            234,
            179,
            8,
            0.1
          );
      }

      .track-another-button {
        min-height: 38px;
        padding: 0 14px;
        border: 1px solid
          rgba(
            128,
            128,
            128,
            0.3
          );
        border-radius: 999px;
        background: transparent;
        color: inherit;
        font: inherit;
        font-size: 12px;
        font-weight: 750;
        cursor: pointer;
        transition:
          transform
          0.18s ease;
      }

      .track-another-button:hover {
        transform:
          translateY(-2px);
      }

      .premium-timeline {
        margin-top: 34px;
        padding: clamp(
          20px,
          4vw,
          32px
        );
        border-radius: 22px;
        background:
          rgba(
            128,
            128,
            128,
            0.045
          );
      }

      .timeline-heading {
        display: flex;
        justify-content:
          space-between;
        gap: 18px;
        align-items:
          flex-start;
        margin-bottom: 30px;
      }

      .timeline-heading h3 {
        margin:
          6px 0 0;
        font-size: 24px;
      }

      .live-indicator {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        font-size: 11px;
        font-weight: 750;
        opacity: 0.7;
      }

      .live-indicator i {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background:
          currentColor;
        animation:
          statusPulse
          1.5s ease
          infinite;
      }

      .timeline-list {
        display: grid;
      }

      .timeline-step {
        display: grid;
        grid-template-columns:
          44px 1fr;
        gap: 14px;
        min-height: 104px;
        opacity: 0;
        animation:
          timelineEnter
          0.45s ease
          forwards;
      }

      .timeline-marker-column {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .timeline-marker {
        width: 35px;
        height: 35px;
        flex: 0 0 auto;
        border-radius: 50%;
        display: grid;
        place-items: center;
        border: 1px solid
          rgba(
            128,
            128,
            128,
            0.32
          );
        background:
          var(
            --background,
            #ffffff
          );
        font-size: 11px;
        font-weight: 850;
        transition:
          transform
          0.25s ease;
      }

      .timeline-step.completed
        .timeline-marker {
        background: #1f294d;
        border-color:
          #1f294d;
        color: #ffffff;
      }

      .timeline-step.current
        .timeline-marker {
        transform:
          scale(1.12);
        box-shadow:
          0 0 0 7px
          rgba(
            31,
            41,
            77,
            0.09
          );
      }

      .timeline-line {
        width: 2px;
        flex: 1;
        margin:
          5px 0;
        background:
          rgba(
            128,
            128,
            128,
            0.17
          );
        overflow: hidden;
      }

      .timeline-line-fill {
        width: 100%;
        height: 0;
        background:
          #1f294d;
        transition:
          height
          0.45s ease;
      }

      .timeline-line-fill.filled {
        height: 100%;
      }

      .timeline-content {
        display: flex;
        justify-content:
          space-between;
        gap: 20px;
        padding:
          4px 0 25px;
      }

      .timeline-content h4 {
        margin: 0;
        font-size: 16px;
        display: flex;
        align-items: center;
        gap: 9px;
        flex-wrap: wrap;
      }

      .timeline-content p {
        margin:
          7px 0 0;
        font-size: 12px;
        opacity: 0.58;
      }

      .current-pill {
        padding:
          4px 7px;
        border-radius: 999px;
        background:
          rgba(
            31,
            41,
            77,
            0.1
          );
        font-size: 8px;
        letter-spacing: 0.1em;
      }

      .timeline-time {
        min-width: 115px;
        display: flex;
        flex-direction: column;
        align-items:
          flex-end;
        gap: 3px;
        font-size: 11px;
      }

      .timeline-time span {
        opacity: 0.52;
      }

      .tracking-details-grid {
        display: grid;
        grid-template-columns:
          repeat(
            4,
            minmax(
              0,
              1fr
            )
          );
        gap: 12px;
        margin-top: 22px;
      }

      .tracking-detail-card {
        min-height: 120px;
        padding: 18px;
        border-radius: 17px;
        border: 1px solid
          rgba(
            128,
            128,
            128,
            0.17
          );
        display: flex;
        flex-direction: column;
        justify-content:
          space-between;
        transition:
          transform
            0.18s ease,
          box-shadow
            0.18s ease;
      }

      .tracking-detail-card:hover {
        transform:
          translateY(-3px);
        box-shadow:
          0 15px 40px
          rgba(
            0,
            0,
            0,
            0.055
          );
      }

      .tracking-detail-card
        > span {
        font-size: 11px;
        font-weight: 750;
        opacity: 0.6;
      }

      .tracking-detail-card strong {
        font-size: 20px;
      }

      .tracking-detail-card small {
        opacity: 0.55;
        font-size: 10px;
      }

      .tracking-order-footer {
        margin-top: 28px;
        padding-top: 25px;
        border-top: 1px solid
          rgba(
            128,
            128,
            128,
            0.16
          );
        display: flex;
        justify-content:
          space-between;
        align-items: center;
        gap: 24px;
      }

      .tracking-order-footer
        > div:first-child {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      .tracking-order-footer
        > div:first-child
        span {
        font-size: 9px;
        letter-spacing: 0.15em;
        font-weight: 800;
        opacity: 0.5;
      }

      .tracking-secure-note {
        display: flex;
        align-items: center;
        gap: 9px;
        max-width: 390px;
      }

      .tracking-secure-note
        > span {
        width: 27px;
        height: 27px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        border: 1px solid
          rgba(
            128,
            128,
            128,
            0.3
          );
        font-size: 10px;
        flex: 0 0 auto;
      }

      .tracking-secure-note p {
        margin: 0;
        font-size: 10px;
        line-height: 1.5;
        opacity: 0.52;
      }

      .cancelled-order-box {
        margin-top: 30px;
        padding: clamp(
          22px,
          5vw,
          34px
        );
        border-radius: 20px;
        background:
          rgba(
            239,
            68,
            68,
            0.07
          );
        border: 1px solid
          rgba(
            239,
            68,
            68,
            0.16
          );
        display: flex;
        gap: 20px;
        align-items: center;
      }

      .cancelled-symbol {
        width: 56px;
        height: 56px;
        flex: 0 0 auto;
        border-radius: 50%;
        border: 1px solid
          currentColor;
        display: grid;
        place-items: center;
        font-size: 29px;
      }

      .cancelled-order-box h3 {
        margin:
          6px 0;
        font-size: 24px;
      }

      .cancelled-order-box p {
        margin:
          0 0 8px;
        opacity: 0.62;
        line-height: 1.6;
      }

      .cancelled-order-box small {
        opacity: 0.55;
      }

      @keyframes trackingFadeUp {
        from {
          opacity: 0;
          transform:
            translateY(
              18px
            );
        }

        to {
          opacity: 1;
          transform:
            translateY(
              0
            );
        }
      }

      @keyframes timelineEnter {
        from {
          opacity: 0;
          transform:
            translateX(
              -10px
            );
        }

        to {
          opacity: 1;
          transform:
            translateX(
              0
            );
        }
      }

      @keyframes trackingFloat {
        0%,
        100% {
          transform:
            translateY(
              0
            );
        }

        50% {
          transform:
            translateY(
              -15px
            );
        }
      }

      @keyframes trackingSpin {
        to {
          transform:
            rotate(
              360deg
            );
        }
      }

      @keyframes statusPulse {
        0%,
        100% {
          opacity: 0.45;
          transform:
            scale(
              0.9
            );
        }

        50% {
          opacity: 1;
          transform:
            scale(
              1.15
            );
        }
      }

      @media (
        max-width:
          850px
      ) {
        .tracking-details-grid {
          grid-template-columns:
            repeat(
              2,
              1fr
            );
        }
      }

      @media (
        max-width:
          640px
      ) {
        .tracking-page {
          width:
            min(
              100% - 22px,
              1180px
            );
          padding:
            30px 0 60px;
        }

        .tracking-hero {
          min-height: 360px;
          border-radius: 23px;
          padding:
            28px 23px
            70px;
        }

        .tracking-hero h1 {
          font-size: 52px;
        }

        .tracking-search-card {
          margin-top: -40px;
          border-radius: 22px;
          padding:
            25px 20px;
        }

        .tracking-result {
          padding:
            21px 17px;
          border-radius: 22px;
        }

        .tracking-result-top,
        .tracking-order-footer {
          flex-direction:
            column;
          align-items:
            flex-start;
        }

        .timeline-heading {
          flex-direction:
            column;
        }

        .timeline-content {
          gap: 10px;
        }

        .timeline-time {
          min-width: 80px;
        }

        .tracking-details-grid {
          grid-template-columns:
            1fr 1fr;
        }

        .tracking-trust {
          gap: 10px;
        }
      }

      @media (
        max-width:
          430px
      ) {
        .tracking-details-grid {
          grid-template-columns:
            1fr;
        }

        .timeline-content {
          flex-direction:
            column;
        }

        .timeline-time {
          align-items:
            flex-start;
        }

        .cancelled-order-box {
          flex-direction:
            column;
          align-items:
            flex-start;
        }
      }
    `}</style>
  );
}