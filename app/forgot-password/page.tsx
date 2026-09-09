"use client";

import Link from "next/link";
import {
  FormEvent,
  useState,
} from "react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [
    email,
    setEmail,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!supabase) {
      setMessage(
        "Password recovery is currently unavailable."
      );

      return;
    }

    const cleanEmail =
      email.trim();

    if (!cleanEmail) {
      setMessage(
        "Please enter your email address."
      );

      return;
    }

    setLoading(true);
    setMessage("");
    setSuccess(false);

    const redirectTo =
      `${window.location.origin}/reset-password`;

    const {
      error,
    } =
      await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        {
          redirectTo,
        }
      );

    setLoading(false);

    if (error) {
      console.error(
        "Password reset email error:",
        error.message
      );

      setMessage(
        "We could not send the recovery email right now. Please try again shortly."
      );

      return;
    }

    /*
      Generic success wording is intentional.
      It does not reveal whether an email
      address exists in the system.
    */
    setSuccess(true);

    setMessage(
      "If an account exists for this email, a password recovery link has been sent. Please check your inbox and spam folder."
    );
  };

  return (
    <>
      <Header />

      <main className="forgot-page">
        <section className="forgot-card">
          <div className="forgot-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="4"
                y="10"
                width="16"
                height="10"
                rx="3"
              />

              <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />

              <path d="M12 14v2.5" />
            </svg>
          </div>

          <div className="forgot-eyebrow">
            JIPLANCE ACCOUNT
          </div>

          <h1>
            Forgot your password?
          </h1>

          <p className="forgot-intro">
            Enter the email address
            connected to your JIPLANCE
            account. We&apos;ll send you
            a secure password recovery
            link.
          </p>

          <form
            className="forgot-form"
            onSubmit={
              handleSubmit
            }
          >
            <label>
              <span>
                Email address
              </span>

              <input
                type="email"
                value={
                  email
                }
                onChange={(
                  event
                ) => {
                  setEmail(
                    event.target.value
                  );

                  if (message) {
                    setMessage("");
                    setSuccess(false);
                  }
                }}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            {message && (
              <div
                className={`forgot-message ${
                  success
                    ? "success"
                    : "error"
                }`}
                role="status"
              >
                <span className="message-icon">
                  {success
                    ? "✓"
                    : "!"}
                </span>

                <p>
                  {message}
                </p>
              </div>
            )}

            <button
              type="submit"
              className="forgot-submit"
              disabled={
                loading
              }
            >
              {loading ? (
                <>
                  <span className="forgot-spinner" />

                  Sending recovery link...
                </>
              ) : (
                <>
                  Send Recovery Link

                  <span className="forgot-arrow">
                    →
                  </span>
                </>
              )}
            </button>
          </form>

          <div className="forgot-security-note">
            <span>
              ✓
            </span>

            <p>
              For your security, we
              don&apos;t reveal whether
              an email address is
              registered with JIPLANCE.
            </p>
          </div>

          <Link
            href="/account"
            className="back-login"
          >
            <span>
              ←
            </span>

            Back to Sign In
          </Link>
        </section>
      </main>

      <Footer />

      <style jsx global>{`
        .forgot-page {
          width:
            min(
              1180px,
              calc(
                100% - 32px
              )
            );

          min-height:
            620px;

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

        .forgot-card {
          position:
            relative;

          width:
            min(
              560px,
              100%
            );

          padding:
            clamp(
              30px,
              6vw,
              52px
            );

          overflow:
            hidden;

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
                77,
                98,
                161,
                0.12
              ),
              transparent
                35%
            );

          box-shadow:
            0 24px 70px
            rgba(
              30,
              40,
              70,
              0.06
            );

          animation:
            forgotFadeUp
            0.5s ease
            both;
        }

        .forgot-icon {
          width:
            58px;

          height:
            58px;

          margin-bottom:
            24px;

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

          display:
            grid;

          place-items:
            center;

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

        .forgot-icon svg {
          width:
            25px;

          height:
            25px;

          stroke:
            currentColor;

          stroke-width:
            1.7;

          stroke-linecap:
            round;

          stroke-linejoin:
            round;
        }

        .forgot-eyebrow {
          font-size:
            11px;

          font-weight:
            850;

          letter-spacing:
            0.19em;

          opacity:
            0.58;
        }

        .forgot-card h1 {
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

        .forgot-intro {
          margin:
            0;

          max-width:
            470px;

          line-height:
            1.7;

          opacity:
            0.68;
        }

        .forgot-form {
          display:
            grid;

          gap:
            18px;

          margin-top:
            30px;
        }

        .forgot-form label {
          display:
            grid;

          gap:
            8px;
        }

        .forgot-form label > span {
          font-size:
            13px;

          font-weight:
            750;
        }

        .forgot-form input {
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

        .forgot-form input:focus {
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

        .forgot-submit {
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

        .forgot-submit:hover:not(
          :disabled
        ) {
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

        .forgot-submit:active:not(
          :disabled
        ) {
          transform:
            scale(
              0.985
            );
        }

        .forgot-submit:disabled {
          cursor:
            wait;

          opacity:
            0.7;
        }

        .forgot-arrow {
          font-size:
            18px;

          transition:
            transform
              0.18s ease;
        }

        .forgot-submit:hover
          .forgot-arrow {
          transform:
            translateX(
              5px
            );
        }

        .forgot-spinner {
          width:
            18px;

          height:
            18px;

          border:
            2px solid
            rgba(
              255,
              255,
              255,
              0.35
            );

          border-top-color:
            #ffffff;

          border-radius:
            50%;

          animation:
            forgotSpin
            0.7s linear
            infinite;
        }

        .forgot-message {
          display:
            flex;

          align-items:
            flex-start;

          gap:
            10px;

          padding:
            14px;

          border-radius:
            14px;

          border:
            1px solid
            rgba(
              128,
              128,
              128,
              0.2
            );
        }

        .forgot-message.success {
          background:
            rgba(
              34,
              197,
              94,
              0.08
            );

          border-color:
            rgba(
              34,
              197,
              94,
              0.2
            );
        }

        .forgot-message.error {
          background:
            rgba(
              239,
              68,
              68,
              0.07
            );

          border-color:
            rgba(
              239,
              68,
              68,
              0.18
            );
        }

        .message-icon {
          width:
            22px;

          height:
            22px;

          flex:
            0 0 22px;

          border:
            1px solid
            currentColor;

          border-radius:
            50%;

          display:
            grid;

          place-items:
            center;

          font-size:
            11px;

          font-weight:
            850;
        }

        .forgot-message p {
          margin:
            0;

          font-size:
            13px;

          line-height:
            1.55;
        }

        .forgot-security-note {
          display:
            flex;

          align-items:
            flex-start;

          gap:
            9px;

          margin-top:
            22px;

          padding:
            14px;

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

        .forgot-security-note > span {
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

        .forgot-security-note p {
          margin:
            0;

          font-size:
            11px;

          line-height:
            1.55;

          opacity:
            0.6;
        }

        .back-login {
          display:
            inline-flex;

          align-items:
            center;

          gap:
            8px;

          margin-top:
            24px;

          color:
            inherit;

          font-size:
            13px;

          font-weight:
            750;

          text-decoration:
            none;

          opacity:
            0.7;

          transition:
            opacity
              0.18s ease,
            transform
              0.18s ease;
        }

        .back-login:hover {
          opacity:
            1;

          transform:
            translateX(
              -3px
            );
        }

        @keyframes forgotFadeUp {
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

        @keyframes forgotSpin {
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
          .forgot-page {
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

          .forgot-card {
            padding:
              28px 22px;

            border-radius:
              23px;
          }

          .forgot-card h1 {
            font-size:
              38px;
          }
        }

        @media (
          prefers-reduced-motion:
            reduce
        ) {
          .forgot-card,
          .forgot-submit,
          .forgot-arrow,
          .back-login,
          .forgot-form input {
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