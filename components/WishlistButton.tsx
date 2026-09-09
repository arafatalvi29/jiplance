"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type WishlistButtonProps = {
  productId: string;
};

const GUEST_WISHLIST_KEY = "jiplance-wishlist";

function getGuestWishlist(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(
      GUEST_WISHLIST_KEY
    );

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is string =>
            typeof item === "string"
        )
      : [];
  } catch {
    return [];
  }
}

function saveGuestWishlist(
  wishlist: string[]
) {
  localStorage.setItem(
    GUEST_WISHLIST_KEY,
    JSON.stringify(wishlist)
  );
}

export default function WishlistButton({
  productId,
}: WishlistButtonProps) {
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadWishlistState = async () => {
      if (!supabase) {
        const guestWishlist =
          getGuestWishlist();

        if (!cancelled) {
          setLiked(
            guestWishlist.includes(productId)
          );
          setLoading(false);
        }

        return;
      }

      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      /*
       * GUEST USER
       *
       * Use browser localStorage.
       */
      if (!session?.user) {
        const guestWishlist =
          getGuestWishlist();

        if (!cancelled) {
          setLiked(
            guestWishlist.includes(productId)
          );
          setLoading(false);
        }

        return;
      }

      /*
       * LOGGED-IN USER
       *
       * Use secure Supabase wishlist.
       */
      const { data, error } =
        await supabase
          .from("wishlists")
          .select("id")
          .eq(
            "user_id",
            session.user.id
          )
          .eq(
            "product_id",
            productId
          )
          .maybeSingle();

      if (error) {
        console.error(
          "Wishlist check error:",
          error.message
        );
      }

      if (!cancelled) {
        setLiked(Boolean(data));
        setLoading(false);
      }
    };

    loadWishlistState();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const toggleGuestWishlist = () => {
    const current =
      getGuestWishlist();

    let next: string[];

    if (current.includes(productId)) {
      next = current.filter(
        (id) => id !== productId
      );
    } else {
      next = [
        ...current,
        productId,
      ];
    }

    saveGuestWishlist(next);

    setLiked(
      next.includes(productId)
    );
  };

  const toggleWishlist = async () => {
    if (
      loading ||
      saving
    ) {
      return;
    }

    setSaving(true);

    try {
      /*
       * If Supabase client is unavailable,
       * safely fall back to guest wishlist.
       */
      if (!supabase) {
        toggleGuestWishlist();
        return;
      }

      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      /*
       * LOGGED OUT:
       * localStorage wishlist.
       */
      if (!session?.user) {
        toggleGuestWishlist();
        return;
      }

      const userId =
        session.user.id;

      /*
       * LOGGED IN:
       * Supabase wishlist.
       */
      if (liked) {
        const { error } =
          await supabase
            .from("wishlists")
            .delete()
            .eq(
              "user_id",
              userId
            )
            .eq(
              "product_id",
              productId
            );

        if (error) {
          console.error(
            "Wishlist remove error:",
            error.message
          );

          alert(
            "Could not remove this product from your wishlist."
          );

          return;
        }

        setLiked(false);
      } else {
        const { error } =
          await supabase
            .from("wishlists")
            .insert({
              user_id: userId,
              product_id: productId,
            });

        /*
         * PostgreSQL 23505 =
         * duplicate unique value.
         *
         * If already saved from another
         * tab/device, treat as liked.
         */
        if (
          error &&
          error.code !== "23505"
        ) {
          console.error(
            "Wishlist add error:",
            error.message
          );

          alert(
            "Could not add this product to your wishlist."
          );

          return;
        }

        setLiked(true);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      type="button"
      className="heart-button"
      aria-label={
        liked
          ? "Remove from wishlist"
          : "Add to wishlist"
      }
      aria-pressed={liked}
      title={
        liked
          ? "Remove from wishlist"
          : "Add to wishlist"
      }
      disabled={loading || saving}
      onClick={toggleWishlist}
      style={{
        cursor:
          loading || saving
            ? "wait"
            : "pointer",
        opacity:
          loading || saving
            ? 0.65
            : 1,
      }}
    >
      {liked ? "♥" : "♡"}
    </button>
  );
}