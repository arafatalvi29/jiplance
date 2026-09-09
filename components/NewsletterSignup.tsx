"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  supabase,
} from "@/lib/supabase";

import {
  useLanguage,
} from "@/components/LanguageProvider";

type NewsletterSignupProps = {
  tagline: string;
};

type SubmitStatus =
  | "idle"
  | "loading"
  | "success"
  | "error";

export default function NewsletterSignup({
  tagline,
}: NewsletterSignupProps) {
  const {
    lang,
  } =
    useLanguage();

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    status,
    setStatus,
  ] =
    useState<SubmitStatus>(
      "idle"
    );

  const [
    message,
    setMessage,
  ] =
    useState("");

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (
        status ===
        "loading"
      ) {
        return;
      }

      setMessage("");

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      if (
        !normalizedEmail
      ) {
        setStatus(
          "error"
        );

        setMessage(
          lang === "en"
            ? "Please enter your email address."
            : "আপনার ইমেইল ঠিকানা লিখুন।"
        );

        return;
      }

      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailPattern.test(
          normalizedEmail
        )
      ) {
        setStatus(
          "error"
        );

        setMessage(
          lang === "en"
            ? "Please enter a valid email address."
            : "সঠিক ইমেইল ঠিকানা লিখুন।"
        );

        return;
      }

      if (!supabase) {
        setStatus(
          "error"
        );

        setMessage(
          lang === "en"
            ? "Newsletter service is temporarily unavailable."
            : "নিউজলেটার সেবা সাময়িকভাবে পাওয়া যাচ্ছে না।"
        );

        return;
      }

      setStatus(
        "loading"
      );

      try {
        const {
          error,
        } =
          await supabase
            .from(
              "newsletter_subscribers"
            )
            .insert({
              email:
                normalizedEmail,

              is_active:
                true,

              source:
                "website",
            });

        if (error) {
          if (
            error.code ===
            "23505"
          ) {
            setStatus(
              "success"
            );

            setMessage(
              lang === "en"
                ? "You're already part of JIPLANCE!"
                : "আপনি ইতোমধ্যেই JIPLANCE-এর সঙ্গে যুক্ত আছেন!"
            );

            return;
          }

          throw error;
        }

        setStatus(
          "success"
        );

        setMessage(
          lang === "en"
            ? "You're in! Welcome to JIPLANCE."
            : "স্বাগতম! আপনি এখন JIPLANCE-এর সঙ্গে যুক্ত।"
        );

        setEmail("");
      } catch (
        error
      ) {
        console.error(
          "Newsletter signup error:",
          error
        );

        setStatus(
          "error"
        );

        setMessage(
          lang === "en"
            ? "Could not join right now. Please try again."
            : "এই মুহূর্তে যুক্ত হওয়া যাচ্ছে না। আবার চেষ্টা করুন।"
        );
      }
    };

  return (
    <section className="section-shell newsletter">
      <div className="newsletter-copy">
        <div className="eyebrow">
          {lang === "en"
            ? "STAY IN THE LOOP"
            : "JIPLANCE-এর সঙ্গে থাকুন"}
        </div>

        <h2>
          {lang === "en"
            ? tagline
            : "বড় হয়ে ওঠা মন, আনন্দময় শৈশব।"}
        </h2>

        <p className="newsletter-subtext">
          {lang === "en"
            ? "New books, fashion drops, offers and JIPLANCE updates — straight to your inbox."
            : "নতুন বই, ফ্যাশন কালেকশন, অফার এবং JIPLANCE-এর আপডেট সরাসরি আপনার ইমেইলে পান।"}
        </p>
      </div>

      <div className="newsletter-action-area">
        <form
          onSubmit={
            handleSubmit
          }
          noValidate
        >
          <input
            type="email"
            value={email}
            onChange={(
              event
            ) => {
              setEmail(
                event.target.value
              );

              if (
                status ===
                "error"
              ) {
                setStatus(
                  "idle"
                );

                setMessage("");
              }
            }}
            placeholder={
              lang === "en"
                ? "Your email address"
                : "আপনার ইমেইল ঠিকানা"
            }
            aria-label={
              lang === "en"
                ? "Email"
                : "ইমেইল"
            }
            autoComplete="email"
            maxLength={254}
            disabled={
              status ===
              "loading"
            }
          />

          <button
            type="submit"
            className={`primary-button newsletter-submit-button ${
              status ===
              "success"
                ? "success"
                : ""
            }`}
            disabled={
              status ===
              "loading"
            }
          >
            {status ===
            "loading" ? (
              <>
                <span className="newsletter-spinner" />

                {lang === "en"
                  ? "Joining..."
                  : "যুক্ত হচ্ছে..."}
              </>
            ) : status ===
              "success" ? (
              <>
                <span>
                  ✓
                </span>

                {lang === "en"
                  ? "Joined"
                  : "যুক্ত হয়েছে"}
              </>
            ) : (
              lang === "en"
                ? "Join JIPLANCE"
                : "JIPLANCE-এ যুক্ত হোন"
            )}
          </button>
        </form>

        {message && (
          <div
            className={`newsletter-message ${status}`}
            role={
              status ===
              "error"
                ? "alert"
                : "status"
            }
            aria-live="polite"
          >
            {status ===
              "success" && (
              <span className="newsletter-success-icon">
                ✓
              </span>
            )}

            <span>
              {message}
            </span>
          </div>
        )}
      </div>

      <style jsx>{`
        .newsletter-copy {
          min-width: 0;
        }

        .newsletter-subtext {
          max-width: 510px;

          margin:
            12px 0 0;

          color:
            rgba(
              29,
              39,
              73,
              0.68
            );

          font-size:
            0.82rem;

          line-height: 1.6;
        }

        .newsletter-action-area {
          min-width: 0;
        }

        .newsletter-action-area
        form {
          position: relative;

          display: flex;

          align-items: stretch;

          gap: 10px;
        }

        .newsletter-action-area
        input {
          min-width: 0;
        }

        .newsletter-submit-button {
          position: relative;

          display: inline-flex;

          align-items: center;

          justify-content: center;

          gap: 8px;

          overflow: hidden;

          min-width: 142px;

          transition:
            transform
              0.2s ease,
            box-shadow
              0.2s ease,
            background
              0.25s ease;
        }

        .newsletter-submit-button::before {
          content: "";

          position: absolute;

          top: -130%;
          left: -45%;

          width: 28%;
          height: 360%;

          transform:
            rotate(22deg);

          background:
            rgba(
              255,
              255,
              255,
              0.35
            );

          transition:
            left
              0.6s ease;
        }

        .newsletter-submit-button:hover:not(
          :disabled
        ) {
          transform:
            translateY(-2px);

          box-shadow:
            0 12px 25px
            rgba(
              25,
              35,
              72,
              0.18
            );
        }

        .newsletter-submit-button:hover:not(
          :disabled
        )::before {
          left: 125%;
        }

        .newsletter-submit-button.success {
          background:
            #244f3a;

          color: white;
        }

        .newsletter-submit-button:disabled {
          cursor: wait;

          opacity: 0.82;
        }

        .newsletter-spinner {
          width: 15px;
          height: 15px;

          border:
            2px solid
            rgba(
              255,
              255,
              255,
              0.4
            );

          border-top-color:
            #ffffff;

          border-radius: 50%;

          animation:
            newsletterSpin
            0.75s linear
            infinite;
        }

        .newsletter-message {
          display: flex;

          align-items: center;

          gap: 7px;

          margin-top: 10px;

          padding:
            9px 12px;

          border-radius: 11px;

          font-size:
            0.72rem;

          font-weight: 700;

          line-height: 1.45;

          animation:
            newsletterMessageIn
            0.28s ease both;
        }

        .newsletter-message.success {
          background:
            rgba(
              32,
              105,
              71,
              0.1
            );

          color:
            #245c40;
        }

        .newsletter-message.error {
          background:
            rgba(
              159,
              55,
              55,
              0.09
            );

          color:
            #973b3b;
        }

        .newsletter-success-icon {
          display: grid;

          place-items: center;

          width: 21px;
          height: 21px;

          flex: 0 0 auto;

          border-radius: 50%;

          background:
            #2f714d;

          color: white;

          font-size:
            0.67rem;

          animation:
            newsletterSuccessPop
            0.36s
            cubic-bezier(
              0.2,
              0.8,
              0.2,
              1
            )
            both;
        }

        @keyframes newsletterSpin {
          to {
            transform:
              rotate(360deg);
          }
        }

        @keyframes newsletterMessageIn {
          from {
            opacity: 0;

            transform:
              translateY(-5px);
          }

          to {
            opacity: 1;

            transform:
              translateY(0);
          }
        }

        @keyframes newsletterSuccessPop {
          0% {
            transform:
              scale(0.5);
          }

          70% {
            transform:
              scale(1.15);
          }

          100% {
            transform:
              scale(1);
          }
        }

        @media (
          max-width: 700px
        ) {
          .newsletter-action-area
          form {
            flex-direction:
              column;
          }

          .newsletter-submit-button {
            width: 100%;

            min-height: 52px;
          }
        }

        @media (
          prefers-reduced-motion:
          reduce
        ) {
          .newsletter-submit-button,
          .newsletter-message,
          .newsletter-success-icon,
          .newsletter-spinner {
            animation: none;

            transition: none;
          }
        }
      `}</style>
    </section>
  );
}