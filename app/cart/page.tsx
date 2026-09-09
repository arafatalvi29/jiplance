"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

import {
  useLanguage,
} from "@/components/LanguageProvider";

import {
  supabase,
} from "@/lib/supabase";

import {
  siteConfig,
} from "@/lib/config";

type CartItem = {
  id: string;
  qty: number;
  variantId?: string | null;
  size?: string | null;
  color?: string | null;
};

type Product = {
  id: string;
  name: string;
  category: string | null;
  product_type: string | null;
  book_section: string | null;
  age_min: number | null;
  age_max: number | null;
  price: number;
  discount_price: number | null;
  stock: number;
  image_url: string | null;
};

type Variant = {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  stock: number;
  price: number | null;
  discount_price: number | null;
  image_url: string | null;
  is_active: boolean;
};

type CartLine = {
  key: string;
  cartItem: CartItem;
  qty: number;
  maxStock: number;
  product: Product;
  variant: Variant | null;
  price: number;
  size: string | null;
  color: string | null;
};

/* =====================================================
   CATEGORY BANGLA LABEL
===================================================== */

function getCategoryBanglaLabel(
  value: string | null
) {
  if (!value) {
    return "পণ্য";
  }

  const text =
    value
      .trim()
      .toLowerCase();

  const translations: Record<
    string,
    string
  > = {
    sensory: "সেন্সরি",
    story: "গল্প",
    educational: "শিক্ষামূলক",
    activity: "অ্যাক্টিভিটি",
    coloring: "রঙ করার বই",

    fiction: "কল্পকাহিনি",
    "non-fiction": "নন-ফিকশন",
    "non fiction": "নন-ফিকশন",

    men: "পুরুষ",
    women: "নারী",
    kids: "শিশু",
    accessories: "অ্যাক্সেসরিজ",

    books: "বই",
    fashion: "ফ্যাশন",
  };

  return (
    translations[text] ??
    value
  );
}

/* =====================================================
   CART PAGE
===================================================== */

