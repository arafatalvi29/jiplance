"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

import {
  useLanguage,
} from "@/components/LanguageProvider";

type Review = {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
};

type ProductReviewsProps = {
  productId: string;
};

type Language = "en" | "bn";

/* =====================================================
   DATE
===================================================== */

function formatReviewDate(
  value: string,
  lang: Language
) {
  try {
    return new Intl.DateTimeFormat(
      lang === "bn"
        ? "bn-BD"
        : "en-GB",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone:
          "Asia/Dhaka",
      }
    ).format(
      new Date(value)
    );
  } catch {
    return "";
  }
}

/* =====================================================
   STAR DISPLAY
===================================================== */

function StarDisplay({
  rating,
  lang,
  size = "normal",
}: {
  rating: number;
  lang: Language;
  size?: "normal" | "large";
}) {
  return (
    <div
      className={`review-stars ${
        size === "large"
          ? "review-stars-large"
          : ""
      }`}
      aria-label={
        lang === "en"
          ? `${rating} out of 5 stars`
          : `৫-এর মধ্যে ${rating} তারকা`
      }
    >
      {[1, 2, 3, 4, 5].map(
        (star) => (
          <span
            key={star}
            className={
              star <= rating
                ? "review-star-filled"
                : "review-star-empty"
            }
          >
            ★
          </span>
        )
      )}
    </div>
  );
}

/* =====================================================
   PRODUCT REVIEWS
===================================================== */

