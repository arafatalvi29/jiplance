"use client";

import {
  useState,
  type CSSProperties,
} from "react";

import {
  useLanguage,
} from "@/components/LanguageProvider";

type ShopFiltersProps = {
  q: string;
  section: string;
  category: string;
  age: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
  categories: string[];
  ages: number[];
  hasActiveFilters: boolean;
};

export default function ShopFilters({
  q,
  section,
  category,
  age,
  minPrice,
  maxPrice,
  sort,
  categories,
  ages,
  hasActiveFilters,
}: ShopFiltersProps) {
  const {
    lang,
  } = useLanguage();

  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const getCategoryLabel = (
    value: string
  ) => {
    if (lang === "en") {
      return value;
    }

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
      books: "বই",
    };

    return (
      translations[
        value
          .trim()
          .toLowerCase()
      ] ?? value
    );
  };

  return (
    <section
      style={{
        marginBottom: "2rem",
      }}
    >
      {/* ===============================================
          FILTER BAR
      =============================================== */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
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
          aria-controls="shop-filter-panel"
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
            cursor: "pointer",
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
              marginLeft: "8px",
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
            href="/shop"
            className="ghost-button"
          >
            {lang === "en"
              ? "Clear All"
              : "সব মুছুন"}
          </a>
        )}
      </div>

      {/* ===============================================
          COLLAPSIBLE FILTER PANEL
      =============================================== */}

      <div
        id="shop-filter-panel"
        style={{
          display: "grid",

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
              action="/shop"
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
                        ? "Search books..."
                        : "বই খুঁজুন..."
                    }
                    style={
                      inputStyle
                    }
                  />
                </label>

                {/* READER */}

                <label
                  style={
                    labelStyle
                  }
                >
                  {lang === "en"
                    ? "Reader"
                    : "পাঠক"}

                  <select
                    name="section"
                    defaultValue={
                      section
                    }
                    style={
                      inputStyle
                    }
                  >
                    <option value="">
                      {lang === "en"
                        ? "All Books"
                        : "সব বই"}
                    </option>

                    <option value="kids">
                      {lang === "en"
                        ? "Kids Books"
                        : "শিশুদের বই"}
                    </option>

                    <option value="adult">
                      {lang === "en"
                        ? "Adult Books"
                        : "প্রাপ্তবয়স্কদের বই"}
                    </option>
                  </select>
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
                        ? "All Categories"
                        : "সব ক্যাটাগরি"}
                    </option>

                    {categories.map(
                      (item) => (
                        <option
                          key={
                            item
                          }
                          value={
                            item
                          }
                        >
                          {getCategoryLabel(
                            item
                          )}
                        </option>
                      )
                    )}
                  </select>
                </label>

                {/* CHILD AGE */}

                <label
                  style={
                    labelStyle
                  }
                >
                  {lang === "en"
                    ? "Child Age"
                    : "শিশুর বয়স"}

                  <select
                    name="age"
                    defaultValue={
                      age
                    }
                    style={
                      inputStyle
                    }
                  >
                    <option value="">
                      {lang === "en"
                        ? "Any Age"
                        : "যেকোনো বয়স"}
                    </option>

                    {ages.map(
                      (item) => (
                        <option
                          key={
                            item
                          }
                          value={
                            item
                          }
                        >
                          {lang === "en"
                            ? `Age ${item}`
                            : `বয়স ${item}`}
                        </option>
                      )
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

              {/* ===========================================
                  ACTIONS
              =========================================== */}

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
                    href="/shop"
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

const labelStyle: CSSProperties = {
  display: "grid",
  gap: "0.45rem",
  fontWeight: 600,
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "44px",
  padding: "0.75rem",
  borderRadius: "10px",

  border:
    "1px solid rgba(20, 32, 67, 0.15)",

  background:
    "transparent",

  color:
    "inherit",
};