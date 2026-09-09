import {
  notFound,
} from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddToCartButton from "@/components/AddToCartButton";
import ProductReviews from "@/components/ProductReviews";
import BilingualText from "@/components/BilingualText";
import ProductImageGallery from "@/components/ProductImageGallery";

import {
  supabase,
} from "@/lib/supabase";

type ProductVariant = {
  id: string;
  size: string | null;
  color: string | null;
  stock: number;
  price: number | null;
  discount_price:
    | number
    | null;
  image_url:
    | string
    | null;
  is_active: boolean;
};

type ProductGalleryImage = {
  id: string;
  image_url: string;
  sort_order: number;
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
    sensory:
      "সেন্সরি",

    story:
      "গল্প",

    educational:
      "শিক্ষামূলক",

    activity:
      "অ্যাক্টিভিটি",

    coloring:
      "রঙ করার বই",

    fiction:
      "কল্পকাহিনি",

    "non-fiction":
      "নন-ফিকশন",

    "non fiction":
      "নন-ফিকশন",

    men:
      "পুরুষ",

    women:
      "নারী",

    kids:
      "শিশু",

    accessories:
      "অ্যাক্সেসরিজ",

    fashion:
      "ফ্যাশন",

    books:
      "বই",
  };

  return (
    translations[
      text
    ] ??
    value
  );
}

/* =====================================================
   PRODUCT PAGE
===================================================== */

