"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

type GalleryImage = {
  id: string;
  product_id: string;
  image_url: string;
  storage_path: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

type Props = {
  productId: string;
  productType: "book" | "fashion";
  productSlug: string;
  canEditProduct: boolean;
};

const MAX_EXTRA_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function ProductImageGalleryManager({
  productId,
  productType,
  productSlug,
  canEditProduct,
}: Props) {
  const [
    images,
    setImages,
  ] = useState<GalleryImage[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState<string | null>(null);

  const [
    message,
    setMessage,
  ] = useState("");

  const remainingSlots =
    Math.max(
      0,
      MAX_EXTRA_IMAGES -
        images.length
    );

  const sortedImages =
    useMemo(() => {
      return [...images].sort(
        (a, b) => {
          if (
            a.sort_order !==
            b.sort_order
          ) {
            return (
              a.sort_order -
              b.sort_order
            );
          }

          return new Date(
            a.created_at
          ).getTime() -
            new Date(
              b.created_at
            ).getTime();
        }
      );
    }, [images]);

  const loadImages =
    useCallback(
      async () => {
        if (!supabase) {
          setLoading(false);
          return;
        }

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "product_images"
            )
            .select(
              `
              id,
              product_id,
              image_url,
              storage_path,
              sort_order,
              is_active,
              created_at
              `
            )
            .eq(
              "product_id",
              productId
            )
            .order(
              "sort_order",
              {
                ascending: true,
              }
            )
            .order(
              "created_at",
              {
                ascending: true,
              }
            );

        if (error) {
          console.error(
            "Product gallery load error:",
            error.message
          );

          setMessage(
            `Gallery load error: ${error.message}`
          );

          setImages([]);
          setLoading(false);
          return;
        }

        setImages(
          (data ?? []) as GalleryImage[]
        );

        setLoading(false);
      },
      [productId]
    );

  useEffect(() => {
    void loadImages();
  }, [loadImages]);

  const validateFiles = (
    fileList: FileList
  ) => {
    const files =
      Array.from(fileList);

    if (
      files.length === 0
    ) {
      return [];
    }

    if (
      files.length >
      remainingSlots
    ) {
      setMessage(
        `You can add only ${remainingSlots} more gallery image${
          remainingSlots === 1
            ? ""
            : "s"
        }.`
      );

      return [];
    }

    for (
      const file of files
    ) {
      if (
        !ALLOWED_IMAGE_TYPES.includes(
          file.type
        )
      ) {
        setMessage(
          "Only JPG, PNG or WEBP images are allowed."
        );

        return [];
      }

      if (
        file.size >
        MAX_IMAGE_SIZE
      ) {
        setMessage(
          `${file.name} is larger than 5 MB.`
        );

        return [];
      }
    }

    return files;
  };

  const buildSafeSlug =
    () => {
      return (
        productSlug
          .toLowerCase()
          .trim()
          .replace(
            /[^a-z0-9]+/g,
            "-"
          )
          .replace(
            /^-+|-+$/g,
            ""
          ) ||
        "product"
      );
    };

  const handleFilesChange =
    async (
      event: ChangeEvent<HTMLInputElement>
    ) => {
      if (
        !supabase ||
        !canEditProduct
      ) {
        setMessage(
          "You do not have permission to edit product images."
        );

        event.target.value =
          "";

        return;
      }

      const fileList =
        event.target.files;

      if (!fileList) {
        return;
      }

      const files =
        validateFiles(
          fileList
        );

      if (
        files.length === 0
      ) {
        event.target.value =
          "";

        return;
      }

      setUploading(true);
      setMessage("");

      const uploadedPaths:
        string[] = [];

      try {
        const safeSlug =
          buildSafeSlug();

        const existingCount =
          images.length;

        const rows: Array<{
          product_id: string;
          image_url: string;
          storage_path: string;
          sort_order: number;
          is_active: boolean;
        }> = [];

        for (
          let index = 0;
          index <
          files.length;
          index += 1
        ) {
          const file =
            files[index];

          const extension =
            file.name
              .split(".")
              .pop()
              ?.toLowerCase() ||
            "jpg";

          const randomPart =
            Math.random()
              .toString(36)
              .slice(2, 8);

          const filePath =
            `${productType}/${productId}/gallery/${Date.now()}-${randomPart}-${safeSlug}.${extension}`;

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
                file,
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

          uploadedPaths.push(
            filePath
          );

          const {
            data:
              publicUrlData,
          } =
            supabase.storage
              .from(
                "product-images"
              )
              .getPublicUrl(
                filePath
              );

          rows.push({
            product_id:
              productId,

            image_url:
              publicUrlData.publicUrl,

            storage_path:
              filePath,

            sort_order:
              existingCount +
              index,

            is_active:
              true,
          });
        }

        const {
          error:
            insertError,
        } =
          await supabase
            .from(
              "product_images"
            )
            .insert(
              rows
            );

        if (
          insertError
        ) {
          throw new Error(
            insertError.message
          );
        }

        setMessage(
          `${files.length} gallery image${
            files.length === 1
              ? ""
              : "s"
          } added successfully.`
        );

        await loadImages();
      } catch (error) {
        if (
          uploadedPaths.length >
          0
        ) {
          await supabase.storage
            .from(
              "product-images"
            )
            .remove(
              uploadedPaths
            );
        }

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Something went wrong.";

        setMessage(
          `Error: ${errorMessage}`
        );
      } finally {
        setUploading(false);

        event.target.value =
          "";
      }
    };

  const handleDelete =
    async (
      image: GalleryImage
    ) => {
      if (
        !supabase ||
        !canEditProduct
      ) {
        setMessage(
          "You do not have permission to remove product images."
        );

        return;
      }

      const confirmed =
        window.confirm(
          "Remove this gallery image?"
        );

      if (
        !confirmed
      ) {
        return;
      }

      setDeletingId(
        image.id
      );

      setMessage("");

      try {
        const {
          error:
            deleteError,
        } =
          await supabase
            .from(
              "product_images"
            )
            .delete()
            .eq(
              "id",
              image.id
            )
            .eq(
              "product_id",
              productId
            );

        if (
          deleteError
        ) {
          throw new Error(
            deleteError.message
          );
        }

        if (
          image.storage_path
        ) {
          const {
            error:
              storageDeleteError,
          } =
            await supabase.storage
              .from(
                "product-images"
              )
              .remove([
                image.storage_path,
              ]);

          if (
            storageDeleteError
          ) {
            console.error(
              "Gallery storage delete warning:",
              storageDeleteError.message
            );
          }
        }

        setImages(
          (
            current
          ) =>
            current.filter(
              (
                item
              ) =>
                item.id !==
                image.id
            )
        );

        setMessage(
          "Gallery image removed."
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Something went wrong.";

        setMessage(
          `Error: ${errorMessage}`
        );
      } finally {
        setDeletingId(
          null
        );
      }
    };

  return (
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
        PRODUCT GALLERY
      </div>

      <h2
        style={{
          marginBottom:
            "0.5rem",
        }}
      >
        Extra Product Images
      </h2>

      <p
        style={{
          marginTop: 0,
          opacity: 0.75,
          lineHeight: 1.6,
        }}
      >
        Keep the main product
        image above and add up to{" "}
        <strong>
          {MAX_EXTRA_IMAGES}
        </strong>{" "}
        extra gallery images.
        Customers will later be
        able to view these from
        the product page.
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

      {loading ? (
        <p>
          Loading gallery...
        </p>
      ) : (
        <>
          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "space-between",
              gap:
                "1rem",
              flexWrap:
                "wrap",
              marginTop:
                "1rem",
            }}
          >
            <div>
              <strong>
                {images.length}
                {" / "}
                {MAX_EXTRA_IMAGES}
              </strong>{" "}
              extra images
            </div>

            {canEditProduct &&
              remainingSlots >
                0 && (
                <label
                  className="primary-button"
                  style={{
                    position:
                      "relative",
                    cursor:
                      uploading
                        ? "wait"
                        : "pointer",
                  }}
                >
                  {uploading
                    ? "Uploading..."
                    : "Add Gallery Images"}

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={
                      handleFilesChange
                    }
                    disabled={
                      uploading
                    }
                    style={{
                      position:
                        "absolute",
                      inset: 0,
                      width:
                        "100%",
                      height:
                        "100%",
                      opacity:
                        0,
                      cursor:
                        "pointer",
                    }}
                  />
                </label>
              )}
          </div>

          {sortedImages.length ===
          0 ? (
            <div
              style={{
                marginTop:
                  "1.25rem",
                padding:
                  "1.25rem",
                border:
                  "1px dashed rgba(128,128,128,0.35)",
                borderRadius:
                  "16px",
              }}
            >
              No extra gallery
              images yet.
            </div>
          ) : (
            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(150px, 1fr))",
                gap:
                  "1rem",
                marginTop:
                  "1.25rem",
              }}
            >
              {sortedImages.map(
                (
                  image,
                  index
                ) => (
                  <article
                    key={
                      image.id
                    }
                    style={{
                      padding:
                        "0.75rem",
                      border:
                        "1px solid rgba(128,128,128,0.2)",
                      borderRadius:
                        "16px",
                    }}
                  >
                    <div
                      style={{
                        aspectRatio:
                          "1 / 1",
                        borderRadius:
                          "12px",
                        overflow:
                          "hidden",
                        background:
                          "rgba(128,128,128,0.08)",
                      }}
                    >
                      <img
                        src={
                          image.image_url
                        }
                        alt={`Gallery image ${
                          index +
                          1
                        }`}
                        style={{
                          display:
                            "block",
                          width:
                            "100%",
                          height:
                            "100%",
                          objectFit:
                            "cover",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "space-between",
                        gap:
                          "0.5rem",
                        marginTop:
                          "0.75rem",
                      }}
                    >
                      <small>
                        Image{" "}
                        {index +
                          2}
                      </small>

                      {canEditProduct && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              image
                            )
                          }
                          disabled={
                            deletingId ===
                            image.id
                          }
                          style={{
                            border:
                              "1px solid rgba(180,50,50,0.3)",
                            borderRadius:
                              "999px",
                            padding:
                              "0.4rem 0.7rem",
                            background:
                              "rgba(220,50,50,0.06)",
                            cursor:
                              "pointer",
                          }}
                        >
                          {deletingId ===
                          image.id
                            ? "Removing..."
                            : "Remove"}
                        </button>
                      )}
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}