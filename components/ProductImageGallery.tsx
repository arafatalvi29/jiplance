"use client";

import {
  useMemo,
  useState,
} from "react";

type GalleryImage = {
  id: string;
  image_url: string;
  sort_order: number;
};

type ProductImageGalleryProps = {
  productName: string;
  mainImageUrl: string | null;
  galleryImages: GalleryImage[];
  fallbackEmoji: string;
};

export default function ProductImageGallery({
  productName,
  mainImageUrl,
  galleryImages,
  fallbackEmoji,
}: ProductImageGalleryProps) {
  const allImages =
    useMemo(() => {
      const images: Array<{
        id: string;
        image_url: string;
      }> = [];

      if (mainImageUrl) {
        images.push({
          id: "main-image",
          image_url:
            mainImageUrl,
        });
      }

      for (
        const image of galleryImages
      ) {
        if (
          !image.image_url
        ) {
          continue;
        }

        if (
          images.some(
            (
              existing
            ) =>
              existing.image_url ===
              image.image_url
          )
        ) {
          continue;
        }

        images.push({
          id: image.id,
          image_url:
            image.image_url,
        });
      }

      return images;
    }, [
      mainImageUrl,
      galleryImages,
    ]);

  const [
    selectedImage,
    setSelectedImage,
  ] =
    useState(
      allImages[0]
        ?.image_url ??
        ""
    );

  if (
    allImages.length ===
    0
  ) {
    return (
      <div className="product-gallery-main product-gallery-fallback">
        <span>
          {fallbackEmoji}
        </span>
      </div>
    );
  }

  return (
    <div className="product-gallery">
      <div className="product-gallery-main">
        <img
          src={
            selectedImage
          }
          alt={
            productName
          }
        />
      </div>

      {allImages.length >
        1 && (
        <div
          className="product-gallery-thumbnails"
          aria-label="Product image gallery"
        >
          {allImages.map(
            (
              image,
              index
            ) => {
              const active =
                selectedImage ===
                image.image_url;

              return (
                <button
                  key={
                    image.id
                  }
                  type="button"
                  className={`product-gallery-thumbnail ${
                    active
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedImage(
                      image.image_url
                    )
                  }
                  aria-label={`View product image ${
                    index +
                    1
                  }`}
                  aria-pressed={
                    active
                  }
                >
                  <img
                    src={
                      image.image_url
                    }
                    alt={`${productName} ${
                      index +
                      1
                    }`}
                  />
                </button>
              );
            }
          )}
        </div>
      )}

      <style jsx>{`
        .product-gallery {
          width: 100%;
          min-width: 0;
        }

        .product-gallery-main {
          position: relative;

          width: 100%;
          min-height: 520px;

          display: grid;
          place-items: center;

          overflow: hidden;

          border-radius: 28px;

          background:
            rgba(
              255,
              255,
              255,
              0.72
            );

          border:
            1px solid
            rgba(
              35,
              44,
              73,
              0.08
            );
        }

        .product-gallery-main img {
          width: 100%;
          height: 520px;

          display: block;

          object-fit: contain;

          transition:
            transform
              0.28s ease,
            opacity
              0.2s ease;
        }

        .product-gallery-main:hover
          img {
          transform:
            scale(1.025);
        }

        .product-gallery-fallback {
          font-size: 6rem;
        }

        .product-gallery-thumbnails {
          display: grid;

          grid-template-columns:
            repeat(
              auto-fit,
              minmax(
                72px,
                88px
              )
            );

          gap: 10px;

          margin-top: 14px;
        }

        .product-gallery-thumbnail {
          position: relative;

          width: 100%;
          aspect-ratio: 1 / 1;

          padding: 5px;

          overflow: hidden;

          border:
            1px solid
            rgba(
              35,
              44,
              73,
              0.12
            );

          border-radius: 14px;

          background:
            rgba(
              255,
              255,
              255,
              0.76
            );

          cursor: pointer;

          transition:
            transform
              0.18s ease,
            border-color
              0.18s ease,
            box-shadow
              0.18s ease,
            background
              0.18s ease;
        }

        .product-gallery-thumbnail:hover {
          transform:
            translateY(-2px);

          border-color:
            rgba(
              34,
              48,
              91,
              0.32
            );
        }

        .product-gallery-thumbnail.active {
          border-color:
            #26345d;

          background:
            #ffffff;

          box-shadow:
            0 0 0 2px
            rgba(
              38,
              52,
              93,
              0.08
            ),
            0 8px 20px
            rgba(
              31,
              41,
              77,
              0.09
            );
        }

        .product-gallery-thumbnail img {
          width: 100%;
          height: 100%;

          display: block;

          object-fit: cover;

          border-radius: 9px;
        }

        @media (
          max-width:
            800px
        ) {
          .product-gallery-main {
            min-height:
              390px;
          }

          .product-gallery-main img {
            height:
              390px;
          }

          .product-gallery-thumbnails {
            display: flex;

            overflow-x: auto;

            padding-bottom: 4px;

            scrollbar-width:
              thin;
          }

          .product-gallery-thumbnail {
            width: 76px;
            min-width: 76px;
            flex: 0 0 76px;
          }
        }

        @media (
          max-width:
            520px
        ) {
          .product-gallery-main {
            min-height:
              320px;

            border-radius:
              20px;
          }

          .product-gallery-main img {
            height:
              320px;
          }

          .product-gallery-thumbnail {
            width: 68px;
            min-width: 68px;
            flex-basis: 68px;
          }
        }

        @media (
          prefers-reduced-motion:
            reduce
        ) {
          .product-gallery-main img,
          .product-gallery-thumbnail {
            transition:
              none;
          }
        }
      `}</style>
    </div>
  );
}