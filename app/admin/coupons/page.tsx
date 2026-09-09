"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

type CouponScope =
  | "all"
  | "books"
  | "fashion"
  | "category";

type CouponRow = {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;

  min_order_amount: number;
  max_discount_amount: number | null;

  usage_limit: number | null;
  used_count: number;

  starts_at: string | null;
  expires_at: string | null;

  is_active: boolean;

  scope_type: CouponScope;
  scope_category_id: string | null;

  created_at: string;
  updated_at: string;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  store_section: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
};

type CouponFilter =
  | "all"
  | "active"
  | "scheduled"
  | "expired"
  | "disabled"
  | "exhausted";

type CouponForm = {
  id: string | null;

  code: string;

  discountType:
    | "percentage"
    | "fixed";

  discountValue: string;

  minOrderAmount: string;

  maxDiscountAmount: string;

  usageLimit: string;

  startsAt: string;

  expiresAt: string;

  isActive: boolean;

  scopeType: CouponScope;
  scopeCategoryId: string;
};

const emptyForm: CouponForm = {
  id: null,

  code: "",

  discountType:
    "percentage",

  discountValue: "",

  minOrderAmount: "0",

  maxDiscountAmount: "",

  usageLimit: "",

  startsAt: "",

  expiresAt: "",

  isActive: true,

  scopeType: "all",
  scopeCategoryId: "",
};

function toLocalInputValue(
  value: string | null
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const offset =
    date.getTimezoneOffset();

  const localDate =
    new Date(
      date.getTime() -
        offset * 60 * 1000
    );

  return localDate
    .toISOString()
    .slice(0, 16);
}