export default async function ProductPage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const {
    slug,
  } =
    await params;

  if (!supabase) {
    notFound();
  }

  const client =
    supabase;

  /* ===================================================
     LOAD PRODUCT
  =================================================== */

  const {
    data:
      product,
    error,
  } =
    await client
      .from(
        "products"
      )
      .select(
        `
        id,
        name,
        slug,
        description,
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
      .eq(
        "slug",
        slug
      )
      .eq(
        "is_active",
        true
      )
      .single();

  if (
    error ||
    !product
  ) {
    notFound();
  }

  /* ===================================================
     LOAD PRODUCT GALLERY
  =================================================== */

  let galleryImages:
    ProductGalleryImage[] =
      [];

  const {
    data:
      galleryData,
    error:
      galleryError,
  } =
    await client
      .from(
        "product_images"
      )
      .select(
        `
        id,
        image_url,
        sort_order
        `
      )
      .eq(
        "product_id",
        product.id
      )
      .eq(
        "is_active",
        true
      )
      .order(
        "sort_order",
        {
          ascending:
            true,
        }
      )
      .order(
        "created_at",
        {
          ascending:
            true,
        }
      );

  if (
    galleryError
  ) {
    console.error(
      "Product gallery error:",
      galleryError.message
    );
  } else {
    galleryImages =
      (
        galleryData ??
        []
      ) as ProductGalleryImage[];
  }

  /* ===================================================
     LOAD FASHION VARIANTS
  =================================================== */

  let variants:
    ProductVariant[] =
      [];

  if (
    product.product_type ===
    "fashion"
  ) {
    const {
      data:
        variantData,
      error:
        variantError,
    } =
      await client
        .from(
          "product_variants"
        )
        .select(
          `
          id,
          size,
          color,
          stock,
          price,
          discount_price,
          image_url,
          is_active
          `
        )
        .eq(
          "product_id",
          product.id
        )
        .eq(
          "is_active",
          true
        )
        .order(
          "created_at",
          {
            ascending:
              true,
          }
        );

    if (
      !variantError &&
      variantData
    ) {
      variants =
        variantData as
          ProductVariant[];
    }
  }

  /* ===================================================
     PRODUCT TYPE
  =================================================== */

  const isBook =
    product.product_type ===
    "book";

  const isAdultBook =
    isBook &&
    product.book_section ===
      "adult";

  /* ===================================================
     AGE
  =================================================== */

  const ageLabel =
    isAdultBook ||
    product.age_min ===
      null ||
    product.age_max ===
      null
      ? "Adult"
      : `${product.age_min}–${product.age_max}`;

  /* ===================================================
     PRICE
  =================================================== */

  const sellingPrice =
    product.discount_price ??
    product.price;

  /* ===================================================
     STOCK
  =================================================== */

  const activeVariantStock =
    variants.reduce(
      (
        sum,
        variant
      ) =>
        sum +
        Math.max(
          0,
          variant.stock ||
            0
        ),
      0
    );

  const displayStock =
    product.product_type ===
      "fashion" &&
    variants.length >
      0
      ? activeVariantStock
      : product.stock;

  /* ===================================================
     CATEGORY LABELS
  =================================================== */

  const categoryEnglish =
    product.category ||
    (
      isBook
        ? "Books"
        : "Fashion"
    );

  const categoryBangla =
    getCategoryBanglaLabel(
      product.category
    );

  return (
    <>
      <Header />

      <main className="section-shell product-page">

        {/* ===============================================
            PRODUCT VISUAL
        =============================================== */}

        <div className="product-detail-visual">
          <ProductImageGallery
            productName={
              product.name
            }
            mainImageUrl={
              product.image_url
            }
            galleryImages={
              galleryImages
            }
            fallbackEmoji={
              isBook
                ? "📚"
                : "👕"
            }
          />
        </div>

        {/* ===============================================
            PRODUCT INFORMATION
        =============================================== */}

        <div className="product-detail-copy">

          {/* EYEBROW */}

          <div className="eyebrow">
            {isBook ? (
              isAdultBook ? (
                <BilingualText
                  en={`${categoryEnglish} • ADULT BOOK`}
                  bn={`${categoryBangla} • প্রাপ্তবয়স্কদের বই`}
                />
              ) : (
                <BilingualText
                  en={`${categoryEnglish} • AGE ${ageLabel}`}
                  bn={`${categoryBangla} • বয়স ${ageLabel}`}
                />
              )
            ) : (
              <BilingualText
                en={`${categoryEnglish} • FASHION`}
                bn={`${categoryBangla} • ফ্যাশন`}
              />
            )}
          </div>

          {/* PRODUCT NAME */}

          <h1>
            {
              product.name
            }
          </h1>

          {/* PRICE */}

          <div className="detail-price">
            <strong>
              ৳
              {
                sellingPrice
              }
            </strong>

            {product.discount_price !==
              null && (
              <del>
                ৳
                {
                  product.price
                }
              </del>
            )}
          </div>

          {/* DESCRIPTION */}

          <p>
            {product.description ? (
              product.description
            ) : (
              <BilingualText
                en="Product description coming soon."
                bn="পণ্যের বিস্তারিত বিবরণ শিগগিরই যোগ করা হবে।"
              />
            )}
          </p>

          {/* STOCK */}

          <div className="stock-note">
            {displayStock >
            0 ? (
              product.product_type ===
                "fashion" &&
              variants.length >
                0 ? (
                <BilingualText
                  en={`Available variant stock: ${displayStock}`}
                  bn={`ভ্যারিয়েন্ট স্টক: ${displayStock}`}
                />
              ) : (
                <BilingualText
                  en={`In stock: ${displayStock}`}
                  bn={`স্টকে আছে: ${displayStock}`}
                />
              )
            ) : (
              <BilingualText
                en="Out of stock"
                bn="স্টকে নেই"
              />
            )}
          </div>

          {/* =============================================
              ADD TO CART / VARIANTS
          ============================================= */}

          {(product.product_type ===
            "fashion" ||
            product.stock >
              0) && (
            <AddToCartButton
              productId={
                product.id
              }
              productType={
                product.product_type
              }
              productStock={
                product.stock
              }
              variants={
                variants
              }
            />
          )}

          {/* =============================================
              CUSTOMER INFO
          ============================================= */}

          <div className="mini-info">
            <span>
              ✓{" "}
              <BilingualText
                en="Pathao delivery"
                bn="Pathao ডেলিভারি"
              />
            </span>

            <span>
              ✓{" "}
              <BilingualText
                en="bKash / Bank Transfer"
                bn="বিকাশ / ব্যাংক ট্রান্সফার"
              />
            </span>

            <span>
              ✓{" "}
              <BilingualText
                en="Easy support"
                bn="সহজ কাস্টমার সাপোর্ট"
              />
            </span>
          </div>
        </div>
      </main>

      {/* ===============================================
          REVIEWS
      =============================================== */}

      <ProductReviews
        productId={
          product.id
        }
      />

      <Footer />
    </>
  );
}