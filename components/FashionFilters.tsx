"use client";

import {
  useState,
  type CSSProperties,
} from "react";

import {
  useLanguage,
} from "@/components/LanguageProvider";

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  parentName?: string;
};

type FashionFiltersProps = {
  q: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
  categories: CategoryOption[];
  hasActiveFilters: boolean;
};

/* =====================================================
   CATEGORY BANGLA LABEL
===================================================== */

function getCategoryBanglaLabel(
  category: CategoryOption
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
   * IMPORTANT:
   * Specific subcategories must be checked
   * BEFORE Men / Women / Kids.
   */

  if (
    text.includes("t-shirt") ||
    text.includes("tshirt") ||
    text.includes("tee")
  ) {
    return "টি-শার্ট";
  }

  if (
    text.includes("polo")
  ) {
    return "পোলো শার্ট";
  }

  if (
    text.includes("shirt")
  ) {
    return "শার্ট";
  }

  if (
    text.includes("panjabi") ||
    text.includes("punjabi")
  ) {
    return "পাঞ্জাবি";
  }

  if (
    text.includes("jean")
  ) {
    return "জিন্স";
  }

  if (
    text.includes("pant") ||
    text.includes("trouser")
  ) {
    return "প্যান্ট";
  }

  if (
    text.includes("short")
  ) {
    return "শর্টস";
  }

  if (
    text.includes("hoodie")
  ) {
    return "হুডি";
  }

  if (
    text.includes("jacket")
  ) {
    return "জ্যাকেট";
  }

  if (
    text.includes("sweater")
  ) {
    return "সোয়েটার";
  }

  if (
    text.includes("dress")
  ) {
    return "ড্রেস";
  }

  if (
    text.includes("kurti") ||
    text.includes("kurta")
  ) {
    return "কুর্তি";
  }

  if (
    text.includes("saree") ||
    text.includes("sari")
  ) {
    return "শাড়ি";
  }

  if (
    text.includes("skirt")
  ) {
    return "স্কার্ট";
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
    text.includes("sandal")
  ) {
    return "স্যান্ডেল";
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
    text.includes("belt")
  ) {
    return "বেল্ট";
  }

  if (
    text.includes("watch")
  ) {
    return "ঘড়ি";
  }

  if (
    text.includes("wallet")
  ) {
    return "ওয়ালেট";
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

  /*
   * Root categories come AFTER
   * specific subcategory checks.
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

  /*
   * Unknown category:
   * show original database name,
   * never incorrectly call it Men/Women.
   */

  return category.name;
}

/* =====================================================
   COMPONENT
===================================================== */

export default function FashionFilters({
  q,
  category,
  minPrice,
  maxPrice,
  sort,
  categories,
  hasActiveFilters,
}: FashionFiltersProps) {
  const {
    lang,
  } = useLanguage();

  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  /* ===================================================
     ROOT CATEGORIES
  =================================================== */

  const parentCategories =
    categories.filter(
      (item) =>
        !item.parentName
    );

  /* ===================================================
     CHILD CATEGORIES
  =================================================== */

  const getChildren = (
    parentName: string
  ) =>
    categories.filter(
      (item) =>
        item.parentName ===
        parentName
    );

  return (
    <section
      style={{
        marginBottom:
          "2rem",
      }}
    >
      {/* ===============================================
          FILTER BUTTON
      =============================================== */}

      <div
        style={{
          display:
            "flex",

          alignItems:
            "center",

          gap:
            "0.75rem",

          flexWrap:
            "wrap",
        }}
      >
        <button
          type="button"
          className="ghost-button"
          onClick={() =>
            setIsOpen(
              (current) =>
                !current
            )
          }
          aria-expanded={
            isOpen
          }
          aria-controls="fashion-filter-panel"
          aria-label={
            isOpen
              ? lang === "en"
                ? "Close filters"
                : "ফিল্টার বন্ধ করুন"
              : lang === "en"
                ? "Open filters"
                : "ফিল্টার খুলুন"
          }
          style={{
            cursor:
              "pointer",
          }}
        >
          {isOpen
            ? lang === "en"
              ? "Close Filters"
              : "ফিল্টার বন্ধ করুন"
            : lang === "en"
              ? "Filters"
              : "ফিল্টার"}

          {hasActiveFilters
            ? lang === "en"
              ? " • Active"
              : " • সক্রিয়"
            : ""}

          <span
            style={{
              marginLeft:
                "8px",

              display:
                "inline-block",

              transform:
                isOpen
                  ? "rotate(180deg)"
                  : "rotate(0deg)",

              transition:
                "transform 220ms ease",
            }}
          >
            ↓
          </span>
        </button>

        {hasActiveFilters && (
          <a
            href="/fashion"
            className="ghost-button"
          >
            {lang === "en"
              ? "Clear All"
              : "সব মুছুন"}
          </a>
        )}
      </div>

      {/* ===============================================
          COLLAPSIBLE PANEL
      =============================================== */}

      <div
        id="fashion-filter-panel"
        style={{
          display:
            "grid",

          gridTemplateRows:
            isOpen
              ? "1fr"
              : "0fr",

          opacity:
            isOpen
              ? 1
              : 0,

          transition:
            "grid-template-rows 280ms ease, opacity 220ms ease",
        }}
      >
        <div
          style={{
            overflow:
              "hidden",
          }}
        >
          <div
            style={{
              padding:
                "1.25rem",

              marginTop:
                "1rem",

              border:
                "1px solid rgba(20, 32, 67, 0.12)",

              borderRadius:
                "18px",

              background:
                "rgba(255,255,255,0.35)",
            }}
          >
            <form
              method="GET"
              action="/fashion"
            >
              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(180px, 1fr))",

                  gap:
                    "1rem",
                }}
              >
                {/* SEARCH */}

                <label
                  style={
                    labelStyle
                  }
                >
                  {lang === "en"
                    ? "Search"
                    : "খুঁজুন"}

                  <input
                    type="search"
                    name="q"
                    defaultValue={
                      q
                    }
                    placeholder={
                      lang === "en"
                        ? "Search fashion..."
                        : "ফ্যাশন পণ্য খুঁজুন..."
                    }
                    style={
                      inputStyle
                    }
                  />
                </label>

                {/* CATEGORY */}

                <label
                  style={
                    labelStyle
                  }
                >
                  {lang === "en"
                    ? "Category"
                    : "ক্যাটাগরি"}

                  <select
                    name="category"
                    defaultValue={
                      category
                    }
                    style={
                      inputStyle
                    }
                  >
                    <option value="">
                      {lang === "en"
                        ? "All Fashion"
                        : "সব ফ্যাশন"}
                    </option>

                    {parentCategories.map(
                      (
                        parent
                      ) => {
                        const children =
                          getChildren(
                            parent.name
                          );

                        const parentLabel =
                          lang === "en"
                            ? parent.name
                            : getCategoryBanglaLabel(
                                parent
                              );

                        return (
                          <optgroup
                            key={
                              parent.id
                            }
                            label={
                              parentLabel
                            }
                          >
                            <option
                              value={
                                parent.slug
                              }
                            >
                              {lang === "en"
                                ? `All ${parent.name}`
                                : `${parentLabel} — সব পণ্য`}
                            </option>

                            {children.map(
                              (
                                child
                              ) => (
                                <option
                                  key={
                                    child.id
                                  }
                                  value={
                                    child.slug
                                  }
                                >
                                  {lang === "en"
                                    ? child.name
                                    : getCategoryBanglaLabel(
                                        child
                                      )}
                                </option>
                              )
                            )}
                          </optgroup>
                        );
                      }
                    )}
                  </select>
                </label>

                {/* MIN PRICE */}

                <label
                  style={
                    labelStyle
                  }
                >
                  {lang === "en"
                    ? "Minimum Price"
                    : "সর্বনিম্ন মূল্য"}

                  <input
                    type="number"
                    name="minPrice"
                    min="0"
                    step="1"
                    defaultValue={
                      minPrice
                    }
                    placeholder={
                      lang === "en"
                        ? "৳ Min"
                        : "৳ সর্বনিম্ন"
                    }
                    style={
                      inputStyle
                    }
                  />
                </label>

                {/* MAX PRICE */}

                <label
                  style={
                    labelStyle
                  }
                >
                  {lang === "en"
                    ? "Maximum Price"
                    : "সর্বোচ্চ মূল্য"}

                  <input
                    type="number"
                    name="maxPrice"
                    min="0"
                    step="1"
                    defaultValue={
                      maxPrice
                    }
                    placeholder={
                      lang === "en"
                        ? "৳ Max"
                        : "৳ সর্বোচ্চ"
                    }
                    style={
                      inputStyle
                    }
                  />
                </label>

                {/* SORT */}

                <label
                  style={
                    labelStyle
                  }
                >
                  {lang === "en"
                    ? "Sort By"
                    : "সাজান"}

                  <select
                    name="sort"
                    defaultValue={
                      sort
                    }
                    style={
                      inputStyle
                    }
                  >
                    <option value="">
                      {lang === "en"
                        ? "Newest"
                        : "নতুন আগে"}
                    </option>

                    <option value="price-low">
                      {lang === "en"
                        ? "Price: Low to High"
                        : "মূল্য: কম থেকে বেশি"}
                    </option>

                    <option value="price-high">
                      {lang === "en"
                        ? "Price: High to Low"
                        : "মূল্য: বেশি থেকে কম"}
                    </option>

                    <option value="name">
                      {lang === "en"
                        ? "Name: A–Z"
                        : "নাম: A–Z"}
                    </option>
                  </select>
                </label>
              </div>

              {/* ACTIONS */}

              <div
                style={{
                  display:
                    "flex",

                  gap:
                    "0.75rem",

                  flexWrap:
                    "wrap",

                  marginTop:
                    "1.25rem",
                }}
              >
                <button
                  type="submit"
                  className="primary-button"
                  style={{
                    border:
                      "none",

                    cursor:
                      "pointer",
                  }}
                >
                  {lang === "en"
                    ? "Apply Filters"
                    : "ফিল্টার প্রয়োগ করুন"}
                </button>

                {hasActiveFilters && (
                  <a
                    href="/fashion"
                    className="ghost-button"
                  >
                    {lang === "en"
                      ? "Clear Filters"
                      : "ফিল্টার মুছুন"}
                  </a>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =====================================================
   STYLES
===================================================== */

const labelStyle:
  CSSProperties = {
  display:
    "grid",

  gap:
    "0.45rem",

  fontWeight:
    600,
};

const inputStyle:
  CSSProperties = {
  width:
    "100%",

  minHeight:
    "44px",

  padding:
    "0.75rem",

  borderRadius:
    "10px",

  border:
    "1px solid rgba(20, 32, 67, 0.15)",

  background:
    "transparent",

  color:
    "inherit",
};