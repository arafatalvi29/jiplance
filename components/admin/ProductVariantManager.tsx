"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

type Variant = {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  stock: number;
  price: number;
  discount_price: number | null;
  image_url: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

type NewVariant = {
  size: string;
  color: string;
  sku: string;
  stock: string;
  price: string;
  discountPrice: string;
  isActive: boolean;
};

type ProductVariantManagerProps = {
  productId: string;
  canEditProduct: boolean;
  canViewStock: boolean;
  canEditStock: boolean;
};

const emptyVariant: NewVariant = {
  size: "",
  color: "",
  sku: "",
  stock: "0",
  price: "",
  discountPrice: "",
  isActive: true,
};

export default function ProductVariantManager({
  productId,
  canEditProduct,
  canViewStock,
  canEditStock,
}: ProductVariantManagerProps) {
  const [
    variants,
    setVariants,
  ] = useState<Variant[]>([]);

  const [
    newVariant,
    setNewVariant,
  ] =
    useState<NewVariant>(
      emptyVariant
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    adding,
    setAdding,
  ] = useState(false);

  const [
    savingId,
    setSavingId,
  ] = useState<string | null>(
    null
  );

  const [
    deletingId,
    setDeletingId,
  ] = useState<string | null>(
    null
  );

  const [
    stockSavingId,
    setStockSavingId,
  ] = useState<string | null>(
    null
  );

  const [
    stockReasons,
    setStockReasons,
  ] = useState<
    Record<string, string>
  >({});

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    loadVariants();
  }, [productId]);

  async function loadVariants() {
    if (
      !supabase ||
      !productId
    ) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const {
      data,
      error,
    } = await supabase
      .from("product_variants")
      .select(
        `
        id,
        product_id,
        size,
        color,
        sku,
        stock,
        price,
        discount_price,
        image_url,
        is_active,
        created_at,
        updated_at
        `
      )
      .eq(
        "product_id",
        productId
      )
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Variant load error:",
        error
      );

      setErrorMessage(
        `Could not load variants: ${error.message}`
      );

      setVariants([]);
    } else {
      setVariants(
        (data ?? []) as Variant[]
      );
    }

    setLoading(false);
  }

  function clearMessages() {
    setMessage("");
    setErrorMessage("");
  }

  function validateVariant({
    size,
    color,
    sku,
    price,
    discountPrice,
  }: {
    size: string;
    color: string;
    sku: string;
    price: string | number;
    discountPrice:
      | string
      | number
      | null;
  }) {
    const cleanSize =
      size.trim();

    const cleanColor =
      color.trim();

    const cleanSku =
      sku.trim();

    const priceNumber =
      Number(price);

    const discountNumber =
      discountPrice === "" ||
      discountPrice === null ||
      discountPrice ===
        undefined
        ? null
        : Number(
            discountPrice
          );

    if (!cleanSize) {
      return "Size is required.";
    }

    if (!cleanColor) {
      return "Color is required.";
    }

    if (!cleanSku) {
      return "SKU is required.";
    }

    if (
      Number.isNaN(
        priceNumber
      ) ||
      priceNumber < 0
    ) {
      return "Price must be 0 or more.";
    }

    if (
      discountNumber !== null &&
      (Number.isNaN(
        discountNumber
      ) ||
        discountNumber < 0)
    ) {
      return "Discount price must be 0 or more.";
    }

    if (
      discountNumber !== null &&
      discountNumber >
        priceNumber
    ) {
      return "Discount price cannot be higher than regular price.";
    }

    return null;
  }

  function validateStock(
    value: string | number
  ) {
    const stockNumber =
      Number(value);

    if (
      Number.isNaN(
        stockNumber
      ) ||
      stockNumber < 0 ||
      !Number.isInteger(
        stockNumber
      )
    ) {
      return "Stock must be a whole number of 0 or more.";
    }

    return null;
  }

  async function addVariant() {
    if (!supabase) {
      setErrorMessage(
        "Supabase is not connected."
      );
      return;
    }

    if (!canEditProduct) {
      setErrorMessage(
        "You do not have permission to add variants."
      );
      return;
    }

    clearMessages();

    const validationError =
      validateVariant({
        size: newVariant.size,
        color:
          newVariant.color,
        sku: newVariant.sku,
        price:
          newVariant.price,
        discountPrice:
          newVariant.discountPrice,
      });

    if (validationError) {
      setErrorMessage(
        validationError
      );
      return;
    }

    let initialStock = 0;

    if (canEditStock) {
      const stockError =
        validateStock(
          newVariant.stock
        );

      if (stockError) {
        setErrorMessage(
          stockError
        );
        return;
      }

      initialStock = Number(
        newVariant.stock
      );
    }

    const price =
      Number(
        newVariant.price
      );

    const discountPrice =
      newVariant.discountPrice.trim() ===
      ""
        ? null
        : Number(
            newVariant.discountPrice
          );

    setAdding(true);

    /*
     * Variant creation is a
     * product-management action.
     *
     * If the user does not have
     * stock.edit, initial stock is 0.
     */
    const {
      data,
      error,
    } = await supabase
      .from("product_variants")
      .insert({
        product_id:
          productId,

        size:
          newVariant.size.trim(),

        color:
          newVariant.color.trim(),

        sku:
          newVariant.sku.trim(),

        

        price,

        discount_price:
          discountPrice,

        image_url: null,

        is_active:
          newVariant.isActive,
      })
      .select(
        `
        id,
        product_id,
        size,
        color,
        sku,
        stock,
        price,
        discount_price,
        image_url,
        is_active,
        created_at,
        updated_at
        `
      )
      .single();

    if (error) {
      console.error(
        "Variant create error:",
        error
      );

      setErrorMessage(
        `Could not add variant: ${error.message}`
      );

      setAdding(false);
      return;
    }

    setVariants(
      (current) => [
        ...current,
        data as Variant,
      ]
    );

    setNewVariant(
      emptyVariant
    );

    setMessage(
      canEditStock
        ? "Variant added successfully."
        : "Variant added successfully with stock 0."
    );

    setAdding(false);
  }

  function updateLocalVariant(
    id: string,
    field: keyof Variant,
    value:
      | string
      | number
      | boolean
      | null
  ) {
    setVariants(
      (current) =>
        current.map(
          (variant) =>
            variant.id === id
              ? {
                  ...variant,
                  [field]:
                    value,
                }
              : variant
        )
    );
  }

  async function saveVariant(
    variant: Variant
  ) {
    if (!supabase) {
      setErrorMessage(
        "Supabase is not connected."
      );
      return;
    }

    if (!canEditProduct) {
      setErrorMessage(
        "You do not have permission to edit variant details."
      );
      return;
    }

    clearMessages();

    const validationError =
      validateVariant({
        size:
          variant.size ?? "",
        color:
          variant.color ?? "",
        sku:
          variant.sku ?? "",
        price:
          variant.price,
        discountPrice:
          variant.discount_price,
      });

    if (validationError) {
      setErrorMessage(
        validationError
      );
      return;
    }

    setSavingId(
      variant.id
    );

    /*
     * IMPORTANT:
     * Stock is intentionally
     * excluded from this update.
     */
    const {
      data,
      error,
    } = await supabase
      .from("product_variants")
      .update({
        size:
          variant.size?.trim() ??
          "",

        color:
          variant.color?.trim() ??
          "",

        sku:
          variant.sku?.trim() ??
          "",

        price:
          Number(
            variant.price
          ),

        discount_price:
          variant.discount_price ===
            null ||
          variant.discount_price ===
            undefined ||
          String(
            variant.discount_price
          ).trim() === ""
            ? null
            : Number(
                variant.discount_price
              ),

        is_active:
          variant.is_active,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        variant.id
      )
      .eq(
        "product_id",
        productId
      )
      .select(
        `
        id,
        product_id,
        size,
        color,
        sku,
        stock,
        price,
        discount_price,
        image_url,
        is_active,
        created_at,
        updated_at
        `
      )
      .single();

    if (error) {
      console.error(
        "Variant update error:",
        error
      );

      setErrorMessage(
        `Could not save variant: ${error.message}`
      );

      setSavingId(null);
      return;
    }

    setVariants(
      (current) =>
        current.map(
          (item) =>
            item.id ===
            variant.id
              ? (data as Variant)
              : item
        )
    );

    setMessage(
      "Variant details updated successfully."
    );

    setSavingId(null);
  }

  async function saveVariantStock(
    variant: Variant
  ) {
    if (!supabase) {
      setErrorMessage(
        "Supabase is not connected."
      );
      return;
    }

    if (!canEditStock) {
      setErrorMessage(
        "You do not have permission to edit stock."
      );
      return;
    }

    clearMessages();

    const stockError =
      validateStock(
        variant.stock
      );

    if (stockError) {
      setErrorMessage(
        stockError
      );
      return;
    }

    setStockSavingId(
      variant.id
    );

    const reason =
      stockReasons[
        variant.id
      ]?.trim() ||
      "Manual variant stock adjustment";

    const {
      data,
      error,
    } = await supabase.rpc(
      "update_inventory_stock",
      {
        p_product_id:
          productId,

        p_variant_id:
          variant.id,

        p_new_stock:
          Number(
            variant.stock
          ),

        p_reason:
          reason,
      }
    );

    if (error) {
      console.error(
        "Variant stock update error:",
        error
      );

      setErrorMessage(
        `Could not update stock: ${error.message}`
      );

      setStockSavingId(
        null
      );

      return;
    }

    const returnedStock =
      data &&
      typeof data ===
        "object" &&
      "new_stock" in data
        ? Number(
            data.new_stock
          )
        : Number(
            variant.stock
          );

    setVariants(
      (current) =>
        current.map(
          (item) =>
            item.id ===
            variant.id
              ? {
                  ...item,
                  stock:
                    returnedStock,
                }
              : item
        )
    );

    setStockReasons(
      (current) => ({
        ...current,
        [variant.id]: "",
      })
    );

    setMessage(
      "Variant stock updated securely."
    );

    setStockSavingId(
      null
    );
  }

  async function deleteVariant(
    variant: Variant
  ) {
    if (!supabase) {
      setErrorMessage(
        "Supabase is not connected."
      );
      return;
    }

    if (!canEditProduct) {
      setErrorMessage(
        "You do not have permission to delete variants."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Delete ${
          variant.color ?? ""
        } ${
          variant.size ?? ""
        } variant?`
      );

    if (!confirmed) {
      return;
    }

    clearMessages();

    setDeletingId(
      variant.id
    );

    const { error } =
      await supabase
        .from(
          "product_variants"
        )
        .delete()
        .eq(
          "id",
          variant.id
        )
        .eq(
          "product_id",
          productId
        );

    if (error) {
      console.error(
        "Variant delete error:",
        error
      );

      setErrorMessage(
        `Could not delete variant: ${error.message}`
      );

      setDeletingId(null);
      return;
    }

    setVariants(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            variant.id
        )
    );

    setMessage(
      "Variant deleted successfully."
    );

    setDeletingId(null);
  }

  if (loading) {
    return (
      <section
        style={sectionStyle}
      >
        <h2
          style={{
            marginTop: 0,
          }}
        >
          Product Variants
        </h2>

        <p>
          Loading variants...
        </p>
      </section>
    );
  }

  return (
    <section
      style={sectionStyle}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div className="eyebrow">
            FASHION INVENTORY
          </div>

          <h2
            style={{
              margin:
                "0.35rem 0",
            }}
          >
            Product Variants
          </h2>

          <p
            style={{
              margin: 0,
              opacity: 0.75,
            }}
          >
            Manage size, color,
            SKU, price and secure
            inventory stock.
          </p>
        </div>

        <strong>
          {variants.length}{" "}
          {variants.length === 1
            ? "variant"
            : "variants"}
        </strong>
      </div>

      {message && (
        <div
          style={successStyle}
        >
          {message}
        </div>
      )}

      {errorMessage && (
        <div
          style={errorStyle}
        >
          {errorMessage}
        </div>
      )}

      {canEditProduct && (
        <div
          style={{
            marginTop:
              "1.5rem",
          }}
        >
          <h3>
            Add New Variant
          </h3>

          <div
            style={gridStyle}
          >
            <label
              style={labelStyle}
            >
              Size

              <input
                value={
                  newVariant.size
                }
                onChange={(
                  event
                ) =>
                  setNewVariant(
                    (current) => ({
                      ...current,
                      size:
                        event
                          .target
                          .value,
                    })
                  )
                }
                placeholder="S, M, L, XL"
                style={inputStyle}
              />
            </label>

            <label
              style={labelStyle}
            >
              Color

              <input
                value={
                  newVariant.color
                }
                onChange={(
                  event
                ) =>
                  setNewVariant(
                    (current) => ({
                      ...current,
                      color:
                        event
                          .target
                          .value,
                    })
                  )
                }
                placeholder="Black"
                style={inputStyle}
              />
            </label>

            <label
              style={labelStyle}
            >
              SKU

              <input
                value={
                  newVariant.sku
                }
                onChange={(
                  event
                ) =>
                  setNewVariant(
                    (current) => ({
                      ...current,
                      sku:
                        event
                          .target
                          .value,
                    })
                  )
                }
                placeholder="JIP-TS-BLK-M"
                style={inputStyle}
              />
            </label>

            {canViewStock && (
              <label
                style={
                  labelStyle
                }
              >
                Initial Stock

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    newVariant.stock
                  }
                  onChange={(
                    event
                  ) =>
                    setNewVariant(
                      (
                        current
                      ) => ({
                        ...current,
                        stock:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  disabled={
                    !canEditStock
                  }
                  style={
                    inputStyle
                  }
                />
              </label>
            )}

            <label
              style={labelStyle}
            >
              Price (৳)

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  newVariant.price
                }
                onChange={(
                  event
                ) =>
                  setNewVariant(
                    (current) => ({
                      ...current,
                      price:
                        event
                          .target
                          .value,
                    })
                  )
                }
                placeholder="750"
                style={inputStyle}
              />
            </label>

            <label
              style={labelStyle}
            >
              Discount Price (৳)

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  newVariant.discountPrice
                }
                onChange={(
                  event
                ) =>
                  setNewVariant(
                    (current) => ({
                      ...current,
                      discountPrice:
                        event
                          .target
                          .value,
                    })
                  )
                }
                placeholder="650"
                style={inputStyle}
              />
            </label>
          </div>

          <label
            style={{
              display: "flex",
              alignItems:
                "center",
              gap: "0.6rem",
              marginTop:
                "1rem",
            }}
          >
            <input
              type="checkbox"
              checked={
                newVariant.isActive
              }
              onChange={(
                event
              ) =>
                setNewVariant(
                  (current) => ({
                    ...current,
                    isActive:
                      event
                        .target
                        .checked,
                  })
                )
              }
            />

            Active variant
          </label>

          {!canEditStock &&
            canViewStock && (
              <p
                style={{
                  opacity: 0.75,
                }}
              >
                You can view stock,
                but new variants
                will start with stock
                0 because you do not
                have stock.edit
                permission.
              </p>
            )}

          <button
            type="button"
            className="primary-button"
            onClick={
              addVariant
            }
            disabled={adding}
            style={{
              marginTop:
                "1rem",
            }}
          >
            {adding
              ? "Adding..."
              : "+ Add Variant"}
          </button>
        </div>
      )}

      <div
        style={{
          marginTop: "2rem",
        }}
      >
        <h3>
          Existing Variants
        </h3>

        {variants.length === 0 ? (
          <div className="empty-box">
            No variants added yet.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "1rem",
            }}
          >
            {variants.map(
              (variant) => (
                <div
                  key={
                    variant.id
                  }
                  style={
                    variantCardStyle
                  }
                >
                  <div
                    style={
                      gridStyle
                    }
                  >
                    <label
                      style={
                        labelStyle
                      }
                    >
                      Size

                      <input
                        value={
                          variant.size ??
                          ""
                        }
                        onChange={(
                          event
                        ) =>
                          updateLocalVariant(
                            variant.id,
                            "size",
                            event
                              .target
                              .value
                          )
                        }
                        disabled={
                          !canEditProduct
                        }
                        style={
                          inputStyle
                        }
                      />
                    </label>

                    <label
                      style={
                        labelStyle
                      }
                    >
                      Color

                      <input
                        value={
                          variant.color ??
                          ""
                        }
                        onChange={(
                          event
                        ) =>
                          updateLocalVariant(
                            variant.id,
                            "color",
                            event
                              .target
                              .value
                          )
                        }
                        disabled={
                          !canEditProduct
                        }
                        style={
                          inputStyle
                        }
                      />
                    </label>

                    <label
                      style={
                        labelStyle
                      }
                    >
                      SKU

                      <input
                        value={
                          variant.sku ??
                          ""
                        }
                        onChange={(
                          event
                        ) =>
                          updateLocalVariant(
                            variant.id,
                            "sku",
                            event
                              .target
                              .value
                          )
                        }
                        disabled={
                          !canEditProduct
                        }
                        style={
                          inputStyle
                        }
                      />
                    </label>

                    {canViewStock && (
                      <label
                        style={
                          labelStyle
                        }
                      >
                        Stock

                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={
                            variant.stock
                          }
                          onChange={(
                            event
                          ) =>
                            updateLocalVariant(
                              variant.id,
                              "stock",
                              Number(
                                event
                                  .target
                                  .value
                              )
                            )
                          }
                          disabled={
                            !canEditStock ||
                            stockSavingId ===
                              variant.id
                          }
                          style={
                            inputStyle
                          }
                        />
                      </label>
                    )}

                    <label
                      style={
                        labelStyle
                      }
                    >
                      Price (৳)

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          variant.price
                        }
                        onChange={(
                          event
                        ) =>
                          updateLocalVariant(
                            variant.id,
                            "price",
                            Number(
                              event
                                .target
                                .value
                            )
                          )
                        }
                        disabled={
                          !canEditProduct
                        }
                        style={
                          inputStyle
                        }
                      />
                    </label>

                    <label
                      style={
                        labelStyle
                      }
                    >
                      Discount Price (৳)

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          variant.discount_price ??
                          ""
                        }
                        onChange={(
                          event
                        ) =>
                          updateLocalVariant(
                            variant.id,
                            "discount_price",
                            event
                              .target
                              .value ===
                              ""
                              ? null
                              : Number(
                                  event
                                    .target
                                    .value
                                )
                          )
                        }
                        disabled={
                          !canEditProduct
                        }
                        style={
                          inputStyle
                        }
                      />
                    </label>
                  </div>

                  {canEditProduct && (
                    <label
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: "0.6rem",
                        marginTop:
                          "1rem",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          variant.is_active
                        }
                        onChange={(
                          event
                        ) =>
                          updateLocalVariant(
                            variant.id,
                            "is_active",
                            event
                              .target
                              .checked
                          )
                        }
                      />

                      Active
                    </label>
                  )}

                  {canEditStock && (
                    <div
                      style={{
                        marginTop:
                          "1rem",
                        maxWidth:
                          "520px",
                      }}
                    >
                      <label
                        style={
                          labelStyle
                        }
                      >
                        Stock Adjustment
                        Reason

                        <input
                          type="text"
                          maxLength={
                            250
                          }
                          value={
                            stockReasons[
                              variant
                                .id
                            ] ?? ""
                          }
                          onChange={(
                            event
                          ) =>
                            setStockReasons(
                              (
                                current
                              ) => ({
                                ...current,
                                [variant.id]:
                                  event
                                    .target
                                    .value,
                              })
                            )
                          }
                          placeholder="Restock, correction, damaged item..."
                          style={
                            inputStyle
                          }
                        />
                      </label>
                    </div>
                  )}

                  <div
                    style={{
                      display:
                        "flex",
                      gap: "0.75rem",
                      flexWrap:
                        "wrap",
                      marginTop:
                        "1rem",
                    }}
                  >
                    {canEditProduct && (
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() =>
                          saveVariant(
                            variant
                          )
                        }
                        disabled={
                          savingId ===
                            variant.id ||
                          deletingId ===
                            variant.id ||
                          stockSavingId ===
                            variant.id
                        }
                      >
                        {savingId ===
                        variant.id
                          ? "Saving..."
                          : "Save Variant Details"}
                      </button>
                    )}

                    {canEditStock && (
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() =>
                          saveVariantStock(
                            variant
                          )
                        }
                        disabled={
                          stockSavingId ===
                            variant.id ||
                          savingId ===
                            variant.id ||
                          deletingId ===
                            variant.id
                        }
                      >
                        {stockSavingId ===
                        variant.id
                          ? "Updating Stock..."
                          : "Update Stock"}
                      </button>
                    )}

                    {canEditProduct && (
                      <button
                        type="button"
                        onClick={() =>
                          deleteVariant(
                            variant
                          )
                        }
                        disabled={
                          deletingId ===
                            variant.id ||
                          savingId ===
                            variant.id ||
                          stockSavingId ===
                            variant.id
                        }
                        style={
                          deleteButtonStyle
                        }
                      >
                        {deletingId ===
                        variant.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    )}
                  </div>

                  {!canEditProduct &&
                    canViewStock &&
                    !canEditStock && (
                      <p
                        style={{
                          marginBottom:
                            0,
                          opacity:
                            0.75,
                        }}
                      >
                        Stock access is
                        read only.
                      </p>
                    )}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}

const sectionStyle:
  React.CSSProperties = {
  marginTop: "2rem",
  padding: "1.5rem",
  border:
    "1px solid rgba(255,255,255,0.12)",
  borderRadius: "18px",
};

const gridStyle:
  React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "1rem",
};

const labelStyle:
  React.CSSProperties = {
  display: "grid",
  gap: "0.45rem",
  fontWeight: 600,
};

const inputStyle:
  React.CSSProperties = {
  width: "100%",
  padding: "0.8rem",
  borderRadius: "10px",
  border:
    "1px solid rgba(255,255,255,0.15)",
  background: "transparent",
  color: "inherit",
};

const variantCardStyle:
  React.CSSProperties = {
  padding: "1.25rem",
  border:
    "1px solid rgba(255,255,255,0.1)",
  borderRadius: "14px",
};

const successStyle:
  React.CSSProperties = {
  marginTop: "1rem",
  padding: "0.9rem 1rem",
  borderRadius: "10px",
  background:
    "rgba(34,197,94,0.12)",
};

const errorStyle:
  React.CSSProperties = {
  marginTop: "1rem",
  padding: "0.9rem 1rem",
  borderRadius: "10px",
  background:
    "rgba(239,68,68,0.12)",
};

const deleteButtonStyle:
  React.CSSProperties = {
  padding: "0.75rem 1rem",
  borderRadius: "10px",
  border:
    "1px solid rgba(239,68,68,0.45)",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
};