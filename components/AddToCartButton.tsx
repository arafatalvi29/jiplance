"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLanguage,
} from "@/components/LanguageProvider";

type ProductVariant = {
  id: string;
  size: string | null;
  color: string | null;
  stock: number;
  price: number | null;
  discount_price: number | null;
  image_url?: string | null;
  is_active?: boolean;
};

type CartItem = {
  id: string;
  qty: number;
  variantId?: string | null;
  size?: string | null;
  color?: string | null;
};

type AddToCartButtonProps = {
  productId: string;
  productType?: string | null;
  productStock?: number;
  variants?: ProductVariant[];
};

export default function AddToCartButton({
  productId,
  productType,
  productStock = 0,
  variants = [],
}: AddToCartButtonProps) {
  const { lang } = useLanguage();

  const [
    selectedSize,
    setSelectedSize,
  ] = useState("");

  const [
    selectedColor,
    setSelectedColor,
  ] = useState("");

  const [
    added,
    setAdded,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    cartCount,
    setCartCount,
  ] = useState(0);

  const isFashion =
    productType === "fashion";

  /* =====================================================
     CART COUNT
  ===================================================== */

  const syncCartCount = () => {
    try {
      const savedCart =
        localStorage.getItem(
          "jiplance-cart"
        );

      const parsed =
        savedCart
          ? JSON.parse(savedCart)
          : [];

      if (
        !Array.isArray(parsed)
      ) {
        setCartCount(0);
        return;
      }

      const total =
        parsed.reduce(
          (
            sum: number,
            item: CartItem
          ) =>
            sum +
            Math.max(
              Number(
                item.qty
              ) || 0,
              0
            ),
          0
        );

      setCartCount(total);
    } catch {
      setCartCount(0);
    }
  };

  useEffect(() => {
    syncCartCount();

    const handleCartUpdate =
      () => {
        syncCartCount();
      };

    const handleStorage =
      () => {
        syncCartCount();
      };

    window.addEventListener(
      "jiplance-cart-updated",
      handleCartUpdate
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "jiplance-cart-updated",
        handleCartUpdate
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  /* =====================================================
     ACTIVE VARIANTS
  ===================================================== */

  const activeVariants =
    useMemo(
      () =>
        variants.filter(
          (variant) =>
            variant.is_active !==
              false &&
            Number(
              variant.stock
            ) >= 0
        ),
      [variants]
    );

  const hasVariants =
    isFashion &&
    activeVariants.length > 0;

  /* =====================================================
     AVAILABLE SIZES
  ===================================================== */

  const sizes =
    useMemo(() => {
      return Array.from(
        new Set(
          activeVariants
            .map(
              (variant) =>
                variant.size?.trim()
            )
            .filter(
              (
                value
              ): value is string =>
                Boolean(value)
            )
        )
      );
    }, [activeVariants]);

  /* =====================================================
     AVAILABLE COLORS
  ===================================================== */

  const availableColors =
    useMemo(() => {
      const filtered =
        selectedSize
          ? activeVariants.filter(
              (variant) =>
                variant.size?.trim() ===
                selectedSize
            )
          : activeVariants;

      return Array.from(
        new Set(
          filtered
            .map(
              (variant) =>
                variant.color?.trim()
            )
            .filter(
              (
                value
              ): value is string =>
                Boolean(value)
            )
        )
      );
    }, [
      activeVariants,
      selectedSize,
    ]);

  /* =====================================================
     SELECTED VARIANT
  ===================================================== */

  const selectedVariant =
    useMemo(() => {
      if (!hasVariants) {
        return null;
      }

      return (
        activeVariants.find(
          (variant) => {
            const variantSize =
              variant.size?.trim() ||
              "";

            const variantColor =
              variant.color?.trim() ||
              "";

            const sizeMatches =
              sizes.length === 0 ||
              variantSize ===
                selectedSize;

            const colorMatches =
              availableColors.length ===
                0 ||
              variantColor ===
                selectedColor;

            return (
              sizeMatches &&
              colorMatches
            );
          }
        ) ?? null
      );
    }, [
      hasVariants,
      activeVariants,
      sizes.length,
      availableColors.length,
      selectedSize,
      selectedColor,
    ]);

  /* =====================================================
     SIZE CHANGE
  ===================================================== */

  const handleSizeChange = (
    size: string
  ) => {
    setSelectedSize(size);
    setSelectedColor("");
    setMessage("");
  };

  /* =====================================================
     ADD TO CART
  ===================================================== */

  const addToCart = () => {
    setMessage("");

    if (hasVariants) {
      if (
        sizes.length > 0 &&
        !selectedSize
      ) {
        setMessage(
          lang === "en"
            ? "Please select a Size."
            : "অনুগ্রহ করে একটি Size নির্বাচন করুন।"
        );

        return;
      }

      if (
        availableColors.length >
          0 &&
        !selectedColor
      ) {
        setMessage(
          lang === "en"
            ? "Please select a Color."
            : "অনুগ্রহ করে একটি Color নির্বাচন করুন।"
        );

        return;
      }

      if (!selectedVariant) {
        setMessage(
          lang === "en"
            ? "This Size and Color combination is not available."
            : "এই Size এবং Color combinationটি পাওয়া যাচ্ছে না।"
        );

        return;
      }

      if (
        selectedVariant.stock <=
        0
      ) {
        setMessage(
          lang === "en"
            ? "This variant is out of stock."
            : "এই ভ্যারিয়েন্টটি স্টকে নেই।"
        );

        return;
      }
    } else {
      if (
        productStock <= 0
      ) {
        setMessage(
          lang === "en"
            ? "This product is out of stock."
            : "এই পণ্যটি স্টকে নেই।"
        );

        return;
      }
    }

    let cart:
      CartItem[] = [];

    try {
      const savedCart =
        localStorage.getItem(
          "jiplance-cart"
        );

      cart =
        savedCart
          ? JSON.parse(
              savedCart
            )
          : [];

      if (
        !Array.isArray(
          cart
        )
      ) {
        cart = [];
      }
    } catch {
      cart = [];
    }

    const variantId =
      selectedVariant?.id ??
      null;

    const existingIndex =
      cart.findIndex(
        (item) =>
          item.id ===
            productId &&
          (item.variantId ??
            null) ===
            variantId
      );

    const maxStock =
      selectedVariant
        ? selectedVariant.stock
        : productStock;

    if (
      existingIndex >= 0
    ) {
      const currentQty =
        cart[
          existingIndex
        ].qty || 0;

      if (
        currentQty >=
        maxStock
      ) {
        setMessage(
          lang === "en"
            ? `Only ${maxStock} available in stock.`
            : `স্টকে মাত্র ${maxStock}টি আছে।`
        );

        return;
      }

      cart[
        existingIndex
      ] = {
        ...cart[
          existingIndex
        ],

        qty:
          currentQty + 1,
      };
    } else {
      cart.push({
        id:
          productId,

        qty:
          1,

        variantId,

        size:
          selectedVariant?.size ??
          null,

        color:
          selectedVariant?.color ??
          null,
      });
    }

    localStorage.setItem(
      "jiplance-cart",
      JSON.stringify(
        cart
      )
    );

    window.dispatchEvent(
      new Event(
        "jiplance-cart-updated"
      )
    );

    syncCartCount();

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1200);
  };

  /* =====================================================
     STOCK STATUS
  ===================================================== */

  const isOutOfStock =
    hasVariants
      ? activeVariants.every(
          (variant) =>
            variant.stock <= 0
        )
      : productStock <= 0;

  /* =====================================================
     UI
  ===================================================== */

  return (
    <>
      <div
        style={{
          display:
            "grid",

          gap:
            "14px",

          marginTop:
            "18px",
        }}
      >
        {hasVariants && (
          <>
            {sizes.length >
              0 && (
              <div>
                <label
                  htmlFor="product-size"
                  style={{
                    display:
                      "block",

                    fontWeight:
                      700,

                    marginBottom:
                      "7px",
                  }}
                >
                  Select Size
                </label>

                <select
                  id="product-size"
                  value={
                    selectedSize
                  }
                  onChange={(
                    event
                  ) =>
                    handleSizeChange(
                      event.target
                        .value
                    )
                  }
                  style={{
                    width:
                      "100%",

                    minHeight:
                      "46px",

                    padding:
                      "0 12px",

                    borderRadius:
                      "10px",

                    border:
                      "1px solid #d8d8d8",

                    background:
                      "transparent",
                  }}
                >
                  <option value="">
                    Choose size
                  </option>

                  {sizes.map(
                    (size) => (
                      <option
                        key={
                          size
                        }
                        value={
                          size
                        }
                      >
                        {size}
                      </option>
                    )
                  )}
                </select>
              </div>
            )}

            {availableColors.length >
              0 && (
              <div>
                <label
                  htmlFor="product-color"
                  style={{
                    display:
                      "block",

                    fontWeight:
                      700,

                    marginBottom:
                      "7px",
                  }}
                >
                  Select Color
                </label>

                <select
                  id="product-color"
                  value={
                    selectedColor
                  }
                  onChange={(
                    event
                  ) => {
                    setSelectedColor(
                      event.target
                        .value
                    );

                    setMessage("");
                  }}
                  disabled={
                    sizes.length >
                      0 &&
                    !selectedSize
                  }
                  style={{
                    width:
                      "100%",

                    minHeight:
                      "46px",

                    padding:
                      "0 12px",

                    borderRadius:
                      "10px",

                    border:
                      "1px solid #d8d8d8",

                    background:
                      "transparent",
                  }}
                >
                  <option value="">
                    Choose color
                  </option>

                  {availableColors.map(
                    (color) => (
                      <option
                        key={
                          color
                        }
                        value={
                          color
                        }
                      >
                        {color}
                      </option>
                    )
                  )}
                </select>
              </div>
            )}

            {selectedVariant && (
              <div
                style={{
                  padding:
                    "12px 14px",

                  border:
                    "1px solid #e5e5e5",

                  borderRadius:
                    "10px",
                }}
              >
                <strong>
                  {selectedVariant.stock >
                  0
                    ? lang ===
                      "en"
                      ? `${selectedVariant.stock} available`
                      : `স্টকে আছে: ${selectedVariant.stock}`
                    : lang ===
                        "en"
                      ? "Out of stock"
                      : "স্টকে নেই"}
                </strong>

                {(selectedVariant.discount_price !==
                  null ||
                  selectedVariant.price !==
                    null) && (
                  <div
                    style={{
                      marginTop:
                        "4px",
                    }}
                  >
                    {lang ===
                    "en"
                      ? "Variant price:"
                      : "ভ্যারিয়েন্ট মূল্য:"}{" "}
                    ৳
                    {selectedVariant.discount_price ??
                      selectedVariant.price}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {isFashion &&
          !hasVariants &&
          productStock >
            0 && (
            <div
              style={{
                padding:
                  "12px 14px",

                border:
                  "1px solid #e5e5e5",

                borderRadius:
                  "10px",
              }}
            >
              {lang === "en"
                ? "This product does not require Size or Color selection."
                : "এই পণ্যের জন্য Size বা Color নির্বাচন করার প্রয়োজন নেই।"}
            </div>
          )}

        {message && (
          <div
            role="status"
            aria-live="polite"
            style={{
              fontSize:
                "0.92rem",

              fontWeight:
                600,

              color:
                "#b33a2f",
            }}
          >
            {message}
          </div>
        )}

        <button
          className="primary-button wide"
          onClick={
            addToCart
          }
          disabled={
            added ||
            isOutOfStock
          }
          type="button"
        >
          {added
            ? lang === "en"
              ? "Added ✓"
              : "কার্টে যোগ হয়েছে ✓"
            : isOutOfStock
              ? lang === "en"
                ? "Out of Stock"
                : "স্টকে নেই"
              : lang === "en"
                ? "Add to Cart"
                : "কার্টে যোগ করুন"}
        </button>
      </div>

      {/* =================================================
          FLOATING VIEW CART
      ================================================= */}

      {cartCount > 0 && (
        <Link
          href="/cart"
          className="floating-cart-bar"
          aria-label={
            lang === "en"
              ? "View Cart"
              : "কার্ট দেখুন"
          }
        >
          <div className="floating-cart-icon">
            <span>
              🛒
            </span>

            <b>
              {cartCount}
            </b>
          </div>

          <div className="floating-cart-text">
            <strong>
              {lang === "en"
                ? "View Cart"
                : "কার্ট দেখুন"}
            </strong>

            <small>
              {cartCount}{" "}
              {lang === "en"
                ? cartCount === 1
                  ? "ITEM"
                  : "ITEMS"
                : "টি পণ্য"}
            </small>
          </div>

          <div className="floating-cart-arrow">
            →
          </div>
        </Link>
      )}

      <style jsx global>{`
        .floating-cart-bar {
          position: fixed;
          left: 50%;
          bottom: calc(
            18px +
              env(
                safe-area-inset-bottom
              )
          );
          transform: translateX(-50%);
          width: min(
            520px,
            calc(100% - 28px)
          );
          min-height: 76px;
          padding: 9px 10px 9px
            12px;
          border-radius: 999px;
          background: linear-gradient(
            135deg,
            #17203d,
            #25335e
          );
          color: white;
          display: flex;
          align-items: center;
          gap: 13px;
          z-index: 999;
          text-decoration: none;
          box-shadow:
            0 20px 45px
              rgba(
                25,
                33,
                61,
                0.28
              ),
            0 5px 14px
              rgba(
                25,
                33,
                61,
                0.14
              );
          animation:
            floatingCartEnter
            0.32s
            cubic-bezier(
              0.2,
              0.8,
              0.2,
              1
            );
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .floating-cart-bar:hover {
          transform:
            translateX(-50%)
            translateY(-2px);
          box-shadow:
            0 24px 50px
              rgba(
                25,
                33,
                61,
                0.32
              );
        }

        .floating-cart-icon {
          width: 54px;
          height: 54px;
          flex: 0 0 54px;
          border-radius: 50%;
          background: white;
          color: #17203d;
          display: grid;
          place-items: center;
          position: relative;
          font-size: 23px;
          box-shadow:
            inset 0 0 0 1px
              rgba(
                23,
                32,
                61,
                0.08
              );
        }

        .floating-cart-icon b {
          position: absolute;
          right: -3px;
          top: -3px;
          min-width: 22px;
          height: 22px;
          padding: 0 5px;
          border-radius: 999px;
          background: #ff7d72;
          color: white;
          font-size: 11px;
          display: grid;
          place-items: center;
          border: 2px solid white;
        }

        .floating-cart-text {
          min-width: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .floating-cart-text strong {
          font-size: 1.04rem;
          font-weight: 800;
          line-height: 1.2;
        }

        .floating-cart-text small {
          font-size: 0.72rem;
          font-weight: 750;
          letter-spacing: 0.07em;
          opacity: 0.78;
        }

        .floating-cart-arrow {
          width: 54px;
          height: 54px;
          flex: 0 0 54px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background:
            rgba(
              255,
              255,
              255,
              0.12
            );
          font-size: 27px;
          transition:
            background 0.2s ease,
            transform 0.2s ease;
        }

        .floating-cart-bar:hover
          .floating-cart-arrow {
          background:
            rgba(
              255,
              255,
              255,
              0.19
            );
          transform:
            translateX(2px);
        }

        @keyframes floatingCartEnter {
          from {
            opacity: 0;
            transform:
              translateX(-50%)
              translateY(24px)
              scale(0.96);
          }

          to {
            opacity: 1;
            transform:
              translateX(-50%)
              translateY(0)
              scale(1);
          }
        }

        @media (
          max-width: 600px
        ) {
          .floating-cart-bar {
            width:
              calc(100% - 24px);
            min-height: 70px;
            bottom: calc(
              12px +
                env(
                  safe-area-inset-bottom
                )
            );
          }

          .floating-cart-icon,
          .floating-cart-arrow {
            width: 50px;
            height: 50px;
            flex-basis: 50px;
          }
        }

        @media (
          prefers-reduced-motion:
            reduce
        ) {
          .floating-cart-bar {
            animation: none;
            transition: none;
          }
        }
      `}</style>
    </>
  );
}