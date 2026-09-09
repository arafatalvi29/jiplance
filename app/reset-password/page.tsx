"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    checkingSession,
    setCheckingSession,
  ] = useState(true);

  const [
    recoveryReady,
    setRecoveryReady,
  ] = useState(false);

  const [
    success,
    setSuccess,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  useEffect(() => {
    if (!supabase) {
      setMessage(
        "Password recovery is currently unavailable."
      );

      setCheckingSession(
        false
      );

      return;
    }

    const supabaseClient =
      supabase;

    let mounted = true;

    const checkRecoverySession =
      async () => {
        const {
          data: {
            session,
          },
          error,
        } =
          await supabaseClient.auth.getSession();

        if (!mounted) {
          return;
        }

        if (error) {
          console.error(
            "Recovery session error:",
            error.message
          );

          setRecoveryReady(
            false
          );

          setMessage(
            "We could not verify this recovery link. Please request a new password reset email."
          );

          setCheckingSession(
            false
          );

          return;
        }

        if (session) {
          setRecoveryReady(
            true
          );

          setMessage(
            ""
          );

          setCheckingSession(
            false
          );

          return;
        }

        window.setTimeout(
          async () => {
            const {
              data: {
                session:
                  delayedSession,
              },
              error:
                delayedError,
            } =
              await supabaseClient.auth.getSession();

            if (!mounted) {
              return;
            }

            if (
              delayedError
            ) {
              console.error(
                "Delayed recovery session error:",
                delayedError.message
              );
            }

            if (
              delayedSession
            ) {
              setRecoveryReady(
                true
              );

              setMessage(
                ""
              );
            } else {
              setRecoveryReady(
                false
              );

              setMessage(
                "This password recovery link is invalid or has expired. Please request a new recovery email."
              );
            }

            setCheckingSession(
              false
            );
          },
          700
        );
      };

    void checkRecoverySession();

    const {
      data: {
        subscription,
      },
    } =
      supabaseClient.auth.onAuthStateChange(
        (
          event,
          session
        ) => {
          if (!mounted) {
            return;
          }

          if (
            event ===
              "PASSWORD_RECOVERY" ||
            session
          ) {
            setRecoveryReady(
              true
            );

            setMessage(
              ""
            );

            setCheckingSession(
              false
            );
          }
        }
      );

    return () => {
      mounted = false;

      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (!supabase) {
        setMessage(
          "Password recovery is currently unavailable."
        );

        return;
      }

      if (
        !recoveryReady
      ) {
        setMessage(
          "Your recovery session is not valid. Please request a new password reset email."
        );

        return;
      }

      if (
        password.length <
        6
      ) {
        setMessage(
          "Your new password must contain at least 6 characters."
        );

        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        setMessage(
          "The passwords do not match."
        );

        return;
      }

      setLoading(
        true
      );

      setMessage(
        ""
      );

      const {
        error,
      } =
        await supabase.auth.updateUser(
          {
            password,
          }
        );

      setLoading(
        false
      );

      if (error) {
        console.error(
          "Password update error:",
          error.message
        );

        setMessage(
          "We could not update your password. The recovery link may have expired. Please request a new one and try again."
        );

        return;
      }

      setPassword(
        ""
      );

      setConfirmPassword(
        ""
      );

      setSuccess(
        true
      );

      setMessage(
        "Your password has been updated successfully."
      );
    };

  return (
    <>
      <Header />

      <main className="reset-page">
        <section className="reset-card">
          <div className="reset-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path d="M7 10V7.5a5 5 0 0 1 10 0V10" />

              <rect
                x="4"
                y="10"
                width="16"
                height="10"
                rx="3"
              />

              <path d="M12 14v2.5" />
            </svg>
          </div>

          <div className="reset-eyebrow">
            SECURE PASSWORD
          </div>

          <h1>
            Set a new password.
          </h1>

          <p className="reset-intro">
            Choose a new password
            for your JIPLANCE
            account. Make sure it
            is different from your
            previous password.
          </p>

          {checkingSession ? (
            <div className="reset-checking">
              <span className="reset-spinner" />

              <div>
                <strong>
                  Verifying recovery
                  link
                </strong>

                <small>
                  Please wait a
                  moment...
                </small>
              </div>
            </div>
          ) : success ? (
            <div className="reset-success-panel">
              <div className="success-mark">
                ✓
              </div>

              <h2>
                Password updated
              </h2>

              <p>
                {message}
              </p>

              <Link
                href="/account"
                className="reset-primary-link"
              >
                Go to Account

                <span>
                  →
                </span>
              </Link>
            </div>
          ) : recoveryReady ? (
            <form
              className="reset-form"
              onSubmit={
                handleSubmit
              }
            >
              <label>
                <span>
                  New password
                </span>

                <input
                  type="password"
                  value={
                    password
                  }
                  onChange={(
                    event
                  ) => {
                    setPassword(
                      event.target
                        .value
                    );

                    if (
                      message
                    ) {
                      setMessage(
                        ""
                      );
                    }
                  }}
                  placeholder="Minimum 6 characters"
                  minLength={
                    6
                  }
                  autoComplete="new-password"
                  required
                />
              </label>

              <label>
                <span>
                  Confirm new password
                </span>

                <input
                  type="password"
                  value={
                    confirmPassword
                  }
                  onChange={(
                    event
                  ) => {
                    setConfirmPassword(
                      event.target
                        .value
                    );

                    if (
                      message
                    ) {
                      setMessage(
                        ""
                      );
                    }
                  }}
                  placeholder="Enter password again"
                  minLength={
                    6
                  }
                  autoComplete="new-password"
                  required
                />
              </label>

              {message && (
                <div
                  className="reset-message"
                  role="status"
                >
                  <span>
                    !
                  </span>

                  <p>
                    {message}
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="reset-submit"
                disabled={
                  loading
                }
              >
                {loading ? (
                  <>
                    <span className="reset-spinner button-spinner" />

                    Updating password...
                  </>
                ) : (
                  <>
                    Update Password

                    <span className="reset-arrow">
                      →
                    </span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="reset-invalid">
              <div className="invalid-mark">
                !
              </div>

              <h2>
                Recovery link unavailable
              </h2>

              <p>
                {message ||
                  "This recovery link cannot be used."}
              </p>

              <Link
                href="/forgot-password"
                className="reset-primary-link"
              >
                Request New Link

                <span>
                  →
                </span>
              </Link>

              <Link
                href="/account"
                className="reset-secondary-link"
              >
                Back to Sign In
              </Link>
            </div>
          )}

          {!success &&
            recoveryReady &&
            !checkingSession && (
              <div className="reset-security-note">
                <span>
                  ✓
                </span>

                <p>
                  Your password is
                  updated securely
                  through JIPLANCE
                  account recovery.
                </p>
              </div>
            )}
        </section>
      </main>

      <Footer />

      <style jsx global>{`
        .reset-page {
          width:
            min(
              1180px,
              calc(
                100% - 32px
              )
            );

          min-height:
            650px;

          margin:
            0 auto;

          padding:
            72px 0 96px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;
        }

        .reset-card {
          width:
            min(
              580px,
              100%
            );

          padding:
            clamp(
              30px,
              6vw,
              54px
            );

          border:
            1px solid
            rgba(
              128,
              128,
              128,
              0.2
            );

          border-radius:
            30px;

          background:
            radial-gradient(
              circle
              at
              90%
              5%,
              rgba(
                74,
                96,
                163,
                0.13
              ),
              transparent
                36%
            );

          box-shadow:
            0 24px 70px
            rgba(
              30,
              40,
              70,
              0.065
            );

          animation:
            resetFadeUp
            0.5s ease
            both;
        }

        .reset-icon {
          width:
            58px;

          height:
            58px;

          margin-bottom:
            24px;

          display:
            grid;

          place-items:
            center;

          border:
            1px solid
            rgba(
              38,
              51,
              91,
              0.14
            );

          border-radius:
            18px;

          color:
            #26345d;

          background:
            linear-gradient(
              145deg,
              #ffffff,
              #eef2fa
            );

          box-shadow:
            0 12px 26px
            rgba(
              35,
              48,
              86,
              0.09
            );
        }

        .reset-icon svg {
          width:
            26px;

          height:
            26px;

          stroke:
            currentColor;

          stroke-width:
            1.7;

          stroke-linecap:
            round;

          stroke-linejoin:
            round;
        }

        .reset-eyebrow {
          font-size:
            11px;

          font-weight:
            850;

          letter-spacing:
            0.19em;

          opacity:
            0.58;
        }

        .reset-card h1 {
          margin:
            10px 0 14px;

          font-size:
            clamp(
              36px,
              6vw,
              52px
            );

          line-height:
            1.03;

          letter-spacing:
            -0.035em;
        }

        .reset-intro {
          margin:
            0;

          max-width:
            490px;

          line-height:
            1.7;

          opacity:
            0.68;
        }

        .reset-form {
          display:
            grid;

          gap:
            18px;

          margin-top:
            30px;
        }

        .reset-form label {
          display:
            grid;

          gap:
            8px;
        }

        .reset-form label > span {
          font-size:
            13px;

          font-weight:
            750;
        }

        .reset-form input {
          width:
            100%;

          min-height:
            56px;

          padding:
            0 16px;

          border:
            1px solid
            rgba(
              128,
              128,
              128,
              0.3
            );

          border-radius:
            15px;

          background:
            transparent;

          color:
            inherit;

          font:
            inherit;

          outline:
            none;

          transition:
            border-color
              0.18s ease,
            box-shadow
              0.18s ease,
            transform
              0.18s ease;
        }

        .reset-form input:focus {
          border-color:
            #2b3a68;

          box-shadow:
            0 0 0 3px
            rgba(
              43,
              58,
              104,
              0.1
            );

          transform:
            translateY(
              -1px
            );
        }

        .reset-submit,
        .reset-primary-link {
          min-height:
            56px;

          border:
            0;

          border-radius:
            15px;

          background:
            #1f294d;

          color:
            #ffffff;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            11px;

          font:
            inherit;

          font-weight:
            800;

          text-decoration:
            none;

          cursor:
            pointer;

          transition:
            transform
              0.18s ease,
            box-shadow
              0.18s ease,
            opacity
              0.18s ease;
        }

        .reset-submit:hover:not(
          :disabled
        ),
        .reset-primary-link:hover {
          transform:
            translateY(
              -2px
            );

          box-shadow:
            0 15px 36px
            rgba(
              31,
              41,
              77,
              0.2
            );
        }

        .reset-submit:active:not(
          :disabled
        ),
        .reset-primary-link:active {
          transform:
            scale(
              0.985
            );
        }

        .reset-submit:disabled {
          cursor:
            wait;

          opacity:
            0.7;
        }

        .reset-arrow {
          font-size:
            18px;

          transition:
            transform
              0.18s ease;
        }

        .reset-submit:hover
          .reset-arrow {
          transform:
            translateX(
              5px
            );
        }

        .reset-message {
          display:
            flex;

          align-items:
            flex-start;

          gap:
            10px;

          padding:
            14px;

          border:
            1px solid
            rgba(
              239,
              68,
              68,
              0.18
            );

          border-radius:
            14px;

          background:
            rgba(
              239,
              68,
              68,
              0.07
            );
        }

        .reset-message > span {
          width:
            22px;

          height:
            22px;

          flex:
            0 0 22px;

          display:
            grid;

          place-items:
            center;

          border:
            1px solid
            currentColor;

          border-radius:
            50%;

          font-size:
            11px;

          font-weight:
            850;
        }

        .reset-message p {
          margin:
            0;

          font-size:
            13px;

          line-height:
            1.55;
        }

        .reset-checking {
          margin-top:
            30px;

          padding:
            20px;

          display:
            flex;

          align-items:
            center;

          gap:
            14px;

          border:
            1px solid
            rgba(
              128,
              128,
              128,
              0.18
            );

          border-radius:
            16px;

          background:
            rgba(
              128,
              128,
              128,
              0.055
            );
        }

        .reset-checking > div {
          display:
            flex;

          flex-direction:
            column;

          gap:
            4px;
        }

        .reset-checking small {
          opacity:
            0.6;
        }

        .reset-spinner {
          width:
            22px;

          height:
            22px;

          flex:
            0 0 22px;

          border:
            2px solid
            rgba(
              43,
              58,
              104,
              0.18
            );

          border-top-color:
            #2b3a68;

          border-radius:
            50%;

          animation:
            resetSpin
            0.7s linear
            infinite;
        }

        .button-spinner {
          width:
            18px;

          height:
            18px;

          flex-basis:
            18px;

          border-color:
            rgba(
              255,
              255,
              255,
              0.35
            );

          border-top-color:
            #ffffff;
        }

        .reset-success-panel,
        .reset-invalid {
          margin-top:
            30px;

          padding:
            26px;

          border:
            1px solid
            rgba(
              128,
              128,
              128,
              0.18
            );

          border-radius:
            20px;

          text-align:
            center;

          background:
            rgba(
              128,
              128,
              128,
              0.045
            );

          animation:
            resetFadeUp
            0.4s ease
            both;
        }

        .success-mark,
        .invalid-mark {
          width:
            54px;

          height:
            54px;

          margin:
            0 auto 16px;

          display:
            grid;

          place-items:
            center;

          border-radius:
            50%;

          font-size:
            22px;

          font-weight:
            900;
        }

        .success-mark {
          border:
            1px solid
            rgba(
              34,
              197,
              94,
              0.32
            );

          background:
            rgba(
              34,
              197,
              94,
              0.09
            );
        }

        .invalid-mark {
          border:
            1px solid
            rgba(
              239,
              68,
              68,
              0.28
            );

          background:
            rgba(
              239,
              68,
              68,
              0.08
            );
        }

        .reset-success-panel h2,
        .reset-invalid h2 {
          margin:
            0 0 9px;

          font-size:
            26px;
        }

        .reset-success-panel p,
        .reset-invalid p {
          margin:
            0 auto 22px;

          max-width:
            430px;

          line-height:
            1.6;

          opacity:
            0.67;
        }

        .reset-primary-link {
          width:
            100%;
        }

        .reset-secondary-link {
          display:
            inline-block;

          margin-top:
            17px;

          color:
            inherit;

          font-size:
            13px;

          font-weight:
            750;

          text-decoration:
            none;

          opacity:
            0.68;

          transition:
            opacity
              0.18s ease;
        }

        .reset-secondary-link:hover {
          opacity:
            1;

          text-decoration:
            underline;

          text-underline-offset:
            3px;
        }

        .reset-security-note {
          margin-top:
            22px;

          padding:
            14px;

          display:
            flex;

          align-items:
            flex-start;

          gap:
            9px;

          border-radius:
            14px;

          background:
            rgba(
              128,
              128,
              128,
              0.055
            );
        }

        .reset-security-note > span {
          width:
            23px;

          height:
            23px;

          flex:
            0 0 23px;

          display:
            grid;

          place-items:
            center;

          border:
            1px solid
            rgba(
              128,
              128,
              128,
              0.35
            );

          border-radius:
            50%;

          font-size:
            10px;
        }

        .reset-security-note p {
          margin:
            0;

          font-size:
            11px;

          line-height:
            1.55;

          opacity:
            0.6;
        }

        @keyframes resetFadeUp {
          from {
            opacity:
              0;

            transform:
              translateY(
                16px
              );
          }

          to {
            opacity:
              1;

            transform:
              translateY(
                0
              );
          }
        }

        @keyframes resetSpin {
          to {
            transform:
              rotate(
                360deg
              );
          }
        }

        @media (
          max-width:
            600px
        ) {
          .reset-page {
            width:
              min(
                100% - 22px,
                1180px
              );

            min-height:
              auto;

            padding:
              40px 0 64px;
          }

          .reset-card {
            padding:
              28px 22px;

            border-radius:
              23px;
          }

          .reset-card h1 {
            font-size:
              38px;
          }
        }

        @media (
          prefers-reduced-motion:
            reduce
        ) {
          .reset-card,
          .reset-success-panel,
          .reset-invalid,
          .reset-submit,
          .reset-primary-link,
          .reset-form input {
            animation:
              none;

            transition:
              none;
          }
        }
      `}</style>
    </>
  );
}