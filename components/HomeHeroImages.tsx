"use client";

/* eslint-disable @next/next/no-img-element */

import {
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "@/lib/supabase";

type HeroImage = {
  slot: number;
  image_url: string | null;
};

type HeroImageMap = {
  1: string | null;
  2: string | null;
  3: string | null;
};

const emptyImages: HeroImageMap = {
  1: null,
  2: null,
  3: null,
};

export default function HomeHeroImages() {
  const [images, setImages] =
    useState<HeroImageMap>(
      emptyImages
    );

  const [loaded, setLoaded] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadHeroImages() {
      const client = supabase;

      if (!client) {
        setLoaded(true);
        return;
      }

      const {
        data,
        error,
      } = await client
        .from(
          "homepage_hero_images"
        )
        .select(
          "slot, image_url"
        )
        .order(
          "slot",
          {
            ascending: true,
          }
        );

      if (cancelled) {
        return;
      }

      if (error) {
        console.error(
          "Homepage hero images error:",
          error.message
        );

        setLoaded(true);
        return;
      }

      const nextImages: HeroImageMap = {
        1: null,
        2: null,
        3: null,
      };

      (
        (data ?? []) as HeroImage[]
      ).forEach(
        (item) => {
          if (
            item.slot === 1 ||
            item.slot === 2 ||
            item.slot === 3
          ) {
            nextImages[item.slot] =
              item.image_url;
          }
        }
      );

      setImages(nextImages);
      setLoaded(true);
    }

    void loadHeroImages();

    return () => {
      cancelled = true;
    };
  }, []);

  function renderSlot(
    slot: 1 | 2 | 3,
    className: string,
    fallbackText: string
  ) {
    const imageUrl =
      images[slot];

    return (
      <div
        className={`${className} ${
          imageUrl
            ? "hero-photo-filled"
            : ""
        }`}
      >
        {imageUrl ? (
          <div
            className={`hero-product-media hero-delay-${slot}`}
          >
            <img
              src={imageUrl}
              alt={`JIPLANCE featured product ${slot}`}
              draggable={false}
              className="hero-product-image"
            />

            <span
              className="hero-product-shine"
              aria-hidden="true"
            />
          </div>
        ) : (
          fallbackText
        )}
      </div>
    );
  }

  if (!loaded) {
    return (
      <>
        <div className="book book-one">
          ABC
        </div>

        <div className="book book-two">
          123
        </div>

        <div className="book book-three">
          STORY
        </div>
      </>
    );
  }

  return (
    <>
      {renderSlot(
        1,
        "book book-one",
        "ABC"
      )}

      {renderSlot(
        2,
        "book book-two",
        "123"
      )}

      {renderSlot(
        3,
        "book book-three",
        "STORY"
      )}

      <style jsx global>{`
        /* =====================================================
           HERO PRODUCT PHOTOS
        ===================================================== */

        .hero-photo-filled {
          overflow: hidden;
          isolation: isolate;
          transform-origin: center;
          will-change: transform;
        }

        /* Left photo */
        .book-one.hero-photo-filled {
          scale: 1.14;
          translate: 18px 6px;
          z-index: 1;
        }

        /* Right photo */
        .book-two.hero-photo-filled {
          scale: 1.14;
          translate: -18px 5px;
          z-index: 1;
        }

        /* Front / center photo */
        .book-three.hero-photo-filled {
          scale: 1.2;
          translate: 0 -3px;
          z-index: 3;
        }

        /* =====================================================
           PHOTO MEDIA
        ===================================================== */

        .hero-product-media {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          border-radius: inherit;
          opacity: 0;

          animation:
            heroPhotoEnter
            0.8s
            cubic-bezier(
              0.22,
              1,
              0.36,
              1
            )
            forwards;
        }

        .hero-delay-1 {
          animation-delay: 0.05s;
        }

        .hero-delay-2 {
          animation-delay: 0.16s;
        }

        .hero-delay-3 {
          animation-delay: 0.27s;
        }

        /* =====================================================
           PRODUCT IMAGE
        ===================================================== */

        .hero-product-image {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;

          transform: scale(1.01);

          filter:
            saturate(1.03)
            contrast(1.02);

          transition:
            transform
              0.65s
              cubic-bezier(
                0.22,
                1,
                0.36,
                1
              ),
            filter
              0.65s
              ease;
        }

        .hero-photo-filled:hover
          .hero-product-image {
          transform: scale(1.06);

          filter:
            saturate(1.07)
            contrast(1.04);
        }

        /* =====================================================
           SOFT PREMIUM SHINE
        ===================================================== */

        .hero-product-shine {
          position: absolute;
          inset: 0;
          pointer-events: none;

          background:
            linear-gradient(
              115deg,
              transparent 25%,
              rgba(
                  255,
                  255,
                  255,
                  0.05
                )
                40%,
              rgba(
                  255,
                  255,
                  255,
                  0.22
                )
                50%,
              rgba(
                  255,
                  255,
                  255,
                  0.05
                )
                60%,
              transparent 75%
            );

          transform:
            translateX(-130%);

          animation:
            heroSoftShine
            7s
            ease-in-out
            infinite;
        }

        .hero-delay-2
          .hero-product-shine {
          animation-delay: 1.4s;
        }

        .hero-delay-3
          .hero-product-shine {
          animation-delay: 2.8s;
        }

        /* =====================================================
           ANIMATIONS
        ===================================================== */

        @keyframes heroPhotoEnter {
          0% {
            opacity: 0;
            transform:
              translateY(14px)
              scale(0.97);
            filter: blur(4px);
          }

          100% {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
            filter: blur(0);
          }
        }

        @keyframes heroSoftShine {
          0%,
          72% {
            transform:
              translateX(-130%);
          }

          88%,
          100% {
            transform:
              translateX(130%);
          }
        }

        /* =====================================================
           ACCESSIBILITY
        ===================================================== */

        @media (
          prefers-reduced-motion:
            reduce
        ) {
          .hero-product-media,
          .hero-product-shine {
            animation: none;
            opacity: 1;
          }

          .hero-product-image {
            transition: none;
          }
        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (
          max-width: 768px
        ) {
          .book-one.hero-photo-filled {
            scale: 1.08;
            translate: 8px 3px;
          }

          .book-two.hero-photo-filled {
            scale: 1.08;
            translate: -8px 3px;
          }

          .book-three.hero-photo-filled {
            scale: 1.12;
            translate: 0 -2px;
          }

          .hero-product-shine {
            animation-duration: 9s;
          }

          .hero-photo-filled:hover
            .hero-product-image {
            transform: scale(1.025);
          }
        }
      `}</style>
    </>
  );
}