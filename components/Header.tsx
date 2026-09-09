"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useState,
} from "react";

import {
  useLanguage,
} from "@/components/LanguageProvider";

/* =====================================================
   PREMIUM INLINE ICONS
===================================================== */

function LanguageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M3 12h18" />

      <path d="M12 3c2.3 2.5 3.5 5.5 3.5 9S14.3 18.5 12 21" />

      <path d="M12 3c-2.3 2.5-3.5 5.5-3.5 9S9.7 18.5 12 21" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M4.5 7.5 12 3.5l7.5 4v9L12 20.5l-7.5-4v-9Z" />

      <path d="M4.8 7.6 12 11.5l7.2-3.9" />

      <path d="M12 11.5v9" />

      <path d="M8.3 5.5 15.7 9.5" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M20.8 5.8c-2-2.1-5.3-2.1-7.3 0L12 7.4l-1.5-1.6c-2-2.1-5.3-2.1-7.3 0-2 2.1-2 5.5 0 7.6L12 21l8.8-7.6c2-2.1 2-5.5 0-7.6Z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="3.5"
      />

      <path d="M5.5 20c.6-4 3-6.2 6.5-6.2s5.9 2.2 6.5 6.2" />

      <circle
        cx="12"
        cy="12"
        r="9"
      />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M5.2 8.2h13.6l1 12H4.2l1-12Z" />

      <path d="M8.5 9V6.8A3.5 3.5 0 0 1 12 3.3a3.5 3.5 0 0 1 3.5 3.5V9" />
    </svg>
  );
}

