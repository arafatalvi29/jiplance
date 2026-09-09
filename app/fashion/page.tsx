import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FashionFilters from "@/components/FashionFilters";
import WishlistButton from "@/components/WishlistButton";
import BilingualText from "@/components/BilingualText";

import { supabase } from "@/lib/supabase";

type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number | null;
};

type ProductVariant = {
  id: string;
  stock: number;
  is_active: boolean;
};

type FashionProduct = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  product_type: string | null;
  fashion_section: string | null;
  brand: string | null;
  price: number;
  discount_price: number | null;
  stock: number;
  image_url: string | null;
  description: string | null;

  product_categories:
    | {
        category_id: string;
      }[]
    | null;

  product_variants:
    | ProductVariant[]
    | null;
};

type FashionSearchParams = {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
};

/* =====================================================
   CATEGORY BANGLA LABEL
===================================================== */

function getCategoryBanglaLabel(
  category: Category
) {
  const name =
    category.name
      .trim()
      .toLowerCase();

  const slug =
    category.slug
      .trim()
      .toLowerCase();

  const text =
    `${name} ${slug}`;

  /*
   * Women must be checked
   * before Men because "women"
   * also contains "men".
   */

  if (
    text.includes("women") ||
    text.includes("woman")
  ) {
    return "নারী";
  }

  if (
    text.includes("men") ||
    text.includes("man")
  ) {
    return "পুরুষ";
  }

  if (
    text.includes("kid") ||
    text.includes("child")
  ) {
    return "শিশু";
  }

  if (
    text.includes("accessor")
  ) {
    return "অ্যাক্সেসরিজ";
  }

  if (
    text.includes("boy")
  ) {
    return "ছেলেদের";
  }

  if (
    text.includes("girl")
  ) {
    return "মেয়েদের";
  }

  if (
    text.includes("t-shirt") ||
    text.includes("tshirt") ||
    text.includes("tee")
  ) {
    return "টি-শার্ট";
  }

  if (
    text.includes("shirt")
  ) {
    return "শার্ট";
  }

  if (
    text.includes("pant") ||
    text.includes("trouser")
  ) {
    return "প্যান্ট";
  }

  if (
    text.includes("jean")
  ) {
    return "জিন্স";
  }

  if (
    text.includes("dress")
  ) {
    return "ড্রেস";
  }

  if (
    text.includes("top")
  ) {
    return "টপস";
  }

  if (
    text.includes("bottom")
  ) {
    return "বটমস";
  }

  if (
    text.includes("shoe") ||
    text.includes("footwear")
  ) {
    return "জুতা";
  }

  if (
    text.includes("bag")
  ) {
    return "ব্যাগ";
  }

  if (
    text.includes("cap") ||
    text.includes("hat")
  ) {
    return "ক্যাপ";
  }

  if (
    text.includes("watch")
  ) {
    return "ঘড়ি";
  }

  return category.name;
}

/* =====================================================
   PAGE
===================================================== */