function toIsoOrNull(
  value: string
) {
  const clean =
    value.trim();

  if (!clean) {
    return null;
  }

  const date =
    new Date(clean);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date.toISOString();
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "No limit";
  }

  return new Date(
    value
  ).toLocaleString(
    "en-BD",
    {
      timeZone:
        "Asia/Dhaka",

      day: "numeric",
      month: "short",
      year: "numeric",

      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function getCouponState(
  coupon: CouponRow
):
  | "active"
  | "scheduled"
  | "expired"
  | "disabled"
  | "exhausted" {
  const now =
    Date.now();

  if (!coupon.is_active) {
    return "disabled";
  }

  if (
    coupon.usage_limit !==
      null &&
    coupon.used_count >=
      coupon.usage_limit
  ) {
    return "exhausted";
  }

  if (
    coupon.starts_at &&
    new Date(
      coupon.starts_at
    ).getTime() > now
  ) {
    return "scheduled";
  }

  if (
    coupon.expires_at &&
    new Date(
      coupon.expires_at
    ).getTime() <= now
  ) {
    return "expired";
  }

  return "active";
}

function stateLabel(
  state: ReturnType<
    typeof getCouponState
  >
) {
  if (
    state === "active"
  ) {
    return "ACTIVE";
  }

  if (
    state === "scheduled"
  ) {
    return "SCHEDULED";
  }

  if (
    state === "expired"
  ) {
    return "EXPIRED";
  }

  if (
    state === "disabled"
  ) {
    return "DISABLED";
  }

  return "LIMIT REACHED";
}

function simpleScopeLabel(
  scope: CouponScope
) {
  if (scope === "all") {
    return "All Products";
  }

  if (scope === "books") {
    return "Books Only";
  }

  if (scope === "fashion") {
    return "Fashion Only";
  }

  return "Specific Category";
}

export default function AdminCouponsPage() {
  const router =
    useRouter();

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [workingId, setWorkingId] =
    useState<string | null>(
      null
    );

  const [canView, setCanView] =
    useState(false);

  const [canManage, setCanManage] =
    useState(false);

  const [
    coupons,
    setCoupons,
  ] =
    useState<
      CouponRow[]
    >([]);

  const [
    categories,
    setCategories,
  ] =
    useState<
      CategoryRow[]
    >([]);

  const [
    categoryLoadFailed,
    setCategoryLoadFailed,
  ] = useState(false);

  const [
    form,
    setForm,
  ] =
    useState<CouponForm>(
      emptyForm
    );

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] =
    useState<CouponFilter>(
      "all"
    );

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const categoryMap =
    useMemo(
      () =>
        new Map(
          categories.map(
            (category) => [
              category.id,
              category,
            ]
          )
        ),
      [categories]
    );

  const getCategoryPath = (
    categoryId: string | null
  ) => {
    if (!categoryId) {
      return "Selected Category";
    }

    const category =
      categoryMap.get(
        categoryId
      );

    if (!category) {
      return "Selected Category";
    }

    const names: string[] = [];
    const visited =
      new Set<string>();

    let current:
      | CategoryRow
      | undefined =
      category;

    while (
      current &&
      !visited.has(
        current.id
      )
    ) {
      visited.add(
        current.id
      );

      names.unshift(
        current.name
      );

      current =
        current.parent_id
          ? categoryMap.get(
              current.parent_id
            )
          : undefined;
    }

    const section =
      category.store_section ===
      "books"
        ? "Books"
        : category.store_section ===
          "fashion"
        ? "Fashion"
        : category.store_section;

    return `${section} — ${names.join(
      " › "
    )}`;
  };

  const categoryOptions =
    useMemo(() => {
      const getDepth = (
        category: CategoryRow
      ) => {
        let depth = 0;

        let current =
          category;

        const visited =
          new Set<string>();

        while (
          current.parent_id &&
          !visited.has(
            current.id
          )
        ) {
          visited.add(
            current.id
          );

          const parent =
            categoryMap.get(
              current.parent_id
            );

          if (!parent) {
            break;
          }

          depth += 1;
          current = parent;
        }

        return depth;
      };

      const getPath = (
        category: CategoryRow
      ) => {
        const names: string[] =
          [];

        const visited =
          new Set<string>();

        let current:
          | CategoryRow
          | undefined =
          category;

        while (
          current &&
          !visited.has(
            current.id
          )
        ) {
          visited.add(
            current.id
          );

          names.unshift(
            current.name
          );

          current =
            current.parent_id
              ? categoryMap.get(
                  current.parent_id
                )
              : undefined;
        }

        return names.join(
          " › "
        );
      };

      const sectionOrder = (
        section: string
      ) => {
        if (
          section === "books"
        ) {
          return 0;
        }

        if (
          section ===
          "fashion"
        ) {
          return 1;
        }

        return 2;
      };

      return [
        ...categories,
      ]
        .sort((a, b) => {
          const sectionCompare =
            sectionOrder(
              a.store_section
            ) -
            sectionOrder(
              b.store_section
            );

          if (
            sectionCompare !== 0
          ) {
            return sectionCompare;
          }

          return getPath(a)
            .localeCompare(
              getPath(b)
            );
        })
        .map(
          (category) => ({
            ...category,
            depth:
              getDepth(
                category
              ),
          })
        );
    }, [
      categories,
      categoryMap,
    ]);

  const loadCoupons =
    async () => {
      if (!supabase) {
        router.push(
          "/account"
        );

        return;
      }

      setLoading(true);
      setErrorMessage("");
      setCategoryLoadFailed(
        false
      );

      try {
        const {
          data: { user },
        } =
          await supabase.auth.getUser();

        if (!user) {
          router.push(
            "/account"
          );

          return;
        }

        const {
          data: profile,
          error:
            profileError,
        } =
          await supabase
            .from(
              "profiles"
            )
            .select(
              "role, is_active"
            )
            .eq(
              "id",
              user.id
            )
            .single();

        if (
          profileError ||
          !profile ||
          !profile.is_active ||
          ![
            "owner",
            "admin",
            "staff",
          ].includes(
            profile.role
          )
        ) {
          router.push(
            "/account"
          );

          return;
        }

        const [
          viewResult,
          manageResult,
        ] =
          await Promise.all(
            [
              supabase.rpc(
                "has_permission",
                {
                  required_permission:
                    "coupons.view",
                }
              ),

              supabase.rpc(
                "has_permission",
                {
                  required_permission:
                    "coupons.manage",
                }
              ),
            ]
          );

        const viewAllowed =
          viewResult.data ===
          true;

        const manageAllowed =
          manageResult.data ===
          true;

        setCanView(
          viewAllowed
        );

        setCanManage(
          manageAllowed
        );

        if (
          !viewAllowed &&
          !manageAllowed
        ) {
          router.push(
            "/admin"
          );

          return;
        }

        const [
          couponResult,
          categoryResult,
        ] =
          await Promise.all(
            [
              supabase
                .from(
                  "coupons"
                )
                .select(
                  `
                  id,
                  code,
                  discount_type,
                  discount_value,
                  min_order_amount,
                  max_discount_amount,
                  usage_limit,
                  used_count,
                  starts_at,
                  expires_at,
                  is_active,
                  scope_type,
                  scope_category_id,
                  created_at,
                  updated_at
                  `
                )
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  }
                ),

              supabase
                .from(
                  "categories"
                )
                .select(
                  `
                  id,
                  name,
                  slug,
                  store_section,
                  parent_id,
                  sort_order,
                  is_active
                  `
                )
                .order(
                  "store_section",
                  {
                    ascending:
                      true,
                  }
                )
                .order(
                  "sort_order",
                  {
                    ascending:
                      true,
                  }
                )
                .order(
                  "name",
                  {
                    ascending:
                      true,
                  }
                ),
            ]
          );

        if (
          couponResult.error
        ) {
          throw couponResult.error;
        }

        setCoupons(
          (
            couponResult.data ??
            []
          ) as CouponRow[]
        );

        if (
          categoryResult.error
        ) {
          console.error(
            "Coupon categories error:",
            categoryResult.error.message
          );

          setCategoryLoadFailed(
            true
          );

          setCategories([]);
        } else {
          setCategories(
            (
              categoryResult.data ??
              []
            ) as CategoryRow[]
          );
        }
      } catch (error) {
        const pageError =
          error as {
            message?: string;
          };

        setErrorMessage(
          pageError.message ||
            "Could not load coupons."
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  useEffect(() => {
    loadCoupons();
  }, []);

  const counts =
    useMemo(() => {
      const result = {
        all: coupons.length,
        active: 0,
        scheduled: 0,
        expired: 0,
        disabled: 0,
        exhausted: 0,
      };

      coupons.forEach(
        (coupon) => {
          const state =
            getCouponState(
              coupon
            );

          result[state] +=
            1;
        }
      );

      return result;
    }, [coupons]);

  const visibleCoupons =
    useMemo(() => {
      const cleanSearch =
        search
          .trim()
          .toLowerCase();

      return coupons.filter(
        (coupon) => {
          const state =
            getCouponState(
              coupon
            );

          const matchesFilter =
            filter ===
              "all" ||
            state === filter;

          const scopeLabel =
            coupon.scope_type ===
            "category"
              ? getCategoryPath(
                  coupon.scope_category_id
                )
              : simpleScopeLabel(
                  coupon.scope_type
                );

          const matchesSearch =
            !cleanSearch ||
            coupon.code
              .toLowerCase()
              .includes(
                cleanSearch
              ) ||
            scopeLabel
              .toLowerCase()
              .includes(
                cleanSearch
              );

          return (
            matchesFilter &&
            matchesSearch
          );
        }
      );
    }, [
      coupons,
      filter,
      search,
      categoryMap,
    ]);

  const openNewCoupon =
    () => {
      if (!canManage) {
        return;
      }

      setForm(
        emptyForm
      );

      setMessage("");
      setErrorMessage("");
      setFormOpen(true);
    };

  const openEditCoupon =
    (
      coupon: CouponRow
    ) => {
      if (!canManage) {
        return;
      }

      setForm({
        id: coupon.id,

        code:
          coupon.code,

        discountType:
          coupon.discount_type,

        discountValue:
          String(
            coupon.discount_value
          ),

        minOrderAmount:
          String(
            coupon.min_order_amount
          ),

        maxDiscountAmount:
          coupon.max_discount_amount ===
          null
            ? ""
            : String(
                coupon.max_discount_amount
              ),

        usageLimit:
          coupon.usage_limit ===
          null
            ? ""
            : String(
                coupon.usage_limit
              ),

        startsAt:
          toLocalInputValue(
            coupon.starts_at
          ),

        expiresAt:
          toLocalInputValue(
            coupon.expires_at
          ),

        isActive:
          coupon.is_active,

        scopeType:
          coupon.scope_type ??
          "all",

        scopeCategoryId:
          coupon.scope_category_id ??
          "",
      });

      setMessage("");
      setErrorMessage("");
      setFormOpen(true);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  const resetForm =
    () => {
      setForm(
        emptyForm
      );

      setFormOpen(false);
    };

  const handleSave =
    async (
      event: React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (
        !supabase ||
        !canManage
      ) {
        return;
      }

      setMessage("");
      setErrorMessage("");

      const code =
        form.code
          .trim()
          .toUpperCase();

      const discountValue =
        Number(
          form.discountValue
        );

      const minOrder =
        Number(
          form.minOrderAmount ||
            0
        );

      const maxDiscount =
        form.maxDiscountAmount.trim()
          ? Number(
              form.maxDiscountAmount
            )
          : null;

      const usageLimit =
        form.usageLimit.trim()
          ? Number(
              form.usageLimit
            )
          : null;

      const startsAt =
        toIsoOrNull(
          form.startsAt
        );

      const expiresAt =
        toIsoOrNull(
          form.expiresAt
        );

      if (!code) {
        setErrorMessage(
          "Coupon code is required."
        );

        return;
      }

      if (
        code.length > 50
      ) {
        setErrorMessage(
          "Coupon code must be 50 characters or shorter."
        );

        return;
      }

      if (
        !Number.isFinite(
          discountValue
        ) ||
        discountValue <= 0
      ) {
        setErrorMessage(
          "Discount value must be greater than 0."
        );

        return;
      }

      if (
        form.discountType ===
          "percentage" &&
        discountValue >
          100
      ) {
        setErrorMessage(
          "Percentage discount cannot be more than 100%."
        );

        return;
      }

      if (
        !Number.isFinite(
          minOrder
        ) ||
        minOrder < 0
      ) {
        setErrorMessage(
          "Minimum order amount cannot be negative."
        );

        return;
      }

      if (
        maxDiscount !==
          null &&
        (
          !Number.isFinite(
            maxDiscount
          ) ||
          maxDiscount <= 0
        )
      ) {
        setErrorMessage(
          "Maximum discount must be greater than 0."
        );

        return;
      }

      if (
        usageLimit !==
          null &&
        (
          !Number.isInteger(
            usageLimit
          ) ||
          usageLimit <= 0
        )
      ) {
        setErrorMessage(
          "Usage limit must be a positive whole number."
        );

        return;
      }

      if (
        startsAt &&
        expiresAt &&
        new Date(
          startsAt
        ).getTime() >=
          new Date(
            expiresAt
          ).getTime()
      ) {
        setErrorMessage(
          "Expiry time must be after the start time."
        );

        return;
      }

      if (
        form.scopeType ===
          "category" &&
        !form.scopeCategoryId
      ) {
        setErrorMessage(
          "Select a category for this coupon."
        );

        return;
      }

      if (
        form.scopeType ===
          "category"
      ) {
        const selectedCategory =
          categoryMap.get(
            form.scopeCategoryId
          );

        if (!selectedCategory) {
          setErrorMessage(
            "The selected category could not be found."
          );

          return;
        }

        if (
          !selectedCategory.is_active
        ) {
          setErrorMessage(
            "Choose an active category for this coupon."
          );

          return;
        }
      }

      const existingCoupon =
        form.id
          ? coupons.find(
              (coupon) =>
                coupon.id ===
                form.id
            )
          : null;

      if (
        existingCoupon &&
        usageLimit !==
          null &&
        usageLimit <
          existingCoupon.used_count
      ) {
        setErrorMessage(
          `Usage limit cannot be lower than the current used count (${existingCoupon.used_count}).`
        );

        return;
      }

      setSaving(true);

      try {
        const payload = {
          code,

          discount_type:
            form.discountType,

          discount_value:
            discountValue,

          min_order_amount:
            minOrder,

          max_discount_amount:
            maxDiscount,

          usage_limit:
            usageLimit,

          starts_at:
            startsAt,

          expires_at:
            expiresAt,

          is_active:
            form.isActive,

          scope_type:
            form.scopeType,

          scope_category_id:
            form.scopeType ===
            "category"
              ? form.scopeCategoryId
              : null,
        };

        if (form.id) {
          const {
            error,
          } =
            await supabase
              .from(
                "coupons"
              )
              .update(
                payload
              )
              .eq(
                "id",
                form.id
              );

          if (error) {
            throw error;
          }

          setMessage(
            "Coupon updated successfully."
          );
        } else {
          const {
            error,
          } =
            await supabase
              .from(
                "coupons"
              )
              .insert(
                payload
              );

          if (error) {
            throw error;
          }

          setMessage(
            "Coupon created successfully."
          );
        }

        resetForm();

        await loadCoupons();
      } catch (error) {
        const saveError =
          error as {
            code?: string;
            message?: string;
          };

        if (
          saveError.code ===
          "23505"
        ) {
          setErrorMessage(
            "That coupon code already exists."
          );
        } else {
          setErrorMessage(
            saveError.message ||
              "Could not save coupon."
          );
        }
      } finally {
        setSaving(false);
      }
    };

  const toggleCoupon =
    async (
      coupon: CouponRow
    ) => {
      if (
        !supabase ||
        !canManage
      ) {
        return;
      }

      setWorkingId(
        coupon.id
      );

      setMessage("");
      setErrorMessage("");

      try {
        const {
          error,
        } =
          await supabase
            .from(
              "coupons"
            )
            .update({
              is_active:
                !coupon.is_active,
            })
            .eq(
              "id",
              coupon.id
            );

        if (error) {
          throw error;
        }

        setMessage(
          coupon.is_active
            ? "Coupon disabled."
            : "Coupon enabled."
        );

        await loadCoupons();
      } catch (error) {
        const actionError =
          error as {
            message?: string;
          };

        setErrorMessage(
          actionError.message ||
            "Could not update coupon."
        );
      } finally {
        setWorkingId(
          null
        );
      }
    };

  const deleteCoupon =
    async (
      coupon: CouponRow
    ) => {
      if (
        !supabase ||
        !canManage
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete coupon ${coupon.code}? Existing orders will keep their saved coupon code and discount history.`
        );

      if (!confirmed) {
        return;
      }

      setWorkingId(
        coupon.id
      );

      setMessage("");
      setErrorMessage("");

      try {
        const {
          error,
        } =
          await supabase
            .from(
              "coupons"
            )
            .delete()
            .eq(
              "id",
              coupon.id
            );

        if (error) {
          throw error;
        }

        setMessage(
          "Coupon deleted."
        );

        await loadCoupons();
      } catch (error) {
        const actionError =
          error as {
            message?: string;
          };

        setErrorMessage(
          actionError.message ||
            "Could not delete coupon."
        );
      } finally {
        setWorkingId(
          null
        );
      }
    };

  return (
    <>
      <Header />

      <main className="section-shell page-space">
        <section className="coupon-admin-header">
          <div>
            <div className="eyebrow">
              COUPON CONTROL
            </div>

            <h1>
              Coupons
            </h1>

            <p>
              Create store-wide, Books,
              Fashion or category-specific
              discount codes for JIPLANCE
              checkout.
            </p>
          </div>

          <div className="coupon-header-actions">
            <a
              href="/admin"
              className="ghost-button"
            >
              ← Dashboard
            </a>

            {canManage && (
              <button
                type="button"
                className="primary-button"
                onClick={
                  openNewCoupon
                }
              >
                + New Coupon
              </button>
            )}
          </div>
        </section>

        {errorMessage && (
          <div className="coupon-message error">
            {errorMessage}
          </div>
        )}

        {message && (
          <div className="coupon-message success">
            ✓ {message}
          </div>
        )}

        {formOpen &&
          canManage && (
            <form
              className="coupon-form-card"
              onSubmit={
                handleSave
              }
            >
              <div className="coupon-form-heading">
                <div>
                  <div className="eyebrow">
                    {form.id
                      ? "EDIT COUPON"
                      : "CREATE COUPON"}
                  </div>

                  <h2>
                    {form.id
                      ? "Update discount"
                      : "New discount code"}
                  </h2>
                </div>

                <button
                  type="button"
                  className="coupon-close-button"
                  onClick={
                    resetForm
                  }
                  disabled={
                    saving
                  }
                >
                  ✕
                </button>
              </div>

              <div className="scope-section">
                <div className="scope-heading">
                  <div>
                    <strong>
                      Applies To
                    </strong>

                    <span>
                      Choose which products
                      are eligible for this
                      coupon.
                    </span>
                  </div>

                  <span className="scope-pill">
                    {form.scopeType ===
                    "category"
                      ? form.scopeCategoryId
                        ? getCategoryPath(
                            form.scopeCategoryId
                          )
                        : "Choose Category"
                      : simpleScopeLabel(
                          form.scopeType
                        )}
                  </span>
                </div>

                <div className="scope-grid">
                  {(
                    [
                      {
                        value: "all",
                        title:
                          "All Products",
                        description:
                          "Books + Fashion",
                      },
                      {
                        value: "books",
                        title:
                          "Books Only",
                        description:
                          "All book products",
                      },
                      {
                        value: "fashion",
                        title:
                          "Fashion Only",
                        description:
                          "All fashion products",
                      },
                      {
                        value:
                          "category",
                        title:
                          "Specific Category",
                        description:
                          "Category + subcategories",
                      },
                    ] as {
                      value: CouponScope;
                      title: string;
                      description: string;
                    }[]
                  ).map(
                    (option) => (
                      <button
                        key={
                          option.value
                        }
                        type="button"
                        className={`scope-option ${
                          form.scopeType ===
                          option.value
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          setForm(
                            (
                              current
                            ) => ({
                              ...current,

                              scopeType:
                                option.value,

                              scopeCategoryId:
                                option.value ===
                                "category"
                                  ? current.scopeCategoryId
                                  : "",
                            })
                          )
                        }
                        disabled={
                          saving
                        }
                      >
                        <span className="scope-check">
                          {form.scopeType ===
                          option.value
                            ? "✓"
                            : ""}
                        </span>

                        <span>
                          <strong>
                            {option.title}
                          </strong>

                          <small>
                            {
                              option.description
                            }
                          </small>
                        </span>
                      </button>
                    )
                  )}
                </div>

                {form.scopeType ===
                  "category" && (
                  <div className="category-target">
                    <label>
                      Target Category

                      <select
                        value={
                          form.scopeCategoryId
                        }
                        onChange={(e) =>
                          setForm(
                            (
                              current
                            ) => ({
                              ...current,

                              scopeCategoryId:
                                e.target.value,
                            })
                          )
                        }
                        disabled={
                          saving ||
                          categoryLoadFailed
                        }
                      >
                        <option value="">
                          Select a category
                        </option>

                        {categoryOptions.map(
                          (category) => (
                            <option
                              key={
                                category.id
                              }
                              value={
                                category.id
                              }
                              disabled={
                                !category.is_active
                              }
                            >
                              {category.store_section ===
                              "books"
                                ? "Books"
                                : category.store_section ===
                                  "fashion"
                                ? "Fashion"
                                : category.store_section}
                              {" — "}
                              {"— ".repeat(
                                category.depth
                              )}
                              {category.name}
                              {!category.is_active
                                ? " (Inactive)"
                                : ""}
                            </option>
                          )
                        )}
                      </select>

                      <small>
                        The selected
                        category and all of
                        its subcategories
                        will be eligible.
                      </small>
                    </label>

                    {categoryLoadFailed && (
                      <div className="category-warning">
                        Category list could
                        not be loaded for
                        this account. Check
                        category-view access
                        or use Owner/Admin
                        while configuring a
                        category coupon.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="coupon-form-grid">
                <label>
                  Coupon Code

                  <input
                    value={
                      form.code
                    }
                    onChange={(e) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,

                          code:
                            e.target.value.toUpperCase(),
                        })
                      )
                    }
                    placeholder="WELCOME10"
                    maxLength={
                      50
                    }
                    disabled={
                      saving
                    }
                  />
                </label>

                <label>
                  Discount Type

                  <select
                    value={
                      form.discountType
                    }
                    onChange={(e) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,

                          discountType:
                            e.target
                              .value as
                              | "percentage"
                              | "fixed",
                        })
                      )
                    }
                    disabled={
                      saving
                    }
                  >
                    <option value="percentage">
                      Percentage
                    </option>

                    <option value="fixed">
                      Fixed Amount
                    </option>
                  </select>
                </label>

                <label>
                  {form.discountType ===
                  "percentage"
                    ? "Discount Percentage"
                    : "Discount Amount"}

                  <input
                    type="number"
                    min="0.01"
                    max={
                      form.discountType ===
                      "percentage"
                        ? 100
                        : undefined
                    }
                    step="0.01"
                    value={
                      form.discountValue
                    }
                    onChange={(e) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,

                          discountValue:
                            e.target.value,
                        })
                      )
                    }
                    placeholder={
                      form.discountType ===
                      "percentage"
                        ? "10"
                        : "100"
                    }
                    disabled={
                      saving
                    }
                  />
                </label>

                <label>
                  Minimum Eligible Order

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.minOrderAmount
                    }
                    onChange={(e) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,

                          minOrderAmount:
                            e.target.value,
                        })
                      )
                    }
                    placeholder="0"
                    disabled={
                      saving
                    }
                  />

                  <small>
                    For scoped coupons,
                    only eligible items
                    count toward this
                    minimum.
                  </small>
                </label>

                <label>
                  Maximum Discount

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={
                      form.maxDiscountAmount
                    }
                    onChange={(e) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,

                          maxDiscountAmount:
                            e.target.value,
                        })
                      )
                    }
                    placeholder="No limit"
                    disabled={
                      saving
                    }
                  />

                  <small>
                    Optional. Useful for
                    percentage coupons.
                  </small>
                </label>

                <label>
                  Usage Limit

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={
                      form.usageLimit
                    }
                    onChange={(e) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,

                          usageLimit:
                            e.target.value,
                        })
                      )
                    }
                    placeholder="Unlimited"
                    disabled={
                      saving
                    }
                  />
                </label>

                <label>
                  Starts At

                  <input
                    type="datetime-local"
                    value={
                      form.startsAt
                    }
                    onChange={(e) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,

                          startsAt:
                            e.target.value,
                        })
                      )
                    }
                    disabled={
                      saving
                    }
                  />

                  <small>
                    Leave empty to start
                    immediately.
                  </small>
                </label>

                <label>
                  Expires At

                  <input
                    type="datetime-local"
                    value={
                      form.expiresAt
                    }
                    onChange={(e) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,

                          expiresAt:
                            e.target.value,
                        })
                      )
                    }
                    disabled={
                      saving
                    }
                  />

                  <small>
                    Leave empty for no
                    expiry.
                  </small>
                </label>
              </div>

              <div className="coupon-active-row">
                <label className="coupon-toggle">
                  <input
                    type="checkbox"
                    checked={
                      form.isActive
                    }
                    onChange={(e) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,

                          isActive:
                            e.target.checked,
                        })
                      )
                    }
                    disabled={
                      saving
                    }
                  />

                  <span />

                  <div>
                    <strong>
                      Coupon Active
                    </strong>

                    <small>
                      Customers can use it
                      only while enabled
                      and within its scope,
                      date and usage rules.
                    </small>
                  </div>
                </label>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Saving..."
                    : form.id
                    ? "Save Changes"
                    : "Create Coupon"}
                </button>
              </div>
            </form>
          )}

        {!loading && (
          <section className="coupon-stats">
            <article>
              <span>
                Total
              </span>

              <strong>
                {counts.all}
              </strong>
            </article>

            <article>
              <span>
                Active
              </span>

              <strong>
                {counts.active}
              </strong>
            </article>

            <article>
              <span>
                Scheduled
              </span>

              <strong>
                {counts.scheduled}
              </strong>
            </article>

            <article>
              <span>
                Expired
              </span>

              <strong>
                {counts.expired}
              </strong>
            </article>
          </section>
        )}

        <section className="coupon-toolbar">
          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search code or scope..."
          />

          <div className="coupon-tabs">
            {(
              [
                "all",
                "active",
                "scheduled",
                "expired",
                "disabled",
                "exhausted",
              ] as CouponFilter[]
            ).map(
              (
                item
              ) => (
                <button
                  key={
                    item
                  }
                  type="button"
                  className={
                    filter ===
                    item
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setFilter(
                      item
                    )
                  }
                >
                  {item ===
                  "all"
                    ? "All"
                    : item ===
                      "active"
                    ? "Active"
                    : item ===
                      "scheduled"
                    ? "Scheduled"
                    : item ===
                      "expired"
                    ? "Expired"
                    : item ===
                      "disabled"
                    ? "Disabled"
                    : "Limit Reached"}
                </button>
              )
            )}
          </div>
        </section>

        {!canManage &&
          !loading && (
            <div className="coupon-readonly">
              View-only access. Coupon
              modification controls are
              hidden.
            </div>
          )}

        {loading ? (
          <section className="coupon-loading">
            <span />

            Loading coupons...
          </section>
        ) : visibleCoupons.length ===
          0 ? (
          <section className="coupon-empty">
            <div>
              %
            </div>

            <h2>
              No coupons found
            </h2>

            <p>
              Create your first coupon
              or change the current
              filter.
            </p>
          </section>
        ) : (
          <section className="coupon-grid">
            {visibleCoupons.map(
              (
                coupon,
                index
              ) => {
                const state =
                  getCouponState(
                    coupon
                  );

                const usagePercentage =
                  coupon.usage_limit ===
                  null
                    ? 0
                    : Math.min(
                        Math.round(
                          (coupon.used_count /
                            coupon.usage_limit) *
                            100
                        ),
                        100
                      );

                const scopeLabel =
                  coupon.scope_type ===
                  "category"
                    ? getCategoryPath(
                        coupon.scope_category_id
                      )
                    : simpleScopeLabel(
                        coupon.scope_type
                      );

                return (
                  <article
                    key={
                      coupon.id
                    }
                    className="coupon-card"
                    style={{
                      animationDelay: `${Math.min(
                        index *
                          45,
                        220
                      )}ms`,
                    }}
                  >
                    <div className="coupon-card-top">
                      <div>
                        <span className="coupon-label">
                          COUPON CODE
                        </span>

                        <h2>
                          {
                            coupon.code
                          }
                        </h2>
                      </div>

                      <span
                        className={`coupon-status ${state}`}
                      >
                        {stateLabel(
                          state
                        )}
                      </span>
                    </div>

                    <div className="coupon-scope-banner">
                      <span>
                        APPLIES TO
                      </span>

                      <strong>
                        {scopeLabel}
                      </strong>

                      {coupon.scope_type ===
                        "category" && (
                        <small>
                          Includes
                          subcategories
                        </small>
                      )}
                    </div>

                    <div className="coupon-discount">
                      <strong>
                        {coupon.discount_type ===
                        "percentage"
                          ? `${Number(
                              coupon.discount_value
                            )}%`
                          : `৳${Number(
                              coupon.discount_value
                            )}`}
                      </strong>

                      <span>
                        {coupon.discount_type ===
                        "percentage"
                          ? "percentage discount"
                          : "fixed discount"}
                      </span>
                    </div>

                    <div className="coupon-details">
                      <div>
                        <span>
                          Min Eligible Order
                        </span>

                        <strong>
                          ৳
                          {Number(
                            coupon.min_order_amount
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Max Discount
                        </span>

                        <strong>
                          {coupon.max_discount_amount ===
                          null
                            ? "No limit"
                            : `৳${Number(
                                coupon.max_discount_amount
                              )}`}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Starts
                        </span>

                        <strong>
                          {coupon.starts_at
                            ? formatDate(
                                coupon.starts_at
                              )
                            : "Immediately"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Expires
                        </span>

                        <strong>
                          {coupon.expires_at
                            ? formatDate(
                                coupon.expires_at
                              )
                            : "No expiry"}
                        </strong>
                      </div>
                    </div>

                    <div className="coupon-usage">
                      <div className="coupon-usage-copy">
                        <span>
                          Usage
                        </span>

                        <strong>
                          {
                            coupon.used_count
                          }
                          {coupon.usage_limit ===
                          null
                            ? " / Unlimited"
                            : ` / ${coupon.usage_limit}`}
                        </strong>
                      </div>

                      {coupon.usage_limit !==
                        null && (
                        <div className="coupon-usage-track">
                          <span
                            style={{
                              width: `${usagePercentage}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {canManage && (
                      <div className="coupon-card-actions">
                        <button
                          type="button"
                          onClick={() =>
                            openEditCoupon(
                              coupon
                            )
                          }
                          disabled={
                            workingId ===
                            coupon.id
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleCoupon(
                              coupon
                            )
                          }
                          disabled={
                            workingId ===
                            coupon.id
                          }
                        >
                          {coupon.is_active
                            ? "Disable"
                            : "Enable"}
                        </button>

                        <button
                          type="button"
                          className="delete"
                          onClick={() =>
                            deleteCoupon(
                              coupon
                            )
                          }
                          disabled={
                            workingId ===
                            coupon.id
                          }
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </article>
                );
              }
            )}
          </section>
        )}
      </main>

      <Footer />

      <style jsx>{`
        .coupon-admin-header {
          display: flex;
          justify-content:
            space-between;
          align-items:
            flex-end;
          gap: 24px;
          padding: 28px 0 26px;
        }

        .coupon-admin-header h1 {
          margin: 6px 0 10px;
          color: #1e2747;
          font-size:
            clamp(
              2.7rem,
              6vw,
              4.7rem
            );
          line-height: 0.95;
          letter-spacing:
            -0.06em;
        }

        .coupon-admin-header p {
          max-width: 620px;
          margin: 0;
          color: #7c8292;
          line-height: 1.7;
        }

        .coupon-header-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .coupon-message {
          margin-bottom: 18px;
          padding: 14px 16px;
          border-radius: 14px;
        }

        .coupon-message.success {
          background: #edf9f1;
          color: #2f7549;
        }

        .coupon-message.error {
          background: #fff1f1;
          color: #a23d3d;
        }

        .coupon-form-card {
          margin-bottom: 24px;
          padding: 25px;
          border: 1px solid
            #e4e7ed;
          border-radius: 24px;
          background: white;
          box-shadow:
            0 18px 50px
            rgba(
              31,
              41,
              77,
              0.055
            );
          animation:
            couponFormIn
            0.3s ease both;
        }

        .coupon-form-heading {
          display: flex;
          justify-content:
            space-between;
          align-items:
            flex-start;
          gap: 20px;
          margin-bottom: 22px;
        }

        .coupon-form-heading h2 {
          margin: 4px 0 0;
          color: #313951;
        }

        .coupon-close-button {
          width: 38px;
          height: 38px;
          border: 1px solid
            #e1e4ea;
          border-radius: 12px;
          background: white;
          color: #697084;
          cursor: pointer;
        }

        .scope-section {
          margin-bottom: 20px;
          padding: 18px;
          border: 1px solid
            #e6e8ef;
          border-radius: 19px;
          background:
            linear-gradient(
              145deg,
              #fbfcff,
              #f8f9fc
            );
        }

        .scope-heading {
          display: flex;
          align-items:
            flex-start;
          justify-content:
            space-between;
          gap: 16px;
          margin-bottom: 14px;
        }

        .scope-heading strong,
        .scope-heading span {
          display: block;
        }

        .scope-heading strong {
          color: #353d58;
          font-size: 0.9rem;
        }

        .scope-heading
          > div
          > span {
          margin-top: 3px;
          color: #8f95a5;
          font-size: 0.7rem;
        }

        .scope-pill {
          max-width: 300px;
          padding: 7px 10px;
          border: 1px solid
            #dce1ee;
          border-radius: 999px;
          background: white;
          color: #53628e;
          font-size: 0.66rem;
          font-weight: 800;
          text-align: right;
        }

        .scope-grid {
          display: grid;
          grid-template-columns:
            repeat(
              4,
              minmax(0, 1fr)
            );
          gap: 9px;
        }

        .scope-option {
          display: grid;
          grid-template-columns:
            auto 1fr;
          align-items: center;
          gap: 9px;
          min-height: 74px;
          padding: 11px;
          border: 1px solid
            #dfe3eb;
          border-radius: 14px;
          background: white;
          text-align: left;
          cursor: pointer;
          transition:
            transform
              0.18s ease,
            border-color
              0.18s ease,
            box-shadow
              0.18s ease;
        }

        .scope-option:hover {
          transform:
            translateY(-1px);
        }

        .scope-option.active {
          border-color:
            #566a9c;
          box-shadow:
            0 0 0 3px
            rgba(
              67,
              86,
              142,
              0.07
            );
        }

        .scope-check {
          display: grid;
          place-items: center;
          width: 25px;
          height: 25px;
          border: 1px solid
            #d9dee8;
          border-radius: 9px;
          color: white;
          font-size: 0.7rem;
        }

        .scope-option.active
          .scope-check {
          border-color:
            #344677;
          background: #344677;
        }

        .scope-option strong,
        .scope-option small {
          display: block;
        }

        .scope-option strong {
          color: #414960;
          font-size: 0.75rem;
        }

        .scope-option small {
          margin-top: 3px;
          color: #999eaa;
          font-size: 0.61rem;
        }

        .category-target {
          margin-top: 13px;
          padding-top: 13px;
          border-top: 1px solid
            #e6e9ef;
          animation:
            couponFormIn
            0.24s ease both;
        }

        .category-target label {
          display: grid;
          gap: 8px;
          color: #596175;
          font-size: 0.78rem;
          font-weight: 720;
        }

        .category-target small {
          color: #9a9fac;
          font-size: 0.67rem;
          font-weight: 500;
        }

        .category-warning {
          margin-top: 10px;
          padding: 10px 12px;
          border-radius: 11px;
          background: #fff5e8;
          color: #88611b;
          font-size: 0.7rem;
          line-height: 1.55;
        }

        .coupon-form-grid {
          display: grid;
          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );
          gap: 15px;
        }

        .coupon-form-grid label {
          display: grid;
          gap: 8px;
          color: #596175;
          font-size: 0.78rem;
          font-weight: 720;
        }

        .coupon-form-grid small {
          color: #9a9fac;
          font-size: 0.67rem;
          font-weight: 500;
        }

        .coupon-form-grid
          :global(input),
        .coupon-form-grid
          :global(select),
        .category-target
          :global(select),
        .coupon-toolbar
          :global(input) {
          width: 100%;
          box-sizing: border-box;
          padding: 13px 14px;
          border: 1px solid
            #dce0e7;
          border-radius: 13px;
          outline: none;
          background: #fafbfc;
          color: #293149;
          transition:
            border-color
              0.18s ease,
            box-shadow
              0.18s ease,
            background
              0.18s ease;
        }

        .coupon-form-grid
          :global(input:focus),
        .coupon-form-grid
          :global(select:focus),
        .category-target
          :global(select:focus),
        .coupon-toolbar
          :global(input:focus) {
          border-color:
            #7784a9;
          background: white;
          box-shadow:
            0 0 0 4px
            rgba(
              73,
              89,
              139,
              0.08
            );
        }

        .coupon-active-row {
          display: flex;
          justify-content:
            space-between;
          align-items: center;
          gap: 20px;
          margin-top: 22px;
          padding-top: 20px;
          border-top: 1px solid
            #edf0f4;
        }

        .coupon-toggle {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }

        .coupon-toggle
          :global(input) {
          display: none;
        }

        .coupon-toggle
          > span {
          position: relative;
          width: 46px;
          height: 25px;
          flex: 0 0 auto;
          border-radius: 999px;
          background: #d9dce4;
          transition:
            background
              0.2s ease;
        }

        .coupon-toggle
          > span::after {
          content: "";
          position: absolute;
          top: 3px;
          left: 3px;
          width: 19px;
          height: 19px;
          border-radius: 50%;
          background: white;
          box-shadow:
            0 2px 5px
            rgba(
              0,
              0,
              0,
              0.16
            );
          transition:
            transform
              0.2s ease;
        }

        .coupon-toggle
          :global(input:checked)
          + span {
          background: #273760;
        }

        .coupon-toggle
          :global(input:checked)
          + span::after {
          transform:
            translateX(
              21px
            );
        }

        .coupon-toggle
          strong,
        .coupon-toggle
          small {
          display: block;
        }

        .coupon-toggle strong {
          color: #353d56;
        }

        .coupon-toggle small {
          margin-top: 2px;
          color: #9297a5;
          font-size: 0.68rem;
          font-weight: 500;
        }

        .coupon-stats {
          display: grid;
          grid-template-columns:
            repeat(
              4,
              minmax(0, 1fr)
            );
          gap: 13px;
          margin-bottom: 20px;
        }

        .coupon-stats article {
          padding: 18px;
          border: 1px solid
            #e5e8ed;
          border-radius: 18px;
          background: white;
        }

        .coupon-stats span {
          display: block;
          margin-bottom: 5px;
          color: #9298a7;
          font-size: 0.66rem;
          font-weight: 800;
          letter-spacing:
            0.08em;
          text-transform:
            uppercase;
        }

        .coupon-stats strong {
          color: #26304e;
          font-size: 1.65rem;
        }

        .coupon-toolbar {
          display: flex;
          align-items: center;
          justify-content:
            space-between;
          gap: 14px;
          margin-bottom: 20px;
        }

        .coupon-toolbar
          :global(input) {
          max-width: 290px;
        }

        .coupon-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .coupon-tabs button {
          padding: 9px 12px;
          border: 1px solid
            #e1e4ea;
          border-radius: 999px;
          background: white;
          color: #737a8c;
          font-size: 0.7rem;
          font-weight: 750;
          cursor: pointer;
        }

        .coupon-tabs button.active {
          border-color:
            #283960;
          background: #283960;
          color: white;
        }

        .coupon-readonly {
          margin-bottom: 18px;
          padding: 12px 14px;
          border-radius: 13px;
          background: #f4f5f7;
          color: #737a8c;
          font-size: 0.75rem;
        }

        .coupon-grid {
          display: grid;
          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );
          gap: 17px;
          padding-bottom: 80px;
        }

        .coupon-card {
          overflow: hidden;
          border: 1px solid
            #e4e7ed;
          border-radius: 22px;
          background: white;
          opacity: 0;
          animation:
            couponCardIn
            0.38s ease forwards;
          transition:
            transform
              0.18s ease,
            box-shadow
              0.18s ease;
        }

        .coupon-card:hover {
          transform:
            translateY(-2px);
          box-shadow:
            0 16px 38px
            rgba(
              31,
              41,
              77,
              0.06
            );
        }

        .coupon-card-top {
          display: flex;
          align-items:
            flex-start;
          justify-content:
            space-between;
          gap: 16px;
          padding: 19px;
          border-bottom: 1px solid
            #eef0f4;
        }

        .coupon-label {
          display: block;
          margin-bottom: 4px;
          color: #a0a4b0;
          font-size: 0.61rem;
          font-weight: 850;
          letter-spacing:
            0.11em;
        }

        .coupon-card-top h2 {
          margin: 0;
          color: #26304c;
          font-size: 1.35rem;
          letter-spacing:
            0.02em;
        }

        .coupon-status {
          padding: 7px 9px;
          border-radius: 999px;
          font-size: 0.59rem;
          font-weight: 850;
          letter-spacing:
            0.05em;
        }

        .coupon-status.active {
          background: #e9f7ee;
          color: #34774b;
        }

        .coupon-status.scheduled {
          background: #edf1ff;
          color: #4d5f96;
        }

        .coupon-status.expired,
        .coupon-status.exhausted {
          background: #fff0e8;
          color: #a05d32;
        }

        .coupon-status.disabled {
          background: #f0f1f3;
          color: #727988;
        }

        .coupon-scope-banner {
          padding: 13px 19px;
          border-bottom: 1px solid
            #edf0f4;
          background:
            linear-gradient(
              90deg,
              #f5f7fd,
              #fafbff
            );
        }

        .coupon-scope-banner span,
        .coupon-scope-banner strong,
        .coupon-scope-banner small {
          display: block;
        }

        .coupon-scope-banner span {
          margin-bottom: 4px;
          color: #8992ab;
          font-size: 0.57rem;
          font-weight: 850;
          letter-spacing:
            0.09em;
        }

        .coupon-scope-banner strong {
          color: #40507c;
          font-size: 0.76rem;
          overflow-wrap:
            anywhere;
        }

        .coupon-scope-banner small {
          margin-top: 3px;
          color: #999fac;
          font-size: 0.62rem;
        }

        .coupon-discount {
          padding: 21px 19px 17px;
        }

        .coupon-discount
          strong {
          display: block;
          color: #1f2a4d;
          font-size: 2.1rem;
          letter-spacing:
            -0.04em;
        }

        .coupon-discount span {
          color: #9297a4;
          font-size: 0.72rem;
        }

        .coupon-details {
          display: grid;
          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );
          gap: 9px;
          padding: 0 19px 18px;
        }

        .coupon-details div {
          padding: 11px;
          border-radius: 13px;
          background: #f8f9fb;
        }

        .coupon-details span,
        .coupon-details strong {
          display: block;
        }

        .coupon-details span {
          margin-bottom: 4px;
          color: #9a9fac;
          font-size: 0.61rem;
        }

        .coupon-details strong {
          color: #4e566c;
          font-size: 0.73rem;
          overflow-wrap:
            anywhere;
        }

        .coupon-usage {
          padding: 15px 19px;
          border-top: 1px solid
            #eef0f4;
          background: #fafbfc;
        }

        .coupon-usage-copy {
          display: flex;
          justify-content:
            space-between;
          gap: 12px;
          margin-bottom: 8px;
          color: #6e7586;
          font-size: 0.7rem;
        }

        .coupon-usage-track {
          height: 6px;
          overflow: hidden;
          border-radius: 999px;
          background: #e5e8ed;
        }

        .coupon-usage-track span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background:
            linear-gradient(
              90deg,
              #344474,
              #7c8ac0
            );
        }

        .coupon-card-actions {
          display: flex;
          gap: 8px;
          padding: 14px 19px;
          border-top: 1px solid
            #edf0f4;
        }

        .coupon-card-actions button {
          flex: 1;
          min-height: 40px;
          border: 1px solid
            #dde1e8;
          border-radius: 11px;
          background: white;
          color: #596176;
          font-weight: 720;
          cursor: pointer;
        }

        .coupon-card-actions
          button.delete {
          border-color:
            #efdada;
          color: #a23d3d;
        }

        .coupon-card-actions
          button:disabled {
          opacity: 0.5;
          cursor: wait;
        }

        .coupon-loading,
        .coupon-empty {
          display: grid;
          place-items: center;
          min-height: 300px;
          padding: 40px;
          border: 1px dashed
            #dce0e8;
          border-radius: 22px;
          background: #fafbfc;
          color: #818798;
          text-align: center;
        }

        .coupon-loading {
          display: flex;
          gap: 10px;
        }

        .coupon-loading span {
          width: 18px;
          height: 18px;
          border: 2px solid
            #dadde5;
          border-top-color:
            #25345d;
          border-radius: 50%;
          animation:
            couponSpin
            0.8s linear infinite;
        }

        .coupon-empty div {
          font-size: 2.8rem;
          color: #556695;
        }

        .coupon-empty h2 {
          margin: 5px 0 0;
          color: #343b55;
        }

        .coupon-empty p {
          margin: 0;
          color: #8a909f;
        }

        @keyframes couponFormIn {
          from {
            opacity: 0;
            transform:
              translateY(-8px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0);
          }
        }

        @keyframes couponCardIn {
          from {
            opacity: 0;
            transform:
              translateY(8px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0);
          }
        }

        @keyframes couponSpin {
          to {
            transform:
              rotate(360deg);
          }
        }

        @media (
          max-width: 1050px
        ) {
          .scope-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );
          }
        }

        @media (
          max-width: 900px
        ) {
          .coupon-admin-header {
            align-items:
              flex-start;
            flex-direction:
              column;
          }

          .coupon-grid {
            grid-template-columns:
              1fr;
          }

          .coupon-stats {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );
          }

          .coupon-toolbar {
            align-items:
              stretch;
            flex-direction:
              column;
          }

          .coupon-toolbar
            :global(input) {
            max-width: none;
          }
        }

        @media (
          max-width: 650px
        ) {
          .coupon-form-grid,
          .scope-grid {
            grid-template-columns:
              1fr;
          }

          .scope-heading {
            flex-direction:
              column;
          }

          .scope-pill {
            max-width: 100%;
            text-align: left;
          }

          .coupon-active-row {
            align-items:
              flex-start;
            flex-direction:
              column;
          }

          .coupon-details {
            grid-template-columns:
              1fr;
          }
        }

        @media (
          prefers-reduced-motion:
            reduce
        ) {
          .coupon-card,
          .coupon-form-card,
          .coupon-loading
            span,
          .category-target {
            animation: none;
          }

          .coupon-card,
          .scope-option,
          .coupon-toggle
            > span,
          .coupon-toggle
            > span::after {
            transition: none;
          }
        }
      `}</style>
    </>
  );
}