export default function Header() {
  const pathname =
    usePathname();

  const {
    lang,
    toggleLanguage,
  } =
    useLanguage();

  const [
    menuOpen,
    setMenuOpen,
  ] =
    useState(false);

  useEffect(() => {
    setMenuOpen(
      false
    );
  }, [pathname]);

  const closeMenu = () => {
    setMenuOpen(
      false
    );
  };

  const booksActive =
    pathname ===
      "/shop" ||
    pathname.startsWith(
      "/shop/"
    );

  const fashionActive =
    pathname ===
      "/fashion" ||
    pathname.startsWith(
      "/fashion/"
    );

  const trackingActive =
    pathname ===
      "/track-order" ||
    pathname.startsWith(
      "/track-order/"
    );

  const wishlistActive =
    pathname ===
      "/wishlist" ||
    pathname.startsWith(
      "/wishlist/"
    );

  const accountActive =
    pathname ===
      "/account" ||
    pathname.startsWith(
      "/account/"
    );

  const cartActive =
    pathname ===
      "/cart" ||
    pathname.startsWith(
      "/cart/"
    );

  return (
    <>
      {/* =====================================================
          ANNOUNCEMENT
      ===================================================== */}

      <div className="jiplance-announcement">
        <span className="announcement-light" />

        <span>
          {lang === "en"
            ? "Free browsing • Safe shopping • Delivery across Bangladesh"
            : "সহজ ব্রাউজিং • নিরাপদ শপিং • সারা বাংলাদেশে ডেলিভারি"}
        </span>

        <span className="announcement-light" />
      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="jiplance-header">
        <div className="jiplance-header-shell">

          {/* =================================================
              BRAND
          ================================================= */}

          <div className="brand-section">
            <Link
              href="/"
              className="jiplance-logo"
              onClick={
                closeMenu
              }
              aria-label="JIPLANCE Home"
            >
              <span className="logo-container">
                <Image
                  src="/jiplance-logo.png"
                  alt="JIPLANCE"
                  fill
                  priority
                  sizes="242px"
                />
              </span>
            </Link>

            <div className="brand-secondary">
              <Link
                href="/about"
                onClick={
                  closeMenu
                }
              >
                {lang === "en"
                  ? "About"
                  : "আমাদের সম্পর্কে"}
              </Link>

              <span>
                •
              </span>

              <Link
                href="/contact"
                onClick={
                  closeMenu
                }
              >
                {lang === "en"
                  ? "Contact"
                  : "যোগাযোগ"}
              </Link>
            </div>
          </div>

          {/* =================================================
              BOOKS + FASHION
          ================================================= */}

          <nav className="main-sector-navigation">

            <Link
              href="/shop"
              onClick={
                closeMenu
              }
              className={`premium-sector books-sector ${
                booksActive
                  ? "active"
                  : ""
              }`}
            >
              <span className="sector-background-glow" />

              <span className="sector-shine" />

              <span className="sector-icon">
                <span>
                  B
                </span>
              </span>

              <span className="sector-information">
                <small>
                  JIPLANCE
                </small>

                <strong>
                  {lang === "en"
                    ? "BOOKS"
                    : "বই"}
                </strong>

                <em>
                  {lang === "en"
                    ? "Explore knowledge"
                    : "জ্ঞান অন্বেষণ করুন"}
                </em>
              </span>

              <span className="sector-arrow">
                →
              </span>

              <span className="active-sector-line" />
            </Link>

            <Link
              href="/fashion"
              onClick={
                closeMenu
              }
              className={`premium-sector fashion-sector ${
                fashionActive
                  ? "active"
                  : ""
              }`}
            >
              <span className="sector-background-glow" />

              <span className="sector-shine" />

              <span className="sector-icon">
                <span>
                  F
                </span>
              </span>

              <span className="sector-information">
                <small>
                  JIPLANCE
                </small>

                <strong>
                  {lang === "en"
                    ? "FASHION"
                    : "ফ্যাশন"}
                </strong>

                <em>
                  {lang === "en"
                    ? "Wear your story"
                    : "নিজের স্টাইল বেছে নিন"}
                </em>
              </span>

              <span className="sector-arrow">
                →
              </span>

              <span className="active-sector-line" />
            </Link>
          </nav>

          {/* =================================================
              RIGHT ACTIONS
          ================================================= */}

          <div className="header-actions">

            <button
              type="button"
              className="header-action language-action"
              onClick={
                toggleLanguage
              }
              aria-label={
                lang === "en"
                  ? "Switch to Bangla"
                  : "Switch to English"
              }
            >
              <span className="premium-action-icon">
                <LanguageIcon />
              </span>

              <span className="language-label">
                {lang === "en"
                  ? "বাংলা"
                  : "English"}
              </span>
            </button>

            <Link
              href="/track-order"
              className={`header-action desktop-action ${
                trackingActive
                  ? "header-action-active"
                  : ""
              }`}
            >
              <span className="premium-action-icon">
                <PackageIcon />
              </span>

              <span className="action-text">
                <small>
                  {lang === "en"
                    ? "Track"
                    : "ট্র্যাক"}
                </small>

                <strong>
                  {lang === "en"
                    ? "Order"
                    : "অর্ডার"}
                </strong>
              </span>
            </Link>

            <Link
              href="/wishlist"
              className={`header-action desktop-action ${
                wishlistActive
                  ? "header-action-active"
                  : ""
              }`}
            >
              <span className="premium-action-icon">
                <HeartIcon />
              </span>

              <strong>
                {lang === "en"
                  ? "Wishlist"
                  : "পছন্দ"}
              </strong>
            </Link>

            <Link
              href="/account"
              className={`header-action desktop-action ${
                accountActive
                  ? "header-action-active"
                  : ""
              }`}
            >
              <span className="premium-action-icon">
                <UserIcon />
              </span>

              <strong>
                {lang === "en"
                  ? "Account"
                  : "অ্যাকাউন্ট"}
              </strong>
            </Link>

            <Link
              href="/cart"
              className={`premium-cart-button ${
                cartActive
                  ? "cart-active"
                  : ""
              }`}
            >
              <span className="premium-cart-icon">
                <BagIcon />
              </span>

              <strong>
                {lang === "en"
                  ? "Cart"
                  : "কার্ট"}
              </strong>

              <span className="cart-shine" />
            </Link>

            <button
              type="button"
              className="mobile-menu-button"
              aria-label={
                menuOpen
                  ? "Close menu"
                  : "Open menu"
              }
              aria-expanded={
                menuOpen
              }
              onClick={() =>
                setMenuOpen(
                  (
                    current
                  ) =>
                    !current
                )
              }
            >
              <span />
              <span />
              <span />
            </button>
          </div>

          {/* =================================================
              MOBILE NAVIGATION
          ================================================= */}

          <div
            className={`mobile-navigation ${
              menuOpen
                ? "open"
                : ""
            }`}
          >
            <div className="mobile-sector-grid">

              <Link
                href="/shop"
                onClick={
                  closeMenu
                }
                className="mobile-sector-card mobile-books"
              >
                <span className="mobile-sector-letter">
                  B
                </span>

                <div>
                  <small>
                    JIPLANCE
                  </small>

                  <strong>
                    {lang === "en"
                      ? "BOOKS"
                      : "বই"}
                  </strong>
                </div>

                <span className="mobile-arrow">
                  →
                </span>
              </Link>

              <Link
                href="/fashion"
                onClick={
                  closeMenu
                }
                className="mobile-sector-card mobile-fashion"
              >
                <span className="mobile-sector-letter">
                  F
                </span>

                <div>
                  <small>
                    JIPLANCE
                  </small>

                  <strong>
                    {lang === "en"
                      ? "FASHION"
                      : "ফ্যাশন"}
                  </strong>
                </div>

                <span className="mobile-arrow">
                  →
                </span>
              </Link>
            </div>

            <div className="mobile-secondary-links">

              <Link
                href="/about"
                onClick={
                  closeMenu
                }
              >
                <span>
                  {lang === "en"
                    ? "About JIPLANCE"
                    : "JIPLANCE সম্পর্কে"}
                </span>

                <span>
                  →
                </span>
              </Link>

              <Link
                href="/contact"
                onClick={
                  closeMenu
                }
              >
                <span>
                  {lang === "en"
                    ? "Contact"
                    : "যোগাযোগ"}
                </span>

                <span>
                  →
                </span>
              </Link>

              <Link
                href="/track-order"
                onClick={
                  closeMenu
                }
              >
                <span>
                  {lang === "en"
                    ? "Track Order"
                    : "অর্ডার ট্র্যাক"}
                </span>

                <span>
                  →
                </span>
              </Link>

              <Link
                href="/wishlist"
                onClick={
                  closeMenu
                }
              >
                <span>
                  {lang === "en"
                    ? "Wishlist"
                    : "পছন্দের তালিকা"}
                </span>

                <span>
                  →
                </span>
              </Link>

              <Link
                href="/account"
                onClick={
                  closeMenu
                }
              >
                <span>
                  {lang === "en"
                    ? "Account"
                    : "অ্যাকাউন্ট"}
                </span>

                <span>
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}