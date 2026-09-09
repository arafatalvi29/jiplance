"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

type ProductType =
  | "book"
  | "fashion";

type BookSection =
  | "kids"
  | "adult";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  store_section: string | null;
  sort_order: number | null;
};

type VariantDraft = {
  localId: string;
  size: string;
  color: string;
  sku: string;
  stock: string;
  price: string;
  discountPrice: string;
};

const fallbackBookCategories = [
  "Sensory",
  "Story",
  "Educational",
];

function createEmptyVariant(): VariantDraft {
  return {
    localId:
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`,

    size: "",
    color: "",
    sku: "",
    stock: "0",
    price: "",
    discountPrice: "",
  };
}

export default function NewProductPage() {
  const [role, setRole] =
    useState<string | null>(null);

  const [
    checkingAccess,
    setCheckingAccess,
  ] = useState(true);

  const [
    categoriesLoading,
    setCategoriesLoading,
  ] = useState(true);

  const [
    categories,
    setCategories,
  ] =
    useState<CategoryRow[]>([]);

  const [
    productType,
    setProductType,
  ] =
    useState<ProductType>(
      "book"
    );

  const [name, setName] =
    useState("");

  const [slug, setSlug] =
    useState("");

  const [
    description,
    setDescription,
  ] =
    useState("");

  const [
    selectedCategoryValue,
    setSelectedCategoryValue,
  ] =
    useState("");

  const [
    bookSection,
    setBookSection,
  ] =
    useState<BookSection>(
      "kids"
    );

  const [
    fashionSection,
    setFashionSection,
  ] =
    useState("");

  const [brand, setBrand] =
    useState("JIPLANCE");

  const [
    publisher,
    setPublisher,
  ] =
    useState("JIPLANCE");

  const [ageMin, setAgeMin] =
    useState("");

  const [ageMax, setAgeMax] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [
    discountPrice,
    setDiscountPrice,
  ] =
    useState("");

  const [stock, setStock] =
    useState("");

  /* =====================================================
     FASHION VARIANTS
  ===================================================== */

  const [
    variants,
    setVariants,
  ] =
    useState<VariantDraft[]>(
      []
    );

  const [
    imageFile,
    setImageFile,
  ] =
    useState<File | null>(
      null
    );

  const [
    imagePreview,
    setImagePreview,
  ] =
    useState("");

  const [
    uploadingImage,
    setUploadingImage,
  ] =
    useState(false);

  const [
    isActive,
    setIsActive,
  ] =
    useState(true);

  const [
    isFeatured,
    setIsFeatured,
  ] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  /* =====================================================
     INITIAL ACCESS + CATEGORIES
  ===================================================== */

  useEffect(() => {
    if (!supabase) {
      setCheckingAccess(
        false
      );

      setCategoriesLoading(
        false
      );

      return;
    }

    const client =
      supabase;

    const initializePage =
      async () => {
        const {
          data: {
            user,
          },
        } =
          await client.auth.getUser();

        if (!user) {
          window.location.href =
            "/account";

          return;
        }

        const {
          data: profile,
          error:
            profileError,
        } =
          await client
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
          window.location.href =
            "/account";

          return;
        }

        const {
          data:
            canCreateProduct,
          error:
            permissionError,
        } =
          await client.rpc(
            "has_permission",
            {
              required_permission:
                "products.create",
            }
          );

        if (
          permissionError ||
          canCreateProduct !==
            true
        ) {
          window.location.href =
            "/admin";

          return;
        }

        setRole(
          profile.role
        );

        const {
          data:
            categoryData,
          error:
            categoryError,
        } =
          await client
            .from(
              "categories"
            )
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
            );

        if (
          categoryError
        ) {
          console.error(
            "Category load error:",
            categoryError.message
          );
        } else {
          setCategories(
            categoryData ??
              []
          );
        }

        setCategoriesLoading(
          false
        );

        setCheckingAccess(
          false
        );
      };

    initializePage();
  }, []);

  /* =====================================================
     IMAGE PREVIEW CLEANUP
  ===================================================== */

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

  /* =====================================================
     BOOK CATEGORIES
  ===================================================== */

  const bookDatabaseCategories =
    useMemo(() => {
      return categories.filter(
        (category) =>
          [
            "book",
            "books",
          ].includes(
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
        bookSection ===
        "kids"
          ? "kids-books"
          : "adult-books";

      const selectedParent =
        bookDatabaseCategories.find(
          (category) =>
            category.parent_id ===
              null &&
            category.slug ===
              parentSlug
        );

      if (
        !selectedParent
      ) {
        return [];
      }

      return bookDatabaseCategories.filter(
        (category) =>
          category.parent_id ===
          selectedParent.id
      );
    }, [
      bookDatabaseCategories,
      bookSection,
    ]);

  /* =====================================================
     FASHION CATEGORIES
  ===================================================== */

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
      if (
        !fashionSection
      ) {
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

      if (
        !selectedParent
      ) {
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

  /* =====================================================
     VARIANT STOCK
  ===================================================== */

  const variantStockTotal =
    useMemo(() => {
      return variants.reduce(
        (
          total,
          variant
        ) => {
          const value =
            Number(
              variant.stock
            );

          if (
            Number.isNaN(
              value
            ) ||
            value < 0
          ) {
            return total;
          }

          return (
            total +
            value
          );
        },
        0
      );
    }, [variants]);

  /* =====================================================
     PRODUCT TYPE
  ===================================================== */

  const handleProductTypeChange =
    (
      value:
        ProductType
    ) => {
      setProductType(
        value
      );

      setSelectedCategoryValue(
        ""
      );

      setMessage("");

      if (
        value ===
        "book"
      ) {
        setFashionSection(
          ""
        );

        setBrand(
          "JIPLANCE"
        );

        setVariants([]);
      } else {
        setAgeMin("");
        setAgeMax("");
      }
    };

  /* =====================================================
     NAME + SLUG
  ===================================================== */

  const handleNameChange =
    (
      value: string
    ) => {
      setName(value);

      const generatedSlug =
        value
          .toLowerCase()
          .trim()
          .replace(
            /[^a-z0-9]+/g,
            "-"
          )
          .replace(
            /^-+|-+$/g,
            ""
          );

      setSlug(
        generatedSlug
      );
    };

  /* =====================================================
     VARIANT FUNCTIONS
  ===================================================== */

  const addVariant =
    () => {
      setVariants(
        (current) => [
          ...current,
          createEmptyVariant(),
        ]
      );

      setMessage("");
    };

  const removeVariant =
    (
      localId: string
    ) => {
      setVariants(
        (current) =>
          current.filter(
            (variant) =>
              variant.localId !==
              localId
          )
      );

      setMessage("");
    };

  const updateVariant =
    (
      localId: string,
      field:
        | "size"
        | "color"
        | "sku"
        | "stock"
        | "price"
        | "discountPrice",
      value: string
    ) => {
      setVariants(
        (current) =>
          current.map(
            (variant) =>
              variant.localId ===
              localId
                ? {
                    ...variant,
                    [field]:
                      value,
                  }
                : variant
          )
      );
    };

  /* =====================================================
     IMAGE
  ===================================================== */

  const handleImageChange =
    (
      event:
        React.ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target
          .files?.[0];

      if (!file) {
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

        setImageFile(null);
        setImagePreview("");

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
        event.target.value =
          "";

        setMessage(
          "Only JPG, PNG or WEBP images are allowed."
        );

        return;
      }

      if (
        file.size >
        5 * 1024 * 1024
      ) {
        event.target.value =
          "";

        setMessage(
          "Image must be 5 MB or smaller."
        );

        return;
      }

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

      const previewUrl =
        URL.createObjectURL(
          file
        );

      setMessage("");
      setImageFile(file);
      setImagePreview(
        previewUrl
      );
    };

  const uploadImage =
    async () => {
      if (
        !supabase ||
        !imageFile
      ) {
        return null;
      }

      setUploadingImage(
        true
      );

      const extension =
        imageFile.name
          .split(".")
          .pop()
          ?.toLowerCase() ||
        "jpg";

      const safeSlug =
        slug ||
        name
          .toLowerCase()
          .trim()
          .replace(
            /[^a-z0-9]+/g,
            "-"
          )
          .replace(
            /^-+|-+$/g,
            ""
          );

      const filePath =
        `${productType}/${Date.now()}-${safeSlug}.${extension}`;

      const {
        error:
          uploadError,
      } =
        await supabase.storage
          .from(
            "product-images"
          )
          .upload(
            filePath,
            imageFile,
            {
              cacheControl:
                "3600",
              upsert:
                false,
            }
          );

      if (
        uploadError
      ) {
        throw new Error(
          uploadError.message
        );
      }

      const {
        data,
      } =
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

  /* =====================================================
     CATEGORY
  ===================================================== */

  const resolveSelectedCategory =
    () => {
      if (
        !selectedCategoryValue
      ) {
        return {
          categoryName:
            null,
          categoryId:
            null,
        };
      }

      if (
        selectedCategoryValue.startsWith(
          "fallback:"
        )
      ) {
        return {
          categoryName:
            selectedCategoryValue.replace(
              "fallback:",
              ""
            ),
          categoryId:
            null,
        };
      }

      if (
        selectedCategoryValue.startsWith(
          "db:"
        )
      ) {
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
            selected?.name ??
            null,

          categoryId:
            selected?.id ??
            null,
        };
      }

      return {
        categoryName:
          null,
        categoryId:
          null,
      };
    };

  /* =====================================================
     RESET
  ===================================================== */

  const resetForm =
    () => {
      setName("");
      setSlug("");
      setDescription("");

      setSelectedCategoryValue(
        ""
      );

      setBookSection(
        "kids"
      );

      setFashionSection(
        ""
      );

      setPublisher(
        "JIPLANCE"
      );

      setBrand(
        "JIPLANCE"
      );

      setAgeMin("");
      setAgeMax("");

      setPrice("");
      setDiscountPrice("");
      setStock("");

      setVariants([]);

      setImageFile(null);

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

      setImagePreview("");

      setIsActive(true);
      setIsFeatured(false);
    };

  /* =====================================================
     SUBMIT
  ===================================================== */

  const handleSubmit =
    async (
      event:
        React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (!supabase) {
        setMessage(
          "Supabase is not connected."
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
        | null =
        null;

      if (
        discountPrice !==
        ""
      ) {
        numericDiscount =
          Number(
            discountPrice
          );

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

      /* =================================================
         BOOK STOCK VALIDATION
      ================================================= */

      let numericStock =
        0;

      if (
        productType ===
        "book" ||
        variants.length ===
          0
      ) {
        if (
          stock === ""
        ) {
          setMessage(
            "Please enter product stock."
          );

          return;
        }

        numericStock =
          Number(stock);

        if (
          Number.isNaN(
            numericStock
          ) ||
          numericStock <
            0 ||
          !Number.isInteger(
            numericStock
          )
        ) {
          setMessage(
            "Stock must be a whole number of 0 or more."
          );

          return;
        }
      }

      /* =================================================
         BOOK VALIDATION
      ================================================= */

      if (
        productType ===
          "book" &&
        bookSection ===
          "kids"
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

        const minAge =
          Number(
            ageMin
          );

        const maxAge =
          Number(
            ageMax
          );

        if (
          Number.isNaN(
            minAge
          ) ||
          Number.isNaN(
            maxAge
          ) ||
          minAge < 0 ||
          maxAge < 0
        ) {
          setMessage(
            "Please enter a valid age range."
          );

          return;
        }

        if (
          minAge >
          maxAge
        ) {
          setMessage(
            "Minimum age cannot be higher than maximum age."
          );

          return;
        }
      }

      /* =================================================
         FASHION VALIDATION
      ================================================= */

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

      /* =================================================
         VARIANT VALIDATION
      ================================================= */

      if (
        productType ===
          "fashion" &&
        variants.length >
          0
      ) {
        const seenCombinations =
          new Set<string>();

        for (
          let index = 0;
          index <
          variants.length;
          index++
        ) {
          const variant =
            variants[
              index
            ];

          const row =
            index + 1;

          const size =
            variant.size.trim();

          const color =
            variant.color.trim();

          if (
            !size &&
            !color
          ) {
            setMessage(
              `Variant ${row}: enter a Size, Color, or both.`
            );

            return;
          }

          const variantStock =
            Number(
              variant.stock
            );

          if (
            Number.isNaN(
              variantStock
            ) ||
            variantStock <
              0 ||
            !Number.isInteger(
              variantStock
            )
          ) {
            setMessage(
              `Variant ${row}: stock must be a whole number of 0 or more.`
            );

            return;
          }

          const combinationKey =
            `${size.toLowerCase()}|${color.toLowerCase()}`;

          if (
            seenCombinations.has(
              combinationKey
            )
          ) {
            setMessage(
              `Variant ${row}: duplicate Size/Color combination.`
            );

            return;
          }

          seenCombinations.add(
            combinationKey
          );

          if (
            variant.price !==
            ""
          ) {
            const variantPrice =
              Number(
                variant.price
              );

            if (
              Number.isNaN(
                variantPrice
              ) ||
              variantPrice <
                0
            ) {
              setMessage(
                `Variant ${row}: invalid price.`
              );

              return;
            }
          }

          if (
            variant.discountPrice !==
            ""
          ) {
            const variantDiscount =
              Number(
                variant.discountPrice
              );

            if (
              Number.isNaN(
                variantDiscount
              ) ||
              variantDiscount <
                0
            ) {
              setMessage(
                `Variant ${row}: invalid discount price.`
              );

              return;
            }

            const effectiveVariantPrice =
              variant.price !==
              ""
                ? Number(
                    variant.price
                  )
                : numericPrice;

            if (
              variantDiscount >
              effectiveVariantPrice
            ) {
              setMessage(
                `Variant ${row}: discount price cannot be higher than its regular price.`
              );

              return;
            }
          }
        }

        numericStock =
          variantStockTotal;
      }

      const {
        categoryName,
        categoryId,
      } =
        resolveSelectedCategory();

      if (
        !categoryName
      ) {
        setMessage(
          "Please select a category."
        );

        return;
      }

      setSaving(true);
      setUploadingImage(
        false
      );
      setMessage("");

      let uploadedFilePath:
        | string
        | null =
        null;

      let createdProductId:
        | string
        | null =
        null;

      try {
        let imageUrl:
          | string
          | null =
          null;

        /* ===============================================
           IMAGE UPLOAD
        =============================================== */

        if (
          imageFile
        ) {
          const uploaded =
            await uploadImage();

          if (
            uploaded
          ) {
            imageUrl =
              uploaded.publicUrl;

            uploadedFilePath =
              uploaded.filePath;
          }
        }

        /* ===============================================
           CREATE PRODUCT
        =============================================== */

        const insertData = {
          name:
            name.trim(),

          slug:
            slug.trim(),

          description:
            description.trim() ||
            null,

          category:
            categoryName,

          product_type:
            productType,

          book_section:
            productType ===
            "book"
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
            productType ===
            "book"
              ? publisher.trim() ||
                null
              : null,

          age_min:
            productType ===
              "book" &&
            bookSection ===
              "kids"
              ? Number(
                  ageMin
                )
              : null,

          age_max:
            productType ===
              "book" &&
            bookSection ===
              "kids"
              ? Number(
                  ageMax
                )
              : null,

          price:
            numericPrice,

          discount_price:
            numericDiscount,

          stock:
            numericStock,

          image_url:
            imageUrl,

          is_active:
            isActive,

          is_featured:
            isFeatured,
        };

        const {
          data:
            createdProduct,
          error:
            productError,
        } =
          await supabase
            .from(
              "products"
            )
            .insert(
              insertData
            )
            .select(
              "id"
            )
            .single();

        if (
          productError
        ) {
          throw new Error(
            productError.message
          );
        }

        createdProductId =
          createdProduct.id;

        /* ===============================================
           CATEGORY RELATION
        =============================================== */

        if (
          categoryId
        ) {
          const {
            error:
              relationError,
          } =
            await supabase
              .from(
                "product_categories"
              )
              .insert({
                product_id:
                  createdProduct.id,

                category_id:
                  categoryId,
              });

          if (
            relationError
          ) {
            throw new Error(
              `Product category link failed: ${relationError.message}`
            );
          }
        }

        /* ===============================================
           CREATE FASHION VARIANTS
        =============================================== */

        if (
          productType ===
            "fashion" &&
          variants.length >
            0
        ) {
          const variantRows =
            variants.map(
              (
                variant
              ) => ({
                product_id:
                  createdProduct.id,

                size:
                  variant.size.trim() ||
                  null,

                color:
                  variant.color.trim() ||
                  null,

                sku:
                  variant.sku.trim() ||
                  null,

                stock:
                  Number(
                    variant.stock
                  ),

                price:
                  variant.price !==
                  ""
                    ? Number(
                        variant.price
                      )
                    : null,

                discount_price:
                  variant.discountPrice !==
                  ""
                    ? Number(
                        variant.discountPrice
                      )
                    : null,

                is_active:
                  true,
              })
            );

          const {
            error:
              variantError,
          } =
            await supabase
              .from(
                "product_variants"
              )
              .insert(
                variantRows
              );

          if (
            variantError
          ) {
            throw new Error(
              `Variant creation failed: ${variantError.message}`
            );
          }
        }

        resetForm();

        setMessage(
          productType ===
              "fashion" &&
            variants.length >
              0
            ? "Product and variants added successfully."
            : "Product added successfully."
        );
      } catch (
        error
      ) {
        /* ===============================================
           ROLLBACK PRODUCT
        =============================================== */

        if (
          createdProductId &&
          supabase
        ) {
          await supabase
            .from(
              "products"
            )
            .delete()
            .eq(
              "id",
              createdProductId
            );
        }

        /* ===============================================
           ROLLBACK IMAGE
        =============================================== */

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
          error instanceof
          Error
            ? error.message
            : "Something went wrong.";

        setMessage(
          `Error: ${errorMessage}`
        );
      } finally {
        setUploadingImage(
          false
        );

        setSaving(false);
      }
    };

  /* =====================================================
     ACCESS LOADING
  ===================================================== */

  if (
    checkingAccess
  ) {
    return (
      <>
        <Header />

        <main className="section-shell simple-page">
          <h1>
            Checking product access...
          </h1>
        </main>

        <Footer />
      </>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <>
      <Header />

      <main className="section-shell page-space">
        <div className="eyebrow">
          JIPLANCE ADMIN
        </div>

        <h1>
          Add New Product
        </h1>

        <p>
          Signed in as{" "}
          <strong>
            {role?.toUpperCase()}
          </strong>
        </p>

        <form
          className="checkout-form"
          onSubmit={
            handleSubmit
          }
          style={{
            maxWidth:
              "850px",

            marginTop:
              "2rem",
          }}
        >
          {/* =============================================
              PRODUCT TYPE
          ============================================= */}

          <label>
            Product Type *
            <select
              value={
                productType
              }
              onChange={(
                event
              ) =>
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

          {/* =============================================
              BASIC INFO
          ============================================= */}

          <label>
            Product Name *
            <input
              type="text"
              value={
                name
              }
              onChange={(
                event
              ) =>
                handleNameChange(
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
              value={
                slug
              }
              onChange={(
                event
              ) =>
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
              onChange={(
                event
              ) =>
                setDescription(
                  event.target
                    .value
                )
              }
              rows={5}
            />
          </label>

          {/* =============================================
              BOOK FIELDS
          ============================================= */}

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

                    setAgeMin(
                      ""
                    );

                    setAgeMax(
                      ""
                    );
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

                  {bookCategoryOptions.length >
                  0
                    ? bookCategoryOptions.map(
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
                      )
                    : bookSection ===
                      "kids"
                    ? fallbackBookCategories.map(
                        (
                          category
                        ) => (
                          <option
                            key={
                              category
                            }
                            value={`fallback:${category}`}
                          >
                            {
                              category
                            }
                          </option>
                        )
                      )
                    : null}
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
                          event.target
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
                          event.target
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

          {/* =============================================
              FASHION FIELDS
          ============================================= */}

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
                          {
                            label
                          }
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
                  value={
                    brand
                  }
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

          {/* =============================================
              BASE PRICE
          ============================================= */}

          <label>
            Price (৳) *
            <input
              type="number"
              min="0"
              step="0.01"
              value={
                price
              }
              onChange={(
                event
              ) =>
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
              onChange={(
                event
              ) =>
                setDiscountPrice(
                  event.target
                    .value
                )
              }
            />
          </label>

          {/* =============================================
              STOCK WITHOUT VARIANTS
          ============================================= */}

          {(productType ===
            "book" ||
            variants.length ===
              0) && (
            <label>
              {productType ===
              "fashion"
                ? "Stock (used when no variants are added) *"
                : "Stock *"}

              <input
                type="number"
                min="0"
                step="1"
                value={
                  stock
                }
                onChange={(
                  event
                ) =>
                  setStock(
                    event.target
                      .value
                  )
                }
                required
              />
            </label>
          )}

          {/* =============================================
              FASHION VARIANTS
          ============================================= */}

          {productType ===
            "fashion" && (
            <section
              style={{
                marginTop:
                  "0.5rem",

                padding:
                  "1.25rem",

                border:
                  "1px solid var(--line)",

                borderRadius:
                  "18px",

                background:
                  "rgba(255,255,255,0.7)",
              }}
            >
              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  alignItems:
                    "center",

                  gap:
                    "1rem",

                  flexWrap:
                    "wrap",
                }}
              >
                <div>
                  <strong>
                    Fashion Variants
                  </strong>

                  <p
                    style={{
                      margin:
                        "0.35rem 0 0",

                      color:
                        "var(--muted)",

                      fontSize:
                        "0.85rem",
                    }}
                  >
                    Add Size,
                    Color and
                    Stock while
                    creating the
                    product.
                  </p>
                </div>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    addVariant
                  }
                >
                  + Add Variant
                </button>
              </div>

              {variants.length ===
              0 ? (
                <div
                  style={{
                    marginTop:
                      "1rem",

                    padding:
                      "1rem",

                    borderRadius:
                      "14px",

                    background:
                      "var(--cream)",

                    color:
                      "var(--muted)",

                    fontSize:
                      "0.85rem",
                  }}
                >
                  No variants
                  added. The
                  normal Stock
                  field above
                  will be used.
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display:
                        "grid",

                      gap:
                        "1rem",

                      marginTop:
                        "1rem",
                    }}
                  >
                    {variants.map(
                      (
                        variant,
                        index
                      ) => (
                        <div
                          key={
                            variant.localId
                          }
                          style={{
                            border:
                              "1px solid var(--line)",

                            borderRadius:
                              "16px",

                            padding:
                              "1rem",

                            background:
                              "#fff",
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",

                              justifyContent:
                                "space-between",

                              alignItems:
                                "center",

                              gap:
                                "1rem",

                              marginBottom:
                                "1rem",
                            }}
                          >
                            <strong>
                              Variant{" "}
                              {index +
                                1}
                            </strong>

                            <button
                              type="button"
                              onClick={() =>
                                removeVariant(
                                  variant.localId
                                )
                              }
                              style={{
                                border:
                                  "1px solid #efb4b4",

                                background:
                                  "#fff7f7",

                                color:
                                  "#b42318",

                                borderRadius:
                                  "999px",

                                padding:
                                  "7px 12px",

                                fontWeight:
                                  700,
                              }}
                            >
                              Remove
                            </button>
                          </div>

                          <div
                            className="form-grid"
                          >
                            <label>
                              Size
                              <input
                                type="text"
                                placeholder="S, M, L, XL"
                                value={
                                  variant.size
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateVariant(
                                    variant.localId,
                                    "size",
                                    event.target
                                      .value
                                  )
                                }
                              />
                            </label>

                            <label>
                              Color
                              <input
                                type="text"
                                placeholder="Black, White, Blue"
                                value={
                                  variant.color
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateVariant(
                                    variant.localId,
                                    "color",
                                    event.target
                                      .value
                                  )
                                }
                              />
                            </label>

                            <label>
                              Stock *
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
                                  updateVariant(
                                    variant.localId,
                                    "stock",
                                    event.target
                                      .value
                                  )
                                }
                                required
                              />
                            </label>

                            <label>
                              SKU
                              <input
                                type="text"
                                placeholder="Optional"
                                value={
                                  variant.sku
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateVariant(
                                    variant.localId,
                                    "sku",
                                    event.target
                                      .value
                                  )
                                }
                              />
                            </label>

                            <label>
                              Variant Price (৳)
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Use main price"
                                value={
                                  variant.price
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateVariant(
                                    variant.localId,
                                    "price",
                                    event.target
                                      .value
                                  )
                                }
                              />
                            </label>

                            <label>
                              Variant Discount (৳)
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Optional"
                                value={
                                  variant.discountPrice
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateVariant(
                                    variant.localId,
                                    "discountPrice",
                                    event.target
                                      .value
                                  )
                                }
                              />
                            </label>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  <div
                    style={{
                      marginTop:
                        "1rem",

                      padding:
                        "0.9rem 1rem",

                      borderRadius:
                        "14px",

                      background:
                        "var(--mint)",

                      fontWeight:
                        800,
                    }}
                  >
                    Total variant
                    stock:{" "}
                    {
                      variantStockTotal
                    }
                  </div>
                </>
              )}
            </section>
          )}

          {/* =============================================
              IMAGE
          ============================================= */}

          <label>
            Product Image
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
                Image preview:
              </p>

              <img
                src={
                  imagePreview
                }
                alt="Product preview"
                style={{
                  width:
                    "220px",

                  maxWidth:
                    "100%",

                  borderRadius:
                    "16px",

                  objectFit:
                    "contain",
                }}
              />
            </div>
          )}

          {/* =============================================
              STATUS
          ============================================= */}

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

          {message && (
            <p>
              {message}
            </p>
          )}

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
              : "Add Product"}
          </button>
        </form>

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