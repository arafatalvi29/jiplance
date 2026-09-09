"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

type ReviewRow = {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  product_type: string;
  image_url: string | null;
};

type ReviewWithProduct = ReviewRow & {
  product?: ProductRow | null;
};

type FilterType =
  | "all"
  | "pending"
  | "published";

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Dhaka",
      }
    ).format(new Date(value));
  } catch {
    return "";
  }
}

function Stars({
  rating,
}: {
  rating: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "2px",
      }}
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map(
        (star) => (
          <span
            key={star}
            style={{
              color:
                star <= rating
                  ? "#e7ac22"
                  : "#d7dae3",
              fontSize: "1rem",
            }}
          >
            ★
          </span>
        )
      )}
    </div>
  );
}

export default function AdminReviewsPage() {
  const router = useRouter();

  const [reviews, setReviews] =
    useState<ReviewWithProduct[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [canView, setCanView] =
    useState(false);

  const [canManage, setCanManage] =
    useState(false);

  const [filter, setFilter] =
    useState<FilterType>("pending");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [actionMessage, setActionMessage] =
    useState("");

  const [workingId, setWorkingId] =
    useState<string | null>(null);

  const loadPage = async () => {
    if (!supabase) {
      router.push("/account");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/account");
        return;
      }

      const [
        viewResult,
        manageResult,
      ] = await Promise.all([
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
      ]);

      const viewAllowed =
        viewResult.data === true;

      const manageAllowed =
        manageResult.data === true;

      setCanView(viewAllowed);
      setCanManage(manageAllowed);

      if (
        !viewAllowed &&
        !manageAllowed
      ) {
        router.push("/admin");
        return;
      }

      const {
        data: reviewData,
        error: reviewError,
      } = await supabase
        .from("reviews")
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
        .order("created_at", {
          ascending: false,
        });

      if (reviewError) {
        throw reviewError;
      }

      const baseReviews =
        (reviewData ??
          []) as ReviewRow[];

      const productIds = Array.from(
        new Set(
          baseReviews.map(
            (review) =>
              review.product_id
          )
        )
      );

      let products: ProductRow[] =
        [];

      if (productIds.length > 0) {
        const {
          data: productData,
          error: productError,
        } = await supabase
          .from("products")
          .select(
            `
            id,
            name,
            slug,
            product_type,
            image_url
            `
          )
          .in("id", productIds);

        if (productError) {
          console.error(
            "Review products error:",
            productError.message
          );
        } else {
          products =
            (productData ??
              []) as ProductRow[];
        }
      }

      const productMap =
        new Map(
          products.map(
            (product) => [
              product.id,
              product,
            ]
          )
        );

      const merged =
        baseReviews.map(
          (review) => ({
            ...review,
            product:
              productMap.get(
                review.product_id
              ) ?? null,
          })
        );

      setReviews(merged);
    } catch (error) {
      const pageError =
        error as {
          message?: string;
        };

      setErrorMessage(
        pageError.message ||
          "Could not load reviews."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const filteredReviews =
    useMemo(() => {
      if (filter === "pending") {
        return reviews.filter(
          (review) =>
            !review.is_approved
        );
      }

      if (
        filter === "published"
      ) {
        return reviews.filter(
          (review) =>
            review.is_approved
        );
      }

      return reviews;
    }, [reviews, filter]);

  const pendingCount =
    reviews.filter(
      (review) =>
        !review.is_approved
    ).length;

  const publishedCount =
    reviews.filter(
      (review) =>
        review.is_approved
    ).length;

  const approveReview = async (
    review: ReviewWithProduct
  ) => {
    if (
      !supabase ||
      !canManage
    ) {
      return;
    }

    setWorkingId(review.id);
    setErrorMessage("");
    setActionMessage("");

    try {
      const { error } =
        await supabase
          .from("reviews")
          .update({
            is_approved: true,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", review.id);

      if (error) {
        throw error;
      }

      setActionMessage(
        "Review published successfully."
      );

      await loadPage();
    } catch (error) {
      const actionError =
        error as {
          message?: string;
        };

      setErrorMessage(
        actionError.message ||
          "Could not publish review."
      );
    } finally {
      setWorkingId(null);
    }
  };

  const unpublishReview = async (
    review: ReviewWithProduct
  ) => {
    if (
      !supabase ||
      !canManage
    ) {
      return;
    }

    setWorkingId(review.id);
    setErrorMessage("");
    setActionMessage("");

    try {
      const { error } =
        await supabase
          .from("reviews")
          .update({
            is_approved: false,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", review.id);

      if (error) {
        throw error;
      }

      setActionMessage(
        "Review moved back to pending."
      );

      await loadPage();
    } catch (error) {
      const actionError =
        error as {
          message?: string;
        };

      setErrorMessage(
        actionError.message ||
          "Could not unpublish review."
      );
    } finally {
      setWorkingId(null);
    }
  };

  const deleteReview = async (
    review: ReviewWithProduct
  ) => {
    if (
      !supabase ||
      !canManage
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this review permanently?"
      );

    if (!confirmed) {
      return;
    }

    setWorkingId(review.id);
    setErrorMessage("");
    setActionMessage("");

    try {
      const { error } =
        await supabase
          .from("reviews")
          .delete()
          .eq("id", review.id);

      if (error) {
        throw error;
      }

      setActionMessage(
        "Review deleted."
      );

      await loadPage();
    } catch (error) {
      const actionError =
        error as {
          message?: string;
        };

      setErrorMessage(
        actionError.message ||
          "Could not delete review."
      );
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <>
      <Header />

      <main className="section-shell page-space">
        <section className="review-admin-hero">
          <div>
            <div className="eyebrow">
              REVIEW CONTROL CENTER
            </div>

            <h1>
              Customer Reviews
            </h1>

            <p>
              Review customer feedback,
              publish approved content,
              and keep the storefront
              trustworthy.
            </p>
          </div>

          <div className="review-admin-actions">
            <a
              href="/admin"
              className="ghost-button"
            >
              ← Dashboard
            </a>

            <button
              type="button"
              className="review-refresh-button"
              onClick={loadPage}
              disabled={loading}
            >
              {loading
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>
        </section>

        {!loading && (
          <section className="review-admin-stats">
            <article>
              <span>
                Total Reviews
              </span>

              <strong>
                {reviews.length}
              </strong>
            </article>

            <article>
              <span>
                Pending
              </span>

              <strong>
                {pendingCount}
              </strong>
            </article>

            <article>
              <span>
                Published
              </span>

              <strong>
                {publishedCount}
              </strong>
            </article>

            <article>
              <span>
                Access
              </span>

              <strong className="review-access-text">
                {canManage
                  ? "Manage"
                  : "View Only"}
              </strong>
            </article>
          </section>
        )}

        <section className="review-toolbar">
          <div className="review-filter-tabs">
            <button
              type="button"
              onClick={() =>
                setFilter("pending")
              }
              className={
                filter === "pending"
                  ? "active"
                  : ""
              }
            >
              Pending
              <span>
                {pendingCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setFilter(
                  "published"
                )
              }
              className={
                filter ===
                "published"
                  ? "active"
                  : ""
              }
            >
              Published
              <span>
                {publishedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setFilter("all")
              }
              className={
                filter === "all"
                  ? "active"
                  : ""
              }
            >
              All
              <span>
                {reviews.length}
              </span>
            </button>
          </div>

          {!canManage &&
            !loading && (
              <div className="review-readonly-badge">
                View-only access
              </div>
            )}
        </section>

        {errorMessage && (
          <div className="review-admin-message error">
            {errorMessage}
          </div>
        )}

        {actionMessage && (
          <div className="review-admin-message success">
            ✓ {actionMessage}
          </div>
        )}

        {loading ? (
          <section className="review-admin-loading">
            <span />
            Loading reviews...
          </section>
        ) : filteredReviews.length ===
          0 ? (
          <section className="review-admin-empty">
            <div>☆</div>

            <h2>
              No reviews here
            </h2>

            <p>
              {filter === "pending"
                ? "There are no reviews waiting for approval."
                : filter ===
                  "published"
                ? "There are no published reviews yet."
                : "No customer reviews have been submitted yet."}
            </p>
          </section>
        ) : (
          <section className="review-admin-grid">
            {filteredReviews.map(
              (review, index) => (
                <article
                  key={review.id}
                  className="review-admin-card"
                  style={{
                    animationDelay: `${Math.min(
                      index * 50,
                      250
                    )}ms`,
                  }}
                >
                  <div className="review-product-row">
                    <div className="review-product-image">
                      {review.product
                        ?.image_url ? (
                        <img
                          src={
                            review.product
                              .image_url
                          }
                          alt={
                            review.product
                              .name
                          }
                        />
                      ) : (
                        <span>
                          {review.product
                            ?.product_type ===
                          "fashion"
                            ? "👕"
                            : "📚"}
                        </span>
                      )}
                    </div>

                    <div className="review-product-copy">
                      <span>
                        PRODUCT
                      </span>

                      <strong>
                        {review.product
                          ?.name ||
                          "Unknown Product"}
                      </strong>

                      {review.product
                        ?.slug && (
                        <a
                          href={`/product/${review.product.slug}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View product ↗
                        </a>
                      )}
                    </div>

                    <span
                      className={`review-status ${
                        review.is_approved
                          ? "published"
                          : "pending"
                      }`}
                    >
                      {review.is_approved
                        ? "PUBLISHED"
                        : "PENDING"}
                    </span>
                  </div>

                  <div className="review-admin-body">
                    <div className="review-rating-row">
                      <Stars
                        rating={
                          review.rating
                        }
                      />

                      <strong>
                        {
                          review.rating
                        }
                        /5
                      </strong>
                    </div>

                    <p
                      className={
                        review.comment
                          ? "review-admin-comment"
                          : "review-admin-comment muted"
                      }
                    >
                      {review.comment
                        ? `“${review.comment}”`
                        : "Customer submitted a rating without a written comment."}
                    </p>
                  </div>

                  <div className="review-admin-meta">
                    <span>
                      Customer ID
                    </span>

                    <code>
                      {review.user_id.slice(
                        0,
                        8
                      )}
                      …
                    </code>

                    <span>
                      Submitted
                    </span>

                    <strong>
                      {formatDate(
                        review.created_at
                      )}
                    </strong>
                  </div>

                  {canManage && (
                    <div className="review-admin-card-actions">
                      {review.is_approved ? (
                        <button
                          type="button"
                          className="review-unpublish-button"
                          onClick={() =>
                            unpublishReview(
                              review
                            )
                          }
                          disabled={
                            workingId ===
                            review.id
                          }
                        >
                          {workingId ===
                          review.id
                            ? "Working..."
                            : "Unpublish"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="review-approve-button"
                          onClick={() =>
                            approveReview(
                              review
                            )
                          }
                          disabled={
                            workingId ===
                            review.id
                          }
                        >
                          {workingId ===
                          review.id
                            ? "Publishing..."
                            : "✓ Approve & Publish"}
                        </button>
                      )}

                      <button
                        type="button"
                        className="review-admin-delete"
                        onClick={() =>
                          deleteReview(
                            review
                          )
                        }
                        disabled={
                          workingId ===
                          review.id
                        }
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </article>
              )
            )}
          </section>
        )}
      </main>

      <Footer />

      <style jsx>{`
        .review-admin-hero {
          display: flex;
          justify-content:
            space-between;
          align-items: flex-end;
          gap: 30px;
          margin-bottom: 32px;
          padding: 32px 0 8px;
        }

        .review-admin-hero h1 {
          margin: 5px 0 10px;
          font-size:
            clamp(
              2.4rem,
              5vw,
              4.2rem
            );
          line-height: 0.98;
          letter-spacing: -0.055em;
          color: #19203f;
        }

        .review-admin-hero p {
          max-width: 620px;
          margin: 0;
          color: #747b8d;
          line-height: 1.7;
        }

        .review-admin-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .review-refresh-button {
          padding: 13px 18px;
          border: none;
          border-radius: 14px;
          background: #1f294d;
          color: white;
          font-weight: 750;
          cursor: pointer;
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease;
        }

        .review-refresh-button:hover:not(
            :disabled
          ) {
          transform:
            translateY(-2px);
          box-shadow:
            0 12px 24px
            rgba(
              31,
              41,
              77,
              0.17
            );
        }

        .review-refresh-button:disabled {
          opacity: 0.6;
        }

        .review-admin-stats {
          display: grid;
          grid-template-columns:
            repeat(
              4,
              minmax(0, 1fr)
            );
          gap: 14px;
          margin-bottom: 25px;
        }

        .review-admin-stats
          article {
          padding: 20px;
          border: 1px solid
            #e5e7ed;
          border-radius: 19px;
          background: #fff;
        }

        .review-admin-stats span {
          display: block;
          margin-bottom: 7px;
          color: #8990a1;
          font-size: 0.72rem;
          font-weight: 750;
          text-transform:
            uppercase;
          letter-spacing:
            0.08em;
        }

        .review-admin-stats
          strong {
          color: #202745;
          font-size: 1.8rem;
          letter-spacing:
            -0.04em;
        }

        .review-admin-stats
          .review-access-text {
          font-size: 1rem;
        }

        .review-toolbar {
          display: flex;
          justify-content:
            space-between;
          align-items: center;
          gap: 18px;
          margin-bottom: 22px;
        }

        .review-filter-tabs {
          display: flex;
          gap: 7px;
          padding: 5px;
          border: 1px solid
            #e2e5eb;
          border-radius: 16px;
          background: #f7f8fa;
        }

        .review-filter-tabs
          button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 13px;
          border: none;
          border-radius: 11px;
          background: transparent;
          color: #697084;
          font-weight: 700;
          cursor: pointer;
          transition:
            background 0.18s
              ease,
            color 0.18s ease,
            transform 0.18s
              ease;
        }

        .review-filter-tabs
          button:hover {
          transform:
            translateY(-1px);
        }

        .review-filter-tabs
          button.active {
          background: white;
          color: #202745;
          box-shadow:
            0 5px 15px
            rgba(
              31,
              41,
              77,
              0.08
            );
        }

        .review-filter-tabs
          button
          span {
          display: grid;
          place-items: center;
          min-width: 23px;
          height: 23px;
          padding: 0 6px;
          border-radius: 999px;
          background: #eceef3;
          font-size: 0.68rem;
        }

        .review-filter-tabs
          button.active
          span {
          background: #1f294d;
          color: white;
        }

        .review-readonly-badge {
          padding: 8px 12px;
          border-radius: 999px;
          background: #f1f2f5;
          color: #70778a;
          font-size: 0.73rem;
          font-weight: 750;
        }

        .review-admin-message {
          margin-bottom: 18px;
          padding: 13px 15px;
          border-radius: 13px;
          font-size: 0.82rem;
        }

        .review-admin-message.success {
          background: #edf9f1;
          color: #287447;
        }

        .review-admin-message.error {
          background: #fff0f0;
          color: #aa3636;
        }

        .review-admin-loading,
        .review-admin-empty {
          display: grid;
          place-items: center;
          min-height: 310px;
          padding: 40px;
          border: 1px dashed
            #dfe2e9;
          border-radius: 24px;
          background: #fafbfc;
          color: #7e8597;
          text-align: center;
        }

        .review-admin-loading {
          display: flex;
          gap: 10px;
        }

        .review-admin-loading
          span {
          width: 18px;
          height: 18px;
          border: 2px solid
            #d9dce4;
          border-top-color:
            #1f294d;
          border-radius: 50%;
          animation:
            adminSpin 0.8s
            linear infinite;
        }

        .review-admin-empty
          div {
          font-size: 2.8rem;
          color: #e1b544;
        }

        .review-admin-empty h2 {
          margin: 8px 0 0;
          color: #343b55;
        }

        .review-admin-empty p {
          max-width: 430px;
          margin: 0;
          line-height: 1.6;
        }

        .review-admin-grid {
          display: grid;
          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );
          gap: 17px;
          padding-bottom: 70px;
        }

        .review-admin-card {
          overflow: hidden;
          border: 1px solid
            #e4e6ec;
          border-radius: 22px;
          background: #fff;
          opacity: 0;
          animation:
            adminReviewIn
            0.38s ease forwards;
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease;
        }

        .review-admin-card:hover {
          transform:
            translateY(-2px);
          box-shadow:
            0 16px 34px
            rgba(
              31,
              41,
              77,
              0.065
            );
        }

        .review-product-row {
          display: grid;
          grid-template-columns:
            auto 1fr auto;
          align-items: center;
          gap: 13px;
          padding: 18px;
          border-bottom: 1px solid
            #eef0f4;
        }

        .review-product-image {
          display: grid;
          place-items: center;
          width: 60px;
          height: 60px;
          overflow: hidden;
          border-radius: 14px;
          background: #f3f4f7;
        }

        .review-product-image
          img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .review-product-image
          span {
          font-size: 1.7rem;
        }

        .review-product-copy
          > span {
          display: block;
          margin-bottom: 3px;
          color: #9a9fad;
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing:
            0.09em;
        }

        .review-product-copy
          strong {
          display: block;
          color: #282f4a;
          font-size: 0.9rem;
        }

        .review-product-copy
          a {
          display: inline-block;
          margin-top: 4px;
          color: #70798e;
          font-size: 0.7rem;
          text-decoration: none;
        }

        .review-status {
          padding: 7px 9px;
          border-radius: 999px;
          font-size: 0.62rem;
          font-weight: 850;
          letter-spacing:
            0.06em;
        }

        .review-status.pending {
          background: #fff4d8;
          color: #8b6510;
        }

        .review-status.published {
          background: #e6f6eb;
          color: #34754b;
        }

        .review-admin-body {
          padding: 19px 18px;
        }

        .review-rating-row {
          display: flex;
          justify-content:
            space-between;
          align-items: center;
          gap: 10px;
        }

        .review-rating-row
          strong {
          color: #6b7284;
          font-size: 0.74rem;
        }

        .review-admin-comment {
          min-height: 56px;
          margin: 14px 0 0;
          color: #51596e;
          line-height: 1.7;
          font-size: 0.86rem;
        }

        .review-admin-comment.muted {
          color: #969baa;
        }

        .review-admin-meta {
          display: grid;
          grid-template-columns:
            auto 1fr;
          gap: 7px 13px;
          padding: 14px 18px;
          border-top: 1px solid
            #eef0f4;
          background: #fafbfc;
          font-size: 0.69rem;
        }

        .review-admin-meta
          span {
          color: #999eac;
        }

        .review-admin-meta
          code,
        .review-admin-meta
          strong {
          color: #666d80;
          font-size: inherit;
        }

        .review-admin-card-actions {
          display: flex;
          gap: 9px;
          padding: 15px 18px;
          border-top: 1px solid
            #edf0f4;
        }

        .review-approve-button,
        .review-unpublish-button,
        .review-admin-delete {
          min-height: 43px;
          padding: 0 15px;
          border-radius: 12px;
          font-weight: 750;
          cursor: pointer;
          transition:
            transform 0.16s ease,
            box-shadow 0.16s ease,
            background 0.16s
              ease;
        }

        .review-approve-button {
          flex: 1;
          border: none;
          background: #1f294d;
          color: white;
        }

        .review-approve-button:hover:not(
            :disabled
          ) {
          transform:
            translateY(-1px);
          box-shadow:
            0 10px 20px
            rgba(
              31,
              41,
              77,
              0.16
            );
        }

        .review-unpublish-button {
          flex: 1;
          border: 1px solid
            #dfe2e9;
          background: #f7f8fa;
          color: #525a70;
        }

        .review-admin-delete {
          border: 1px solid
            #efdada;
          background: white;
          color: #a33d3d;
        }

        .review-admin-delete:hover:not(
            :disabled
          ) {
          background: #fff5f5;
          transform:
            translateY(-1px);
        }

        .review-approve-button:disabled,
        .review-unpublish-button:disabled,
        .review-admin-delete:disabled {
          cursor: wait;
          opacity: 0.55;
        }

        @keyframes adminReviewIn {
          from {
            opacity: 0;
            transform:
              translateY(8px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0);
          }
        }

        @keyframes adminSpin {
          to {
            transform:
              rotate(360deg);
          }
        }

        @media (
          max-width: 900px
        ) {
          .review-admin-hero {
            align-items:
              flex-start;
            flex-direction:
              column;
          }

          .review-admin-stats {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );
          }

          .review-admin-grid {
            grid-template-columns:
              1fr;
          }
        }

        @media (
          max-width: 600px
        ) {
          .review-admin-stats {
            grid-template-columns:
              1fr 1fr;
          }

          .review-toolbar {
            align-items:
              flex-start;
            flex-direction:
              column;
          }

          .review-filter-tabs {
            width: 100%;
            overflow-x: auto;
          }

          .review-product-row {
            grid-template-columns:
              auto 1fr;
          }

          .review-status {
            grid-column:
              1 / -1;
            justify-self:
              flex-start;
          }

          .review-admin-card-actions {
            flex-direction:
              column;
          }

          .review-admin-delete {
            width: 100%;
          }
        }

        @media (
          prefers-reduced-motion:
            reduce
        ) {
          .review-admin-card,
          .review-admin-loading
            span {
            animation: none;
          }

          .review-refresh-button,
          .review-admin-card,
          .review-filter-tabs
            button,
          .review-approve-button,
          .review-unpublish-button,
          .review-admin-delete {
            transition: none;
          }
        }
      `}</style>
    </>
  );
}