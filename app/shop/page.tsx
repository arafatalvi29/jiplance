import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ShopFilters from "@/components/ShopFilters";
import BilingualText from "@/components/BilingualText";

import { supabase } from "@/lib/supabase";

type ShopSearchParams = {
  q?: string;
  section?: string;
  category?: string;
  age?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
};

type BookProduct = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  product_type: string;
  book_section: string | null;
  age_min: number | null;
  age_max: number | null;
  price: number;
  discount_price: number | null;
  stock: number;
  description: string | null;
  image_url: string | null;
};

export default async function Shop({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  const params = await searchParams;

  let supabaseProducts: BookProduct[] = [];

  if (supabase) {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        id,
        name,
        slug,
        category,
        product_type,
        book_section,
        age_min,
        age_max,
        price,
        discount_price,
        stock,
        description,
        image_url
        `
      )
      .eq("is_active", true)
      .eq("product_type", "book")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Supabase shop error:",
        error.message
      );
    } else {
      supabaseProducts =
        (data ?? []) as BookProduct[];
    }
  }

  /* =====================================================
     AVAILABLE CATEGORIES
  ===================================================== */

  const availableCategories = Array.from(
    new Set(
      supabaseProducts
        .map((product) =>
          product.category?.trim()
        )
        .filter(
          (
            category
          ): category is string =>
            Boolean(category)
        )
    )
  ).sort((a, b) =>
    a.localeCompare(b)
  );

  /* =====================================================
     AVAILABLE AGES
  ===================================================== */

  const ageSet = new Set<number>();

  supabaseProducts.forEach((product) => {
    if (
      product.book_section === "kids" &&
      product.age_min !== null &&
      product.age_max !== null
    ) {
      for (
        let age = product.age_min;
        age <= product.age_max;
        age++
      ) {
        ageSet.add(age);
      }
    }
  });

  const availableAges = Array.from(
    ageSet
  ).sort((a, b) => a - b);

  /* =====================================================
     FILTER VALUES
  ===================================================== */

  const searchQuery =
    params.q?.trim().toLowerCase() ?? "";

  const selectedSection =
    params.section?.trim() ?? "";

  const selectedCategory =
    params.category?.trim() ?? "";

  const selectedAge =
    params.age &&
    !Number.isNaN(Number(params.age))
      ? Number(params.age)
      : null;

  const minPrice =
    params.minPrice &&
    !Number.isNaN(Number(params.minPrice))
      ? Number(params.minPrice)
      : null;

  const maxPrice =
    params.maxPrice &&
    !Number.isNaN(Number(params.maxPrice))
      ? Number(params.maxPrice)
      : null;

  /* =====================================================
     FILTER PRODUCTS
  ===================================================== */

  let filteredProducts =
    supabaseProducts.filter((product) => {
      const sellingPrice =
        product.discount_price ??
        product.price;

      const searchableText = [
        product.name,
        product.category ?? "",
        product.description ?? "",
        product.book_section ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const searchOk =
        !searchQuery ||
        searchableText.includes(
          searchQuery
        );

      const sectionOk =
        !selectedSection ||
        product.book_section ===
          selectedSection;

      const categoryOk =
        !selectedCategory ||
        product.category?.toLowerCase() ===
          selectedCategory.toLowerCase();

      let ageOk = true;

      if (selectedAge !== null) {
        ageOk =
          product.book_section ===
            "kids" &&
          product.age_min !== null &&
          product.age_max !== null &&
          selectedAge >=
            product.age_min &&
          selectedAge <=
            product.age_max;
      }

      const minPriceOk =
        minPrice === null ||
        sellingPrice >= minPrice;

      const maxPriceOk =
        maxPrice === null ||
        sellingPrice <= maxPrice;

      return (
        searchOk &&
        sectionOk &&
        categoryOk &&
        ageOk &&
        minPriceOk &&
        maxPriceOk
      );
    });

  /* =====================================================
     SORT
  ===================================================== */

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

  /* =====================================================
     MAP PRODUCTS
  ===================================================== */

  const products =
    filteredProducts.map((product) => {
      const isKidsBook =
        product.book_section ===
        "kids";

      let ageLabel = "Adult";

      if (
        isKidsBook &&
        product.age_min !== null &&
        product.age_max !== null
      ) {
        ageLabel =
          `${product.age_min}–${product.age_max}`;
      }

      return {
        id: product.id,

        slug: product.slug,

        name: product.name,

        bnName:
          product.name,

        category:
          (product.category ??
            "Books") as
            | "Sensory"
            | "Story"
            | "Educational",

        age:
          ageLabel,

        price:
          product.discount_price ??
          product.price,

        originalPrice:
          product.discount_price !==
          null
            ? product.price
            : undefined,

        stock:
          product.stock,

        emoji:
          product.book_section ===
          "adult"
            ? "📖"
            : "📚",

        imageUrl:
          product.image_url ??
          undefined,

        description:
          product.description ??
          "",

        bookSection:
          product.book_section,
      };
    });

  const hasActiveFilters =
    Boolean(searchQuery) ||
    Boolean(selectedSection) ||
    Boolean(selectedCategory) ||
    selectedAge !== null ||
    minPrice !== null ||
    maxPrice !== null ||
    Boolean(params.sort);

  return (
    <>
      <Header />

      <main className="section-shell page-space">

        {/* =================================================
            SHOP HEADING
        ================================================= */}

        <div className="shop-heading">
          <div>
            <div className="eyebrow">
              JIPLANCE BOOKS
            </div>

            <h1>
              <BilingualText
                en="Books for every reader."
                bn="প্রতিটি পাঠকের জন্য বই।"
              />
            </h1>

            <p>
              <BilingualText
                en="Discover books for children and grown-up readers."
                bn="শিশু ও প্রাপ্তবয়স্ক পাঠকদের জন্য বই আবিষ্কার করুন।"
              />
            </p>
          </div>

          <p>
            {products.length}{" "}
            <BilingualText
              en={
                products.length === 1
                  ? "product"
                  : "products"
              }
              bn="টি পণ্য"
            />
          </p>
        </div>

        {/* =================================================
            BOOK SECTIONS
        ================================================= */}

        <div
          className="filter-row"
          style={{
            marginBottom: "1.25rem",
          }}
        >
          <a href="/shop">
            <BilingualText
              en="All Books"
              bn="সব বই"
            />
          </a>

          <a href="/shop?section=kids">
            <BilingualText
              en="Kids Books"
              bn="শিশুদের বই"
            />
          </a>

          <a href="/shop?section=adult">
            <BilingualText
              en="Adult Books"
              bn="প্রাপ্তবয়স্কদের বই"
            />
          </a>
        </div>

        {/* =================================================
            SEARCH + FILTERS
        ================================================= */}

        <ShopFilters
          q={params.q ?? ""}
          section={selectedSection}
          category={selectedCategory}
          age={params.age ?? ""}
          minPrice={
            params.minPrice ??
            ""
          }
          maxPrice={
            params.maxPrice ??
            ""
          }
          sort={params.sort ?? ""}
          categories={
            availableCategories
          }
          ages={availableAges}
          hasActiveFilters={
            hasActiveFilters
          }
        />

        {/* =================================================
            PRODUCTS
        ================================================= */}

        {products.length > 0 ? (
          <div className="product-grid product-grid-editorial">
            {products.map(
              (
                product,
                index
              ) => {
                /*
                  Mobile editorial layout:

                  Product 1 = Single
                  Product 2 = Single
                  Product 3 = Single

                  Product 4+ = 2-column

                  Desktop remains normal grid.
                */

                
                  const featured =
  index < 2 ||
  (index >= 4 &&
    (index - 4) % 5 === 0);

                return (
                  <ProductCard
                    product={
                      product
                    }
                    featured={
                      featured
                    }
                    key={
                      product.id
                    }
                  />
                );
              }
            )}
          </div>
        ) : (
          <div className="empty-box">
            <strong>
              <BilingualText
                en="No books found."
                bn="কোনো বই পাওয়া যায়নি।"
              />
            </strong>

            <p>
              <BilingualText
                en="Try changing or clearing your filters."
                bn="ফিল্টার পরিবর্তন বা মুছে আবার চেষ্টা করুন।"
              />
            </p>

            <a
              href="/shop"
              className="ghost-button"
            >
              <BilingualText
                en="View All Books"
                bn="সব বই দেখুন"
              />
            </a>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}