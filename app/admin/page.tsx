import Header from "@/components/Header";
import Footer from "@/components/Footer";

import {
  createSupabaseServerClient,
} from "@/lib/supabase-server";

import {
  redirect,
} from "next/navigation";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  product_type: string;
  book_section:
    | string
    | null;
  fashion_section:
    | string
    | null;
  category:
    | string
    | null;
  price: number;
  discount_price:
    | number
    | null;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
};

type OrderRow = {
  id: string;
  status: string;
  payment_status: string;
};

type NewsletterStats = {
  total: number;
  active: number;
  joined_today: number;
  joined_this_month: number;
};

export default async function AdminPage() {
  const supabase =
    await createSupabaseServerClient();

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/account"
    );
  }

  const {
    data:
      profile,

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
    redirect(
      "/account"
    );
  }

  const isOwner =
    profile.role ===
    "owner";

  /*
   * =========================================================
   * PERMISSIONS
   *
   * has_permission() is the central
   * permission resolver.
   * =========================================================
   */

  const [
    productsViewResult,
    productsCreateResult,
    productsEditResult,
    stockViewResult,

    ordersViewResult,
    paymentsViewResult,
    paymentsVerifyResult,

    categoriesViewResult,
    categoriesCreateResult,
    categoriesEditResult,
    categoriesDeleteResult,

    reviewsViewResult,
    reviewsManageResult,

    couponsViewResult,
    couponsManageResult,

    newsletterViewResult,
  ] =
    await Promise.all([
      supabase.rpc(
        "has_permission",
        {
          required_permission:
            "products.view",
        }
      ),

      supabase.rpc(
        "has_permission",
        {
          required_permission:
            "products.create",
        }
      ),

      supabase.rpc(
        "has_permission",
        {
          required_permission:
            "products.edit",
        }
      ),

      supabase.rpc(
        "has_permission",
        {
          required_permission:
            "stock.view",
        }
      ),

      supabase.rpc(
        "has_permission",
        {
          required_permission:
            "orders.view",
        }
      ),

      supabase.rpc(
        "has_permission",
        {
          required_permission:
            "payments.view",
        }
      ),

      supabase.rpc(
        "has_permission",
        {
          required_permission:
            "payments.verify",
        }
      ),

      supabase.rpc(
        "has_permission",
        {
          required_permission:
            "categories.view",
        }
      ),

      supabase.rpc(
        "has_permission",
        {
          required_permission:
            "categories.create",
        }
      ),

      supabase.rpc(
        "has_permission",
        {
          required_permission:
            "categories.edit",
        }
      ),

      supabase.rpc(
        "has_permission",
        {
          required_permission:
            "categories.delete",
        }
      ),

      supabase.rpc(
        "has_permission",
        {
          required_permission:
            "reviews.view",
        }
      ),

      supabase.rpc(
        "has_permission",
        {
          required_permission:
            "reviews.manage",
        }
      ),

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

      supabase.rpc(
        "has_permission",
        {
          required_permission:
            "newsletter.view",
        }
      ),
    ]);

  /*
   * =========================================================
   * PERMISSION FLAGS
   * =========================================================
   */

  const canViewProducts =
    productsViewResult.data ===
    true;

  const canCreateProducts =
    productsCreateResult.data ===
    true;

  const canEditProducts =
    productsEditResult.data ===
    true;

  const canViewStock =
    stockViewResult.data ===
    true;

  const canViewOrders =
    ordersViewResult.data ===
    true;

  const canViewPayments =
    paymentsViewResult.data ===
    true;

  const canVerifyPayments =
    paymentsVerifyResult.data ===
    true;

  const canViewCategories =
    categoriesViewResult.data ===
    true;

  const canCreateCategories =
    categoriesCreateResult.data ===
    true;

  const canEditCategories =
    categoriesEditResult.data ===
    true;

  const canDeleteCategories =
    categoriesDeleteResult.data ===
    true;

  const canViewReviews =
    reviewsViewResult.data ===
    true;

  const canManageReviews =
    reviewsManageResult.data ===
    true;

  const canViewCoupons =
    couponsViewResult.data ===
    true;

  const canManageCoupons =
    couponsManageResult.data ===
    true;

  const canViewNewsletter =
    newsletterViewResult.data ===
    true;

  const canSeePaymentInformation =
    canViewPayments ||
    canVerifyPayments;

  const canManageCategories =
    canViewCategories ||
    canCreateCategories ||
    canEditCategories ||
    canDeleteCategories;

  const hasReviewAccess =
    canViewReviews ||
    canManageReviews;

  const hasCouponAccess =
    canViewCoupons ||
    canManageCoupons;

  /*
   * =========================================================
   * TEAM MANAGEMENT
   * =========================================================
   */

  let canManageStaff =
    false;

  if (isOwner) {
    canManageStaff =
      true;
  } else if (
    profile.role ===
    "admin"
  ) {
    const staffManagementPermissions =
      [
        "staff.view",
        "staff.create",
        "staff.disable",
        "staff.manage_permissions",
      ];

    const staffPermissionChecks =
      await Promise.all(
        staffManagementPermissions.map(
          (
            permission
          ) =>
            supabase.rpc(
              "has_permission",
              {
                required_permission:
                  permission,
              }
            )
        )
      );

    canManageStaff =
      staffPermissionChecks.every(
        (
          result
        ) =>
          !result.error &&
          result.data ===
            true
      );
  }

  /*
   * =========================================================
   * PRODUCTS
   * =========================================================
   */

  let products:
    ProductRow[] =
    [];

  let productErrorMessage =
    "";

  if (
    canViewProducts ||
    canViewStock ||
    canCreateProducts ||
    canEditProducts
  ) {
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
          slug,
          product_type,
          book_section,
          fashion_section,
          category,
          price,
          discount_price,
          stock,
          is_active,
          is_featured,
          created_at
          `
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        );

    if (
      productError
    ) {
      console.error(
        "Admin products error:",
        productError.message
      );

      productErrorMessage =
        productError.message;
    } else {
      products =
        (
          productData ??
          []
        ) as ProductRow[];
    }
  }

  /*
   * =========================================================
   * ORDERS
   * =========================================================
   */

  let orders:
    OrderRow[] =
    [];

  let orderErrorMessage =
    "";

  if (
    canViewOrders ||
    canSeePaymentInformation
  ) {
    const {
      data:
        orderData,

      error:
        orderError,
    } =
      await supabase
        .from(
          "orders"
        )
        .select(
          `
          id,
          status,
          payment_status
          `
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        );

    if (
      orderError
    ) {
      console.error(
        "Admin orders error:",
        orderError.message
      );

      orderErrorMessage =
        orderError.message;
    } else {
      orders =
        (
          orderData ??
          []
        ) as OrderRow[];
    }
  }

  /*
   * =========================================================
   * NEWSLETTER STATS
   * =========================================================
   */

  let newsletterStats:
    NewsletterStats = {
      total: 0,
      active: 0,
      joined_today: 0,
      joined_this_month: 0,
    };

  let newsletterErrorMessage =
    "";

  if (
    canViewNewsletter
  ) {
    const {
      data:
        newsletterData,

      error:
        newsletterError,
    } =
      await supabase.rpc(
        "get_newsletter_stats"
      );

    if (
      newsletterError
    ) {
      console.error(
        "Admin newsletter stats error:",
        newsletterError.message
      );

      newsletterErrorMessage =
        newsletterError.message;
    } else if (
      newsletterData
    ) {
      const safeData =
        newsletterData as
          Partial<NewsletterStats>;

      newsletterStats = {
        total:
          Number(
            safeData.total ??
              0
          ),

        active:
          Number(
            safeData.active ??
              0
          ),

        joined_today:
          Number(
            safeData.joined_today ??
              0
          ),

        joined_this_month:
          Number(
            safeData.joined_this_month ??
              0
          ),
      };
    }
  }

  /*
   * =========================================================
   * DASHBOARD COUNTS
   * =========================================================
   */

  const bookCount =
    products.filter(
      (
        product
      ) =>
        product.product_type ===
        "book"
    ).length;

  const fashionCount =
    products.filter(
      (
        product
      ) =>
        product.product_type ===
        "fashion"
    ).length;

  const pendingOrderCount =
    orders.filter(
      (
        order
      ) =>
        order.status ===
        "pending"
    ).length;

  const pendingPaymentCount =
    orders.filter(
      (
        order
      ) =>
        order.payment_status ===
          "pending_verification" &&
        order.status !==
          "cancelled"
    ).length;

  const hasProductAccess =
    canViewProducts ||
    canViewStock ||
    canCreateProducts ||
    canEditProducts;

  const hasOperationalAccess =
    isOwner ||
    hasProductAccess ||
    canViewOrders ||
    canSeePaymentInformation ||
    canManageStaff ||
    canManageCategories ||
    hasReviewAccess ||
    hasCouponAccess ||
    canViewNewsletter;

  return (
    <>
      <Header />

      <main className="section-shell page-space">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="shop-heading">
          <div>
            <div className="eyebrow">
              JIPLANCE ADMIN
            </div>

            <h1>
              Dashboard
            </h1>

            <p>
              Signed in as{" "}
              <strong>
                {profile.role.toUpperCase()}
              </strong>
            </p>
          </div>

          <div
            style={{
              display:
                "flex",

              gap:
                "12px",

              flexWrap:
                "wrap",
            }}
          >
            {canManageCategories && (
              <a
                href="/admin/categories"
                className="ghost-button"
              >
                Categories
              </a>
            )}

            {hasReviewAccess && (
              <a
                href="/admin/reviews"
                className="ghost-button"
              >
                Reviews
              </a>
            )}

            {hasCouponAccess && (
              <a
                href="/admin/coupons"
                className="ghost-button"
              >
                Coupons
              </a>
            )}

            {canViewNewsletter && (
              <a
                href="/admin/newsletter"
                className="ghost-button"
              >
                Newsletter
              </a>
            )}

            {isOwner && (
              <a
                href="/admin/payment-settings"
                className="ghost-button"
              >
                Payment Settings
              </a>
            )}

            {canManageStaff && (
              <a
                href="/admin/staff"
                className="ghost-button"
              >
                Team Management
              </a>
            )}

            {canViewOrders && (
              <a
                href="/admin/orders"
                className="primary-button"
              >
                Manage Orders
              </a>
            )}
          </div>
        </div>

        {/* =================================================
            NO OPERATIONAL ACCESS
        ================================================= */}

        {!hasOperationalAccess && (
          <section
            className="empty-box"
            style={{
              marginBottom:
                "3rem",

              textAlign:
                "left",
            }}
          >
            <strong>
              No operational access
              assigned.
            </strong>

            <p>
              Your account is active,
              but the Owner has not
              assigned any management
              permissions yet.
            </p>
          </section>
        )}

        {/* =================================================
            DASHBOARD CARDS
        ================================================= */}

        {hasOperationalAccess && (
          <section
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",

              gap:
                "1rem",

              marginBottom:
                "3rem",
            }}
          >
            {canViewProducts && (
              <>
                <div className="empty-box">
                  <strong>
                    Total Products
                  </strong>

                  <h2>
                    {
                      products.length
                    }
                  </h2>
                </div>

                <div className="empty-box">
                  <strong>
                    Books
                  </strong>

                  <h2>
                    {
                      bookCount
                    }
                  </h2>
                </div>

                <div className="empty-box">
                  <strong>
                    Fashion
                  </strong>

                  <h2>
                    {
                      fashionCount
                    }
                  </h2>
                </div>
              </>
            )}

            {canViewOrders && (
              <>
                <div className="empty-box">
                  <strong>
                    Total Orders
                  </strong>

                  <h2>
                    {
                      orders.length
                    }
                  </h2>
                </div>

                <div className="empty-box">
                  <strong>
                    Pending Orders
                  </strong>

                  <h2>
                    {
                      pendingOrderCount
                    }
                  </h2>
                </div>
              </>
            )}

            {canSeePaymentInformation && (
              <div className="empty-box">
                <strong>
                  Payment Verification
                </strong>

                <h2>
                  {
                    pendingPaymentCount
                  }
                </h2>

                <small>
                  Waiting for
                  verification
                </small>
              </div>
            )}

            {/* NEWSLETTER CARD */}

            {canViewNewsletter && (
              <div className="empty-box">
                <strong>
                  Newsletter
                </strong>

                <h2>
                  {
                    newsletterStats.total
                  }
                </h2>

                <small>
                  {
                    newsletterStats.active
                  }{" "}
                  active •{" "}
                  {
                    newsletterStats.joined_today
                  }{" "}
                  joined today
                </small>
              </div>
            )}
          </section>
        )}

        {/* =================================================
            OWNER PAYMENT SETTINGS
        ================================================= */}

        {isOwner && (
          <section
            style={{
              marginBottom:
                "3rem",
            }}
          >
            <div className="shop-heading">
              <div>
                <div className="eyebrow">
                  OWNER CONTROL
                </div>

                <h2>
                  Payment Settings
                </h2>

                <p>
                  Manage the official
                  bKash, Bank and future
                  Nagad payment details
                  shown to customers at
                  checkout.
                </p>
              </div>

              <a
                href="/admin/payment-settings"
                className="ghost-button"
              >
                Manage Payment Settings
              </a>
            </div>

            <div
              className="empty-box"
              style={{
                textAlign:
                  "left",
              }}
            >
              <strong>
                🔒 Owner-only control
              </strong>

              <p>
                Only the Owner can
                change customer payment
                destination details.
                Admin and Staff payment
                verification
                permissions do not
                grant access to these
                settings.
              </p>
            </div>
          </section>
        )}

        {/* =================================================
            COUPON MANAGEMENT
        ================================================= */}

        {hasCouponAccess && (
          <section
            style={{
              marginBottom:
                "3rem",
            }}
          >
            <div className="shop-heading">
              <div>
                <div className="eyebrow">
                  COUPON MANAGEMENT
                </div>

                <h2>
                  Coupons & Discounts
                </h2>

                <p>
                  Manage customer
                  coupon codes,
                  discount values,
                  validity dates and
                  usage limits based
                  on your assigned
                  permissions.
                </p>
              </div>

              <a
                href="/admin/coupons"
                className="ghost-button"
              >
                Manage Coupons
              </a>
            </div>

            <div
              className="empty-box"
              style={{
                textAlign:
                  "left",
              }}
            >
              <strong>
                Coupon Access
              </strong>

              <p>
                {canViewCoupons
                  ? "View Coupons"
                  : ""}

                {canManageCoupons
                  ? `${
                      canViewCoupons
                        ? " • "
                        : ""
                    }Create / Edit / Enable / Disable / Delete`
                  : ""}
              </p>

              {!canManageCoupons &&
                canViewCoupons && (
                  <small>
                    This account has
                    read-only coupon
                    access.
                  </small>
                )}
            </div>
          </section>
        )}

        {/* =================================================
            NEWSLETTER MANAGEMENT
        ================================================= */}

        {canViewNewsletter && (
          <section
            style={{
              marginBottom:
                "3rem",
            }}
          >
            <div className="shop-heading">
              <div>
                <div className="eyebrow">
                  AUDIENCE MANAGEMENT
                </div>

                <h2>
                  Newsletter
                </h2>

                <p>
                  Review customers who
                  joined JIPLANCE
                  updates and monitor
                  audience growth.
                </p>
              </div>

              <a
                href="/admin/newsletter"
                className="ghost-button"
              >
                View Subscribers
              </a>
            </div>

            {newsletterErrorMessage ? (
              <div
                className="empty-box"
                style={{
                  textAlign:
                    "left",
                }}
              >
                <strong>
                  Newsletter stats
                  could not be loaded.
                </strong>

                <p>
                  {
                    newsletterErrorMessage
                  }
                </p>
              </div>
            ) : (
              <div
                className="empty-box"
                style={{
                  textAlign:
                    "left",
                }}
              >
                <strong>
                  Newsletter Audience
                </strong>

                <p>
                  {
                    newsletterStats.total
                  }{" "}
                  total subscriber
                  {newsletterStats.total ===
                  1
                    ? ""
                    : "s"}

                  {" • "}

                  {
                    newsletterStats.active
                  }{" "}
                  active

                  {" • "}

                  {
                    newsletterStats.joined_today
                  }{" "}
                  joined today

                  {" • "}

                  {
                    newsletterStats.joined_this_month
                  }{" "}
                  joined this month
                </p>

                <small>
                  Subscriber email
                  addresses remain
                  protected and are
                  available only to
                  accounts with
                  newsletter access.
                </small>
              </div>
            )}
          </section>
        )}

        {/* =================================================
            CATEGORY MANAGEMENT
        ================================================= */}

        {canManageCategories && (
          <section
            style={{
              marginBottom:
                "3rem",
            }}
          >
            <div className="shop-heading">
              <div>
                <div className="eyebrow">
                  CATEGORY MANAGEMENT
                </div>

                <h2>
                  Categories
                </h2>

                <p>
                  Manage Books and
                  Fashion categories
                  based on your
                  assigned
                  permissions.
                </p>
              </div>

              <a
                href="/admin/categories"
                className="ghost-button"
              >
                Manage Categories
              </a>
            </div>

            <div className="empty-box">
              <strong>
                Category Access
              </strong>

              <p>
                {canViewCategories
                  ? "View"
                  : ""}

                {canCreateCategories
                  ? `${
                      canViewCategories
                        ? " • "
                        : ""
                    }Create`
                  : ""}

                {canEditCategories
                  ? `${
                      canViewCategories ||
                      canCreateCategories
                        ? " • "
                        : ""
                    }Edit`
                  : ""}

                {canDeleteCategories
                  ? `${
                      canViewCategories ||
                      canCreateCategories ||
                      canEditCategories
                        ? " • "
                        : ""
                    }Delete`
                  : ""}
              </p>
            </div>
          </section>
        )}

        {/* =================================================
            REVIEW MANAGEMENT
        ================================================= */}

        {hasReviewAccess && (
          <section
            style={{
              marginBottom:
                "3rem",
            }}
          >
            <div className="shop-heading">
              <div>
                <div className="eyebrow">
                  REVIEW MANAGEMENT
                </div>

                <h2>
                  Customer Reviews
                </h2>

                <p>
                  View customer
                  feedback and
                  moderate reviews
                  based on your
                  assigned
                  permissions.
                </p>
              </div>

              <a
                href="/admin/reviews"
                className="ghost-button"
              >
                Manage Reviews
              </a>
            </div>

            <div className="empty-box">
              <strong>
                Review Access
              </strong>

              <p>
                {canViewReviews
                  ? "View Reviews"
                  : ""}

                {canManageReviews
                  ? `${
                      canViewReviews
                        ? " • "
                        : ""
                    }Approve / Manage`
                  : ""}
              </p>
            </div>
          </section>
        )}

        {/* =================================================
            PRODUCT MANAGEMENT
        ================================================= */}

        {hasProductAccess && (
          <section
            style={{
              marginBottom:
                "3rem",
            }}
          >
            <div className="shop-heading">
              <div>
                <div className="eyebrow">
                  PRODUCT MANAGEMENT
                </div>

                <h2>
                  Products
                </h2>

                {!canViewProducts &&
                  canViewStock && (
                    <p>
                      Stock visibility
                      only.
                    </p>
                  )}
              </div>

              {canCreateProducts && (
                <a
                  className="primary-button"
                  href="/admin/products/new"
                >
                  + Add Product
                </a>
              )}
            </div>

            {productErrorMessage ? (
              <div className="empty-box">
                <strong>
                  Could not load
                  products.
                </strong>

                <p>
                  {
                    productErrorMessage
                  }
                </p>
              </div>
            ) : products.length ===
              0 ? (
              <div className="empty-box">
                No products found.
              </div>
            ) : (
              <div
                style={{
                  overflowX:
                    "auto",
                }}
              >
                <table
                  style={{
                    width:
                      "100%",

                    borderCollapse:
                      "collapse",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={
                          cellStyle
                        }
                      >
                        Product
                      </th>

                      {canViewProducts && (
                        <>
                          <th
                            style={
                              cellStyle
                            }
                          >
                            Type
                          </th>

                          <th
                            style={
                              cellStyle
                            }
                          >
                            Price
                          </th>
                        </>
                      )}

                      {canViewStock && (
                        <th
                          style={
                            cellStyle
                          }
                        >
                          Stock
                        </th>
                      )}

                      {canViewProducts && (
                        <th
                          style={
                            cellStyle
                          }
                        >
                          Status
                        </th>
                      )}

                      {canEditProducts && (
                        <th
                          style={
                            cellStyle
                          }
                        >
                          Action
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {products.map(
                      (
                        product
                      ) => {
                        const sellingPrice =
                          product.discount_price ??
                          product.price;

                        return (
                          <tr
                            key={
                              product.id
                            }
                          >
                            <td
                              style={
                                cellStyle
                              }
                            >
                              <strong>
                                {
                                  product.name
                                }
                              </strong>

                              {canViewProducts && (
                                <>
                                  <br />

                                  <small>
                                    {
                                      product.slug
                                    }
                                  </small>
                                </>
                              )}
                            </td>

                            {canViewProducts && (
                              <>
                                <td
                                  style={
                                    cellStyle
                                  }
                                >
                                  {product.product_type ===
                                  "fashion"
                                    ? "Fashion"
                                    : "Book"}
                                </td>

                                <td
                                  style={
                                    cellStyle
                                  }
                                >
                                  ৳
                                  {Number(
                                    sellingPrice
                                  )}
                                </td>
                              </>
                            )}

                            {canViewStock && (
                              <td
                                style={
                                  cellStyle
                                }
                              >
                                {
                                  product.stock
                                }
                              </td>
                            )}

                            {canViewProducts && (
                              <td
                                style={
                                  cellStyle
                                }
                              >
                                {product.is_active
                                  ? "Active"
                                  : "Hidden"}
                              </td>
                            )}

                            {canEditProducts && (
                              <td
                                style={
                                  cellStyle
                                }
                              >
                                <a
                                  href={`/admin/products/${product.id}`}
                                >
                                  Edit
                                </a>
                              </td>
                            )}
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* =================================================
            ORDER MANAGEMENT
        ================================================= */}

        {canViewOrders && (
          <section>
            <div className="shop-heading">
              <div>
                <div className="eyebrow">
                  ORDER MANAGEMENT
                </div>

                <h2>
                  Orders
                </h2>

                <p>
                  Review customer
                  orders and delivery
                  status.
                </p>
              </div>

              <a
                href="/admin/orders"
                className="primary-button"
              >
                Manage Orders
              </a>
            </div>

            {orderErrorMessage ? (
              <div className="empty-box">
                <strong>
                  Order information
                  could not be loaded.
                </strong>

                <p>
                  {
                    orderErrorMessage
                  }
                </p>
              </div>
            ) : (
              <div className="empty-box">
                <strong>
                  {
                    orders.length
                  }{" "}
                  Total Orders
                </strong>

                <p>
                  {
                    pendingOrderCount
                  }{" "}
                  pending order
                  {pendingOrderCount ===
                  1
                    ? ""
                    : "s"}

                  {canSeePaymentInformation
                    ? ` and ${pendingPaymentCount} payment${
                        pendingPaymentCount ===
                        1
                          ? ""
                          : "s"
                      } waiting for verification.`
                    : "."}
                </p>
              </div>
            )}
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}

const cellStyle = {
  textAlign:
    "left" as const,

  padding:
    "14px",

  borderBottom:
    "1px solid #ddd",

  verticalAlign:
    "top" as const,
};