export default function CartPage() {
  const {
    lang,
  } = useLanguage();

  const [
    cart,
    setCart,
  ] =
    useState<CartItem[]>([]);

  const [
    zone,
    setZone,
  ] =
    useState<
      "dhaka" | "outsideDhaka"
    >("dhaka");

  const [
    products,
    setProducts,
  ] =
    useState<Product[]>([]);

  const [
    variants,
    setVariants,
  ] =
    useState<Variant[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  /* ===================================================
     LOAD CART FROM LOCAL STORAGE
  =================================================== */

  useEffect(() => {
    try {
      const savedCart =
        localStorage.getItem(
          "jiplance-cart"
        );

      const parsed =
        savedCart
          ? JSON.parse(
              savedCart
            )
          : [];

      setCart(
        Array.isArray(
          parsed
        )
          ? parsed
          : []
      );
    } catch {
      setCart([]);
    }
  }, []);

  /* ===================================================
     LOAD PRODUCTS + VARIANTS
  =================================================== */

  useEffect(() => {
    const loadCartData =
      async () => {
        if (!supabase) {
          setLoading(
            false
          );

          return;
        }

        if (
          cart.length ===
          0
        ) {
          setProducts(
            []
          );

          setVariants(
            []
          );

          setLoading(
            false
          );

          return;
        }

        setLoading(
          true
        );

        const productIds =
          Array.from(
            new Set(
              cart.map(
                (item) =>
                  item.id
              )
            )
          );

        const variantIds =
          Array.from(
            new Set(
              cart
                .map(
                  (item) =>
                    item.variantId
                )
                .filter(
                  (
                    value
                  ): value is string =>
                    typeof value ===
                      "string" &&
                    value.length >
                      0
                )
            )
          );

        /* =============================================
           PRODUCTS
        ============================================= */

        const {
          data:
            productData,

          error:
            productError,
        } =
          await supabase
            .from(
              "products"
            )
            .select(
              `
              id,
              name,
              category,
              product_type,
              book_section,
              age_min,
              age_max,
              price,
              discount_price,
              stock,
              image_url
              `
            )
            .in(
              "id",
              productIds
            )
            .eq(
              "is_active",
              true
            );

        if (
          !productError &&
          productData
        ) {
          setProducts(
            productData as
              Product[]
          );
        } else {
          setProducts(
            []
          );
        }

        /* =============================================
           VARIANTS
        ============================================= */

        if (
          variantIds.length >
          0
        ) {
          const {
            data:
              variantData,

            error:
              variantError,
          } =
            await supabase
              .from(
                "product_variants"
              )
              .select(
                `
                id,
                product_id,
                size,
                color,
                stock,
                price,
                discount_price,
                image_url,
                is_active
                `
              )
              .in(
                "id",
                variantIds
              );

          if (
            !variantError &&
            variantData
          ) {
            setVariants(
              variantData as
                Variant[]
            );
          } else {
            setVariants(
              []
            );
          }
        } else {
          setVariants(
            []
          );
        }

        setLoading(
          false
        );
      };

    loadCartData();
  }, [cart]);

  /* ===================================================
     CART LINES
  =================================================== */

  const lines =
    useMemo<
      CartLine[]
    >(() => {
      return cart
        .map(
          (
            item
          ) => {
            const product =
              products.find(
                (
                  entry
                ) =>
                  entry.id ===
                  item.id
              );

            if (
              !product
            ) {
              return null;
            }

            const variant =
              item.variantId
                ? variants.find(
                    (
                      entry
                    ) =>
                      entry.id ===
                      item.variantId
                  ) ??
                  null
                : null;

            /*
             * Fashion cart item with saved variant
             * must still have a valid active variant.
             */
            if (
              item.variantId &&
              (
                !variant ||
                !variant.is_active ||
                variant.product_id !==
                  product.id
              )
            ) {
              return null;
            }

            const price =
              variant?.discount_price ??
              variant?.price ??
              product.discount_price ??
              product.price;

            const maxStock =
              variant
                ? Math.max(
                    0,
                    variant.stock
                  )
                : Math.max(
                    0,
                    product.stock
                  );

            return {
              key:
                `${product.id}:${variant?.id ?? "base"}`,

              cartItem:
                item,

              qty:
                item.qty,

              maxStock,

              product,

              variant,

              price,

              size:
                variant?.size ??
                item.size ??
                null,

              color:
                variant?.color ??
                item.color ??
                null,
            };
          }
        )
        .filter(
          (
            line
          ): line is CartLine =>
            line !== null
        );
    }, [
      cart,
      products,
      variants,
    ]);

  /* ===================================================
     TOTALS
  =================================================== */

  const subtotal =
    useMemo(() => {
      return lines.reduce(
        (
          sum,
          line
        ) =>
          sum +
          line.price *
            line.qty,
        0
      );
    }, [lines]);

  const shipping =
    siteConfig.delivery[
      zone
    ];

  const total =
    subtotal +
    (
      lines.length
        ? shipping
        : 0
    );

  /* ===================================================
     SAVE CART
  =================================================== */

  const saveCart = (
    next: CartItem[]
  ) => {
    setCart(
      next
    );

    localStorage.setItem(
      "jiplance-cart",
      JSON.stringify(
        next
      )
    );

    window.dispatchEvent(
      new Event(
        "jiplance-cart-updated"
      )
    );
  };

  /* ===================================================
     QUANTITY
  =================================================== */

  const updateQty = (
    target: CartItem,
    requestedQty: number,
    maxStock: number
  ) => {
    const safeQty =
      Math.min(
        Math.max(
          0,
          requestedQty
        ),
        maxStock
      );

    const next =
      cart
        .map(
          (
            item
          ) => {
            const sameLine =
              item.id ===
                target.id &&
              (
                item.variantId ??
                null
              ) ===
                (
                  target.variantId ??
                  null
                );

            if (
              !sameLine
            ) {
              return item;
            }

            return {
              ...item,

              qty:
                safeQty,
            };
          }
        )
        .filter(
          (item) =>
            item.qty >
            0
        );

    saveCart(
      next
    );
  };

  /* ===================================================
     REMOVE LINE
  =================================================== */

  const removeLine = (
    target: CartItem
  ) => {
    const next =
      cart.filter(
        (
          item
        ) => {
          return !(
            item.id ===
              target.id &&
            (
              item.variantId ??
              null
            ) ===
              (
                target.variantId ??
                null
              )
          );
        }
      );

    saveCart(
      next
    );
  };

  /* ===================================================
     PRODUCT META
  =================================================== */

  const getProductMeta = (
    line: CartLine
  ) => {
    const categoryEnglish =
      line.product.category ??
      (
        line.product.product_type ===
        "fashion"
          ? "Fashion"
          : "Book"
      );

    const categoryBangla =
      getCategoryBanglaLabel(
        line.product.category
      );

    /* =============================================
       FASHION
       Size / Color intentionally stay English
    ============================================= */

    if (
      line.product.product_type ===
      "fashion"
    ) {
      const details = [
        lang === "en"
          ? categoryEnglish
          : categoryBangla,

        line.size
          ? `Size ${line.size}`
          : null,

        line.color
          ? `Color ${line.color}`
          : null,
      ].filter(Boolean);

      return details.join(
        " • "
      );
    }

    /* =============================================
       ADULT BOOK
    ============================================= */

    if (
      line.product.book_section ===
      "adult"
    ) {
      return lang === "en"
        ? `${
            line.product.category ??
            "Book"
          } • Adult`
        : `${categoryBangla} • প্রাপ্তবয়স্ক`;
    }

    /* =============================================
       KIDS BOOK AGE
    ============================================= */

    if (
      line.product.age_min !==
        null &&
      line.product.age_max !==
        null
    ) {
      return lang === "en"
        ? `${
            line.product.category ??
            "Book"
          } • Age ${
            line.product.age_min
          }–${
            line.product.age_max
          }`
        : `${categoryBangla} • বয়স ${
            line.product.age_min
          }–${
            line.product.age_max
          }`;
    }

    return lang === "en"
      ? (
          line.product.category ??
          "Book"
        )
      : categoryBangla;
  };

  /* ===================================================
     UI
  =================================================== */

  return (
    <>
      <Header />

      <main className="section-shell page-space">

        {/* ===============================================
            HEADING
        =============================================== */}

        <div className="shop-heading">
          <div>
            <div className="eyebrow">
              {lang === "en"
                ? "YOUR BAG"
                : "আপনার ব্যাগ"}
            </div>

            <h1>
              {lang === "en"
                ? "Cart"
                : "কার্ট"}
            </h1>
          </div>
        </div>

        <div className="cart-layout">

          {/* =============================================
              CART ITEMS
          ============================================= */}

          <section className="cart-list">

            {/* LOADING */}

            {loading && (
              <div className="empty-box">
                {lang === "en"
                  ? "Loading cart..."
                  : "কার্ট লোড হচ্ছে..."}
              </div>
            )}

            {/* EMPTY */}

            {!loading &&
              lines.length ===
                0 && (
                <div className="empty-box">
                  {lang ===
                  "en"
                    ? "Your cart is empty."
                    : "আপনার কার্ট খালি।"}
                </div>
              )}

            {/* ITEMS */}

            {!loading &&
              lines.map(
                (
                  line
                ) => (
                  <article
                    className="cart-item"
                    key={
                      line.key
                    }
                  >
                    {/* IMAGE */}

                    <div className="cart-emoji">
                      {line.variant
                        ?.image_url ||
                      line.product
                        .image_url ? (
                        <img
                          src={
                            line.variant
                              ?.image_url ??
                            line
                              .product
                              .image_url ??
                            ""
                          }
                          alt={
                            line
                              .product
                              .name
                          }
                          style={{
                            width:
                              "64px",

                            height:
                              "64px",

                            objectFit:
                              "contain",

                            borderRadius:
                              "8px",
                          }}
                        />
                      ) : (
                        <span>
                          {line
                            .product
                            .product_type ===
                          "fashion"
                            ? "👕"
                            : "📚"}
                        </span>
                      )}
                    </div>

                    {/* PRODUCT INFO */}

                    <div className="cart-grow">
                      <strong>
                        {
                          line
                            .product
                            .name
                        }
                      </strong>

                      <small>
                        {getProductMeta(
                          line
                        )}
                      </small>

                      {/* PRICE EACH */}

                      <small
                        style={{
                          display:
                            "block",

                          marginTop:
                            "4px",
                        }}
                      >
                        ৳
                        {
                          line.price
                        }{" "}

                        {lang ===
                        "en"
                          ? "each"
                          : "প্রতি পিস"}
                      </small>

                      {/* STOCK */}

                      {line.maxStock >
                      0 ? (
                        <small
                          style={{
                            display:
                              "block",

                            marginTop:
                              "4px",
                          }}
                        >
                          {lang ===
                          "en"
                            ? `${line.maxStock} in stock`
                            : `স্টকে আছে: ${line.maxStock}`}
                        </small>
                      ) : (
                        <small
                          style={{
                            display:
                              "block",

                            marginTop:
                              "4px",
                          }}
                        >
                          {lang ===
                          "en"
                            ? "Out of stock"
                            : "স্টকে নেই"}
                        </small>
                      )}

                      {/* QUANTITY */}

                      <div className="qty-row">
                        <button
                          type="button"
                          aria-label={
                            lang ===
                            "en"
                              ? "Decrease quantity"
                              : "পরিমাণ কমান"
                          }
                          onClick={() =>
                            updateQty(
                              line.cartItem,
                              line.qty -
                                1,
                              line.maxStock
                            )
                          }
                        >
                          −
                        </button>

                        <span>
                          {
                            line.qty
                          }
                        </span>

                        <button
                          type="button"
                          aria-label={
                            lang ===
                            "en"
                              ? "Increase quantity"
                              : "পরিমাণ বাড়ান"
                          }
                          disabled={
                            line.qty >=
                            line.maxStock
                          }
                          onClick={() =>
                            updateQty(
                              line.cartItem,
                              line.qty +
                                1,
                              line.maxStock
                            )
                          }
                        >
                          +
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            removeLine(
                              line.cartItem
                            )
                          }
                          style={{
                            marginLeft:
                              "8px",
                          }}
                        >
                          {lang ===
                          "en"
                            ? "Remove"
                            : "মুছুন"}
                        </button>
                      </div>
                    </div>

                    {/* LINE TOTAL */}

                    <strong>
                      ৳
                      {line.price *
                        line.qty}
                    </strong>
                  </article>
                )
              )}
          </section>

          {/* =============================================
              ORDER SUMMARY
          ============================================= */}

          <aside className="order-summary">
            <h3>
              {lang === "en"
                ? "Order Summary"
                : "অর্ডার সারাংশ"}
            </h3>

            <label>
              {lang === "en"
                ? "Delivery area"
                : "ডেলিভারি এলাকা"}
            </label>

            <select
              value={
                zone
              }
              onChange={(
                event
              ) =>
                setZone(
                  event.target
                    .value as
                    typeof zone
                )
              }
            >
              <option value="dhaka">
                {lang ===
                "en"
                  ? "Dhaka"
                  : "ঢাকা"}{" "}
                — ৳
                {
                  siteConfig
                    .delivery
                    .dhaka
                }
              </option>

              <option value="outsideDhaka">
                {lang ===
                "en"
                  ? "Outside Dhaka"
                  : "ঢাকার বাইরে"}{" "}
                — ৳
                {
                  siteConfig
                    .delivery
                    .outsideDhaka
                }
              </option>
            </select>

            {/* SUBTOTAL */}

            <div>
              <span>
                {lang ===
                "en"
                  ? "Subtotal"
                  : "পণ্যের মোট"}
              </span>

              <strong>
                ৳
                {
                  subtotal
                }
              </strong>
            </div>

            {/* DELIVERY */}

            <div>
              <span>
                {lang ===
                "en"
                  ? "Delivery"
                  : "ডেলিভারি"}
              </span>

              <strong>
                ৳
                {lines.length
                  ? shipping
                  : 0}
              </strong>
            </div>

            {/* TOTAL */}

            <div className="summary-total">
              <span>
                {lang ===
                "en"
                  ? "Total"
                  : "সর্বমোট"}
              </span>

              <strong>
                ৳
                {
                  total
                }
              </strong>
            </div>

            {/* CHECKOUT */}

            {lines.length >
            0 ? (
              <a
                className="primary-button wide"
                href="/checkout"
              >
                {lang ===
                "en"
                  ? "Checkout"
                  : "চেকআউট করুন"}
              </a>
            ) : (
              <button
                className="primary-button wide"
                type="button"
                disabled
              >
                {lang ===
                "en"
                  ? "Checkout"
                  : "চেকআউট করুন"}
              </button>
            )}
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}