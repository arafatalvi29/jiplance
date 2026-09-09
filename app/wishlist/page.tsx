"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WishlistButton from "@/components/WishlistButton";
import { useLanguage } from "@/components/LanguageProvider";
import { supabase } from "@/lib/supabase";

const GUEST_WISHLIST_KEY =
  "jiplance-wishlist";

type WishlistProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  discount_price: number | null;
  stock: number;
  image_url: string | null;
  product_type: string | null;
  book_section: string | null;
  fashion_section: string | null;
  category: string | null;
  is_active: boolean;
};

type WishlistRow = {
  product_id: string;
};

function getBanglaSectionLabel(
  value: string | null
) {
  if (!value) {
    return "পণ্য";
  }

  const cleanValue =
    value
      .trim()
      .toLowerCase();

  const translations: Record<
    string,
    string
  > = {
    book: "বই",
    books: "বই",

    kids: "শিশু",
    kid: "শিশু",
    children: "শিশু",
    child: "শিশু",

    "kids books":
      "শিশুদের বই",

    "kid books":
      "শিশুদের বই",

    "children books":
      "শিশুদের বই",

    "children's books":
      "শিশুদের বই",

    adult:
      "প্রাপ্তবয়স্ক",

    adults:
      "প্রাপ্তবয়স্ক",

    "adult books":
      "প্রাপ্তবয়স্কদের বই",

    sensory:
      "সেন্সরি",

    "sensory books":
      "সেন্সরি বই",

    story:
      "গল্প",

    stories:
      "গল্প",

    "story books":
      "গল্পের বই",

    educational:
      "শিক্ষামূলক",

    education:
      "শিক্ষামূলক",

    "educational books":
      "শিক্ষামূলক বই",

    activity:
      "অ্যাক্টিভিটি",

    "activity books":
      "অ্যাক্টিভিটি বই",

    coloring:
      "রঙ করার বই",

    colouring:
      "রঙ করার বই",

    fiction:
      "কল্পকাহিনি",

    "non-fiction":
      "নন-ফিকশন",

    "non fiction":
      "নন-ফিকশন",

    fashion:
      "ফ্যাশন",

    men:
      "পুরুষ",

    man:
      "পুরুষ",

    mens:
      "পুরুষ",

    "men's":
      "পুরুষ",

    women:
      "নারী",

    woman:
      "নারী",

    womens:
      "নারী",

    "women's":
      "নারী",

    boys:
      "ছেলেদের",

    boy:
      "ছেলেদের",

    girls:
      "মেয়েদের",

    girl:
      "মেয়েদের",

    accessories:
      "অ্যাক্সেসরিজ",

    accessory:
      "অ্যাক্সেসরিজ",

    "t-shirt":
      "টি-শার্ট",

    "t-shirts":
      "টি-শার্ট",

    tshirt:
      "টি-শার্ট",

    tshirts:
      "টি-শার্ট",

    tee:
      "টি-শার্ট",

    polo:
      "পোলো শার্ট",

    "polo shirt":
      "পোলো শার্ট",

    "polo shirts":
      "পোলো শার্ট",

    shirt:
      "শার্ট",

    shirts:
      "শার্ট",

    panjabi:
      "পাঞ্জাবি",

    punjabi:
      "পাঞ্জাবি",

    jeans:
      "জিন্স",

    jean:
      "জিন্স",

    pant:
      "প্যান্ট",

    pants:
      "প্যান্ট",

    trouser:
      "প্যান্ট",

    trousers:
      "প্যান্ট",

    short:
      "শর্টস",

    shorts:
      "শর্টস",

    hoodie:
      "হুডি",

    hoodies:
      "হুডি",

    jacket:
      "জ্যাকেট",

    jackets:
      "জ্যাকেট",

    sweater:
      "সোয়েটার",

    sweaters:
      "সোয়েটার",

    dress:
      "ড্রেস",

    dresses:
      "ড্রেস",

    kurti:
      "কুর্তি",

    kurtis:
      "কুর্তি",

    saree:
      "শাড়ি",

    sarees:
      "শাড়ি",

    skirt:
      "স্কার্ট",

    skirts:
      "স্কার্ট",

    top:
      "টপ",

    tops:
      "টপ",

    bottom:
      "বটম",

    bottoms:
      "বটম",

    shoe:
      "জুতা",

    shoes:
      "জুতা",

    sandal:
      "স্যান্ডেল",

    sandals:
      "স্যান্ডেল",

    bag:
      "ব্যাগ",

    bags:
      "ব্যাগ",

    cap:
      "ক্যাপ",

    caps:
      "ক্যাপ",

    belt:
      "বেল্ট",

    belts:
      "বেল্ট",

    watch:
      "ঘড়ি",

    watches:
      "ঘড়ি",

    wallet:
      "ওয়ালেট",

    wallets:
      "ওয়ালেট",
  };

  return (
    translations[
      cleanValue
    ] ?? value
  );
}

