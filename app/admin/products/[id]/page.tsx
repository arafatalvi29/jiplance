"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductVariantManager from "@/components/admin/ProductVariantManager";
import ProductImageGalleryManager from "@/components/admin/ProductImageGalleryManager";
import { supabase } from "@/lib/supabase";

type ProductType = "book" | "fashion";
type BookSection = "kids" | "adult";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  store_section: string | null;
  sort_order: number | null;
};

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;

  const [role, setRole] =
    useState<string | null>(null);

  const [
    canEditProduct,
    setCanEditProduct,
  ] = useState(false);

  const [
    canViewStock,
    setCanViewStock,
  ] = useState(false);

  const [
    canEditStock,
    setCanEditStock,
  ] = useState(false);

  const [
    checkingAccess,
    setCheckingAccess,
  ] = useState(true);

  const [
    loadingProduct,
    setLoadingProduct,
  ] = useState(true);

  const [
    categoriesLoading,
    setCategoriesLoading,
  ] = useState(true);

  const [categories, setCategories] =
    useState<CategoryRow[]>([]);

  const [productType, setProductType] =
    useState<ProductType>("book");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    selectedCategoryValue,
    setSelectedCategoryValue,
  ] = useState("");

  const [
    bookSection,
    setBookSection,
  ] = useState<BookSection>("kids");

  const [
    fashionSection,
    setFashionSection,
  ] = useState("");

  const [brand, setBrand] =
    useState("");

  const [
    publisher,
    setPublisher,
  ] = useState("");

  const [ageMin, setAgeMin] =
    useState("");

  const [ageMax, setAgeMax] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [
    discountPrice,
    setDiscountPrice,
  ] = useState("");

  const [stock, setStock] =
    useState("0");

  const [
    stockReason,
    setStockReason,
  ] = useState(
    "Manual stock adjustment"
  );

  const [
    currentImageUrl,
    setCurrentImageUrl,
  ] = useState("");

  const [
    imageFile,
    setImageFile,
  ] = useState<File | null>(null);

  const [
    imagePreview,
    setImagePreview,
  ] = useState("");

  const [
    uploadingImage,
    setUploadingImage,
  ] = useState(false);

  const [
    isActive,
    setIsActive,
  ] = useState(true);

  const [
    isFeatured,
    setIsFeatured,
  ] = useState(false);

  const [saving, setSaving] =
    useState(false);

  const [
    savingStock,
    setSavingStock,
  ] = useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    if (!supabase) {
      setCheckingAccess(false);
      setLoadingProduct(false);
      setCategoriesLoading(false);
      return;
    }

    const client = supabase;

    const loadPage = async () => {
      const {
        data: { user },
      } = await client.auth.getUser();

      if (!user) {
        window.location.href =
          "/account";
        return;
      }

      const {
        data: profile,
        error: profileError,
      } = await client
        .from("profiles")
        .select("role, is_active")
        .eq("id", user.id)
        .single();

      if (
        profileError ||
        !profile ||
        !profile.is_active ||
        ![
          "owner",
          "admin",
          "staff",
        ].includes(profile.role)
      ) {
        window.location.href =
          "/account";
        return;
      }

      const [
        productEditResult,
        stockViewResult,
        stockEditResult,
      ] = await Promise.all([
        client.rpc(
          "has_permission",
          {
            required_permission:
              "products.edit",
          }
        ),

        client.rpc(
          "has_permission",
          {
            required_permission:
              "stock.view",
          }
        ),

        client.rpc(
          "has_permission",
          {
            required_permission:
              "stock.edit",
          }
        ),
      ]);

      const hasProductEdit =
        !productEditResult.error &&
        productEditResult.data === true;

      const hasStockEdit =
        !stockEditResult.error &&
        stockEditResult.data === true;

      const hasStockView =
        hasStockEdit ||
        (!stockViewResult.error &&
          stockViewResult.data === true);

      if (
        !hasProductEdit &&
        !hasStockView
      ) {
        window.location.href =
          "/admin";
        return;
      }

      setRole(profile.role);

      setCanEditProduct(
        hasProductEdit
      );

      setCanViewStock(
        hasStockView
      );

      setCanEditStock(
        hasStockEdit
      );

      setCheckingAccess(false);

      const {
        data: categoryData,
        error: categoryError,
      } = await client
        .from("categories")
        .select(
          `
          id,
          name,
          slug,
          parent_id,
          store_section,
          sort_order
          `
        )
        .eq("is_active", true)
        .order("sort_order", {
          ascending: true,
        });

      if (categoryError) {
        console.error(
          "Category load error:",
          categoryError.message
        );
      } else {
        setCategories(
          categoryData ?? []
        );
      }

      setCategoriesLoading(false);

      const {
        data: product,
        error: productError,
      } = await client
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (
        productError ||
        !product
      ) {
        setMessage(
          `Error loading product: ${
            productError?.message ??
            "Product not found"
          }`
        );

        setLoadingProduct(false);
        return;
      }

      const resolvedProductType:
        ProductType =
        product.product_type ===
        "fashion"
          ? "fashion"
          : "book";

      setProductType(
        resolvedProductType
      );

      setName(
        product.name ?? ""
      );

      setSlug(
        product.slug ?? ""
      );

      setDescription(
        product.description ?? ""
      );

      setBookSection(
        product.book_section ===
          "adult"
          ? "adult"
          : "kids"
      );

      setFashionSection(
        product.fashion_section ??
          ""
      );

      setBrand(
        product.brand ?? ""
      );

      setPublisher(
        product.publisher ?? ""
      );

      setAgeMin(
        product.age_min !== null &&
          product.age_min !==
            undefined
          ? String(product.age_min)
          : ""
      );

      setAgeMax(
        product.age_max !== null &&
          product.age_max !==
            undefined
          ? String(product.age_max)
          : ""
      );

      setPrice(
        product.price !== null &&
          product.price !==
            undefined
          ? String(product.price)
          : ""
      );

      setDiscountPrice(
        product.discount_price !==
          null &&
          product.discount_price !==
            undefined
          ? String(
              product.discount_price
            )
          : ""
      );

      setStock(
        product.stock !== null &&
          product.stock !==
            undefined
          ? String(product.stock)
          : "0"
      );

      const existingImage =
        product.image_url ?? "";

      setCurrentImageUrl(
        existingImage
      );

      setImagePreview(
        existingImage
      );

      setIsActive(
        product.is_active ?? true
      );

      setIsFeatured(
        product.is_featured ??
          false
      );

      const {
        data: categoryRelations,
        error: relationError,
      } = await client
        .from(
          "product_categories"
        )
        .select("category_id")
        .eq(
          "product_id",
          productId
        );

      if (relationError) {
        console.error(
          "Product category load error:",
          relationError.message
        );
      }

      const firstRelation =
        categoryRelations?.[0];

      if (firstRelation) {
        setSelectedCategoryValue(
          `db:${firstRelation.category_id}`
        );
      } else if (
        product.category &&
        categoryData
      ) {
        const categoryMatch =
          categoryData.find(
            (category) => {
              const section =
                (
                  category.store_section ??
                  ""
                ).toLowerCase();

              const sectionMatches =
                resolvedProductType ===
                "fashion"
                  ? section ===
                    "fashion"
                  : [
                      "book",
                      "books",
                    ].includes(
                      section
                    );

              return (
                product.category ===
                  category.name &&
                sectionMatches
              );
            }
          );

        if (categoryMatch) {
          setSelectedCategoryValue(
            `db:${categoryMatch.id}`
          );
        }
      }

      setLoadingProduct(false);
    };

    loadPage();
  }, [productId]);

  useEffect(() => {
    return () => {
      if (
        imagePreview &&
        imagePreview.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          imagePreview
        );
      }
    };
  }, [imagePreview]);

  const bookCategories =
    useMemo(() => {
      return categories.filter(
        (category) =>
          ["book", "books"].includes(
            (
              category.store_section ??
              ""
            ).toLowerCase()
          )
      );
    }, [categories]);

  const bookCategoryOptions =
    useMemo(() => {
      const parentSlug =
        bookSection === "kids"
          ? "kids-books"
          : "adult-books";

      const selectedParent =
        bookCategories.find(
          (category) =>
            category.parent_id ===
              null &&
            category.slug ===
              parentSlug
        );

      if (!selectedParent) {
        return [];
      }

      return bookCategories.filter(
        (category) =>
          category.parent_id ===
          selectedParent.id
      );
    }, [
      bookCategories,
      bookSection,
    ]);

  const fashionCategories =
    useMemo(() => {
      return categories.filter(
        (category) =>
          (
            category.store_section ??
            ""
          ).toLowerCase() ===
          "fashion"
      );
    }, [categories]);

  const fashionCategoryOptions =
    useMemo(() => {
      if (!fashionSection) {
        return [];
      }

      const selectedParent =
        fashionCategories.find(
          (category) =>
            category.parent_id ===
              null &&
            category.slug ===
              `fashion-${fashionSection}`
        );

      if (!selectedParent) {
        return [];
      }

      return fashionCategories.filter(
        (category) =>
          category.id ===
            selectedParent.id ||
          category.parent_id ===
            selectedParent.id
      );
    }, [
      fashionCategories,
      fashionSection,
    ]);

  const handleProductTypeChange = (
    value: ProductType
  ) => {
    setProductType(value);
    setSelectedCategoryValue("");
    setMessage("");

    if (value === "book") {
      setFashionSection("");
      setBrand("");
    } else {
      setAgeMin("");
      setAgeMax("");
      setPublisher("");
    }
  };

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      setImageFile(null);
      setImagePreview(
        currentImageUrl
      );
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      event.target.value = "";

      setMessage(
        "Only JPG, PNG or WEBP images are allowed."
      );

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      event.target.value = "";

      setMessage(
        "Image must be 5 MB or smaller."
      );

      return;
    }

    if (
      imagePreview.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    const previewUrl =
      URL.createObjectURL(file);

    setMessage("");
    setImageFile(file);
    setImagePreview(previewUrl);
  };

  const uploadNewImage =
    async () => {
      if (
        !supabase ||
        !imageFile
      ) {
        return null;
      }

      setUploadingImage(true);

      const extension =
        imageFile.name
          .split(".")
          .pop()
          ?.toLowerCase() ||
        "jpg";

      const safeSlug =
        slug
          .toLowerCase()
          .trim()
          .replace(
            /[^a-z0-9]+/g,
            "-"
          )
          .replace(
            /^-+|-+$/g,
            ""
          ) || "product";

      const filePath =
        `${productType}/${Date.now()}-${safeSlug}.${extension}`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from("product-images")
        .upload(
          filePath,
          imageFile,
          {
            cacheControl:
              "3600",
            upsert: false,
          }
        );

      if (uploadError) {
        throw new Error(
          uploadError.message
        );
      }

      const { data } =
        supabase.storage
          .from(
            "product-images"
          )
          .getPublicUrl(
            filePath
          );

      return {
        publicUrl:
          data.publicUrl,
        filePath,
      };
    };

  const resolveSelectedCategory =
    () => {
      if (
        !selectedCategoryValue ||
        !selectedCategoryValue.startsWith(
          "db:"
        )
      ) {
        return {
          categoryName: null,
          categoryId: null,
        };
      }

      const categoryId =
        selectedCategoryValue.replace(
          "db:",
          ""
        );

      const selected =
        categories.find(
          (category) =>
            category.id ===
            categoryId
        );

      return {
        categoryName:
          selected?.name ?? null,

        categoryId:
          selected?.id ?? null,
      };
    };

  const handleStockSave =
    async () => {
      if (
        !supabase ||
        !canEditStock
      ) {
        setMessage(
          "You do not have permission to edit stock."
        );
        return;
      }

      const numericStock =
        Number(stock);

      if (
        Number.isNaN(
          numericStock
        ) ||
        numericStock < 0 ||
        !Number.isInteger(
          numericStock
        )
      ) {
        setMessage(
          "Stock must be a whole number of 0 or more."
        );
        return;
      }

      setSavingStock(true);
      setMessage("");

      const {
        data,
        error,
      } = await supabase.rpc(
        "update_inventory_stock",
        {
          p_product_id:
            productId,

          p_new_stock:
            numericStock,

          p_variant_id:
            null,

          p_reason:
            stockReason.trim() ||
            "Manual stock adjustment",
        }
      );

      if (error) {
        setMessage(
          `Error: ${error.message}`
        );

        setSavingStock(false);
        return;
      }

      const returnedStock =
        data &&
        typeof data === "object" &&
        "new_stock" in data
          ? Number(
              data.new_stock
            )
          : numericStock;

      setStock(
        String(returnedStock)
      );

      setMessage(
        "Stock updated securely."
      );

      setSavingStock(false);
    };

  const handleSave = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!supabase) {
      setMessage(
        "Supabase is not connected."
      );
      return;
    }

    if (!canEditProduct) {
      setMessage(
        "You do not have permission to edit product details."
      );
      return;
    }

    if (
      !name.trim() ||
      !slug.trim() ||
      price === ""
    ) {
      setMessage(
        "Please fill all required fields."
      );
      return;
    }

    const numericPrice =
      Number(price);

    if (
      Number.isNaN(
        numericPrice
      ) ||
      numericPrice < 0
    ) {
      setMessage(
        "Please enter a valid price."
      );
      return;
    }

    let numericDiscount:
      | number
      | null = null;

    if (
      discountPrice !== ""
    ) {
      numericDiscount =
        Number(discountPrice);

      if (
        Number.isNaN(
          numericDiscount
        ) ||
        numericDiscount < 0
      ) {
        setMessage(
          "Please enter a valid discount price."
        );
        return;
      }

      if (
        numericDiscount >
        numericPrice
      ) {
        setMessage(
          "Discount price cannot be higher than regular price."
        );
        return;
      }
    }

    if (
      productType === "book" &&
      bookSection === "kids"
    ) {
      if (
        ageMin === "" ||
        ageMax === ""
      ) {
        setMessage(
          "Please enter the age range for a kids book."
        );
        return;
      }

      const minimumAge =
        Number(ageMin);

      const maximumAge =
        Number(ageMax);

      if (
        Number.isNaN(
          minimumAge
        ) ||
        Number.isNaN(
          maximumAge
        ) ||
        minimumAge < 0 ||
        maximumAge < 0
      ) {
        setMessage(
          "Please enter a valid age range."
        );
        return;
      }

      if (
        minimumAge >
        maximumAge
      ) {
        setMessage(
          "Minimum age cannot be higher than maximum age."
        );
        return;
      }
    }

    if (
      productType ===
        "fashion" &&
      !fashionSection
    ) {
      setMessage(
        "Please select a fashion section."
      );
      return;
    }

    const {
      categoryName,
      categoryId,
    } =
      resolveSelectedCategory();

    if (
      !categoryName ||
      !categoryId
    ) {
      setMessage(
        "Please select a category."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    let uploadedFilePath:
      | string
      | null = null;

    try {
      let finalImageUrl:
        | string
        | null =
        currentImageUrl ||
        null;

      if (imageFile) {
        const uploaded =
          await uploadNewImage();

        if (uploaded) {
          finalImageUrl =
            uploaded.publicUrl;

          uploadedFilePath =
            uploaded.filePath;
        }
      }

      /*
       * IMPORTANT:
       * Stock is NOT updated here.
       * Stock uses the secure inventory RPC.
       */
      const updateData = {
        name: name.trim(),

        slug: slug.trim(),

        description:
          description.trim() ||
          null,

        category:
          categoryName,

        product_type:
          productType,

        book_section:
          productType === "book"
            ? bookSection
            : null,

        fashion_section:
          productType ===
          "fashion"
            ? fashionSection
            : null,

        brand:
          productType ===
          "fashion"
            ? brand.trim() ||
              null
            : null,

        publisher:
          productType === "book"
            ? publisher.trim() ||
              null
            : null,

        age_min:
          productType === "book" &&
          bookSection === "kids"
            ? Number(ageMin)
            : null,

        age_max:
          productType === "book" &&
          bookSection === "kids"
            ? Number(ageMax)
            : null,

        price:
          numericPrice,

        discount_price:
          numericDiscount,

        image_url:
          finalImageUrl,

        is_active:
          isActive,

        is_featured:
          isFeatured,

        updated_at:
          new Date().toISOString(),
      };

      const {
        error: productError,
      } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", productId);

      if (productError) {
        throw new Error(
          productError.message
        );
      }

      const {
        error:
          deleteRelationError,
      } = await supabase
        .from(
          "product_categories"
        )
        .delete()
        .eq(
          "product_id",
          productId
        );

      if (
        deleteRelationError
      ) {
        throw new Error(
          `Old category link could not be removed: ${deleteRelationError.message}`
        );
      }

      const {
        error:
          insertRelationError,
      } = await supabase
        .from(
          "product_categories"
        )
        .insert({
          product_id:
            productId,

          category_id:
            categoryId,
        });

      if (
        insertRelationError
      ) {
        throw new Error(
          `New category link could not be saved: ${insertRelationError.message}`
        );
      }

      setCurrentImageUrl(
        finalImageUrl ?? ""
      );

      setImagePreview(
        finalImageUrl ?? ""
      );

      setImageFile(null);

      setMessage(
        "Product details updated successfully."
      );
    } catch (error) {
      if (
        uploadedFilePath &&
        supabase
      ) {
        await supabase.storage
          .from(
            "product-images"
          )
          .remove([
            uploadedFilePath,
          ]);
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong.";

      setMessage(
        `Error: ${errorMessage}`
      );
    } finally {
      setUploadingImage(false);
      setSaving(false);
    }
  };

  if (
    checkingAccess ||
    loadingProduct
  ) {
    return (
      <>
        <Header />

        <main className="section-shell simple-page">
          <h1>
            Loading product...
          </h1>
        </main>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="section-shell page-space">
        <div className="eyebrow">
          JIPLANCE ADMIN
        </div>

        <h1>
          {canEditProduct
            ? "Edit Product"
            : "Product Inventory"}
        </h1>

        <p>
          Signed in as{" "}
          <strong>
            {role?.toUpperCase()}
          </strong>
        </p>

        {message && (
          <p
            style={{
              marginTop:
                "1rem",
            }}
          >
            {message}
          </p>
        )}

        {canViewStock && (
          <section
            className="empty-box"
            style={{
              maxWidth:
                "850px",

              marginTop:
                "1.5rem",

              textAlign:
                "left",
            }}
          >
            <div className="eyebrow">
              SECURE INVENTORY
            </div>

            <h2
              style={{
                marginBottom:
                  "0.5rem",
              }}
            >
              Product Stock
            </h2>

            <p
              style={{
                marginTop: 0,
                opacity: 0.75,
              }}
            >
              Stock changes are
              saved separately from
              product details and
              recorded in inventory
              history.
            </p>

            <label
              style={{
                display: "grid",
                gap: "0.45rem",
                maxWidth:
                  "320px",
                marginTop:
                  "1rem",
              }}
            >
              Stock

              <input
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(event) =>
                  setStock(
                    event.target
                      .value
                  )
                }
                disabled={
                  !canEditStock ||
                  savingStock
                }
              />
            </label>

            {canEditStock ? (
              <>
                <label
                  style={{
                    display:
                      "grid",
                    gap: "0.45rem",
                    maxWidth:
                      "520px",
                    marginTop:
                      "1rem",
                  }}
                >
                  Adjustment Reason

                  <input
                    type="text"
                    maxLength={250}
                    value={
                      stockReason
                    }
                    onChange={(
                      event
                    ) =>
                      setStockReason(
                        event.target
                          .value
                      )
                    }
                    placeholder="Restock, correction, damaged item..."
                  />
                </label>

                <button
                  type="button"
                  className="primary-button"
                  onClick={
                    handleStockSave
                  }
                  disabled={
                    savingStock
                  }
                  style={{
                    marginTop:
                      "1rem",
                  }}
                >
                  {savingStock
                    ? "Updating Stock..."
                    : "Update Stock"}
                </button>
              </>
            ) : (
              <p
                style={{
                  marginBottom: 0,
                }}
              >
                <strong>
                  Read only:
                </strong>{" "}
                you can view stock
                but cannot change it.
              </p>
            )}
          </section>
        )}

        {canEditProduct && (
          <form
            className="checkout-form"
            onSubmit={
              handleSave
            }
            style={{
              maxWidth:
                "850px",

              marginTop:
                "2rem",
            }}
          >
            <label>
              Product Type *

              <select
                value={
                  productType
                }
                onChange={(event) =>
                  handleProductTypeChange(
                    event.target
                      .value as ProductType
                  )
                }
              >
                <option value="book">
                  Book
                </option>

                <option value="fashion">
                  Fashion
                </option>
              </select>
            </label>

            <label>
              Product Name *

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target
                      .value
                  )
                }
                required
              />
            </label>

            <label>
              Slug *

              <input
                type="text"
                value={slug}
                onChange={(event) =>
                  setSlug(
                    event.target
                      .value
                  )
                }
                required
              />
            </label>

            <label>
              Description

              <textarea
                value={
                  description
                }
                onChange={(event) =>
                  setDescription(
                    event.target
                      .value
                  )
                }
                rows={5}
              />
            </label>

            {productType ===
              "book" && (
              <>
                <label>
                  Book Section *

                  <select
                    value={
                      bookSection
                    }
                    onChange={(
                      event
                    ) => {
                      setBookSection(
                        event.target
                          .value as BookSection
                      );

                      setSelectedCategoryValue(
                        ""
                      );

                      setAgeMin("");
                      setAgeMax("");
                    }}
                  >
                    <option value="kids">
                      Kids
                    </option>

                    <option value="adult">
                      Adult
                    </option>
                  </select>
                </label>

                <label>
                  Category *

                  <select
                    value={
                      selectedCategoryValue
                    }
                    onChange={(
                      event
                    ) =>
                      setSelectedCategoryValue(
                        event.target
                          .value
                      )
                    }
                    disabled={
                      categoriesLoading
                    }
                    required
                  >
                    <option value="">
                      {categoriesLoading
                        ? "Loading categories..."
                        : "Select category"}
                    </option>

                    {bookCategoryOptions.map(
                      (
                        category
                      ) => (
                        <option
                          key={
                            category.id
                          }
                          value={`db:${category.id}`}
                        >
                          {
                            category.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Publisher

                  <input
                    type="text"
                    value={
                      publisher
                    }
                    onChange={(
                      event
                    ) =>
                      setPublisher(
                        event.target
                          .value
                      )
                    }
                  />
                </label>

                {bookSection ===
                  "kids" && (
                  <>
                    <label>
                      Minimum Age *

                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={
                          ageMin
                        }
                        onChange={(
                          event
                        ) =>
                          setAgeMin(
                            event
                              .target
                              .value
                          )
                        }
                        required
                      />
                    </label>

                    <label>
                      Maximum Age *

                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={
                          ageMax
                        }
                        onChange={(
                          event
                        ) =>
                          setAgeMax(
                            event
                              .target
                              .value
                          )
                        }
                        required
                      />
                    </label>
                  </>
                )}
              </>
            )}

            {productType ===
              "fashion" && (
              <>
                <label>
                  Fashion Section *

                  <select
                    value={
                      fashionSection
                    }
                    onChange={(
                      event
                    ) => {
                      setFashionSection(
                        event.target
                          .value
                      );

                      setSelectedCategoryValue(
                        ""
                      );
                    }}
                    required
                  >
                    <option value="">
                      Select section
                    </option>

                    <option value="men">
                      Men
                    </option>

                    <option value="women">
                      Women
                    </option>

                    <option value="kids">
                      Kids
                    </option>

                    <option value="accessories">
                      Accessories
                    </option>
                  </select>
                </label>

                <label>
                  Category *

                  <select
                    value={
                      selectedCategoryValue
                    }
                    onChange={(
                      event
                    ) =>
                      setSelectedCategoryValue(
                        event.target
                          .value
                      )
                    }
                    disabled={
                      categoriesLoading ||
                      !fashionSection
                    }
                    required
                  >
                    <option value="">
                      {!fashionSection
                        ? "Select fashion section first"
                        : categoriesLoading
                        ? "Loading categories..."
                        : "Select category"}
                    </option>

                    {fashionCategoryOptions.map(
                      (
                        category
                      ) => {
                        const parent =
                          category.parent_id
                            ? fashionCategories.find(
                                (
                                  item
                                ) =>
                                  item.id ===
                                  category.parent_id
                              )
                            : null;

                        const label =
                          parent
                            ? `${parent.name} → ${category.name}`
                            : category.name;

                        return (
                          <option
                            key={
                              category.id
                            }
                            value={`db:${category.id}`}
                          >
                            {label}
                          </option>
                        );
                      }
                    )}
                  </select>
                </label>

                <label>
                  Brand

                  <input
                    type="text"
                    value={brand}
                    onChange={(
                      event
                    ) =>
                      setBrand(
                        event.target
                          .value
                      )
                    }
                  />
                </label>
              </>
            )}

            <label>
              Price (৳) *

              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) =>
                  setPrice(
                    event.target
                      .value
                  )
                }
                required
              />
            </label>

            <label>
              Discount Price (৳)

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  discountPrice
                }
                onChange={(event) =>
                  setDiscountPrice(
                    event.target
                      .value
                  )
                }
              />
            </label>

            <label>
              Replace Product Image

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={
                  handleImageChange
                }
              />
            </label>

            {imagePreview && (
              <div
                style={{
                  marginTop:
                    "0.75rem",
                }}
              >
                <p>
                  Current / New Image
                  Preview:
                </p>

                <img
                  src={
                    imagePreview
                  }
                  alt={
                    name ||
                    "Product image"
                  }
                  style={{
                    width:
                      "220px",

                    maxWidth:
                      "100%",

                    borderRadius:
                      "16px",

                    objectFit:
                      "cover",
                  }}
                />
              </div>
            )}

            {!imagePreview && (
              <p>
                No product image
                uploaded yet.
              </p>
            )}

            <label>
              <input
                type="checkbox"
                checked={
                  isActive
                }
                onChange={(
                  event
                ) =>
                  setIsActive(
                    event.target
                      .checked
                  )
                }
              />{" "}
              Active Product
            </label>

            <label>
              <input
                type="checkbox"
                checked={
                  isFeatured
                }
                onChange={(
                  event
                ) =>
                  setIsFeatured(
                    event.target
                      .checked
                  )
                }
              />{" "}
              Featured Product
            </label>

            <button
              className="primary-button wide"
              type="submit"
              disabled={
                saving ||
                uploadingImage ||
                categoriesLoading
              }
            >
              {uploadingImage
                ? "Uploading Image..."
                : saving
                ? "Saving..."
                : "Save Product Details"}
            </button>
          </form>
        )}
          {canEditProduct && (
  <ProductImageGalleryManager
    productId={productId}
    productType={productType}
    productSlug={slug}
    canEditProduct={canEditProduct}
  />
)}
        {productType ===
          "fashion" && (
          <ProductVariantManager
            productId={
              productId
            }
            canEditProduct={
              canEditProduct
            }
            canViewStock={
              canViewStock
            }
            canEditStock={
              canEditStock
            }
          />
        )}

        <div
          style={{
            marginTop:
              "1.5rem",
          }}
        >
          <a href="/admin">
            ← Back to Dashboard
          </a>
        </div>
      </main>

      <Footer />
    </>
  );
}