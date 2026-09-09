"use client";

import Link from "next/link";

import {
  siteConfig,
} from "@/lib/config";

import {
  useLanguage,
} from "@/components/LanguageProvider";

export default function Footer() {
  const {
    lang,
  } =
    useLanguage();

  return (
    <footer className="footer">
      {/* =========================================
          BRAND
      ========================================= */}

      <div>
        <Link
          href="/"
          className="footer-logo-link"
          aria-label="JIPLANCE Home"
        >
          <img
            src="/jiplance-logo.png"
            alt="JIPLANCE"
            className="footer-logo-image"
          />
        </Link>

        <p>
          {lang === "en"
            ? siteConfig.tagline
            : "বড় হয়ে ওঠা মন, আনন্দময় শৈশব।"}
        </p>
      </div>

      {/* =========================================
          SHOP
      ========================================= */}

      <div>
        <h4>
          {lang === "en"
            ? "Shop"
            : "কেনাকাটা"}
        </h4>

        <Link href="/shop">
          {lang === "en"
            ? "Books"
            : "বই"}
        </Link>

        <Link href="/fashion">
          {lang === "en"
            ? "Fashion"
            : "ফ্যাশন"}
        </Link>

        <Link href="/wishlist">
          {lang === "en"
            ? "Wishlist"
            : "উইশলিস্ট"}
        </Link>

        <Link href="/shop?category=Educational">
          {lang === "en"
            ? "Educational Books"
            : "শিক্ষামূলক বই"}
        </Link>
      </div>

      {/* =========================================
          CUSTOMER CARE
      ========================================= */}

      <div>
        <h4>
          {lang === "en"
            ? "Customer Care"
            : "গ্রাহক সহায়তা"}
        </h4>

        <Link href="/track-order">
          {lang === "en"
            ? "Track Order"
            : "অর্ডার ট্র্যাক করুন"}
        </Link>

        <Link href="/shipping">
          {lang === "en"
            ? "Shipping & Delivery"
            : "শিপিং ও ডেলিভারি"}
        </Link>

        <Link href="/returns">
          {lang === "en"
            ? "Returns & Refunds"
            : "রিটার্ন ও রিফান্ড"}
        </Link>

        <Link href="/contact">
          {lang === "en"
            ? "Contact Us"
            : "যোগাযোগ করুন"}
        </Link>
      </div>

      {/* =========================================
          CONTACT
      ========================================= */}

      <div>
        <h4>
          {lang === "en"
            ? "Contact"
            : "যোগাযোগ"}
        </h4>

        <a
          href={`mailto:${siteConfig.contact.email}`}
        >
          {
            siteConfig.contact.email
          }
        </a>

        <a
          href={`tel:${siteConfig.contact.phone}`}
        >
          {
            siteConfig.contact.phone
          }
        </a>

        <span>
          {
            siteConfig.delivery.courier
          }{" "}
          {lang === "en"
            ? "delivery"
            : "ডেলিভারি"}
        </span>
      </div>

      <style jsx global>{`
        .footer-logo-link {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          max-width: 100%;
          text-decoration: none;
        }

        .footer-logo-image {
          display: block;
          width: 170px;
          height: 68px;
          max-width: 100%;
          object-fit: contain;
          object-position: left center;
        }

        @media (max-width: 640px) {
          .footer-logo-image {
            width: 150px;
            height: 60px;
          }
        }
      `}</style>
    </footer>
  );
}