export default function WishlistPage() {
  const { lang } =
    useLanguage();

  const [
    products,
    setProducts,
  ] =
    useState<
      WishlistProduct[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    isLoggedIn,
    setIsLoggedIn,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const getGuestWishlist = () => {
    if (
      typeof window ===
      "undefined"
    ) {
      return [] as string[];
    }

    try {
      const stored =
        localStorage.getItem(
          GUEST_WISHLIST_KEY
        );

      if (!stored) {
        return [];
      }

      const parsed =
        JSON.parse(
          stored
        );

      if (
        !Array.isArray(
          parsed
        )
      ) {
        return [];
      }

      return parsed.filter(
        (
          item
        ): item is string =>
          typeof item ===
          "string"
      );
    } catch {
      return [];
    }
  };

  const loadProductsByIds =
    useCallback(
      async (
        productIds:
          string[]
      ) => {
        if (!supabase) {
          setProducts(
            []
          );

          return;
        }

        const uniqueIds =
          [
            ...new Set(
              productIds
            ),
          ];

        if (
          uniqueIds.length ===
          0
        ) {
          setProducts(
            []
          );

          return;
        }

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "products"
            )
            .select(
              `
              id,
              name,
              slug,
              price,
              discount_price,
              stock,
              image_url,
              product_type,
              book_section,
              fashion_section,
              category,
              is_active
              `
            )
            .in(
              "id",
              uniqueIds
            )
            .eq(
              "is_active",
              true
            );

        if (error) {
          console.error(
            "Wishlist products error:",
            error.message
          );

          setProducts(
            []
          );

          setMessage(
            lang ===
            "en"
              ? "Could not load your wishlist."
              : "আপনার উইশলিস্ট লোড করা যায়নি।"
          );

          return;
        }

        const loaded =
          (
            data ?? []
          ) as WishlistProduct[];

        /*
          Keep products in roughly the same
          order as the wishlist IDs.
        */
        const productMap =
          new Map(
            loaded.map(
              (
                product
              ) => [
                product.id,
                product,
              ]
            )
          );

        const orderedProducts =
          uniqueIds
            .map(
              (
                id
              ) =>
                productMap.get(
                  id
                )
            )
            .filter(
              (
                product
              ): product is WishlistProduct =>
                Boolean(
                  product
                )
            );

        setProducts(
          orderedProducts
        );
      },
      [lang]
    );

  const loadWishlist =
    useCallback(
      async () => {
        setLoading(
          true
        );

        setMessage(
          ""
        );

        if (!supabase) {
          setProducts(
            []
          );

          setLoading(
            false
          );

          return;
        }

        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession();

        /*
          GUEST WISHLIST
          ----------------
          Guest products come from
          localStorage.
        */
        if (
          !session?.user
        ) {
          setIsLoggedIn(
            false
          );

          const guestIds =
            getGuestWishlist();

          await loadProductsByIds(
            guestIds
          );

          setLoading(
            false
          );

          return;
        }

        /*
          LOGGED-IN WISHLIST
          ------------------
          Account products come from
          Supabase.
        */
        setIsLoggedIn(
          true
        );

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "wishlists"
            )
            .select(
              "product_id"
            )
            .eq(
              "user_id",
              session.user.id
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            );

        if (error) {
          console.error(
            "Wishlist load error:",
            error.message
          );

          setProducts(
            []
          );

          setMessage(
            lang ===
            "en"
              ? "Could not load your wishlist."
              : "আপনার উইশলিস্ট লোড করা যায়নি।"
          );

          setLoading(
            false
          );

          return;
        }

        const rows =
          (
            data ?? []
          ) as WishlistRow[];

        await loadProductsByIds(
          rows.map(
            (
              row
            ) =>
              row.product_id
          )
        );

        setLoading(
          false
        );
      },
      [
        loadProductsByIds,
        lang,
      ]
    );

  useEffect(() => {
    loadWishlist();

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
          loadWishlist();
        }
      );

    /*
      WishlistButton changes localStorage
      for guests, but localStorage does not
      automatically fire a storage event
      in the same tab.

      So when this page becomes active
      again, refresh the wishlist.
    */
    const handleFocus =
      () => {
        loadWishlist();
      };

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      subscription.unsubscribe();

      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, [
    loadWishlist,
  ]);

  const handleRemove =
    async (
      productId:
        string
    ) => {
      if (!supabase) {
        return;
      }

      setMessage(
        ""
      );

      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession();

      /*
        Guest remove
      */
      if (
        !session?.user
      ) {
        const current =
          getGuestWishlist();

        const next =
          current.filter(
            (
              id
            ) =>
              id !==
              productId
          );

        localStorage.setItem(
          GUEST_WISHLIST_KEY,
          JSON.stringify(
            next
          )
        );

        setProducts(
          (
            currentProducts
          ) =>
            currentProducts.filter(
              (
                product
              ) =>
                product.id !==
                productId
            )
        );

        return;
      }

      /*
        Logged-in remove
      */
      const {
        error,
      } =
        await supabase
          .from(
            "wishlists"
          )
          .delete()
          .eq(
            "user_id",
            session.user.id
          )
          .eq(
            "product_id",
            productId
          );

      if (error) {
        console.error(
          "Wishlist remove error:",
          error.message
        );

        setMessage(
          lang ===
          "en"
            ? "Could not remove this product."
            : "এই পণ্যটি উইশলিস্ট থেকে সরানো যায়নি।"
        );

        return;
      }

      setProducts(
        (
          currentProducts
        ) =>
          currentProducts.filter(
            (
              product
            ) =>
              product.id !==
              productId
          )
      );
    };

  return (
    <>
      <Header />

      <main className="wishlist-shell">
        <section className="wishlist-hero">
          <div>
            <div className="wishlist-eyebrow">
              JIPLANCE
            </div>

            <h1>
              {lang ===
              "en"
                ? "My Wishlist"
                : "আমার উইশলিস্ট"}
            </h1>

            <p>
              {lang ===
              "en"
                ? "Keep your favourite books and fashion products in one place."
                : "আপনার পছন্দের বই ও ফ্যাশন পণ্য এক জায়গায় সংরক্ষণ করুন।"}
            </p>
          </div>

          {!loading && (
            <div className="wishlist-count">
              <strong>
                {
                  products.length
                }
              </strong>

              <span>
                {lang ===
                "en"
                  ? products.length ===
                    1
                    ? "Saved item"
                    : "Saved items"
                  : "সংরক্ষিত পণ্য"}
              </span>
            </div>
          )}
        </section>

        {!loading && (
          <div className="wishlist-mode">
            <span>
              {isLoggedIn
                ? lang ===
                  "en"
                  ? "Account Wishlist"
                  : "অ্যাকাউন্ট উইশলিস্ট"
                : lang ===
                  "en"
                ? "Guest Wishlist"
                : "গেস্ট উইশলিস্ট"}
            </span>

            <small>
              {isLoggedIn
                ? lang ===
                  "en"
                  ? "Your saved products are connected to your JIPLANCE account."
                  : "আপনার সংরক্ষিত পণ্যগুলো আপনার JIPLANCE অ্যাকাউন্টের সঙ্গে যুক্ত।"
                : lang ===
                  "en"
                ? "Guest wishlist is saved on this browser."
                : "গেস্ট উইশলিস্ট এই ব্রাউজারে সংরক্ষিত থাকে।"}
            </small>
          </div>
        )}

        {message && (
          <div className="wishlist-message">
            {
              message
            }
          </div>
        )}

        {loading ? (
          <section className="wishlist-loading">
            <div className="wishlist-loader" />

            <p>
              {lang ===
              "en"
                ? "Loading your wishlist..."
                : "আপনার উইশলিস্ট লোড হচ্ছে..."}
            </p>
          </section>
        ) : products.length ===
          0 ? (
          <section className="wishlist-empty">
            <div className="wishlist-empty-heart">
              ♡
            </div>

            <h2>
              {lang ===
              "en"
                ? "Your wishlist is empty"
                : "আপনার উইশলিস্ট খালি"}
            </h2>

            <p>
              {lang ===
              "en"
                ? "Save products you love and they will appear here."
                : "আপনার পছন্দের পণ্য সংরক্ষণ করুন, সেগুলো এখানে দেখা যাবে।"}
            </p>

            <div className="wishlist-empty-actions">
              <Link
                href="/shop"
                className="wishlist-primary"
              >
                {lang ===
                "en"
                  ? "Explore Books"
                  : "বই দেখুন"}

                <span>
                  →
                </span>
              </Link>

              <Link
                href="/fashion"
                className="wishlist-secondary"
              >
                {lang ===
                "en"
                  ? "Explore Fashion"
                  : "ফ্যাশন দেখুন"}
              </Link>
            </div>
          </section>
        ) : (
          <section className="wishlist-grid">
            {products.map(
              (
                product
              ) => {
                const sellingPrice =
                  product.discount_price ??
                  product.price;

                const hasDiscount =
                  product.discount_price !==
                    null &&
                  product.discount_price <
                    product.price;

                const rawSectionLabel =
                  product.product_type ===
                  "fashion"
                    ? product.fashion_section ||
                      product.category ||
                      "Fashion"
                    : product.book_section ||
                      product.category ||
                      "Books";

                const sectionLabel =
                  lang ===
                  "en"
                    ? rawSectionLabel
                    : getBanglaSectionLabel(
                        rawSectionLabel
                      );

                return (
                  <article
                    key={
                      product.id
                    }
                    className="wishlist-card"
                  >
                    <div className="wishlist-image">
                      {/*
                        Existing reusable
                        WishlistButton remains
                        the source of truth for
                        heart state.
                      */}
                      <WishlistButton
                        productId={
                          product.id
                        }
                      />

                      <Link
                        href={`/product/${product.slug}`}
                        className="wishlist-image-link"
                      >
                        {product.image_url ? (
                          <img
                            src={
                              product.image_url
                            }
                            alt={
                              product.name
                            }
                          />
                        ) : (
                          <div className="wishlist-placeholder">
                            {product.product_type ===
                            "fashion"
                              ? "👕"
                              : "📚"}
                          </div>
                        )}
                      </Link>
                    </div>

                    <div className="wishlist-card-copy">
                      <div className="wishlist-card-section">
                        {
                          sectionLabel
                        }
                      </div>

                      <Link
                        href={`/product/${product.slug}`}
                        className="wishlist-product-name"
                      >
                        {
                          product.name
                        }
                      </Link>

                      <div className="wishlist-price">
                        <strong>
                          ৳
                          {
                            sellingPrice
                          }
                        </strong>

                        {hasDiscount && (
                          <del>
                            ৳
                            {
                              product.price
                            }
                          </del>
                        )}
                      </div>

                      <div className="wishlist-card-actions">
                        <Link
                          href={`/product/${product.slug}`}
                          className="wishlist-view"
                        >
                          {lang ===
                          "en"
                            ? "View Product"
                            : "পণ্য দেখুন"}

                          <span>
                            →
                          </span>
                        </Link>

                        <button
                          type="button"
                          className="wishlist-remove"
                          onClick={() =>
                            handleRemove(
                              product.id
                            )
                          }
                        >
                          {lang ===
                          "en"
                            ? "Remove"
                            : "সরান"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </section>
        )}
      </main>

      <Footer />

      <style jsx global>{`
        .wishlist-shell {
          width: min(
            1180px,
            calc(100% - 32px)
          );
          margin: 0 auto;
          padding: 72px 0 96px;
        }

        .wishlist-hero {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 30px;
          padding-bottom: 30px;
          border-bottom:
            1px solid
            rgba(
              128,
              128,
              128,
              0.2
            );
        }

        .wishlist-eyebrow,
        .wishlist-card-section {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          opacity: 0.6;
        }

        .wishlist-hero h1 {
          margin: 8px 0 10px;
          font-size: clamp(
            38px,
            6vw,
            68px
          );
          line-height: 1;
        }

        .wishlist-hero p {
          margin: 0;
          max-width: 600px;
          line-height: 1.7;
          opacity: 0.68;
        }

        .wishlist-count {
          min-width: 120px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .wishlist-count strong {
          font-size: 34px;
          line-height: 1;
        }

        .wishlist-count span {
          margin-top: 6px;
          font-size: 12px;
          opacity: 0.6;
        }

        .wishlist-mode {
          margin: 18px 0 30px;
          padding: 14px 16px;
          border-radius: 14px;
          background:
            rgba(
              128,
              128,
              128,
              0.07
            );
          display: flex;
          align-items: center;
          justify-content:
            space-between;
          gap: 18px;
        }

        .wishlist-mode span {
          font-weight: 800;
        }

        .wishlist-mode small {
          opacity: 0.62;
          text-align: right;
        }

        .wishlist-message {
          margin: 18px 0;
          padding: 14px 16px;
          border:
            1px solid
            rgba(
              128,
              128,
              128,
              0.25
            );
          border-radius: 14px;
        }

        .wishlist-grid {
          display: grid;
          grid-template-columns:
            repeat(
              4,
              minmax(
                0,
                1fr
              )
            );
          gap: 18px;
        }

        .wishlist-card {
          overflow: hidden;
          border:
            1px solid
            rgba(
              128,
              128,
              128,
              0.2
            );
          border-radius: 22px;
          display: flex;
          flex-direction: column;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .wishlist-card:hover {
          transform:
            translateY(-4px);
          box-shadow:
            0 20px 55px
            rgba(
              0,
              0,
              0,
              0.08
            );
        }

        .wishlist-image {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          background:
            rgba(
              128,
              128,
              128,
              0.06
            );
        }

        .wishlist-image-link {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wishlist-image img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: contain;
          transition:
            transform
            0.25s ease;
        }

        .wishlist-card:hover
          .wishlist-image img {
          transform:
            scale(1.025);
        }

        .wishlist-placeholder {
          font-size: 54px;
        }

        .wishlist-card-copy {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }

        .wishlist-product-name {
          color: inherit;
          text-decoration: none;
          font-size: 18px;
          line-height: 1.35;
          font-weight: 800;
        }

        .wishlist-price {
          display: flex;
          align-items: center;
          gap: 9px;
          flex-wrap: wrap;
        }

        .wishlist-price strong {
          font-size: 18px;
        }

        .wishlist-price del {
          opacity: 0.5;
        }

        .wishlist-card-actions {
          margin-top: auto;
          padding-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .wishlist-view,
        .wishlist-remove,
        .wishlist-primary,
        .wishlist-secondary {
          min-height: 43px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 0 16px;
          font: inherit;
          font-weight: 750;
          text-decoration: none;
          cursor: pointer;
          transition:
            transform
              0.18s ease,
            opacity
              0.18s ease;
        }

        .wishlist-view,
        .wishlist-primary {
          border:
            1px solid
            #1f294d;
          background:
            #1f294d;
          color:
            #ffffff;
        }

        .wishlist-remove,
        .wishlist-secondary {
          border:
            1px solid
            rgba(
              128,
              128,
              128,
              0.35
            );
          background:
            transparent;
          color:
            inherit;
        }

        .wishlist-view:hover,
        .wishlist-remove:hover,
        .wishlist-primary:hover,
        .wishlist-secondary:hover {
          transform:
            translateY(-2px);
        }

        .wishlist-loading,
        .wishlist-empty {
          min-height: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding:
            40px 20px;
        }

        .wishlist-loading p,
        .wishlist-empty p {
          opacity: 0.65;
        }

        .wishlist-empty h2 {
          margin:
            12px 0 4px;
          font-size: 30px;
        }

        .wishlist-empty-heart {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          border:
            1px solid
            rgba(
              128,
              128,
              128,
              0.3
            );
          font-size: 36px;
        }

        .wishlist-empty-actions {
          display: flex;
          gap: 10px;
          margin-top: 18px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .wishlist-loader {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border:
            3px solid
            rgba(
              128,
              128,
              128,
              0.2
            );
          border-top-color:
            currentColor;
          animation:
            wishlistSpin
            0.8s linear
            infinite;
        }

        @keyframes wishlistSpin {
          to {
            transform:
              rotate(
                360deg
              );
          }
        }

        @media (
          max-width:
            1000px
        ) {
          .wishlist-grid {
            grid-template-columns:
              repeat(
                3,
                minmax(
                  0,
                  1fr
                )
              );
          }
        }

        @media (
          max-width:
            760px
        ) {
          .wishlist-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              );
          }

          .wishlist-hero {
            align-items:
              flex-start;
          }

          .wishlist-mode {
            align-items:
              flex-start;
            flex-direction:
              column;
          }

          .wishlist-mode small {
            text-align:
              left;
          }
        }

        @media (
          max-width:
            520px
        ) {
          .wishlist-shell {
            width: min(
              100% - 22px,
              1180px
            );
            padding:
              36px 0 64px;
          }

          .wishlist-hero {
            flex-direction:
              column;
          }

          .wishlist-count {
            align-items:
              flex-start;
          }

          .wishlist-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              );
            gap: 10px;
          }

          .wishlist-card {
            border-radius:
              16px;
          }

          .wishlist-card-copy {
            padding:
              13px;
          }

          .wishlist-product-name {
            font-size:
              15px;
          }

          .wishlist-card-section {
            font-size:
              9px;
          }

          .wishlist-price strong {
            font-size:
              16px;
          }

          .wishlist-view,
          .wishlist-remove {
            min-height:
              38px;
            padding:
              0 10px;
            font-size:
              12px;
          }
        }
      `}</style>
    </>
  );
}