"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { supabase } from "@/lib/supabase";

type NewsletterStats = {
  total: number;
  active: number;
  joined_today: number;
  joined_this_month: number;
};

type SubscriberRow = {
  id: string;
  email: string;
  is_active: boolean;
  source: string;
  created_at: string;
  total_count: number;
};

const PAGE_SIZE = 20;

function formatDate(
  value: string
) {
  return new Date(
    value
  ).toLocaleString(
    "en-BD",
    {
      timeZone:
        "Asia/Dhaka",

      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",

      hour:
        "numeric",

      minute:
        "2-digit",
    }
  );
}

export default function AdminNewsletterPage() {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    listLoading,
    setListLoading,
  ] =
    useState(false);

  const [
    allowed,
    setAllowed,
  ] =
    useState(false);

  const [
    stats,
    setStats,
  ] =
    useState<NewsletterStats>({
      total: 0,
      active: 0,
      joined_today: 0,
      joined_this_month: 0,
    });

  const [
    subscribers,
    setSubscribers,
  ] =
    useState<
      SubscriberRow[]
    >([]);

  const [
    searchInput,
    setSearchInput,
  ] =
    useState("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    page,
    setPage,
  ] =
    useState(1);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const totalCount =
    subscribers.length > 0
      ? Number(
          subscribers[0]
            .total_count ??
            0
        )
      : 0;

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalCount /
          PAGE_SIZE
      )
    );

  // ========================================================
  // SECURITY + STATS
  // ========================================================

  const loadFoundation =
    useCallback(
      async () => {
        if (!supabase) {
          router.push(
            "/account"
          );

          return;
        }

        setLoading(
          true
        );

        setErrorMessage(
          ""
        );

        try {
          const {
            data: {
              user,
            },
          } =
            await supabase.auth.getUser();

          if (!user) {
            router.push(
              "/account"
            );

            return;
          }

          const {
            data:
              profile,

            error:
              profileError,
          } =
            await supabase
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
            router.push(
              "/account"
            );

            return;
          }

          const {
            data:
              permissionData,

            error:
              permissionError,
          } =
            await supabase.rpc(
              "has_permission",
              {
                required_permission:
                  "newsletter.view",
              }
            );

          if (
            permissionError ||
            permissionData !==
              true
          ) {
            router.push(
              "/admin"
            );

            return;
          }

          setAllowed(
            true
          );

          const {
            data:
              statsData,

            error:
              statsError,
          } =
            await supabase.rpc(
              "get_newsletter_stats"
            );

          if (
            statsError
          ) {
            throw statsError;
          }

          const safeStats =
            statsData as
              | NewsletterStats
              | null;

          if (
            safeStats
          ) {
            setStats({
              total:
                Number(
                  safeStats.total ??
                    0
                ),

              active:
                Number(
                  safeStats.active ??
                    0
                ),

              joined_today:
                Number(
                  safeStats.joined_today ??
                    0
                ),

              joined_this_month:
                Number(
                  safeStats.joined_this_month ??
                    0
                ),
            });
          }
        } catch (
          error
        ) {
          const pageError =
            error as {
              message?:
                string;
            };

          setErrorMessage(
            pageError.message ||
              "Could not load newsletter data."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [router]
    );

  // ========================================================
  // SUBSCRIBER LIST
  // ========================================================

  const loadSubscribers =
    useCallback(
      async () => {
        if (
          !supabase ||
          !allowed
        ) {
          return;
        }

        setListLoading(
          true
        );

        setErrorMessage(
          ""
        );

        try {
          const offset =
            (page - 1) *
            PAGE_SIZE;

          const {
            data,
            error,
          } =
            await supabase.rpc(
              "get_newsletter_subscribers",
              {
                p_search:
                  search ||
                  null,

                p_limit:
                  PAGE_SIZE,

                p_offset:
                  offset,
              }
            );

          if (
            error
          ) {
            throw error;
          }

          setSubscribers(
            (
              data ??
              []
            ) as SubscriberRow[]
          );
        } catch (
          error
        ) {
          const listError =
            error as {
              message?:
                string;
            };

          setErrorMessage(
            listError.message ||
              "Could not load subscribers."
          );
        } finally {
          setListLoading(
            false
          );
        }
      },
      [
        allowed,
        page,
        search,
      ]
    );

  useEffect(() => {
    loadFoundation();
  }, [
    loadFoundation,
  ]);

  useEffect(() => {
    loadSubscribers();
  }, [
    loadSubscribers,
  ]);

  // ========================================================
  // SEARCH
  // ========================================================

  const handleSearch =
    (
      event:
        React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      setPage(
        1
      );

      setSearch(
        searchInput.trim()
      );
    };

  const clearSearch =
    () => {
      setSearchInput(
        ""
      );

      setSearch(
        ""
      );

      setPage(
        1
      );
    };

  const pageNumbers =
    useMemo(
      () => {
        const result: number[] =
          [];

        const start =
          Math.max(
            1,
            page - 2
          );

        const end =
          Math.min(
            totalPages,
            page + 2
          );

        for (
          let i = start;
          i <= end;
          i += 1
        ) {
          result.push(
            i
          );
        }

        return result;
      },
      [
        page,
        totalPages,
      ]
    );

  return (
    <>
      <Header />

      <main className="section-shell newsletter-admin-page">

        {/* =================================================
            HEADER
        ================================================= */}

        <section className="newsletter-admin-header">
          <div>
            <div className="eyebrow">
              AUDIENCE
              MANAGEMENT
            </div>

            <h1>
              Newsletter
            </h1>

            <p>
              See how many
              customers joined
              JIPLANCE updates and
              review subscriber
              activity.
            </p>
          </div>

          <Link
            href="/admin"
            className="newsletter-back-button"
          >
            ← Dashboard
          </Link>
        </section>

        {errorMessage && (
          <div className="newsletter-admin-error">
            {errorMessage}
          </div>
        )}

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <section className="newsletter-loading">
            <span />

            Loading newsletter
            dashboard...
          </section>
        ) : (
          <>
            {/* =============================================
                STATS
            ============================================= */}

            <section className="newsletter-stats-grid">
              <article>
                <span className="stat-label">
                  TOTAL JOINED
                </span>

                <strong>
                  {
                    stats.total
                  }
                </strong>

                <small>
                  All subscribers
                </small>
              </article>

              <article>
                <span className="stat-label">
                  ACTIVE
                </span>

                <strong>
                  {
                    stats.active
                  }
                </strong>

                <small>
                  Currently active
                </small>
              </article>

              <article>
                <span className="stat-label">
                  TODAY
                </span>

                <strong>
                  {
                    stats.joined_today
                  }
                </strong>

                <small>
                  Joined today
                </small>
              </article>

              <article>
                <span className="stat-label">
                  THIS MONTH
                </span>

                <strong>
                  {
                    stats.joined_this_month
                  }
                </strong>

                <small>
                  New this month
                </small>
              </article>
            </section>

            {/* =============================================
                LIST SECTION
            ============================================= */}

            <section className="subscriber-panel">

              <div className="subscriber-panel-heading">
                <div>
                  <div className="eyebrow">
                    SUBSCRIBERS
                  </div>

                  <h2>
                    JIPLANCE
                    audience
                  </h2>
                </div>

                <div className="subscriber-count">
                  {search
                    ? `${totalCount} result${
                        totalCount ===
                        1
                          ? ""
                          : "s"
                      }`
                    : `${stats.total} total`}
                </div>
              </div>

              {/* SEARCH */}

              <form
                className="newsletter-search"
                onSubmit={
                  handleSearch
                }
              >
                <input
                  type="email"
                  value={
                    searchInput
                  }
                  onChange={(e) =>
                    setSearchInput(
                      e.target.value
                    )
                  }
                  placeholder="Search subscriber email..."
                  aria-label="Search subscriber email"
                />

                <button
                  type="submit"
                  disabled={
                    listLoading
                  }
                >
                  Search
                </button>

                {search && (
                  <button
                    type="button"
                    className="clear-search"
                    onClick={
                      clearSearch
                    }
                  >
                    Clear
                  </button>
                )}
              </form>

              {/* TABLE */}

              <div className="subscriber-table-wrap">
                <table className="subscriber-table">
                  <thead>
                    <tr>
                      <th>
                        Email
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Source
                      </th>

                      <th>
                        Joined
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {listLoading ? (
                      <tr>
                        <td
                          colSpan={
                            4
                          }
                        >
                          <div className="table-loading">
                            <span />

                            Loading
                            subscribers...
                          </div>
                        </td>
                      </tr>
                    ) : subscribers.length ===
                      0 ? (
                      <tr>
                        <td
                          colSpan={
                            4
                          }
                        >
                          <div className="newsletter-empty">
                            <strong>
                              No subscribers
                              found
                            </strong>

                            <span>
                              {search
                                ? "Try a different email search."
                                : "New subscribers will appear here after joining JIPLANCE."}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      subscribers.map(
                        (
                          subscriber
                        ) => (
                          <tr
                            key={
                              subscriber.id
                            }
                          >
                            <td>
                              <div className="subscriber-email">
                                <span className="email-avatar">
                                  @
                                </span>

                                <strong>
                                  {
                                    subscriber.email
                                  }
                                </strong>
                              </div>
                            </td>

                            <td>
                              <span
                                className={`subscriber-status ${
                                  subscriber.is_active
                                    ? "active"
                                    : "inactive"
                                }`}
                              >
                                {subscriber.is_active
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>

                            <td>
                              <span className="subscriber-source">
                                {
                                  subscriber.source
                                }
                              </span>
                            </td>

                            <td>
                              <span className="subscriber-date">
                                {formatDate(
                                  subscriber.created_at
                                )}
                              </span>
                            </td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}

              {totalPages >
                1 && (
                <div className="newsletter-pagination">
                  <button
                    type="button"
                    disabled={
                      page <=
                        1 ||
                      listLoading
                    }
                    onClick={() =>
                      setPage(
                        (
                          current
                        ) =>
                          Math.max(
                            1,
                            current -
                              1
                          )
                      )
                    }
                  >
                    ← Previous
                  </button>

                  <div className="page-number-group">
                    {pageNumbers.map(
                      (
                        pageNumber
                      ) => (
                        <button
                          type="button"
                          key={
                            pageNumber
                          }
                          className={
                            pageNumber ===
                            page
                              ? "active"
                              : ""
                          }
                          onClick={() =>
                            setPage(
                              pageNumber
                            )
                          }
                          disabled={
                            listLoading
                          }
                        >
                          {
                            pageNumber
                          }
                        </button>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={
                      page >=
                        totalPages ||
                      listLoading
                    }
                    onClick={() =>
                      setPage(
                        (
                          current
                        ) =>
                          Math.min(
                            totalPages,
                            current +
                              1
                          )
                      )
                    }
                  >
                    Next →
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <Footer />

      <style jsx global>{`

        /* =====================================================
           PAGE
        ===================================================== */

        .newsletter-admin-page {
          padding-top:
            38px;

          padding-bottom:
            100px;
        }


        /* =====================================================
           HEADER
        ===================================================== */

        .newsletter-admin-header {
          display: flex;

          align-items:
            flex-end;

          justify-content:
            space-between;

          gap: 25px;

          margin-bottom:
            28px;
        }

        .newsletter-admin-header
        h1 {
          margin:
            7px 0 10px;

          color:
            #1f294d;

          font-size:
            clamp(
              2.8rem,
              6vw,
              5rem
            );

          line-height:
            0.95;

          letter-spacing:
            -0.06em;
        }

        .newsletter-admin-header
        p {
          max-width:
            620px;

          margin: 0;

          color:
            #7c8291;

          line-height:
            1.7;
        }

        .newsletter-back-button {
          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          min-height:
            46px;

          padding:
            0 17px;

          border:
            1px solid
            #dfe3ea;

          border-radius:
            14px;

          background:
            white;

          color:
            #4c566f;

          font-size:
            0.75rem;

          font-weight:
            800;

          text-decoration:
            none;

          transition:
            transform
              0.18s ease,
            box-shadow
              0.18s ease;
        }

        .newsletter-back-button:hover {
          transform:
            translateY(-2px);

          box-shadow:
            0 10px 24px
            rgba(
              29,
              39,
              72,
              0.07
            );
        }


        /* =====================================================
           ERROR
        ===================================================== */

        .newsletter-admin-error {
          margin-bottom:
            18px;

          padding:
            14px 16px;

          border-radius:
            13px;

          background:
            #fff0f0;

          color:
            #9c3c3c;

          font-size:
            0.76rem;

          font-weight:
            700;
        }


        /* =====================================================
           STATS
        ===================================================== */

        .newsletter-stats-grid {
          display: grid;

          grid-template-columns:
            repeat(
              4,
              minmax(
                0,
                1fr
              )
            );

          gap: 14px;

          margin-bottom:
            24px;
        }

        .newsletter-stats-grid
        article {
          position: relative;

          overflow: hidden;

          min-height:
            145px;

          padding:
            21px;

          border:
            1px solid
            #e5e8ee;

          border-radius:
            22px;

          background:
            linear-gradient(
              145deg,
              #ffffff,
              #f9fafc
            );

          box-shadow:
            0 12px 30px
            rgba(
              29,
              39,
              72,
              0.04
            );

          transition:
            transform
              0.2s ease,
            box-shadow
              0.2s ease;
        }

        .newsletter-stats-grid
        article::after {
          content: "";

          position: absolute;

          width:
            90px;

          height:
            90px;

          right:
            -35px;

          top:
            -35px;

          border-radius:
            50%;

          background:
            rgba(
              50,
              68,
              125,
              0.05
            );
        }

        .newsletter-stats-grid
        article:hover {
          transform:
            translateY(-3px);

          box-shadow:
            0 17px 37px
            rgba(
              29,
              39,
              72,
              0.075
            );
        }

        .stat-label {
          display: block;

          margin-bottom:
            12px;

          color:
            #9298a6;

          font-size:
            0.62rem;

          font-weight:
            900;

          letter-spacing:
            0.12em;
        }

        .newsletter-stats-grid
        strong {
          display: block;

          color:
            #273252;

          font-size:
            2.4rem;

          line-height: 1;
        }

        .newsletter-stats-grid
        small {
          display: block;

          margin-top:
            8px;

          color:
            #979caa;

          font-size:
            0.7rem;
        }


        /* =====================================================
           PANEL
        ===================================================== */

        .subscriber-panel {
          overflow: hidden;

          border:
            1px solid
            #e3e7ed;

          border-radius:
            24px;

          background:
            #ffffff;

          box-shadow:
            0 18px 50px
            rgba(
              30,
              39,
              70,
              0.045
            );
        }

        .subscriber-panel-heading {
          display: flex;

          align-items:
            flex-end;

          justify-content:
            space-between;

          gap: 20px;

          padding:
            24px;

          border-bottom:
            1px solid
            #edf0f4;
        }

        .subscriber-panel-heading
        h2 {
          margin:
            5px 0 0;

          color:
            #2c3551;

          font-size:
            1.65rem;
        }

        .subscriber-count {
          padding:
            8px 12px;

          border-radius:
            999px;

          background:
            #f1f3f8;

          color:
            #6c7489;

          font-size:
            0.68rem;

          font-weight:
            800;
        }


        /* =====================================================
           SEARCH
        ===================================================== */

        .newsletter-search {
          display: flex;

          gap: 9px;

          padding:
            17px 24px;

          border-bottom:
            1px solid
            #edf0f4;

          background:
            #fafbfc;
        }

        .newsletter-search
        input {
          flex: 1;

          min-width: 0;

          min-height:
            46px;

          padding:
            0 14px;

          border:
            1px solid
            #dce1e8;

          border-radius:
            12px;

          outline: none;

          background:
            white;

          color:
            #29314b;

          transition:
            border-color
              0.18s ease,
            box-shadow
              0.18s ease;
        }

        .newsletter-search
        input:focus {
          border-color:
            #7481aa;

          box-shadow:
            0 0 0 4px
            rgba(
              65,
              82,
              140,
              0.075
            );
        }

        .newsletter-search
        button {
          min-height:
            46px;

          padding:
            0 17px;

          border:
            0;

          border-radius:
            12px;

          background:
            #29375f;

          color:
            white;

          font-size:
            0.72rem;

          font-weight:
            800;

          cursor: pointer;
        }

        .newsletter-search
        button.clear-search {
          border:
            1px solid
            #dfe3ea;

          background:
            white;

          color:
            #687086;
        }


        /* =====================================================
           TABLE
        ===================================================== */

        .subscriber-table-wrap {
          overflow-x:
            auto;
        }

        .subscriber-table {
          width: 100%;

          border-collapse:
            collapse;

          min-width:
            760px;
        }

        .subscriber-table
        th {
          padding:
            13px 21px;

          border-bottom:
            1px solid
            #e8ebf0;

          background:
            #f8f9fb;

          color:
            #8e94a2;

          font-size:
            0.62rem;

          font-weight:
            900;

          letter-spacing:
            0.09em;

          text-align: left;

          text-transform:
            uppercase;
        }

        .subscriber-table
        td {
          padding:
            16px 21px;

          border-bottom:
            1px solid
            #eef0f4;

          color:
            #4f576d;

          font-size:
            0.75rem;
        }

        .subscriber-table
        tbody tr {
          transition:
            background
              0.18s ease;
        }

        .subscriber-table
        tbody tr:hover {
          background:
            #fbfcfd;
        }

        .subscriber-table
        tbody tr:last-child
        td {
          border-bottom:
            0;
        }

        .subscriber-email {
          display: flex;

          align-items:
            center;

          gap: 10px;
        }

        .email-avatar {
          display: grid;

          place-items:
            center;

          width: 35px;
          height: 35px;

          flex:
            0 0 auto;

          border-radius:
            11px;

          background:
            #edf1fa;

          color:
            #3d5187;

          font-size:
            0.8rem;

          font-weight:
            900;
        }

        .subscriber-email
        strong {
          color:
            #39435f;

          overflow-wrap:
            anywhere;
        }

        .subscriber-status {
          display:
            inline-flex;

          padding:
            6px 9px;

          border-radius:
            999px;

          font-size:
            0.62rem;

          font-weight:
            850;
        }

        .subscriber-status.active {
          background:
            #eaf7ef;

          color:
            #32744a;
        }

        .subscriber-status.inactive {
          background:
            #f0f1f3;

          color:
            #747a87;
        }

        .subscriber-source {
          text-transform:
            capitalize;
        }

        .subscriber-date {
          color:
            #747b8c;

          white-space:
            nowrap;
        }


        /* =====================================================
           LOADING + EMPTY
        ===================================================== */

        .newsletter-loading {
          display: flex;

          align-items:
            center;

          justify-content:
            center;

          gap: 10px;

          min-height:
            300px;

          border:
            1px dashed
            #dce1e8;

          border-radius:
            22px;

          color:
            #7e8596;
        }

        .newsletter-loading
        span,
        .table-loading
        span {
          width: 18px;
          height: 18px;

          border:
            2px solid
            #d9dde5;

          border-top-color:
            #29375f;

          border-radius:
            50%;

          animation:
            newsletterAdminSpin
            0.8s linear
            infinite;
        }

        .table-loading {
          display: flex;

          align-items:
            center;

          justify-content:
            center;

          gap: 9px;

          min-height:
            160px;

          color:
            #848a9a;
        }

        .newsletter-empty {
          display: grid;

          gap: 6px;

          place-items:
            center;

          min-height:
            180px;

          text-align:
            center;
        }

        .newsletter-empty
        strong {
          color:
            #424b64;
        }

        .newsletter-empty
        span {
          color:
            #8b91a0;
        }


        /* =====================================================
           PAGINATION
        ===================================================== */

        .newsletter-pagination {
          display: flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap: 12px;

          padding:
            17px 21px;

          border-top:
            1px solid
            #edf0f4;

          background:
            #fafbfc;
        }

        .newsletter-pagination
        button {
          min-height:
            38px;

          padding:
            0 12px;

          border:
            1px solid
            #dde2e9;

          border-radius:
            10px;

          background:
            white;

          color:
            #626a7e;

          font-size:
            0.68rem;

          font-weight:
            780;

          cursor: pointer;
        }

        .newsletter-pagination
        button:disabled {
          opacity: 0.4;

          cursor:
            not-allowed;
        }

        .page-number-group {
          display: flex;

          gap: 5px;
        }

        .page-number-group
        button {
          min-width:
            38px;

          padding: 0;
        }

        .page-number-group
        button.active {
          border-color:
            #29375f;

          background:
            #29375f;

          color:
            white;
        }


        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (
          max-width: 900px
        ) {
          .newsletter-admin-header {
            align-items:
              flex-start;

            flex-direction:
              column;
          }

          .newsletter-stats-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              );
          }
        }

        @media (
          max-width: 620px
        ) {
          .newsletter-stats-grid {
            grid-template-columns:
              1fr;
          }

          .subscriber-panel-heading {
            align-items:
              flex-start;

            flex-direction:
              column;
          }

          .newsletter-search {
            flex-direction:
              column;
          }

          .newsletter-search
          button {
            width: 100%;
          }

          .newsletter-pagination {
            align-items:
              stretch;

            flex-direction:
              column;
          }

          .page-number-group {
            justify-content:
              center;
          }
        }


        /* =====================================================
           ANIMATION
        ===================================================== */

        @keyframes newsletterAdminSpin {
          to {
            transform:
              rotate(360deg);
          }
        }

        @media (
          prefers-reduced-motion:
          reduce
        ) {
          .newsletter-loading
          span,
          .table-loading
          span {
            animation:
              none;
          }

          .newsletter-stats-grid
          article,
          .newsletter-back-button {
            transition:
              none;
          }
        }
      `}</style>
    </>
  );
}