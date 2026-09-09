"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

type AccountMode =
  | "login"
  | "signup";

type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  variant_size:
    | string
    | null;
  variant_color:
    | string
    | null;
};

type CustomerOrder = {
  id: string;
  order_number:
    | number
    | null;
  subtotal: number;
  delivery_charge: number;
  total: number;
  claimed_amount: number;
  due_amount: number;
  payment_method: string;
  payment_status: string;
  status: string;
  created_at: string;
  order_items:
    OrderItem[];
};

export default function AccountPage() {
  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    fullName,
    setFullName,
  ] =
    useState("");

  const [
    mode,
    setMode,
  ] =
    useState<AccountMode>(
      "login"
    );

  const [
    userEmail,
    setUserEmail,
  ] =
    useState<
      string | null
    >(null);

  const [
    userName,
    setUserName,
  ] =
    useState<
      string | null
    >(null);

  const [
    role,
    setRole,
  ] =
    useState<
      string | null
    >(null);

  const [
    orders,
    setOrders,
  ] =
    useState<
      CustomerOrder[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    ordersLoading,
    setOrdersLoading,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const loadAccount =
    useCallback(
      async () => {
        if (!supabase) {
          setLoading(
            false
          );

          return;
        }

        const {
          data: {
            user,
          },
        } =
          await supabase.auth.getUser();

        if (!user) {
          setUserEmail(
            null
          );

          setUserName(
            null
          );

          setRole(
            null
          );

          setOrders(
            []
          );

          setLoading(
            false
          );

          return;
        }

        setUserEmail(
          user.email ??
            null
        );

        const {
          data:
            profile,
          error:
            profileError,
        } =
          await supabase
            .from(
              "profiles"
            )
            .select(
              "full_name, role"
            )
            .eq(
              "id",
              user.id
            )
            .single();

        if (
          !profileError &&
          profile
        ) {
          setUserName(
            profile.full_name ??
              null
          );

          setRole(
            profile.role ??
              "customer"
          );
        } else {
          setUserName(
            user
              .user_metadata
              ?.full_name ??
              null
          );

          setRole(
            "customer"
          );
        }

        setOrdersLoading(
          true
        );

        const {
          data:
            orderData,
          error:
            orderError,
        } =
          await supabase
            .from(
              "orders"
            )
            .select(
              `
              id,
              order_number,
              subtotal,
              delivery_charge,
              total,
              claimed_amount,
              due_amount,
              payment_method,
              payment_status,
              status,
              created_at,
              order_items (
                id,
                product_name,
                quantity,
                unit_price,
                line_total,
                variant_size,
                variant_color
              )
              `
            )
            .eq(
              "customer_id",
              user.id
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            );

        if (
          orderError
        ) {
          console.error(
            "Customer order history error:",
            orderError.message
          );

          setOrders(
            []
          );
        } else {
          setOrders(
            (
              orderData ??
              []
            ) as CustomerOrder[]
          );
        }

        setOrdersLoading(
          false
        );

        setLoading(
          false
        );
      },
      []
    );

  useEffect(() => {
    loadAccount();

    if (!supabase) {
      return;
    }

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        () => {
          loadAccount();
        }
      );

    return () => {
      subscription.unsubscribe();
    };
  }, [
    loadAccount,
  ]);

  const handleLogin =
    async (
      e: React.FormEvent<HTMLFormElement>
    ) => {
      e.preventDefault();

      if (!supabase) {
        setMessage(
          "Supabase is not connected."
        );

        return;
      }

      setLoading(
        true
      );

      setMessage(
        ""
      );

      const {
        error,
      } =
        await supabase.auth.signInWithPassword(
          {
            email:
              email.trim(),

            password,
          }
        );

      if (error) {
        setMessage(
          error.message
        );

        setLoading(
          false
        );

        return;
      }

      setMessage(
        "Login successful."
      );

      setPassword(
        ""
      );

      await loadAccount();
    };

  const handleSignup =
    async (
      e: React.FormEvent<HTMLFormElement>
    ) => {
      e.preventDefault();

      if (!supabase) {
        setMessage(
          "Supabase is not connected."
        );

        return;
      }

      setLoading(
        true
      );

      setMessage(
        ""
      );

      const {
        data,
        error,
      } =
        await supabase.auth.signUp(
          {
            email:
              email.trim(),

            password,

            options: {
              data: {
                full_name:
                  fullName.trim(),
              },
            },
          }
        );

      if (error) {
        setMessage(
          error.message
        );

        setLoading(
          false
        );

        return;
      }

      setPassword(
        ""
      );

      if (
        data.session
      ) {
        setMessage(
          "Account created successfully."
        );

        await loadAccount();
      } else {
        setMessage(
          "Account created. Please check your email if confirmation is required."
        );

        setLoading(
          false
        );
      }
    };

  const handleLogout =
    async () => {
      if (!supabase) {
        return;
      }

      setLoading(
        true
      );

      setMessage(
        ""
      );

      const {
        error,
      } =
        await supabase.auth.signOut();

      if (error) {
        setMessage(
          error.message
        );

        setLoading(
          false
        );

        return;
      }

      setUserEmail(
        null
      );

      setUserName(
        null
      );

      setRole(
        null
      );

      setOrders(
        []
      );

      setMessage(
        "Logged out successfully."
      );

      setLoading(
        false
      );
    };

  if (loading) {
    return (
      <>
        <Header />

        <main className="account-shell">
          <div className="account-loading">
            <div className="loading-logo">
              J
            </div>

            <div className="loading-line" />

            <p>
              Preparing your JIPLANCE
              account...
            </p>
          </div>
        </main>

        <Footer />

        <AccountStyles />
      </>
    );
  }

  if (userEmail) {
    const customerName =
      userName?.trim() ||
      userEmail.split(
        "@"
      )[0];

    return (
      <>
        <Header />

        <main className="account-shell">
          <section className="account-hero">
            <div>
              <div className="account-eyebrow">
                JIPLANCE ACCOUNT
              </div>

              <h1>
                Welcome,{" "}
                {
                  customerName
                }
              </h1>

              <p>
                Manage your
                account and
                follow your
                JIPLANCE orders
                from one place.
              </p>
            </div>

            <div className="account-hero-actions">
              <a
                className="account-secondary-button"
                href="/wishlist"
              >
                My Wishlist

                <span>
                  ♡
                </span>
              </a>

              {(role ===
                "owner" ||
                role ===
                  "admin" ||
                role ===
                  "staff") && (
                <a
                  className="account-primary-button"
                  href="/admin"
                >
                  Admin Dashboard

                  <span>
                    →
                  </span>
                </a>
              )}

              <button
                className="account-secondary-button"
                type="button"
                onClick={
                  handleLogout
                }
              >
                Log Out
              </button>
            </div>
          </section>

          <section className="account-stats">
            <div className="account-stat-card">
              <span>
                Account
              </span>

              <strong>
                {role?.toUpperCase() ??
                  "CUSTOMER"}
              </strong>

              <small>
                {
                  userEmail
                }
              </small>
            </div>

            <div className="account-stat-card">
              <span>
                Total Orders
              </span>

              <strong>
                {
                  orders.length
                }
              </strong>

              <small>
                Orders connected
                to this account
              </small>
            </div>

            <div className="account-stat-card">
              <span>
                Active Orders
              </span>

              <strong>
                {
                  orders.filter(
                    (
                      order
                    ) =>
                      ![
                        "delivered",
                        "cancelled",
                      ].includes(
                        order.status
                      )
                  ).length
                }
              </strong>

              <small>
                Currently being
                processed
              </small>
            </div>

            <div className="account-stat-card">
              <span>
                Completed
              </span>

              <strong>
                {
                  orders.filter(
                    (
                      order
                    ) =>
                      order.status ===
                      "delivered"
                  ).length
                }
              </strong>

              <small>
                Successfully
                delivered
              </small>
            </div>
          </section>

          {message && (
            <div className="account-message">
              {
                message
              }
            </div>
          )}

          <section className="orders-section">
            <div className="orders-heading">
              <div>
                <div className="account-eyebrow">
                  YOUR ORDERS
                </div>

                <h2>
                  Order History
                </h2>

                <p>
                  Check your
                  order, payment
                  and delivery
                  progress.
                </p>
              </div>
            </div>

            {ordersLoading ? (
              <div className="order-empty">
                <div className="loading-line" />

                <p>
                  Loading your
                  orders...
                </p>
              </div>
            ) : orders.length ===
              0 ? (
              <div className="order-empty">
                <div className="empty-icon">
                  🛍️
                </div>

                <h3>
                  No account
                  orders yet
                </h3>

                <p>
                  You can shop
                  with or
                  without
                  logging in.
                  Orders
                  connected to
                  this account
                  will appear
                  here.
                </p>

                <a
                  href="/shop"
                  className="account-primary-button"
                >
                  Start Shopping

                  <span>
                    →
                  </span>
                </a>
              </div>
            ) : (
              <div className="order-list">
                {orders.map(
                  (
                    order,
                    index
                  ) => (
                    <OrderCard
                      key={
                        order.id
                      }
                      order={
                        order
                      }
                      index={
                        index
                      }
                    />
                  )
                )}
              </div>
            )}
          </section>
        </main>

        <Footer />

        <AccountStyles />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="account-auth-page">
        <section className="auth-info-panel">
          <div className="account-eyebrow">
            JIPLANCE
          </div>

          <h1>
            Your shopping,
            <br />
            beautifully
            organized.
          </h1>

          <p>
            Create an optional
            account to keep
            your JIPLANCE
            shopping
            experience in one
            place.
          </p>

          <div className="auth-benefits">
            <div>
              <span>
                01
              </span>

              <div>
                <strong>
                  Order History
                </strong>

                <small>
                  See your
                  connected
                  orders
                  anytime.
                </small>
              </div>
            </div>

            <div>
              <span>
                02
              </span>

              <div>
                <strong>
                  Order Progress
                </strong>

                <small>
                  Follow
                  confirmation,
                  processing and
                  delivery.
                </small>
              </div>
            </div>

            <div>
              <span>
                03
              </span>

              <div>
                <strong>
                  Guest Shopping
                </strong>

                <small>
                  Account is
                  optional.
                  Checkout still
                  works without
                  login.
                </small>
              </div>
            </div>
          </div>

          <a
            href="/shop"
            className="continue-guest-link"
          >
            Continue shopping
            as guest

            <span>
              →
            </span>
          </a>
        </section>

        <section className="auth-card">
          <div className="auth-card-top">
            <div className="account-eyebrow">
              {mode ===
              "login"
                ? "WELCOME BACK"
                : "JOIN JIPLANCE"}
            </div>

            <h2>
              {mode ===
              "login"
                ? "Sign in"
                : "Create account"}
            </h2>

            <p>
              {mode ===
              "login"
                ? "Access your JIPLANCE account."
                : "Create your optional customer account."}
            </p>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={
                mode ===
                "login"
                  ? "active"
                  : ""
              }
              onClick={() => {
                setMode(
                  "login"
                );

                setMessage(
                  ""
                );
              }}
            >
              Sign In
            </button>

            <button
              type="button"
              className={
                mode ===
                "signup"
                  ? "active"
                  : ""
              }
              onClick={() => {
                setMode(
                  "signup"
                );

                setMessage(
                  ""
                );
              }}
            >
              Create Account
            </button>
          </div>

          <form
            className="account-form"
            onSubmit={
              mode ===
              "login"
                ? handleLogin
                : handleSignup
            }
          >
            {mode ===
              "signup" && (
              <label>
                <span>
                  Full name
                </span>

                <input
                  type="text"
                  required
                  value={
                    fullName
                  }
                  onChange={(
                    e
                  ) =>
                    setFullName(
                      e.target
                        .value
                    )
                  }
                  placeholder="Your full name"
                  autoComplete="name"
                />
              </label>
            )}

            <label>
              <span>
                Email address
              </span>

              <input
                type="email"
                required
                value={
                  email
                }
                onChange={(
                  e
                ) =>
                  setEmail(
                    e.target
                      .value
                  )
                }
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            <label>
              <div className="password-label-row">
                <span>
                  Password
                </span>

                {mode ===
                  "login" && (
                  <a
                    href="/forgot-password"
                    className="forgot-password-link"
                  >
                    Forgot password?
                  </a>
                )}
              </div>

              <input
                type="password"
                required
                minLength={
                  6
                }
                value={
                  password
                }
                onChange={(
                  e
                ) =>
                  setPassword(
                    e.target
                      .value
                  )
                }
                placeholder="Minimum 6 characters"
                autoComplete={
                  mode ===
                  "login"
                    ? "current-password"
                    : "new-password"
                }
              />
            </label>

            {message && (
              <div className="account-message">
                {
                  message
                }
              </div>
            )}

            <button
              className="account-primary-button auth-submit"
              type="submit"
            >
              {mode ===
              "login"
                ? "Sign In"
                : "Create Account"}

              <span>
                →
              </span>
            </button>
          </form>

          <div className="guest-note">
            <strong>
              Account is
              optional.
            </strong>

            <span>
              You can purchase
              from JIPLANCE
              without signing
              in.
            </span>
          </div>
        </section>
      </main>

      <Footer />

      <AccountStyles />
    </>
  );
}

