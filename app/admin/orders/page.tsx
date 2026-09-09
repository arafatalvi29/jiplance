import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  variant_size: string | null;
  variant_color: string | null;
};

type OrderRow = {
  id: string;
  order_number: number | null;

  customer_name: string;
  phone: string;
  address: string;

  delivery_area: string;
  delivery_charge: number;

  payment_method: string;
  transaction_id: string;

  subtotal: number;
  total: number;

  claimed_amount: number;
  due_amount: number;

  payment_proof_path: string | null;
  payment_proof_uploaded_at: string | null;

  status: string;
  payment_status: string;

  created_at: string;

  order_items: OrderItem[];
};

type OrderView =
  | "active"
  | "successful"
  | "cancelled"
  | "payments"
  | "all";

async function updateOrderAction(
  formData: FormData
) {
  "use server";

  const supabase =
    await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/account");
  }

  const orderId = String(
    formData.get("order_id") ?? ""
  );

  const paymentStatusValue =
    formData.get("payment_status");

  const orderStatusValue =
    formData.get("order_status");

  const paymentStatus =
    paymentStatusValue &&
    String(paymentStatusValue).trim() !== ""
      ? String(paymentStatusValue)
      : null;

  const orderStatus =
    orderStatusValue &&
    String(orderStatusValue).trim() !== ""
      ? String(orderStatusValue)
      : null;

  if (!orderId) {
    throw new Error(
      "Order ID is missing."
    );
  }

  if (!paymentStatus && !orderStatus) {
    throw new Error(
      "No update selected."
    );
  }

  /*
   * admin_update_order()
   * remains the final backend
   * permission + stock security gate.
   */
  const { error } = await supabase.rpc(
    "admin_update_order",
    {
      p_order_id: orderId,
      p_payment_status: paymentStatus,
      p_order_status: orderStatus,
    }
  );

  if (error) {
    console.error(
      "Order update error:",
      error.message
    );

    throw new Error(error.message);
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
  }>;
}) {
  const params = await searchParams;

  const requestedView =
    params.view ?? "active";

  const currentView: OrderView = [
    "active",
    "successful",
    "cancelled",
    "payments",
    "all",
  ].includes(requestedView)
    ? (requestedView as OrderView)
    : "active";

  const supabase =
    await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/account");
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    !profile ||
    !profile.is_active ||
    !["owner", "admin", "staff"].includes(
      profile.role
    )
  ) {
    redirect("/account");
  }

  /*
   * PERMISSIONS
   */
  const [
    viewOrdersResult,
    updateOrdersResult,
    cancelOrdersResult,
    viewPaymentsResult,
    verifyPaymentsResult,
  ] = await Promise.all([
    supabase.rpc("has_permission", {
      required_permission:
        "orders.view",
    }),

    supabase.rpc("has_permission", {
      required_permission:
        "orders.update",
    }),

    supabase.rpc("has_permission", {
      required_permission:
        "orders.cancel",
    }),

    supabase.rpc("has_permission", {
      required_permission:
        "payments.view",
    }),

    supabase.rpc("has_permission", {
      required_permission:
        "payments.verify",
    }),
  ]);

  const canViewOrders =
    viewOrdersResult.data === true;

  const canUpdateOrders =
    updateOrdersResult.data === true;

  const canCancelOrders =
    cancelOrdersResult.data === true;

  const canViewPayments =
    viewPaymentsResult.data === true;

  const canVerifyPayments =
    verifyPaymentsResult.data === true;

  const canViewPaymentDetails =
    canViewPayments ||
    canVerifyPayments;

  if (!canViewOrders) {
    redirect("/admin");
  }

  /*
   * ORDER QUERY
   *
   * payment_proof_path is only useful
   * to users who already passed our
   * payment permission checks.
   *
   * Backend orders RLS remains active.
   */
  const {
    data: ordersData,
    error: ordersError,
  } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      customer_name,
      phone,
      address,
      delivery_area,
      delivery_charge,
      payment_method,
      transaction_id,
      subtotal,
      total,
      claimed_amount,
      due_amount,
      payment_proof_path,
      payment_proof_uploaded_at,
      status,
      payment_status,
      created_at,
      order_items (
        id,
        product_name,
        quantity,
        unit_price,
        line_total,
        variant_size,
        variant_color
      )
      `
    )
    .order("created_at", {
      ascending: false,
    });

  if (ordersError) {
    console.error(
      "Admin orders error:",
      ordersError.message
    );
  }

  const orders =
    (ordersData ?? []) as OrderRow[];

  /*
   * PRIVATE PAYMENT PROOF URLs
   *
   * Bucket is private.
   * URLs expire after 10 minutes.
   *
   * Only users with payments.view
   * or payments.verify reach this step.
   */
  const paymentProofUrls: Record<
    string,
    string
  > = {};

  const paymentProofErrors: Record<
    string,
    boolean
  > = {};

  if (canViewPaymentDetails) {
    const proofOrders =
      orders.filter(
        (order) =>
          Boolean(
            order.payment_proof_path
          )
      );

    await Promise.all(
      proofOrders.map(
        async (order) => {
          if (
            !order.payment_proof_path
          ) {
            return;
          }

          const {
            data: signedData,
            error: signedError,
          } =
            await supabase.storage
              .from(
                "payment-proofs"
              )
              .createSignedUrl(
                order.payment_proof_path,
                60 * 10
              );

          if (
            signedError ||
            !signedData?.signedUrl
          ) {
            console.error(
              `Payment proof URL error for ${order.id}:`,
              signedError?.message
            );

            paymentProofErrors[
              order.id
            ] = true;

            return;
          }

          paymentProofUrls[
            order.id
          ] =
            signedData.signedUrl;
        }
      )
    );
  }

  const activeOrders =
    orders.filter(
      (order) =>
        ![
          "delivered",
          "cancelled",
        ].includes(order.status)
    );

  const successfulOrders =
    orders.filter(
      (order) =>
        order.status ===
        "delivered"
    );

  const cancelledOrders =
    orders.filter(
      (order) =>
        order.status ===
        "cancelled"
    );

  const paymentReviewOrders =
    orders.filter(
      (order) =>
        order.payment_status ===
          "pending_verification" &&
        order.status !== "cancelled"
    );

  const effectiveView: OrderView =
    currentView === "payments" &&
    !canViewPaymentDetails
      ? "active"
      : currentView;

  const visibleOrders =
    effectiveView === "successful"
      ? successfulOrders
      : effectiveView === "cancelled"
      ? cancelledOrders
      : effectiveView === "payments"
      ? paymentReviewOrders
      : effectiveView === "all"
      ? orders
      : activeOrders;

  const viewTitle =
    effectiveView === "successful"
      ? "Successful Orders"
      : effectiveView === "cancelled"
      ? "Cancelled Orders"
      : effectiveView === "payments"
      ? "Payment Review"
      : effectiveView === "all"
      ? "All Orders"
      : "New / Active Orders";

  const viewDescription =
    effectiveView === "successful"
      ? "Delivered orders are stored here as completed sales history."
      : effectiveView === "cancelled"
      ? "Cancelled orders remain saved here with their full details."
      : effectiveView === "payments"
      ? "Review transaction information and private payment screenshots before verification."
      : effectiveView === "all"
      ? "Complete order history."
      : "Only new and currently processing orders appear here.";

  const hasAnyOrderControl =
    canUpdateOrders ||
    canCancelOrders ||
    canVerifyPayments;

  return (
    <>
      <Header />

      <main className="section-shell page-space">
        <div className="shop-heading">
          <div>
            <div className="eyebrow">
              JIPLANCE ADMIN
            </div>

            <h1>
              Order Management
            </h1>

            <p>
              Signed in as{" "}
              <strong>
                {profile.role.toUpperCase()}
              </strong>
            </p>
          </div>

          <a
            href="/admin"
            className="primary-button"
          >
            Back to Dashboard
          </a>
        </div>

        {/* =========================================
            SUMMARY
        ========================================= */}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <SummaryCard
            href="/admin/orders"
            label="New / Active"
            count={activeOrders.length}
            active={
              effectiveView === "active"
            }
          />

          {canViewPaymentDetails && (
            <SummaryCard
              href="/admin/orders?view=payments"
              label="Payment Review"
              count={
                paymentReviewOrders.length
              }
              active={
                effectiveView ===
                "payments"
              }
            />
          )}

          <SummaryCard
            href="/admin/orders?view=successful"
            label="Successful"
            count={
              successfulOrders.length
            }
            active={
              effectiveView ===
              "successful"
            }
          />

          <SummaryCard
            href="/admin/orders?view=cancelled"
            label="Cancelled"
            count={
              cancelledOrders.length
            }
            active={
              effectiveView ===
              "cancelled"
            }
          />

          <SummaryCard
            href="/admin/orders?view=all"
            label="All Orders"
            count={orders.length}
            active={
              effectiveView === "all"
            }
          />
        </section>

        {/* =========================================
            CURRENT VIEW
        ========================================= */}

        <section
          style={{
            marginBottom: "1.5rem",
            padding: "20px",
            border:
              "1px solid #e5e5e5",
            borderRadius: "14px",
          }}
        >
          <div className="eyebrow">
            CURRENT VIEW
          </div>

          <h2
            style={{
              marginTop: "6px",
              marginBottom: "6px",
            }}
          >
            {viewTitle}
          </h2>

          <p style={{ margin: 0 }}>
            {viewDescription}
          </p>

          {!hasAnyOrderControl && (
            <p
              style={{
                marginTop: "12px",
                marginBottom: 0,
                fontWeight: 600,
              }}
            >
              Read-only access. You can
              view orders, but you do
              not have permission to
              modify them.
            </p>
          )}
        </section>

        {/* =========================================
            ORDERS
        ========================================= */}

        {ordersError ? (
          <div className="empty-box">
            <strong>
              Could not load orders.
            </strong>

            <p>
              {ordersError.message}
            </p>
          </div>
        ) : visibleOrders.length ===
          0 ? (
          <div className="empty-box">
            <h3>
              No orders here.
            </h3>

            <p>
              {effectiveView ===
              "active"
                ? "New orders will automatically appear here."
                : `There are currently no ${viewTitle.toLowerCase()}.`}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "1.5rem",
            }}
          >
            {visibleOrders.map(
              (order) => {
                const displayOrderNumber =
                  order.order_number !==
                  null
                    ? `JIP-${
                        order.order_number +
                        1000
                      }`
                    : order.id.slice(
                        0,
                        8
                      );

                const isCancelled =
                  order.status ===
                  "cancelled";

                const isSuccessful =
                  order.status ===
                  "delivered";

                const proofUrl =
                  paymentProofUrls[
                    order.id
                  ];

                const proofUrlError =
                  paymentProofErrors[
                    order.id
                  ] === true;

                return (
                  <section
                    key={order.id}
                    className="empty-box"
                    style={{
                      textAlign: "left",
                    }}
                  >
                    {/* =================================
                        ORDER TOP
                    ================================= */}

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "flex-start",
                        gap: "1rem",
                        flexWrap: "wrap",
                        marginBottom:
                          "1.5rem",
                      }}
                    >
                      <div>
                        <div className="eyebrow">
                          ORDER
                        </div>

                        <h2
                          style={{
                            marginBottom:
                              "6px",
                          }}
                        >
                          {
                            displayOrderNumber
                          }
                        </h2>

                        <small>
                          {new Date(
                            order.created_at
                          ).toLocaleString(
                            "en-BD",
                            {
                              timeZone:
                                "Asia/Dhaka",
                            }
                          )}
                        </small>
                      </div>

                      <div>
                        <strong>
                          Order Status:{" "}
                        </strong>

                        {formatOrderStatus(
                          order.status
                        )}

                        {canViewPaymentDetails && (
                          <>
                            <br />

                            <strong>
                              Payment
                              Status:{" "}
                            </strong>

                            {formatPaymentStatus(
                              order.payment_status
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* =================================
                        CUSTOMER / PAYMENT / TOTAL
                    ================================= */}

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "1.5rem",
                        marginBottom:
                          "1.5rem",
                      }}
                    >
                      <div>
                        <h3>
                          Customer
                        </h3>

                        <p>
                          <strong>
                            {
                              order.customer_name
                            }
                          </strong>
                        </p>

                        <p>
                          {order.phone}
                        </p>

                        <p>
                          {order.address}
                        </p>

                        <p>
                          {order.delivery_area ===
                          "dhaka"
                            ? "Dhaka"
                            : "Outside Dhaka"}
                        </p>
                      </div>

                      {/* =================================
                          PAYMENT
                      ================================= */}

                      {canViewPaymentDetails ? (
                        <div>
                          <h3>
                            Payment
                          </h3>

                          <p>
                            Method:{" "}
                            <strong>
                              {
                                order.payment_method
                              }
                            </strong>
                          </p>

                          <p>
                            {order.payment_method ===
                            "Bank"
                              ? "Transaction / Reference: "
                              : "Transaction ID: "}

                            <strong>
                              {
                                order.transaction_id
                              }
                            </strong>
                          </p>

                          <p>
                            Amount Claimed
                            Sent:{" "}
                            <strong>
                              ৳
                              {Number(
                                order.claimed_amount
                              )}
                            </strong>
                          </p>

                          <p>
                            Due on
                            Delivery:{" "}
                            <strong>
                              ৳
                              {Number(
                                order.due_amount
                              )}
                            </strong>
                          </p>

                          {/* PAYMENT PROOF */}

                          <div
                            style={{
                              marginTop:
                                "16px",
                              padding:
                                "14px",
                              border:
                                "1px solid #e5e7eb",
                              borderRadius:
                                "12px",
                              background:
                                "#fafafa",
                            }}
                          >
                            <strong
                              style={{
                                display:
                                  "block",
                                marginBottom:
                                  "7px",
                              }}
                            >
                              Payment Proof
                            </strong>

                            {!order.payment_proof_path ? (
                              <p
                                style={{
                                  margin: 0,
                                }}
                              >
                                No screenshot
                                submitted.
                              </p>
                            ) : proofUrl ? (
                              <>
                                <p
                                  style={{
                                    marginTop:
                                      0,
                                    marginBottom:
                                      "10px",
                                  }}
                                >
                                  ✓ Screenshot
                                  received
                                </p>

                                {order.payment_proof_uploaded_at && (
                                  <small
                                    style={{
                                      display:
                                        "block",
                                      marginBottom:
                                        "10px",
                                    }}
                                  >
                                    Uploaded:{" "}
                                    {new Date(
                                      order.payment_proof_uploaded_at
                                    ).toLocaleString(
                                      "en-BD",
                                      {
                                        timeZone:
                                          "Asia/Dhaka",
                                      }
                                    )}
                                  </small>
                                )}

                                <a
                                  href={
                                    proofUrl
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="admin-action-button"
                                  style={{
                                    display:
                                      "inline-block",
                                    textDecoration:
                                      "none",
                                  }}
                                >
                                  View Payment
                                  Screenshot ↗
                                </a>

                                <small
                                  style={{
                                    display:
                                      "block",
                                    marginTop:
                                      "9px",
                                  }}
                                >
                                  Private link ·
                                  expires in 10
                                  minutes
                                </small>
                              </>
                            ) : proofUrlError ? (
                              <p
                                style={{
                                  margin: 0,
                                }}
                              >
                                Screenshot exists,
                                but a secure preview
                                could not be created.
                                Refresh the page and
                                try again.
                              </p>
                            ) : (
                              <p
                                style={{
                                  margin: 0,
                                }}
                              >
                                Screenshot is
                                unavailable.
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h3>
                            Payment
                          </h3>

                          <p>
                            Payment details
                            are restricted
                            for this
                            account.
                          </p>
                        </div>
                      )}

                      <div>
                        <h3>
                          Order Total
                        </h3>

                        <p>
                          Subtotal: ৳
                          {Number(
                            order.subtotal
                          )}
                        </p>

                        <p>
                          Delivery: ৳
                          {Number(
                            order.delivery_charge
                          )}
                        </p>

                        <p>
                          <strong>
                            Total: ৳
                            {Number(
                              order.total
                            )}
                          </strong>
                        </p>
                      </div>
                    </div>

                    {/* =================================
                        ORDER ITEMS
                    ================================= */}

                    <div
                      style={{
                        marginBottom:
                          "1.5rem",
                      }}
                    >
                      <h3>
                        Items
                      </h3>

                      {order.order_items
                        ?.length > 0 ? (
                        <div
                          style={{
                            overflowX:
                              "auto",
                          }}
                        >
                          <table
                            style={{
                              width: "100%",
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

                                <th
                                  style={
                                    cellStyle
                                  }
                                >
                                  Variant
                                </th>

                                <th
                                  style={
                                    cellStyle
                                  }
                                >
                                  Qty
                                </th>

                                <th
                                  style={
                                    cellStyle
                                  }
                                >
                                  Price
                                </th>

                                <th
                                  style={
                                    cellStyle
                                  }
                                >
                                  Total
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {order.order_items.map(
                                (
                                  item
                                ) => {
                                  const variantText =
                                    [
                                      item.variant_size
                                        ? `Size: ${item.variant_size}`
                                        : null,

                                      item.variant_color
                                        ? `Color: ${item.variant_color}`
                                        : null,
                                    ]
                                      .filter(
                                        Boolean
                                      )
                                      .join(
                                        " • "
                                      );

                                  return (
                                    <tr
                                      key={
                                        item.id
                                      }
                                    >
                                      <td
                                        style={
                                          cellStyle
                                        }
                                      >
                                        {
                                          item.product_name
                                        }
                                      </td>

                                      <td
                                        style={
                                          cellStyle
                                        }
                                      >
                                        {variantText ||
                                          "—"}
                                      </td>

                                      <td
                                        style={
                                          cellStyle
                                        }
                                      >
                                        {
                                          item.quantity
                                        }
                                      </td>

                                      <td
                                        style={
                                          cellStyle
                                        }
                                      >
                                        ৳
                                        {Number(
                                          item.unit_price
                                        )}
                                      </td>

                                      <td
                                        style={
                                          cellStyle
                                        }
                                      >
                                        ৳
                                        {Number(
                                          item.line_total
                                        )}
                                      </td>
                                    </tr>
                                  );
                                }
                              )}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p>
                          No order items
                          found.
                        </p>
                      )}
                    </div>

                    {/* =================================
                        CANCELLED
                    ================================= */}

                    {isCancelled && (
                      <div
                        style={{
                          borderTop:
                            "1px solid #ddd",
                          paddingTop:
                            "1.5rem",
                        }}
                      >
                        <strong>
                          Cancelled Order
                        </strong>

                        <p>
                          This order is
                          cancelled and
                          its reserved
                          stock has been
                          restored.
                        </p>
                      </div>
                    )}

                    {/* =================================
                        SUCCESSFUL
                    ================================= */}

                    {isSuccessful && (
                      <div
                        style={{
                          borderTop:
                            "1px solid #ddd",
                          paddingTop:
                            "1.5rem",
                        }}
                      >
                        <strong>
                          Successful Order
                          ✓
                        </strong>

                        <p>
                          This order has
                          been delivered
                          and is stored
                          as completed
                          sales history.
                        </p>
                      </div>
                    )}

                    {/* =================================
                        ACTIVE CONTROLS
                    ================================= */}

                    {!isCancelled &&
                      !isSuccessful && (
                        <div
                          style={{
                            borderTop:
                              "1px solid #ddd",
                            paddingTop:
                              "1.5rem",
                          }}
                        >
                          {canVerifyPayments && (
                            <>
                              <h3>
                                Payment
                                Verification
                              </h3>

                              <p
                                style={{
                                  marginTop:
                                    "-4px",
                                  marginBottom:
                                    "14px",
                                }}
                              >
                                Check the
                                transaction /
                                reference and
                                payment screenshot
                                before verifying.
                              </p>

                              <div
                                style={{
                                  display:
                                    "flex",
                                  gap: "10px",
                                  flexWrap:
                                    "wrap",
                                  marginBottom:
                                    "1.5rem",
                                }}
                              >
                                <form
                                  action={
                                    updateOrderAction
                                  }
                                >
                                  <input
                                    type="hidden"
                                    name="order_id"
                                    value={
                                      order.id
                                    }
                                  />

                                  <input
                                    type="hidden"
                                    name="payment_status"
                                    value="verified"
                                  />

                                  <button
                                    type="submit"
                                    className="admin-action-button"
                                  >
                                    ✓ Verify
                                    Payment
                                  </button>
                                </form>

                                <form
                                  action={
                                    updateOrderAction
                                  }
                                >
                                  <input
                                    type="hidden"
                                    name="order_id"
                                    value={
                                      order.id
                                    }
                                  />

                                  <input
                                    type="hidden"
                                    name="payment_status"
                                    value="rejected"
                                  />

                                  <button
                                    type="submit"
                                    className="admin-action-button"
                                  >
                                    ✕ Reject
                                    Payment
                                  </button>
                                </form>

                                <form
                                  action={
                                    updateOrderAction
                                  }
                                >
                                  <input
                                    type="hidden"
                                    name="order_id"
                                    value={
                                      order.id
                                    }
                                  />

                                  <input
                                    type="hidden"
                                    name="payment_status"
                                    value="pending_verification"
                                  />

                                  <button
                                    type="submit"
                                    className="admin-action-button"
                                  >
                                    Pending
                                    Verification
                                  </button>
                                </form>
                              </div>
                            </>
                          )}

                          {(canUpdateOrders ||
                            canCancelOrders) && (
                            <>
                              <h3>
                                Order Status
                              </h3>

                              <div
                                style={{
                                  display:
                                    "flex",
                                  gap: "10px",
                                  flexWrap:
                                    "wrap",
                                }}
                              >
                                {canUpdateOrders && (
                                  <>
                                    <StatusButton
                                      orderId={
                                        order.id
                                      }
                                      status="confirmed"
                                      label="Confirm"
                                    />

                                    <StatusButton
                                      orderId={
                                        order.id
                                      }
                                      status="processing"
                                      label="Processing"
                                    />

                                    <StatusButton
                                      orderId={
                                        order.id
                                      }
                                      status="shipped"
                                      label="Shipped"
                                    />

                                    <StatusButton
                                      orderId={
                                        order.id
                                      }
                                      status="delivered"
                                      label="Delivered"
                                    />
                                  </>
                                )}

                                {canCancelOrders && (
                                  <StatusButton
                                    orderId={
                                      order.id
                                    }
                                    status="cancelled"
                                    label="Cancel Order"
                                  />
                                )}
                              </div>
                            </>
                          )}

                          {!hasAnyOrderControl && (
                            <p
                              style={{
                                margin: 0,
                                fontWeight: 600,
                              }}
                            >
                              View-only
                              access. Order
                              modification
                              controls are
                              not available
                              for this
                              account.
                            </p>
                          )}
                        </div>
                      )}
                  </section>
                );
              }
            )}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}

function SummaryCard({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <a
      href={href}
      style={{
        textDecoration: "none",
        color: "inherit",
        display: "block",
      }}
    >
      <div
        className="empty-box"
        style={{
          minHeight: "150px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          border: active
            ? "2px solid currentColor"
            : undefined,
          transform: active
            ? "translateY(-2px)"
            : undefined,
          transition:
            "transform 0.18s ease, border 0.18s ease",
        }}
      >
        <strong>
          {label}
        </strong>

        <h2
          style={{
            fontSize: "2rem",
            marginTop: "10px",
            marginBottom: 0,
          }}
        >
          {count}
        </h2>
      </div>
    </a>
  );
}

function StatusButton({
  orderId,
  status,
  label,
}: {
  orderId: string;
  status: string;
  label: string;
}) {
  return (
    <form action={updateOrderAction}>
      <input
        type="hidden"
        name="order_id"
        value={orderId}
      />

      <input
        type="hidden"
        name="order_status"
        value={status}
      />

      <button
        type="submit"
        className="admin-action-button"
      >
        {label}
      </button>
    </form>
  );
}

function formatPaymentStatus(
  status: string
) {
  if (
    status ===
    "pending_verification"
  ) {
    return "Pending Verification";
  }

  if (status === "verified") {
    return "Verified";
  }

  if (status === "rejected") {
    return "Rejected";
  }

  return status;
}

function formatOrderStatus(
  status: string
) {
  if (status === "pending") {
    return "Pending";
  }

  if (status === "confirmed") {
    return "Confirmed";
  }

  if (status === "processing") {
    return "Processing";
  }

  if (status === "shipped") {
    return "Shipped";
  }

  if (status === "delivered") {
    return "Delivered";
  }

  if (status === "cancelled") {
    return "Cancelled";
  }

  return status;
}

const cellStyle = {
  textAlign: "left" as const,
  padding: "12px",
  borderBottom:
    "1px solid #ddd",
  verticalAlign: "top" as const,
};