"use client";

import {
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
  const {
    lang,
  } = useLanguage();

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

  const isFashion =
    productType === "fashion";

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
     Database driven — no hardcoded sizes
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

    /*
     * Changing Size resets Color
     * because available colors may change.
     */
    setSelectedColor("");

    setMessage("");
  };

  /* =====================================================
     ADD TO CART
  ===================================================== */

  const addToCart = () => {
    setMessage("");

    /* ===================================================
       VARIANT VALIDATION
    =================================================== */

    if (hasVariants) {
      if (
        sizes.length >
          0 &&
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
        productStock <=
        0
      ) {
        setMessage(
          lang === "en"
            ? "This product is out of stock."
            : "এই পণ্যটি স্টকে নেই।"
        );

        return;
      }
    }

    /* ===================================================
       READ CART
    =================================================== */

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

    /* ===================================================
       VARIANT ID
    =================================================== */

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

    /* ===================================================
       UPDATE EXISTING ITEM
    =================================================== */

    if (
      existingIndex >=
      0
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
          currentQty +
          1,
      };
    } else {
      /* =================================================
         ADD NEW ITEM
      ================================================= */

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

    /* ===================================================
       SAVE CART
    =================================================== */

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

    /* ===================================================
       SUCCESS ANIMATION
    =================================================== */

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1200);
  };

  /* =====================================================
     TOTAL STOCK STATUS
  ===================================================== */

  const isOutOfStock =
    hasVariants
      ? activeVariants.every(
          (variant) =>
            variant.stock <=
            0
        )
      : productStock <=
        0;

  /* =====================================================
     UI
  ===================================================== */

  return (
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
      {/* =================================================
          VARIANTS
      ================================================= */}

      {hasVariants && (
        <>
          {/* =============================================
              SIZE
              Intentionally always English
          ============================================= */}

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

          {/* =============================================
              COLOR
              Intentionally always English
          ============================================= */}

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

          {/* =============================================
              SELECTED VARIANT INFO
          ============================================= */}

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

      {/* =================================================
          FASHION WITHOUT VARIANT
      ================================================= */}

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

      {/* =================================================
          MESSAGE
      ================================================= */}

      {message && (
        <div
          role="status"
          aria-live="polite"
          style={{
            fontSize:
              "0.92rem",

            fontWeight:
              600,
          }}
        >
          {message}
        </div>
      )}

      {/* =================================================
          ADD TO CART BUTTON
      ================================================= */}

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
  );
}