export default async function FashionPage({
  searchParams,
}: {
  searchParams: Promise<FashionSearchParams>;
}) {
  const params =
    await searchParams;

  let fashionProducts:
    FashionProduct[] = [];

  let fashionCategories:
    Category[] = [];

  /* ===================================================
     LOAD CATEGORIES + PRODUCTS
  =================================================== */

  if (supabase) {
    const {
      data: categoryData,
      error: categoryError,
    } = await supabase
      .from("categories")
      .select(
        `
        id,
        name,
        slug,
        parent_id,
        sort_order
        `
      )
      .eq(
        "store_section",
        "fashion"
      )
      .eq(
        "is_active",
        true
      )
      .order(
        "sort_order",
        {
          ascending: true,
        }
      );

    if (categoryError) {
      console.error(
        "Supabase fashion category error:",
        categoryError.message
      );
    } else {
      fashionCategories =
        (
          categoryData as Category[]
        ) ?? [];
    }

    const {
      data: productData,
      error: productError,
    } = await supabase
      .from("products")
      .select(
        `
        id,
        name,
        slug,
        category,
        product_type,
        fashion_section,
        brand,
        price,
        discount_price,
        stock,
        image_url,
        description,

        product_categories (
          category_id
        ),

        product_variants (
          id,
          stock,
          is_active
        )
        `
      )
      .eq(
        "is_active",
        true
      )
      .eq(
        "product_type",
        "fashion"
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (productError) {
      console.error(
        "Supabase fashion product error:",
        productError.message
      );
    } else {
      fashionProducts =
        (
          productData as FashionProduct[]
        ) ?? [];
    }
  }

  /* ===================================================
     CATEGORY HELPERS
  =================================================== */

  const getSubcategories = (
    parentId: string
  ) =>
    fashionCategories.filter(
      (category) =>
        category.parent_id ===
        parentId
    );

  const mainCategories =
    fashionCategories.filter(
      (category) =>
        category.parent_id ===
        null
    );

  const selectedCategorySlug =
    params.category?.trim() ??
    "";

  const selectedCategory =
    selectedCategorySlug
      ? fashionCategories.find(
          (category) =>
            category.slug ===
            selectedCategorySlug
        ) ?? null
      : null;

  const selectedCategoryIds =
    selectedCategory
      ? [
          selectedCategory.id,

          ...getSubcategories(
            selectedCategory.id
          ).map(
            (subcategory) =>
              subcategory.id
          ),
        ]
      : [];

  /* ===================================================
     SEARCH + PRICE FILTERS
  =================================================== */

  const searchQuery =
    params.q
      ?.trim()
      .toLowerCase() ??
    "";

  const minPrice =
    params.minPrice &&
    !Number.isNaN(
      Number(params.minPrice)
    )
      ? Number(
          params.minPrice
        )
      : null;

  const maxPrice =
    params.maxPrice &&
    !Number.isNaN(
      Number(params.maxPrice)
    )
      ? Number(
          params.maxPrice
        )
      : null;

  let filteredProducts =
    fashionProducts.filter(
      (product) => {
        const sellingPrice =
          product.discount_price ??
          product.price;

        const searchableText =
          [
            product.name,
            product.brand ?? "",
            product.category ?? "",
            product.fashion_section ??
              "",
            product.description ??
              "",
          ]
            .join(" ")
            .toLowerCase();

        const searchOk =
          !searchQuery ||
          searchableText.includes(
            searchQuery
          );

        const categoryOk =
          !selectedCategory ||
          product.product_categories?.some(
            (item) =>
              selectedCategoryIds.includes(
                item.category_id
              )
          );

        const minPriceOk =
          minPrice === null ||
          sellingPrice >=
            minPrice;

        const maxPriceOk =
          maxPrice === null ||
          sellingPrice <=
            maxPrice;

        return (
          searchOk &&
          categoryOk &&
          minPriceOk &&
          maxPriceOk
        );
      }
    );

  /* ===================================================
     SORT
  =================================================== */

  switch (params.sort) {
    case "price-low":
      filteredProducts.sort(
        (a, b) =>
          (a.discount_price ??
            a.price) -
          (b.discount_price ??
            b.price)
      );

      break;

    case "price-high":
      filteredProducts.sort(
        (a, b) =>
          (b.discount_price ??
            b.price) -
          (a.discount_price ??
            a.price)
      );

      break;

    case "name":
      filteredProducts.sort(
        (a, b) =>
          a.name.localeCompare(
            b.name
          )
      );

      break;

    default:
      break;
  }

  /* ===================================================
     STOCK
  =================================================== */

  const getProductStock = (
    product: FashionProduct
  ) => {
    const activeVariants =
      product.product_variants?.filter(
        (variant) =>
          variant.is_active
      ) ?? [];

    if (
      activeVariants.length >
      0
    ) {
      return activeVariants.reduce(
        (total, variant) =>
          total +
          Math.max(
            0,
            Number(
              variant.stock
            ) || 0
          ),
        0
      );
    }

    return Math.max(
      0,
      Number(
        product.stock
      ) || 0
    );
  };

  /* ===================================================
     FILTER CATEGORY DATA
  =================================================== */

  const filterCategories =
    fashionCategories.map(
      (category) => {
        const parent =
          category.parent_id
            ? fashionCategories.find(
                (item) =>
                  item.id ===
                  category.parent_id
              )
            : null;

        return {
          id:
            category.id,

          name:
            category.name,

          slug:
            category.slug,

          parentName:
            parent?.name,
        };
      }
    );

  const hasActiveFilters =
    Boolean(
      searchQuery
    ) ||
    Boolean(
      selectedCategorySlug
    ) ||
    minPrice !== null ||
    maxPrice !== null ||
    Boolean(
      params.sort
    );

  /* ===================================================
     UI
  =================================================== */

  return (
    <>
      <Header />

      <main className="section-shell page-space">

        {/* ===============================================
            PAGE HEADING
        =============================================== */}

        <div className="shop-heading">
          <div>
            <div className="eyebrow">
              JIPLANCE FASHION
            </div>

            <h1>
              <BilingualText
                en="Style for every occasion."
                bn="প্রতিটি উপলক্ষের জন্য স্টাইল।"
              />
            </h1>

            <p>
              <BilingualText
                en="Explore fashion, clothing and accessories from JIPLANCE."
                bn="JIPLANCE-এর ফ্যাশন, পোশাক ও অ্যাক্সেসরিজের সংগ্রহ দেখুন।"
              />
            </p>
          </div>

          <p>
            {
              filteredProducts.length
            }{" "}

            <BilingualText
              en={
                filteredProducts.length ===
                1
                  ? "product"
                  : "products"
              }
              bn="টি পণ্য"
            />
          </p>
        </div>

        {/* ===============================================
            MAIN CATEGORIES
        =============================================== */}

        <div
          className="filter-row"
          style={{
            marginBottom:
              "1.25rem",
          }}
        >
          <a href="/fashion">
            <BilingualText
              en="All Fashion"
              bn="সব ফ্যাশন"
            />
          </a>

          {mainCategories.map(
            (category) => (
              <a
                key={
                  category.id
                }
                href={`/fashion?category=${category.slug}`}
              >
                <BilingualText
                  en={
                    category.name
                  }
                  bn={getCategoryBanglaLabel(
                    category
                  )}
                />
              </a>
            )
          )}
        </div>

        {/* ===============================================
            FILTERS
        =============================================== */}

        <FashionFilters
          q={
            params.q ??
            ""
          }
          category={
            selectedCategorySlug
          }
          minPrice={
            params.minPrice ??
            ""
          }
          maxPrice={
            params.maxPrice ??
            ""
          }
          sort={
            params.sort ??
            ""
          }
          categories={
            filterCategories
          }
          hasActiveFilters={
            hasActiveFilters
          }
        />

        {/* ===============================================
            SUBCATEGORIES
        =============================================== */}

        {selectedCategory &&
          selectedCategory.parent_id ===
            null &&
          getSubcategories(
            selectedCategory.id
          ).length >
            0 && (
            <section
              style={{
                marginBottom:
                  "1.75rem",
              }}
            >
              <div
                className="eyebrow"
                style={{
                  marginBottom:
                    "0.75rem",
                }}
              >
                <BilingualText
                  en={
                    selectedCategory.name
                  }
                  bn={getCategoryBanglaLabel(
                    selectedCategory
                  )}
                />
              </div>

              <div className="filter-row">
                {getSubcategories(
                  selectedCategory.id
                ).map(
                  (
                    subcategory
                  ) => (
                    <a
                      key={
                        subcategory.id
                      }
                      href={`/fashion?category=${subcategory.slug}`}
                    >
                      <BilingualText
                        en={
                          subcategory.name
                        }
                        bn={getCategoryBanglaLabel(
                          subcategory
                        )}
                      />
                    </a>
                  )
                )}
              </div>
            </section>
          )}

        {/* ===============================================
            PRODUCTS
        =============================================== */}

        {filteredProducts.length >
        0 ? (
          <div
            className="product-grid fashion-editorial-grid"
            style={{
              marginTop:
                "1rem",

              alignItems:
                "stretch",
            }}
          >
            {filteredProducts.map(
              (
                product,
                index
              ) => {
                const sellingPrice =
                  product.discount_price ??
                  product.price;

                const stock =
                  getProductStock(
                    product
                  );

                const featured =
  index < 2 ||
  (index >= 4 &&
    (index - 4) % 5 === 0);

                return (
                  <article
                    key={
                      product.id
                    }
                    className={`product-card ${
                      featured
                        ? "product-card-featured"
                        : ""
                    }`}
                    style={{
                      height:
                        "auto",

                      minHeight:
                        "100%",

                      overflow:
                        "hidden",

                      display:
                        "flex",

                      flexDirection:
                        "column",
                    }}
                  >
                    {/* PRODUCT IMAGE */}

                    <div
                      className="product-visual"
                      style={{
                        width:
                          "100%",

                        height:
                          "auto",

                        aspectRatio:
                          "1 / 1",

                        overflow:
                          "hidden",

                        display:
                          "flex",

                        alignItems:
                          "center",

                        justifyContent:
                          "center",

                        position:
                          "relative",
                      }}
                    >
                      <WishlistButton
                        productId={
                          product.id
                        }
                      />

                      <a
                        href={`/product/${product.slug}`}
                        style={{
                          width:
                            "100%",

                          height:
                            "100%",

                          display:
                            "flex",

                          alignItems:
                            "center",

                          justifyContent:
                            "center",

                          textDecoration:
                            "none",

                          color:
                            "inherit",
                        }}
                      >
                        {product.image_url ? (
                          <img
                            src={
                              product.image_url
                            }
                            alt={
                              product.name
                            }
                            style={{
                              width:
                                "100%",

                              height:
                                "100%",

                              display:
                                "block",

                              objectFit:
                                "contain",
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize:
                                "4rem",
                            }}
                          >
                            👕
                          </span>
                        )}
                      </a>
                    </div>

                    {/* PRODUCT INFO */}

                    <a
                      href={`/product/${product.slug}`}
                      style={{
                        textDecoration:
                          "none",

                        color:
                          "inherit",

                        display:
                          "flex",

                        flexDirection:
                          "column",

                        width:
                          "100%",

                        flex:
                          1,
                      }}
                    >
                      <div
                        className="product-card-copy"
                        style={{
                          display:
                            "flex",

                          flexDirection:
                            "column",

                          gap:
                            "9px",

                          padding:
                            "18px",

                          height:
                            "100%",

                          minHeight:
                            "170px",

                          overflow:
                            "visible",
                        }}
                      >
                        <div className="eyebrow">
                          {product.brand ||
                            "JIPLANCE FASHION"}
                        </div>

                        <h3
                          style={{
                            margin:
                              0,

                            lineHeight:
                              1.3,
                          }}
                        >
                          {
                            product.name
                          }
                        </h3>

                        <div
                          className="detail-price"
                          style={{
                            display:
                              "flex",

                            alignItems:
                              "center",

                            gap:
                              "10px",

                            flexWrap:
                              "wrap",
                          }}
                        >
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

                        <small
                          style={{
                            display:
                              "block",

                            marginTop:
                              "auto",
                          }}
                        >
                          {stock >
                          0 ? (
                            <BilingualText
                              en={`In stock: ${stock}`}
                              bn={`স্টকে আছে: ${stock}`}
                            />
                          ) : (
                            <BilingualText
                              en="Out of stock"
                              bn="স্টকে নেই"
                            />
                          )}
                        </small>
                      </div>
                    </a>
                  </article>
                );
              }
            )}
          </div>
        ) : (
          <div
            className="empty-box"
            style={{
              marginTop:
                "1rem",
            }}
          >
            <strong>
              <BilingualText
                en="No fashion products found."
                bn="কোনো ফ্যাশন পণ্য পাওয়া যায়নি।"
              />
            </strong>

            <p>
              <BilingualText
                en="Try changing or clearing your filters."
                bn="ফিল্টার পরিবর্তন বা মুছে আবার চেষ্টা করুন।"
              />
            </p>

            <a
              href="/fashion"
              className="ghost-button"
            >
              <BilingualText
                en="View All Fashion"
                bn="সব ফ্যাশন দেখুন"
              />
            </a>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}