export default function ProductReviews({
  productId,
}: ProductReviewsProps) {
  const {
    lang,
  } = useLanguage();

  const [
    approvedReviews,
    setApprovedReviews,
  ] =
    useState<Review[]>([]);

  const [
    ownReview,
    setOwnReview,
  ] =
    useState<Review | null>(
      null
    );

  const [
    userId,
    setUserId,
  ] =
    useState<string | null>(
      null
    );

  const [
    rating,
    setRating,
  ] =
    useState(5);

  const [
    hoverRating,
    setHoverRating,
  ] =
    useState(0);

  const [
    comment,
    setComment,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  /* ===================================================
     LOAD REVIEWS
  =================================================== */

  const loadReviews =
    useCallback(
      async () => {
        if (!supabase) {
          setLoading(
            false
          );

          return;
        }

        setLoading(
          true
        );

        try {
          const {
            data: {
              session,
            },
          } =
            await supabase.auth.getSession();

          const currentUserId =
            session?.user
              ?.id ??
            null;

          setUserId(
            currentUserId
          );

          /* =============================================
             APPROVED PUBLIC REVIEWS
          ============================================= */

          const {
            data:
              publicReviews,

            error:
              publicError,
          } =
            await supabase
              .from(
                "reviews"
              )
              .select(
                `
                id,
                user_id,
                product_id,
                rating,
                comment,
                is_approved,
                created_at,
                updated_at
                `
              )
              .eq(
                "product_id",
                productId
              )
              .eq(
                "is_approved",
                true
              )
              .order(
                "created_at",
                {
                  ascending:
                    false,
                }
              );

          if (
            publicError
          ) {
            console.error(
              "Approved reviews error:",
              publicError.message
            );
          }

          setApprovedReviews(
            (
              publicReviews as
                Review[]
            ) ?? []
          );

          /* =============================================
             GUEST
          ============================================= */

          if (
            !currentUserId
          ) {
            setOwnReview(
              null
            );

            setLoading(
              false
            );

            return;
          }

          /* =============================================
             USER'S OWN REVIEW
          ============================================= */

          const {
            data:
              currentReview,

            error:
              ownError,
          } =
            await supabase
              .from(
                "reviews"
              )
              .select(
                `
                id,
                user_id,
                product_id,
                rating,
                comment,
                is_approved,
                created_at,
                updated_at
                `
              )
              .eq(
                "product_id",
                productId
              )
              .eq(
                "user_id",
                currentUserId
              )
              .maybeSingle();

          if (
            ownError
          ) {
            console.error(
              "Own review error:",
              ownError.message
            );
          }

          const normalizedReview =
            (
              currentReview as
                Review | null
            ) ?? null;

          setOwnReview(
            normalizedReview
          );

          if (
            normalizedReview
          ) {
            setRating(
              normalizedReview.rating
            );

            setComment(
              normalizedReview.comment ??
                ""
            );
          } else {
            setRating(
              5
            );

            setComment(
              ""
            );
          }
        } finally {
          setLoading(
            false
          );
        }
      },
      [productId]
    );

  /* ===================================================
     INITIAL LOAD + AUTH CHANGES
  =================================================== */

  useEffect(() => {
    loadReviews();

    if (!supabase) {
      return;
    }

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        () => {
          loadReviews();
        }
      );

    return () => {
      subscription.unsubscribe();
    };
  }, [loadReviews]);

  /* ===================================================
     AVERAGE RATING
  =================================================== */

  const averageRating =
    useMemo(() => {
      if (
        approvedReviews.length ===
        0
      ) {
        return 0;
      }

      const total =
        approvedReviews.reduce(
          (
            sum,
            review
          ) =>
            sum +
            review.rating,
          0
        );

      return (
        total /
        approvedReviews.length
      );
    }, [
      approvedReviews,
    ]);

  /* ===================================================
     RATING DISTRIBUTION
  =================================================== */

  const ratingDistribution =
    useMemo(() => {
      return [
        5,
        4,
        3,
        2,
        1,
      ].map(
        (
          star
        ) => {
          const count =
            approvedReviews.filter(
              (
                review
              ) =>
                review.rating ===
                star
            ).length;

          const percentage =
            approvedReviews.length >
            0
              ? (count /
                  approvedReviews.length) *
                100
              : 0;

          return {
            star,
            count,
            percentage,
          };
        }
      );
    }, [
      approvedReviews,
    ]);

  /* ===================================================
     SUBMIT / UPDATE REVIEW
  =================================================== */

  const handleSubmit =
    async (
      event:
        React.FormEvent
    ) => {
      event.preventDefault();

      if (
        !supabase ||
        !userId ||
        saving
      ) {
        return;
      }

      setSaving(
        true
      );

      setMessage(
        ""
      );

      setErrorMessage(
        ""
      );

      const cleanComment =
        comment.trim();

      try {
        /* =============================================
           UPDATE PENDING REVIEW
        ============================================= */

        if (
          ownReview &&
          !ownReview.is_approved
        ) {
          const {
            error,
          } =
            await supabase
              .from(
                "reviews"
              )
              .update({
                rating,

                comment:
                  cleanComment ||
                  null,

                is_approved:
                  false,

                updated_at:
                  new Date().toISOString(),
              })
              .eq(
                "id",
                ownReview.id
              )
              .eq(
                "user_id",
                userId
              );

          if (error) {
            throw error;
          }

          setMessage(
            lang === "en"
              ? "Your review has been updated and is waiting for approval."
              : "আপনার রিভিউ আপডেট হয়েছে এবং অনুমোদনের অপেক্ষায় আছে।"
          );
        } else if (
          !ownReview
        ) {
          /* ===========================================
             NEW REVIEW
          =========================================== */

          const {
            error,
          } =
            await supabase
              .from(
                "reviews"
              )
              .insert({
                user_id:
                  userId,

                product_id:
                  productId,

                rating,

                comment:
                  cleanComment ||
                  null,

                is_approved:
                  false,
              });

          if (error) {
            throw error;
          }

          setMessage(
            lang === "en"
              ? "Thank you! Your review has been submitted for approval."
              : "ধন্যবাদ! আপনার রিভিউ অনুমোদনের জন্য জমা হয়েছে।"
          );
        }

        await loadReviews();
      } catch (
        error
      ) {
        const reviewError =
          error as {
            message?: string;
            code?: string;
          };

        console.error(
          "Review save error:",
          reviewError
        );

        if (
          reviewError.code ===
          "23505"
        ) {
          setErrorMessage(
            lang === "en"
              ? "You have already reviewed this product."
              : "আপনি ইতোমধ্যে এই পণ্যটির রিভিউ দিয়েছেন।"
          );
        } else {
          setErrorMessage(
            lang === "en"
              ? reviewError.message ||
                  "Could not save your review. Please try again."
              : "রিভিউ সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।"
          );
        }
      } finally {
        setSaving(
          false
        );
      }
    };

  /* ===================================================
     DELETE REVIEW
  =================================================== */

  const handleDelete =
    async () => {
      if (
        !supabase ||
        !userId ||
        !ownReview ||
        saving
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          lang === "en"
            ? "Remove your review from this product?"
            : "এই পণ্য থেকে আপনার রিভিউ মুছে ফেলতে চান?"
        );

      if (
        !confirmed
      ) {
        return;
      }

      setSaving(
        true
      );

      setMessage(
        ""
      );

      setErrorMessage(
        ""
      );

      try {
        const {
          error,
        } =
          await supabase
            .from(
              "reviews"
            )
            .delete()
            .eq(
              "id",
              ownReview.id
            )
            .eq(
              "user_id",
              userId
            );

        if (error) {
          throw error;
        }

        setOwnReview(
          null
        );

        setRating(
          5
        );

        setComment(
          ""
        );

        setMessage(
          lang === "en"
            ? "Your review has been removed."
            : "আপনার রিভিউ মুছে ফেলা হয়েছে।"
        );

        await loadReviews();
      } catch {
        setErrorMessage(
          lang === "en"
            ? "Could not remove your review."
            : "আপনার রিভিউ মুছে ফেলা যায়নি।"
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /* ===================================================
     RATING WORD
  =================================================== */

  const ratingWord =
    rating === 5
      ? lang === "en"
        ? "Excellent"
        : "চমৎকার"
      : rating === 4
        ? lang === "en"
          ? "Very Good"
          : "খুব ভালো"
        : rating === 3
          ? lang === "en"
            ? "Good"
            : "ভালো"
          : rating === 2
            ? lang ===
              "en"
              ? "Fair"
              : "মোটামুটি"
            : lang ===
                "en"
              ? "Needs Improvement"
              : "উন্নতি প্রয়োজন";

  /* ===================================================
     UI
  =================================================== */

  return (
    <section className="reviews-section">
      <div className="reviews-glow reviews-glow-one" />

      <div className="reviews-glow reviews-glow-two" />

      {/* =================================================
          HEADING
      ================================================= */}

      <div className="reviews-heading">
        <div>
          <span className="reviews-kicker">
            {lang === "en"
              ? "CUSTOMER VOICES"
              : "গ্রাহকদের মতামত"}
          </span>

          <h2>
            {lang === "en"
              ? "Reviews that help you choose with confidence."
              : "আত্মবিশ্বাসের সঙ্গে পণ্য বেছে নিতে সহায়ক রিভিউ।"}
          </h2>

          <p>
            {lang === "en"
              ? "Real ratings and experiences shared by the JIPLANCE community."
              : "JIPLANCE কমিউনিটির শেয়ার করা বাস্তব রেটিং ও অভিজ্ঞতা।"}
          </p>
        </div>

        <div className="review-trust-badge">
          <span className="review-trust-icon">
            ✓
          </span>

          <div>
            <strong>
              {lang === "en"
                ? "Moderated Reviews"
                : "মডারেটেড রিভিউ"}
            </strong>

            <small>
              {lang === "en"
                ? "Quality checked before publishing"
                : "প্রকাশের আগে যাচাই করা হয়"}
            </small>
          </div>
        </div>
      </div>

      {/* =================================================
          RATING DASHBOARD
      ================================================= */}

      <div className="review-dashboard">
        <div className="review-score-card">
          <span className="review-score-label">
            {lang === "en"
              ? "CUSTOMER RATING"
              : "গ্রাহক রেটিং"}
          </span>

          <div className="review-score-number">
            {approvedReviews.length >
            0
              ? averageRating.toFixed(
                  1
                )
              : "—"}
          </div>

          <StarDisplay
            rating={Math.round(
              averageRating
            )}
            size="large"
            lang={lang}
          />

          <p>
            {approvedReviews.length ===
            0
              ? lang === "en"
                ? "No published reviews yet"
                : "এখনও কোনো প্রকাশিত রিভিউ নেই"
              : lang === "en"
                ? `Based on ${approvedReviews.length} ${
                    approvedReviews.length ===
                    1
                      ? "review"
                      : "reviews"
                  }`
                : `${approvedReviews.length}টি রিভিউয়ের ভিত্তিতে`}
          </p>
        </div>

        <div className="review-distribution">
          {ratingDistribution.map(
            ({
              star,
              count,
              percentage,
            }) => (
              <div
                className="review-bar-row"
                key={star}
              >
                <span className="review-bar-star">
                  {star} ★
                </span>

                <div className="review-bar-track">
                  <div
                    className="review-bar-fill"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>

                <span className="review-bar-count">
                  {count}
                </span>
              </div>
            )
          )}
        </div>
      </div>

      {/* =================================================
          REVIEW CONTENT
      ================================================= */}

      <div className="review-content-grid">

        {/* ===============================================
            CUSTOMER REVIEW FORM
        =============================================== */}

        <div className="review-form-panel">
          <div className="review-form-heading">
            <span>
              {ownReview
                ? lang === "en"
                  ? "YOUR REVIEW"
                  : "আপনার রিভিউ"
                : lang === "en"
                  ? "SHARE YOUR EXPERIENCE"
                  : "আপনার অভিজ্ঞতা শেয়ার করুন"}
            </span>

            <h3>
              {ownReview
                ? ownReview.is_approved
                  ? lang === "en"
                    ? "Your review is live"
                    : "আপনার রিভিউ প্রকাশিত হয়েছে"
                  : lang === "en"
                    ? "Your review is pending"
                    : "আপনার রিভিউ অনুমোদনের অপেক্ষায়"
                : lang === "en"
                  ? "How was this product?"
                  : "পণ্যটি কেমন ছিল?"}
            </h3>
          </div>

          {/* =============================================
              LOADING
          ============================================= */}

          {loading ? (
            <div className="review-loading">
              <span />

              {lang === "en"
                ? "Loading reviews..."
                : "রিভিউ লোড হচ্ছে..."}
            </div>
          ) : !userId ? (
            /* ===========================================
               LOGIN REQUIRED
            =========================================== */

            <div className="review-login-card">
              <div className="review-login-icon">
                ☆
              </div>

              <h4>
                {lang === "en"
                  ? "Want to leave a review?"
                  : "রিভিউ দিতে চান?"}
              </h4>

              <p>
                {lang === "en"
                  ? "Sign in to your JIPLANCE account and share your experience."
                  : "আপনার JIPLANCE অ্যাকাউন্টে সাইন ইন করে অভিজ্ঞতা শেয়ার করুন।"}
              </p>

              <Link
                href="/account"
                className="review-login-button"
              >
                {lang === "en"
                  ? "Sign In to Review"
                  : "রিভিউ দিতে সাইন ইন করুন"}

                <span>
                  →
                </span>
              </Link>
            </div>
          ) : ownReview?.is_approved ? (
            /* ===========================================
               APPROVED OWN REVIEW
            =========================================== */

            <div className="own-review-status approved">
              <div className="review-status-top">
                <span className="review-status-pill">
                  ✓{" "}
                  {lang === "en"
                    ? "PUBLISHED"
                    : "প্রকাশিত"}
                </span>

                <span>
                  {formatReviewDate(
                    ownReview.created_at,
                    lang
                  )}
                </span>
              </div>

              <StarDisplay
                rating={
                  ownReview.rating
                }
                lang={lang}
              />

              {ownReview.comment && (
                <p>
                  “
                  {
                    ownReview.comment
                  }
                  ”
                </p>
              )}

              <p className="review-approved-note">
                {lang === "en"
                  ? "Your review is now visible to other customers."
                  : "আপনার রিভিউ এখন অন্য গ্রাহকরাও দেখতে পারবেন।"}
              </p>

              <button
                type="button"
                className="review-delete-button"
                onClick={
                  handleDelete
                }
                disabled={
                  saving
                }
              >
                {lang === "en"
                  ? "Remove Review"
                  : "রিভিউ মুছুন"}
              </button>
            </div>
          ) : (
            /* ===========================================
               NEW / PENDING REVIEW FORM
            =========================================== */

            <form
              className="review-form"
              onSubmit={
                handleSubmit
              }
            >
              {ownReview && (
                <div className="review-pending-banner">
                  <span>
                    ⌛
                  </span>

                  <div>
                    <strong>
                      {lang === "en"
                        ? "Pending Approval"
                        : "অনুমোদনের অপেক্ষায়"}
                    </strong>

                    <small>
                      {lang === "en"
                        ? "You can edit this review while it is pending."
                        : "অনুমোদনের আগে আপনি এই রিভিউ সম্পাদনা করতে পারবেন।"}
                    </small>
                  </div>
                </div>
              )}

              {/* =========================================
                  RATING
              ========================================= */}

              <div className="rating-picker">
                <span className="rating-picker-label">
                  {lang === "en"
                    ? "Your rating"
                    : "আপনার রেটিং"}
                </span>

                <div
                  className="rating-buttons"
                  onMouseLeave={() =>
                    setHoverRating(
                      0
                    )
                  }
                >
                  {[
                    1,
                    2,
                    3,
                    4,
                    5,
                  ].map(
                    (
                      star
                    ) => (
                      <button
                        key={
                          star
                        }
                        type="button"
                        className={
                          star <=
                          (hoverRating ||
                            rating)
                            ? "rating-button active"
                            : "rating-button"
                        }
                        aria-label={
                          lang ===
                          "en"
                            ? `${star} star rating`
                            : `${star} তারকা রেটিং`
                        }
                        onMouseEnter={() =>
                          setHoverRating(
                            star
                          )
                        }
                        onFocus={() =>
                          setHoverRating(
                            star
                          )
                        }
                        onBlur={() =>
                          setHoverRating(
                            0
                          )
                        }
                        onClick={() =>
                          setRating(
                            star
                          )
                        }
                      >
                        ★
                      </button>
                    )
                  )}
                </div>

                <strong className="rating-word">
                  {
                    ratingWord
                  }
                </strong>
              </div>

              {/* =========================================
                  COMMENT
              ========================================= */}

              <label className="review-comment-field">
                <span>
                  {lang === "en"
                    ? "Tell us more"
                    : "আরও বিস্তারিত লিখুন"}

                  <small>
                    {lang === "en"
                      ? "Optional"
                      : "ঐচ্ছিক"}
                  </small>
                </span>

                <textarea
                  value={
                    comment
                  }
                  onChange={(
                    event
                  ) =>
                    setComment(
                      event.target.value.slice(
                        0,
                        1000
                      )
                    )
                  }
                  rows={5}
                  placeholder={
                    lang === "en"
                      ? "What did you like about this product?"
                      : "এই পণ্যটির কোন দিকটি আপনার ভালো লেগেছে?"
                  }
                />

                <small className="review-character-count">
                  {
                    comment.length
                  }
                  /1000
                </small>
              </label>

              {/* =========================================
                  MESSAGES
              ========================================= */}

              {message && (
                <div className="review-message success">
                  ✓{" "}
                  {
                    message
                  }
                </div>
              )}

              {errorMessage && (
                <div className="review-message error">
                  {
                    errorMessage
                  }
                </div>
              )}

              {/* =========================================
                  FORM ACTIONS
              ========================================= */}

              <div className="review-form-actions">
                <button
                  type="submit"
                  className="review-submit-button"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? lang ===
                      "en"
                      ? "Saving..."
                      : "সংরক্ষণ হচ্ছে..."
                    : ownReview
                      ? lang ===
                        "en"
                        ? "Update Review"
                        : "রিভিউ আপডেট করুন"
                      : lang ===
                          "en"
                        ? "Submit Review"
                        : "রিভিউ জমা দিন"}

                  {!saving && (
                    <span>
                      →
                    </span>
                  )}
                </button>

                {ownReview && (
                  <button
                    type="button"
                    className="review-delete-button"
                    onClick={
                      handleDelete
                    }
                    disabled={
                      saving
                    }
                  >
                    {lang ===
                    "en"
                      ? "Delete"
                      : "মুছুন"}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* ===============================================
            PUBLISHED REVIEWS
        =============================================== */}

        <div className="published-reviews">
          <div className="published-reviews-heading">
            <div>
              <span>
                {lang === "en"
                  ? "PUBLISHED REVIEWS"
                  : "প্রকাশিত রিভিউ"}
              </span>

              <h3>
                {lang === "en"
                  ? "What customers are saying"
                  : "গ্রাহকরা যা বলছেন"}
              </h3>
            </div>

            <strong>
              {approvedReviews.length
                .toString()
                .padStart(
                  2,
                  "0"
                )}
            </strong>
          </div>

          {loading ? (
            <div className="reviews-empty">
              {lang === "en"
                ? "Loading customer reviews..."
                : "গ্রাহকদের রিভিউ লোড হচ্ছে..."}
            </div>
          ) : approvedReviews.length ===
            0 ? (
            <div className="reviews-empty">
              <div className="reviews-empty-stars">
                ☆ ☆ ☆ ☆ ☆
              </div>

              <h4>
                {lang === "en"
                  ? "Be the first voice."
                  : "প্রথম রিভিউটি দিন।"}
              </h4>

              <p>
                {lang === "en"
                  ? "There are no published reviews for this product yet."
                  : "এই পণ্যটির জন্য এখনও কোনো প্রকাশিত রিভিউ নেই।"}
              </p>
            </div>
          ) : (
            <div className="review-list">
              {approvedReviews.map(
                (
                  review,
                  index
                ) => (
                  <article
                    className="review-card"
                    key={
                      review.id
                    }
                    style={{
                      animationDelay: `${Math.min(
                        index *
                          70,
                        350
                      )}ms`,
                    }}
                  >
                    <div className="review-card-top">
                      <div className="review-avatar">
                        J
                      </div>

                      <div className="review-author">
                        <strong>
                          {lang ===
                          "en"
                            ? "JIPLANCE Customer"
                            : "JIPLANCE গ্রাহক"}
                        </strong>

                        <span>
                          {lang ===
                          "en"
                            ? "Verified account"
                            : "যাচাইকৃত অ্যাকাউন্ট"}
                        </span>
                      </div>

                      <time>
                        {formatReviewDate(
                          review.created_at,
                          lang
                        )}
                      </time>
                    </div>

                    <StarDisplay
                      rating={
                        review.rating
                      }
                      lang={
                        lang
                      }
                    />

                    {review.comment ? (
                      <p className="review-card-comment">
                        “
                        {
                          review.comment
                        }
                        ”
                      </p>
                    ) : (
                      <p className="review-card-comment muted">
                        {lang ===
                        "en"
                          ? "Rated this product without a written comment."
                          : "লিখিত মন্তব্য ছাড়াই এই পণ্যটির রেটিং দেওয়া হয়েছে।"}
                      </p>
                    )}

                    <div className="review-card-footer">
                      <span>
                        ✓{" "}
                        {lang ===
                        "en"
                          ? "Moderated review"
                          : "মডারেটেড রিভিউ"}
                      </span>

                      <span>
                        {
                          review.rating
                        }
                        /5
                      </span>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* =================================================
          STYLES
      ================================================= */}

      <style jsx>{`
        .reviews-section {
          position: relative;
          overflow: hidden;
          max-width: 1240px;
          margin: 28px auto 90px;
          padding: 52px;
          border: 1px solid
            rgba(31, 41, 77, 0.1);
          border-radius: 34px;
          background:
            linear-gradient(
              145deg,
              rgba(
                255,
                255,
                255,
                0.98
              ),
              rgba(
                247,
                248,
                252,
                0.96
              )
            );
          box-shadow:
            0 32px 90px
            rgba(
              31,
              41,
              77,
              0.08
            );
          isolation: isolate;
        }

        .reviews-glow {
          position: absolute;
          width: 360px;
          height: 360px;
          border-radius: 50%;
          filter: blur(20px);
          pointer-events: none;
          z-index: -1;
        }

        .reviews-glow-one {
          top: -220px;
          right: -100px;
          background:
            rgba(
              255,
              205,
              86,
              0.16
            );
        }

        .reviews-glow-two {
          bottom: -250px;
          left: -130px;
          background:
            rgba(
              70,
              92,
              180,
              0.1
            );
        }

        .reviews-heading {
          display: flex;
          justify-content:
            space-between;
          align-items: flex-end;
          gap: 30px;
          margin-bottom: 34px;
        }

        .reviews-kicker,
        .review-form-heading > span,
        .published-reviews-heading
          > div
          > span,
        .review-score-label {
          display: block;
          margin-bottom: 9px;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          color: #6d748c;
        }

        .reviews-heading h2 {
          max-width: 690px;
          margin: 0;
          font-size:
            clamp(
              2rem,
              4vw,
              3.35rem
            );
          line-height: 1.02;
          letter-spacing: -0.055em;
          color: #171b2e;
        }

        .reviews-heading p {
          max-width: 620px;
          margin: 17px 0 0;
          color: #6a7188;
          line-height: 1.7;
        }

        .review-trust-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 235px;
          padding: 14px 16px;
          border: 1px solid
            rgba(
              31,
              41,
              77,
              0.09
            );
          border-radius: 18px;
          background:
            rgba(
              255,
              255,
              255,
              0.75
            );
          backdrop-filter:
            blur(12px);
        }

        .review-trust-icon {
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          flex: 0 0 auto;
          border-radius: 50%;
          background: #1f294d;
          color: white;
          font-weight: 900;
        }

        .review-trust-badge strong,
        .review-trust-badge small {
          display: block;
        }

        .review-trust-badge strong {
          color: #1d2238;
          font-size: 0.9rem;
        }

        .review-trust-badge small {
          margin-top: 3px;
          color: #7b8193;
          font-size: 0.72rem;
        }

        .review-dashboard {
          display: grid;
          grid-template-columns:
            270px 1fr;
          gap: 18px;
          margin-bottom: 22px;
        }

        .review-score-card,
        .review-distribution,
        .review-form-panel,
        .published-reviews {
          border: 1px solid
            rgba(
              31,
              41,
              77,
              0.08
            );
          background:
            rgba(
              255,
              255,
              255,
              0.82
            );
          box-shadow:
            0 18px 50px
            rgba(
              31,
              41,
              77,
              0.045
            );
        }

        .review-score-card {
          padding: 27px;
          border-radius: 24px;
        }

        .review-score-number {
          margin-bottom: 4px;
          font-size: 3.8rem;
          line-height: 1;
          font-weight: 850;
          letter-spacing: -0.07em;
          color: #171b2e;
        }

        .review-score-card p {
          margin: 11px 0 0;
          color: #757c91;
          font-size: 0.82rem;
        }

        .review-distribution {
          display: grid;
          align-content: center;
          gap: 13px;
          padding: 25px 30px;
          border-radius: 24px;
        }

        .review-bar-row {
          display: grid;
          grid-template-columns:
            42px 1fr 28px;
          align-items: center;
          gap: 12px;
        }

        .review-bar-star {
          color: #5f6578;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .review-bar-track {
          height: 8px;
          overflow: hidden;
          border-radius: 999px;
          background: #eef0f6;
        }

        .review-bar-fill {
          height: 100%;
          border-radius: inherit;
          background:
            linear-gradient(
              90deg,
              #f1b828,
              #ffd86a
            );
          transition:
            width 0.65s
            cubic-bezier(
              0.2,
              0.8,
              0.2,
              1
            );
        }

        .review-bar-count {
          color: #9297a8;
          font-size: 0.76rem;
          text-align: right;
        }

        .review-content-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 0.85fr)
            minmax(0, 1.15fr);
          gap: 22px;
        }

        .review-form-panel,
        .published-reviews {
          padding: 30px;
          border-radius: 26px;
        }

        .review-form-heading {
          margin-bottom: 24px;
        }

        .review-form-heading h3,
        .published-reviews-heading
          h3 {
          margin: 0;
          color: #1c2137;
          font-size: 1.35rem;
          letter-spacing: -0.025em;
        }

        .review-loading {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 35px 0;
          color: #777e91;
        }

        .review-loading span {
          width: 18px;
          height: 18px;
          border: 2px solid
            #d6d9e3;
          border-top-color:
            #1f294d;
          border-radius: 50%;
          animation:
            reviewSpin 0.8s
            linear infinite;
        }

        .review-login-card {
          padding: 34px 24px;
          border-radius: 22px;
          text-align: center;
          background:
            linear-gradient(
              145deg,
              #f8f9fc,
              #f1f3f9
            );
        }

        .review-login-icon {
          margin-bottom: 13px;
          font-size: 2.5rem;
          color: #e4ad1c;
          animation:
            reviewFloat 2.8s
            ease-in-out infinite;
        }

        .review-login-card h4 {
          margin: 0;
          color: #20253b;
          font-size: 1.2rem;
        }

        .review-login-card p {
          max-width: 360px;
          margin: 10px auto 20px;
          color: #757c8e;
          line-height: 1.6;
        }

        .review-login-button,
        .review-submit-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          min-height: 48px;
          padding: 0 20px;
          border: none;
          border-radius: 14px;
          background: #1f294d;
          color: white;
          text-decoration: none;
          font-weight: 750;
          cursor: pointer;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .review-login-button:hover,
        .review-submit-button:hover:not(
            :disabled
          ) {
          transform:
            translateY(-2px);
          box-shadow:
            0 14px 28px
            rgba(
              31,
              41,
              77,
              0.2
            );
        }

        .review-login-button span,
        .review-submit-button span {
          transition:
            transform 0.2s ease;
        }

        .review-login-button:hover span,
        .review-submit-button:hover
          span {
          transform:
            translateX(4px);
        }

        .review-pending-banner {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 22px;
          padding: 14px;
          border: 1px solid
            rgba(
              225,
              165,
              0,
              0.22
            );
          border-radius: 15px;
          background:
            rgba(
              255,
              204,
              51,
              0.09
            );
        }

        .review-pending-banner > span {
          font-size: 1.3rem;
        }

        .review-pending-banner strong,
        .review-pending-banner small {
          display: block;
        }

        .review-pending-banner strong {
          color: #735a12;
          font-size: 0.87rem;
        }

        .review-pending-banner small {
          margin-top: 2px;
          color: #8d7a43;
          font-size: 0.73rem;
        }

        .rating-picker {
          margin-bottom: 22px;
        }

        .rating-picker-label {
          display: block;
          margin-bottom: 9px;
          color: #555d72;
          font-size: 0.82rem;
          font-weight: 700;
        }

        .rating-buttons {
          display: flex;
          gap: 4px;
        }

        .rating-button {
          padding: 0;
          border: none;
          background: transparent;
          color: #d7d9e0;
          font-size: 2rem;
          line-height: 1;
          cursor: pointer;
          transform-origin: center;
          transition:
            color 0.15s ease,
            transform 0.15s ease;
        }

        .rating-button.active {
          color: #f2b827;
        }

        .rating-button:hover {
          transform:
            translateY(-3px)
            scale(1.12)
            rotate(-4deg);
        }

        .rating-word {
          display: block;
          margin-top: 9px;
          color: #7d8495;
          font-size: 0.76rem;
        }

        .review-comment-field {
          display: block;
          position: relative;
        }

        .review-comment-field
          > span {
          display: flex;
          justify-content:
            space-between;
          align-items: center;
          margin-bottom: 9px;
          color: #555d72;
          font-size: 0.82rem;
          font-weight: 700;
        }

        .review-comment-field
          > span
          small {
          color: #a0a5b3;
          font-weight: 500;
        }

        .review-comment-field
          textarea {
          width: 100%;
          resize: vertical;
          min-height: 135px;
          padding: 16px 16px 34px;
          border: 1px solid
            #e1e4ec;
          border-radius: 17px;
          outline: none;
          background: #fafbfc;
          color: #1f2438;
          font: inherit;
          line-height: 1.6;
          box-sizing:
            border-box;
          transition:
            border-color 0.18s
              ease,
            box-shadow 0.18s
              ease,
            background 0.18s
              ease;
        }

        .review-comment-field
          textarea:focus {
          border-color:
            rgba(
              31,
              41,
              77,
              0.4
            );
          background: white;
          box-shadow:
            0 0 0 4px
            rgba(
              31,
              41,
              77,
              0.055
            );
        }

        .review-character-count {
          position: absolute;
          right: 13px;
          bottom: 10px;
          color: #a1a5b2;
          font-size: 0.68rem;
        }

        .review-message {
          margin-top: 14px;
          padding: 12px 14px;
          border-radius: 13px;
          font-size: 0.78rem;
          line-height: 1.5;
        }

        .review-message.success {
          background: #eef9f2;
          color: #287a45;
        }

        .review-message.error {
          background: #fff0f0;
          color: #b13b3b;
        }

        .review-form-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 18px;
        }

        .review-submit-button {
          flex: 1;
        }

        .review-submit-button:disabled,
        .review-delete-button:disabled {
          cursor: wait;
          opacity: 0.6;
        }

        .review-delete-button {
          min-height: 46px;
          padding: 0 16px;
          border: 1px solid
            #e3e5eb;
          border-radius: 13px;
          background: white;
          color: #9b3a3a;
          font-weight: 700;
          cursor: pointer;
          transition:
            background 0.18s
              ease,
            transform 0.18s
              ease;
        }

        .review-delete-button:hover:not(
            :disabled
          ) {
          background: #fff5f5;
          transform:
            translateY(-1px);
        }

        .own-review-status {
          padding: 22px;
          border-radius: 20px;
          background:
            #f4faf6;
          animation:
            reviewFadeUp 0.4s
            ease both;
        }

        .review-status-top {
          display: flex;
          justify-content:
            space-between;
          gap: 10px;
          margin-bottom: 15px;
          color: #7c8392;
          font-size: 0.73rem;
        }

        .review-status-pill {
          padding: 5px 9px;
          border-radius: 999px;
          background: #dff3e5;
          color: #347a4c;
          font-weight: 800;
          font-size: 0.65rem;
          letter-spacing:
            0.08em;
        }

        .own-review-status p {
          margin: 15px 0;
          color: #555d6d;
          line-height: 1.7;
        }

        .review-approved-note {
          font-size: 0.76rem;
          color: #748178 !important;
        }

        .published-reviews-heading {
          display: flex;
          justify-content:
            space-between;
          gap: 20px;
          align-items: flex-end;
          margin-bottom: 22px;
        }

        .published-reviews-heading
          > strong {
          color: #d7dbe5;
          font-size: 2.3rem;
          letter-spacing: -0.05em;
        }

        .review-list {
          display: grid;
          gap: 13px;
        }

        .review-card {
          padding: 20px;
          border: 1px solid
            #eaecf1;
          border-radius: 19px;
          background:
            linear-gradient(
              150deg,
              #ffffff,
              #fbfbfd
            );
          opacity: 0;
          animation:
            reviewFadeUp 0.45s
            ease forwards;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            border-color 0.2s
              ease;
        }

        .review-card:hover {
          transform:
            translateY(-3px);
          border-color:
            #dfe2ea;
          box-shadow:
            0 16px 30px
            rgba(
              31,
              41,
              77,
              0.07
            );
        }

        .review-card-top {
          display: grid;
          grid-template-columns:
            auto 1fr auto;
          align-items: center;
          gap: 11px;
          margin-bottom: 13px;
        }

        .review-avatar {
          display: grid;
          place-items: center;
          width: 39px;
          height: 39px;
          border-radius: 50%;
          background:
            linear-gradient(
              145deg,
              #1f294d,
              #354578
            );
          color: white;
          font-weight: 850;
        }

        .review-author strong,
        .review-author span {
          display: block;
        }

        .review-author strong {
          color: #282d40;
          font-size: 0.86rem;
        }

        .review-author span {
          margin-top: 2px;
          color: #9a9fae;
          font-size: 0.68rem;
        }

        .review-card time {
          color: #a1a6b3;
          font-size: 0.69rem;
        }

        .review-stars {
          display: flex;
          gap: 2px;
          line-height: 1;
        }

        .review-stars-large {
          font-size: 1.17rem;
        }

        .review-star-filled {
          color: #efb526;
        }

        .review-star-empty {
          color: #d9dce4;
        }

        .review-card-comment {
          margin: 14px 0 16px;
          color: #535b70;
          font-size: 0.88rem;
          line-height: 1.72;
        }

        .review-card-comment.muted {
          color: #989daa;
        }

        .review-card-footer {
          display: flex;
          justify-content:
            space-between;
          gap: 12px;
          padding-top: 13px;
          border-top: 1px solid
            #eff0f4;
          color: #989eac;
          font-size: 0.66rem;
        }

        .reviews-empty {
          display: grid;
          place-items: center;
          min-height: 260px;
          padding: 30px;
          border: 1px dashed
            #dfe2e9;
          border-radius: 20px;
          text-align: center;
          color: #858b9b;
        }

        .reviews-empty-stars {
          color: #e9b93d;
          font-size: 1.5rem;
          letter-spacing: 0.06em;
        }

        .reviews-empty h4 {
          margin: 5px 0 0;
          color: #3b4052;
          font-size: 1.1rem;
        }

        .reviews-empty p {
          margin: 0;
          max-width: 340px;
          line-height: 1.6;
          font-size: 0.82rem;
        }

        @keyframes reviewFadeUp {
          from {
            opacity: 0;
            transform:
              translateY(12px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0);
          }
        }

        @keyframes reviewSpin {
          to {
            transform:
              rotate(360deg);
          }
        }

        @keyframes reviewFloat {
          0%,
          100% {
            transform:
              translateY(0);
          }

          50% {
            transform:
              translateY(-5px);
          }
        }

        @media (
          max-width: 900px
        ) {
          .reviews-section {
            margin-left: 16px;
            margin-right: 16px;
            padding: 32px 24px;
          }

          .reviews-heading {
            align-items:
              flex-start;
            flex-direction:
              column;
          }

          .review-dashboard {
            grid-template-columns:
              1fr;
          }

          .review-content-grid {
            grid-template-columns:
              1fr;
          }

          .review-trust-badge {
            min-width: 0;
          }
        }

        @media (
          max-width: 560px
        ) {
          .reviews-section {
            padding: 25px 16px;
            margin-bottom: 60px;
            border-radius: 25px;
          }

          .reviews-heading h2 {
            font-size: 2rem;
          }

          .review-score-card,
          .review-distribution,
          .review-form-panel,
          .published-reviews {
            padding: 20px;
          }

          .review-bar-row {
            grid-template-columns:
              38px 1fr 22px;
            gap: 8px;
          }

          .rating-button {
            font-size: 1.8rem;
          }

          .review-form-actions {
            align-items: stretch;
            flex-direction:
              column;
          }

          .review-delete-button {
            width: 100%;
          }

          .review-card-top {
            grid-template-columns:
              auto 1fr;
          }

          .review-card time {
            grid-column:
              1 / -1;
          }
        }

        @media (
          prefers-reduced-motion:
            reduce
        ) {
          .review-card,
          .review-login-icon,
          .review-loading span {
            animation: none;
          }

          .review-bar-fill,
          .rating-button,
          .review-login-button,
          .review-submit-button {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}