function OrderCard({
  order,
  index,
}: {
  order: CustomerOrder;
  index: number;
}) {
  const displayNumber =
    order.order_number !==
    null
      ? `JIP-${
          order.order_number +
          1000
        }`
      : order.id.slice(
          0,
          8
        );

  return (
    <article
      className="customer-order-card"
      style={{
        animationDelay: `${
          Math.min(
            index,
            6
          ) * 80
        }ms`,
      }}
    >
      <div className="order-card-header">
        <div>
          <span className="order-small-label">
            ORDER
          </span>

          <h3>
            {
              displayNumber
            }
          </h3>

          <small>
            {new Date(
              order.created_at
            ).toLocaleString(
              "en-BD",
              {
                timeZone:
                  "Asia/Dhaka",

                dateStyle:
                  "medium",

                timeStyle:
                  "short",
              }
            )}
          </small>
        </div>

        <div className="order-badges">
          <StatusBadge
            type="order"
            status={
              order.status
            }
          />

          <StatusBadge
            type="payment"
            status={
              order.payment_status
            }
          />
        </div>
      </div>

      <OrderProgress
        status={
          order.status
        }
      />

      <div className="order-items">
        {order.order_items?.map(
          (
            item
          ) => {
            const variant =
              [
                item.variant_size
                  ? `Size: ${item.variant_size}`
                  : null,

                item.variant_color
                  ? `Color: ${item.variant_color}`
                  : null,
              ]
                .filter(
                  Boolean
                )
                .join(
                  " • "
                );

            return (
              <div
                className="customer-order-item"
                key={
                  item.id
                }
              >
                <div>
                  <strong>
                    {
                      item.product_name
                    }
                  </strong>

                  {variant && (
                    <small>
                      {
                        variant
                      }
                    </small>
                  )}
                </div>

                <div className="item-price">
                  <span>
                    Qty{" "}
                    {
                      item.quantity
                    }
                  </span>

                  <strong>
                    ৳
                    {Number(
                      item.line_total
                    )}
                  </strong>
                </div>
              </div>
            );
          }
        )}
      </div>

      <div className="order-financials">
        <div>
          <span>
            Order Total
          </span>

          <strong>
            ৳
            {Number(
              order.total
            )}
          </strong>
        </div>

        <div>
          <span>
            Amount Claimed
            Sent
          </span>

          <strong>
            ৳
            {Number(
              order.claimed_amount
            )}
          </strong>
        </div>

        <div>
          <span>
            Due on Delivery
          </span>

          <strong>
            ৳
            {Number(
              order.due_amount
            )}
          </strong>
        </div>

        <div>
          <span>
            Payment
          </span>

          <strong>
            {
              order.payment_method
            }
          </strong>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({
  status,
  type,
}: {
  status: string;
  type:
    | "order"
    | "payment";
}) {
  let label =
    status;

  if (
    status ===
    "pending_verification"
  ) {
    label =
      "Payment Review";
  }

  if (
    status ===
    "pending"
  ) {
    label =
      "Pending";
  }

  if (
    status ===
    "confirmed"
  ) {
    label =
      "Confirmed";
  }

  if (
    status ===
    "processing"
  ) {
    label =
      "Processing";
  }

  if (
    status ===
    "shipped"
  ) {
    label =
      "Shipped";
  }

  if (
    status ===
    "delivered"
  ) {
    label =
      "Delivered";
  }

  if (
    status ===
    "cancelled"
  ) {
    label =
      "Cancelled";
  }

  if (
    status ===
    "verified"
  ) {
    label =
      "Payment Verified";
  }

  if (
    status ===
    "rejected"
  ) {
    label =
      "Payment Rejected";
  }

  return (
    <span
      className={`status-badge ${type} status-${status}`}
    >
      {
        label
      }
    </span>
  );
}

function OrderProgress({
  status,
}: {
  status: string;
}) {
  if (
    status ===
    "cancelled"
  ) {
    return (
      <div className="cancelled-progress">
        <span>
          ×
        </span>

        <div>
          <strong>
            Order Cancelled
          </strong>

          <small>
            This order is no
            longer being
            processed.
          </small>
        </div>
      </div>
    );
  }

  const steps = [
    "confirmed",
    "processing",
    "shipped",
    "delivered",
  ];

  const currentIndex =
    status ===
    "pending"
      ? -1
      : steps.indexOf(
          status
        );

  return (
    <div className="order-progress">
      {steps.map(
        (
          step,
          index
        ) => {
          const completed =
            index <=
            currentIndex;

          return (
            <div
              key={
                step
              }
              className={`progress-step ${
                completed
                  ? "completed"
                  : ""
              }`}
            >
              <div className="progress-dot">
                {completed
                  ? "✓"
                  : index +
                    1}
              </div>

              <span>
                {step
                  .charAt(
                    0
                  )
                  .toUpperCase() +
                  step.slice(
                    1
                  )}
              </span>
            </div>
          );
        }
      )}
    </div>
  );
}

function AccountStyles() {
  return (
    <style jsx global>{`
      .account-shell {
        width:
          min(
            1180px,
            calc(
              100% - 32px
            )
          );
        margin:
          0 auto;
        padding:
          72px 0 96px;
      }

      .account-eyebrow,
      .order-small-label {
        font-size:
          12px;
        font-weight:
          800;
        letter-spacing:
          0.18em;
        opacity:
          0.65;
      }

      .account-hero {
        display:
          flex;
        align-items:
          flex-end;
        justify-content:
          space-between;
        gap:
          32px;
        padding:
          36px;
        border:
          1px solid
          rgba(
            128,
            128,
            128,
            0.2
          );
        border-radius:
          28px;
        background:
          radial-gradient(
            circle at top right,
            rgba(
              127,
              127,
              127,
              0.13
            ),
            transparent
              42%
          );
        animation:
          accountFadeUp
          0.55s ease
          both;
      }

      .account-hero h1 {
        margin:
          10px 0;
        font-size:
          clamp(
            32px,
            5vw,
            58px
          );
        line-height:
          1.05;
      }

      .account-hero p {
        max-width:
          620px;
        margin:
          0;
        opacity:
          0.72;
        line-height:
          1.7;
      }

      .account-hero-actions {
        display:
          flex;
        gap:
          10px;
        flex-wrap:
          wrap;
      }

      .account-primary-button,
      .account-secondary-button {
        min-height:
          48px;
        padding:
          0 20px;
        border-radius:
          999px;
        border:
          1px solid
          currentColor;
        display:
          inline-flex;
        align-items:
          center;
        justify-content:
          center;
        gap:
          12px;
        font:
          inherit;
        font-weight:
          750;
        text-decoration:
          none;
        cursor:
          pointer;
        transition:
          transform
            0.18s ease,
          opacity
            0.18s ease,
          box-shadow
            0.18s ease;
      }

      .account-primary-button {
        background:
          #1f294d;
        color:
          #ffffff;
      }

      .account-primary-button::before {
        content:
          "";
        position:
          absolute;
      }

      .account-primary-button:hover,
      .account-secondary-button:hover {
        transform:
          translateY(
            -2px
          );
      }

      .account-primary-button:active,
      .account-secondary-button:active {
        transform:
          scale(
            0.97
          );
      }

      .account-secondary-button {
        background:
          transparent;
        color:
          inherit;
      }

      .account-stats {
        display:
          grid;
        grid-template-columns:
          repeat(
            4,
            minmax(
              0,
              1fr
            )
          );
        gap:
          14px;
        margin-top:
          18px;
      }

      .account-stat-card {
        min-height:
          155px;
        padding:
          22px;
        border:
          1px solid
          rgba(
            128,
            128,
            128,
            0.2
          );
        border-radius:
          20px;
        display:
          flex;
        flex-direction:
          column;
        justify-content:
          space-between;
        transition:
          transform
            0.2s ease,
          box-shadow
            0.2s ease;
        animation:
          accountFadeUp
          0.55s ease
          both;
      }

      .account-stat-card:hover {
        transform:
          translateY(
            -4px
          );
        box-shadow:
          0 18px 50px
          rgba(
            0,
            0,
            0,
            0.08
          );
      }

      .account-stat-card span {
        font-size:
          13px;
        font-weight:
          700;
        opacity:
          0.65;
      }

      .account-stat-card strong {
        font-size:
          28px;
      }

      .account-stat-card small {
        opacity:
          0.6;
        line-height:
          1.4;
      }

      .orders-section {
        margin-top:
          64px;
      }

      .orders-heading {
        margin-bottom:
          22px;
      }

      .orders-heading h2 {
        font-size:
          clamp(
            28px,
            4vw,
            42px
          );
        margin:
          8px 0;
      }

      .orders-heading p {
        margin:
          0;
        opacity:
          0.66;
      }

      .order-list {
        display:
          grid;
        gap:
          18px;
      }

      .customer-order-card {
        padding:
          26px;
        border:
          1px solid
          rgba(
            128,
            128,
            128,
            0.22
          );
        border-radius:
          24px;
        opacity:
          0;
        animation:
          accountFadeUp
          0.55s ease
          forwards;
        transition:
          transform
            0.2s ease,
          box-shadow
            0.2s ease;
      }

      .customer-order-card:hover {
        transform:
          translateY(
            -3px
          );
        box-shadow:
          0 20px 60px
          rgba(
            0,
            0,
            0,
            0.07
          );
      }

      .order-card-header {
        display:
          flex;
        justify-content:
          space-between;
        gap:
          18px;
        flex-wrap:
          wrap;
      }

      .order-card-header h3 {
        margin:
          5px 0;
        font-size:
          24px;
      }

      .order-badges {
        display:
          flex;
        gap:
          8px;
        align-items:
          flex-start;
        flex-wrap:
          wrap;
      }

      .status-badge {
        display:
          inline-flex;
        align-items:
          center;
        min-height:
          30px;
        padding:
          0 11px;
        border-radius:
          999px;
        border:
          1px solid
          rgba(
            128,
            128,
            128,
            0.3
          );
        font-size:
          11px;
        font-weight:
          800;
        letter-spacing:
          0.04em;
      }

      .status-delivered,
      .status-verified {
        background:
          rgba(
            34,
            197,
            94,
            0.1
          );
      }

      .status-cancelled,
      .status-rejected {
        background:
          rgba(
            239,
            68,
            68,
            0.1
          );
      }

      .status-pending,
      .status-pending_verification {
        background:
          rgba(
            234,
            179,
            8,
            0.1
          );
      }

      .status-confirmed,
      .status-processing,
      .status-shipped {
        background:
          rgba(
            59,
            130,
            246,
            0.1
          );
      }

      .order-progress {
        display:
          grid;
        grid-template-columns:
          repeat(
            4,
            1fr
          );
        margin:
          28px 0;
      }

      .progress-step {
        position:
          relative;
        display:
          flex;
        flex-direction:
          column;
        align-items:
          center;
        gap:
          8px;
        text-align:
          center;
        font-size:
          12px;
        opacity:
          0.45;
      }

      .progress-step::before {
        content:
          "";
        position:
          absolute;
        top:
          15px;
        right:
          50%;
        width:
          100%;
        height:
          2px;
        background:
          rgba(
            128,
            128,
            128,
            0.25
          );
        z-index:
          -1;
      }

      .progress-step:first-child::before {
        display:
          none;
      }

      .progress-step.completed {
        opacity:
          1;
      }

      .progress-dot {
        width:
          32px;
        height:
          32px;
        border-radius:
          50%;
        display:
          grid;
        place-items:
          center;
        border:
          1px solid
          rgba(
            128,
            128,
            128,
            0.35
          );
        background:
          var(
            --background,
            white
          );
        font-weight:
          800;
      }

      .progress-step.completed
        .progress-dot {
        border-width:
          2px;
      }

      .cancelled-progress {
        margin:
          24px 0;
        padding:
          16px 18px;
        border-radius:
          16px;
        background:
          rgba(
            239,
            68,
            68,
            0.08
          );
        display:
          flex;
        gap:
          14px;
        align-items:
          center;
      }

      .cancelled-progress
        > span {
        width:
          34px;
        height:
          34px;
        border-radius:
          50%;
        display:
          grid;
        place-items:
          center;
        border:
          1px solid
          currentColor;
        font-size:
          20px;
      }

      .cancelled-progress div {
        display:
          flex;
        flex-direction:
          column;
        gap:
          3px;
      }

      .cancelled-progress small {
        opacity:
          0.65;
      }

      .order-items {
        border-top:
          1px solid
          rgba(
            128,
            128,
            128,
            0.18
          );
        border-bottom:
          1px solid
          rgba(
            128,
            128,
            128,
            0.18
          );
      }

      .customer-order-item {
        padding:
          15px 0;
        display:
          flex;
        justify-content:
          space-between;
        gap:
          18px;
      }

      .customer-order-item
        + .customer-order-item {
        border-top:
          1px solid
          rgba(
            128,
            128,
            128,
            0.12
          );
      }

      .customer-order-item
        > div:first-child {
        display:
          flex;
        flex-direction:
          column;
        gap:
          5px;
      }

      .customer-order-item small,
      .item-price span {
        opacity:
          0.6;
      }

      .item-price {
        display:
          flex;
        flex-direction:
          column;
        text-align:
          right;
        gap:
          4px;
      }

      .order-financials {
        margin-top:
          20px;
        display:
          grid;
        grid-template-columns:
          repeat(
            4,
            1fr
          );
        gap:
          12px;
      }

      .order-financials
        > div {
        padding:
          14px;
        border-radius:
          14px;
        background:
          rgba(
            128,
            128,
            128,
            0.06
          );
        display:
          flex;
        flex-direction:
          column;
        gap:
          6px;
      }

      .order-financials span {
        font-size:
          12px;
        opacity:
          0.62;
      }

      .order-empty {
        min-height:
          300px;
        border:
          1px dashed
          rgba(
            128,
            128,
            128,
            0.35
          );
        border-radius:
          24px;
        display:
          flex;
        flex-direction:
          column;
        align-items:
          center;
        justify-content:
          center;
        text-align:
          center;
        padding:
          32px;
      }

      .order-empty p {
        max-width:
          520px;
        opacity:
          0.65;
        line-height:
          1.6;
      }

      .empty-icon {
        font-size:
          44px;
        margin-bottom:
          12px;
      }

      .account-auth-page {
        width:
          min(
            1180px,
            calc(
              100% - 32px
            )
          );
        margin:
          0 auto;
        padding:
          72px 0 96px;
        display:
          grid;
        grid-template-columns:
          1.05fr
          0.95fr;
        gap:
          28px;
      }

      .auth-info-panel,
      .auth-card {
        border:
          1px solid
          rgba(
            128,
            128,
            128,
            0.2
          );
        border-radius:
          30px;
        padding:
          clamp(
            28px,
            5vw,
            52px
          );
        animation:
          accountFadeUp
          0.55s ease
          both;
      }

      .auth-info-panel {
        display:
          flex;
        flex-direction:
          column;
        justify-content:
          center;
        min-height:
          620px;
        background:
          radial-gradient(
            circle at
              10% 10%,
            rgba(
              127,
              127,
              127,
              0.15
            ),
            transparent
              40%
          );
      }

      .auth-info-panel h1 {
        margin:
          12px 0 18px;
        font-size:
          clamp(
            38px,
            5vw,
            64px
          );
        line-height:
          1.02;
      }

      .auth-info-panel
        > p {
        max-width:
          540px;
        opacity:
          0.7;
        line-height:
          1.7;
      }

      .auth-benefits {
        display:
          grid;
        gap:
          12px;
        margin:
          34px 0;
      }

      .auth-benefits
        > div {
        display:
          flex;
        align-items:
          center;
        gap:
          16px;
        padding:
          15px;
        border-radius:
          16px;
        background:
          rgba(
            128,
            128,
            128,
            0.07
          );
        transition:
          transform
            0.18s ease;
      }

      .auth-benefits
        > div:hover {
        transform:
          translateX(
            5px
          );
      }

      .auth-benefits
        > div
        > span {
        font-weight:
          850;
        opacity:
          0.45;
      }

      .auth-benefits div div {
        display:
          flex;
        flex-direction:
          column;
        gap:
          4px;
      }

      .auth-benefits small {
        opacity:
          0.65;
      }

      .continue-guest-link {
        color:
          inherit;
        text-decoration:
          none;
        font-weight:
          750;
        display:
          inline-flex;
        gap:
          10px;
        align-items:
          center;
      }

      .continue-guest-link span {
        transition:
          transform
            0.18s ease;
      }

      .continue-guest-link:hover
        span {
        transform:
          translateX(
            5px
          );
      }

      .auth-card {
        align-self:
          center;
      }

      .auth-card-top h2 {
        margin:
          8px 0;
        font-size:
          38px;
      }

      .auth-card-top p {
        opacity:
          0.65;
      }

      .auth-tabs {
        display:
          grid;
        grid-template-columns:
          1fr 1fr;
        padding:
          5px;
        border-radius:
          999px;
        background:
          rgba(
            128,
            128,
            128,
            0.08
          );
        margin:
          28px 0;
      }

      .auth-tabs button {
        min-height:
          44px;
        border:
          0;
        border-radius:
          999px;
        background:
          transparent;
        color:
          inherit;
        cursor:
          pointer;
        font:
          inherit;
        font-weight:
          700;
        opacity:
          0.6;
        transition:
          background
            0.18s ease,
          opacity
            0.18s ease,
          transform
            0.18s ease;
      }

      .auth-tabs button.active {
        background:
          rgba(
            128,
            128,
            128,
            0.16
          );
        opacity:
          1;
      }

      .auth-tabs button:active {
        transform:
          scale(
            0.97
          );
      }

      .account-form {
        display:
          grid;
        gap:
          18px;
      }

      .account-form label {
        display:
          grid;
        gap:
          8px;
      }

      .account-form
        label
        > span {
        font-size:
          13px;
        font-weight:
          750;
      }

      .password-label-row {
        display:
          flex;
        align-items:
          center;
        justify-content:
          space-between;
        gap:
          14px;
      }

      .password-label-row
        > span {
        font-size:
          13px;
        font-weight:
          750;
      }

      .forgot-password-link {
        color:
          #2d3d70;
        font-size:
          12px;
        font-weight:
          800;
        text-decoration:
          none;
        opacity:
          0.82;
        transition:
          opacity
            0.18s ease,
          transform
            0.18s ease;
      }

      .forgot-password-link:hover {
        opacity:
          1;
        transform:
          translateY(
            -1px
          );
        text-decoration:
          underline;
        text-underline-offset:
          3px;
      }

      .account-form input {
        width:
          100%;
        min-height:
          52px;
        border:
          1px solid
          rgba(
            128,
            128,
            128,
            0.3
          );
        border-radius:
          14px;
        background:
          transparent;
        color:
          inherit;
        padding:
          0 15px;
        font:
          inherit;
        outline:
          none;
        transition:
          border
            0.18s ease,
          box-shadow
            0.18s ease,
          transform
            0.18s ease;
      }

      .account-form input:focus {
        border-color:
          currentColor;
        box-shadow:
          0 0 0 3px
          rgba(
            128,
            128,
            128,
            0.12
          );
        transform:
          translateY(
            -1px
          );
      }

      .auth-submit {
        width:
          100%;
        position:
          relative;
        margin-top:
          4px;
      }

      .guest-note {
        margin-top:
          22px;
        padding-top:
          20px;
        border-top:
          1px solid
          rgba(
            128,
            128,
            128,
            0.2
          );
        display:
          flex;
        flex-direction:
          column;
        gap:
          4px;
        font-size:
          13px;
      }

      .guest-note span {
        opacity:
          0.62;
      }

      .account-message {
        margin:
          18px 0;
        padding:
          14px 16px;
        border:
          1px solid
          rgba(
            128,
            128,
            128,
            0.24
          );
        border-radius:
          14px;
        background:
          rgba(
            128,
            128,
            128,
            0.07
          );
      }

      .account-loading {
        min-height:
          440px;
        display:
          flex;
        flex-direction:
          column;
        align-items:
          center;
        justify-content:
          center;
        gap:
          18px;
      }

      .loading-logo {
        width:
          58px;
        height:
          58px;
        border-radius:
          18px;
        display:
          grid;
        place-items:
          center;
        border:
          1px solid
          rgba(
            128,
            128,
            128,
            0.3
          );
        font-size:
          27px;
        font-weight:
          900;
        animation:
          accountPulse
          1.2s ease
          infinite;
      }

      .loading-line {
        width:
          180px;
        height:
          4px;
        border-radius:
          999px;
        overflow:
          hidden;
        background:
          rgba(
            128,
            128,
            128,
            0.15
          );
        position:
          relative;
      }

      .loading-line::after {
        content:
          "";
        position:
          absolute;
        inset:
          0;
        width:
          45%;
        border-radius:
          inherit;
        background:
          currentColor;
        animation:
          loadingMove
          1.1s ease
          infinite;
      }

      @keyframes accountFadeUp {
        from {
          opacity:
            0;
          transform:
            translateY(
              16px
            );
        }

        to {
          opacity:
            1;
          transform:
            translateY(
              0
            );
        }
      }

      @keyframes accountPulse {
        0%,
        100% {
          transform:
            scale(
              1
            );
          opacity:
            0.7;
        }

        50% {
          transform:
            scale(
              1.06
            );
          opacity:
            1;
        }
      }

      @keyframes loadingMove {
        from {
          transform:
            translateX(
              -120%
            );
        }

        to {
          transform:
            translateX(
              330%
            );
        }
      }

      @media (
        max-width:
          900px
      ) {
        .account-auth-page {
          grid-template-columns:
            1fr;
        }

        .auth-info-panel {
          min-height:
            auto;
        }

        .account-stats {
          grid-template-columns:
            repeat(
              2,
              1fr
            );
        }

        .order-financials {
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
        .account-shell,
        .account-auth-page {
          width:
            min(
              100% - 22px,
              1180px
            );
          padding-top:
            34px;
          padding-bottom:
            60px;
        }

        .account-hero {
          padding:
            24px;
          border-radius:
            22px;
          align-items:
            flex-start;
          flex-direction:
            column;
        }

        .account-hero-actions {
          width:
            100%;
        }

        .account-hero-actions
          .account-primary-button,
        .account-hero-actions
          .account-secondary-button {
          flex:
            1;
        }

        .account-stats {
          grid-template-columns:
            1fr 1fr;
        }

        .account-stat-card {
          min-height:
            135px;
          padding:
            17px;
        }

        .customer-order-card {
          padding:
            19px;
          border-radius:
            20px;
        }

        .order-progress {
          overflow-x:
            auto;
          grid-template-columns:
            repeat(
              4,
              minmax(
                88px,
                1fr
              )
            );
          padding-bottom:
            5px;
        }

        .order-financials {
          grid-template-columns:
            1fr 1fr;
        }

        .auth-info-panel,
        .auth-card {
          padding:
            25px;
          border-radius:
            22px;
        }

        .auth-info-panel h1 {
          font-size:
            40px;
        }
      }

      @media (
        max-width:
          430px
      ) {
        .account-stats,
        .order-financials {
          grid-template-columns:
            1fr;
        }

        .customer-order-item {
          flex-direction:
            column;
        }

        .item-price {
          text-align:
            left;
        }

        .password-label-row {
          align-items:
            flex-start;
        }
      }
    `}</style>
  );
}