"use client";

import {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

type PaymentSettings = {
  id: number;

  bkash_enabled: boolean;
  bkash_number: string | null;
  bkash_account_type: string | null;

  nagad_enabled: boolean;
  nagad_number: string | null;
  nagad_account_type: string | null;

  bank_enabled: boolean;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_branch: string | null;
  bank_routing_number: string | null;
};

export default function PaymentSettingsPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [
    bkashEnabled,
    setBkashEnabled,
  ] = useState(true);

  const [
    bkashNumber,
    setBkashNumber,
  ] = useState("");

  const [
    bkashAccountType,
    setBkashAccountType,
  ] = useState("Personal");

  const [
    nagadEnabled,
    setNagadEnabled,
  ] = useState(false);

  const [
    nagadNumber,
    setNagadNumber,
  ] = useState("");

  const [
    nagadAccountType,
    setNagadAccountType,
  ] = useState("Personal");

  const [
    bankEnabled,
    setBankEnabled,
  ] = useState(true);

  const [
    bankName,
    setBankName,
  ] = useState("");

  const [
    bankAccountName,
    setBankAccountName,
  ] = useState("");

  const [
    bankAccountNumber,
    setBankAccountNumber,
  ] = useState("");

  const [
    bankBranch,
    setBankBranch,
  ] = useState("");

  const [
    bankRoutingNumber,
    setBankRoutingNumber,
  ] = useState("");

  useEffect(() => {
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

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            "role, is_active"
          )
          .eq("id", user.id)
          .single();

        if (
          profileError ||
          !profile ||
          !profile.is_active ||
          profile.role !== "owner"
        ) {
          router.push("/admin");
          return;
        }

        const {
          data,
          error,
        } = await supabase
          .from("payment_settings")
          .select(
            `
            id,
            bkash_enabled,
            bkash_number,
            bkash_account_type,
            nagad_enabled,
            nagad_number,
            nagad_account_type,
            bank_enabled,
            bank_name,
            bank_account_name,
            bank_account_number,
            bank_branch,
            bank_routing_number
            `
          )
          .eq("id", 1)
          .single();

        if (error) {
          throw error;
        }

        const settings =
          data as PaymentSettings;

        setBkashEnabled(
          settings.bkash_enabled
        );

        setBkashNumber(
          settings.bkash_number ?? ""
        );

        setBkashAccountType(
          settings.bkash_account_type ??
            "Personal"
        );

        setNagadEnabled(
          settings.nagad_enabled
        );

        setNagadNumber(
          settings.nagad_number ?? ""
        );

        setNagadAccountType(
          settings.nagad_account_type ??
            "Personal"
        );

        setBankEnabled(
          settings.bank_enabled
        );

        setBankName(
          settings.bank_name ?? ""
        );

        setBankAccountName(
          settings.bank_account_name ??
            ""
        );

        setBankAccountNumber(
          settings.bank_account_number ??
            ""
        );

        setBankBranch(
          settings.bank_branch ?? ""
        );

        setBankRoutingNumber(
          settings.bank_routing_number ??
            ""
        );
      } catch (error) {
        const pageError =
          error as {
            message?: string;
          };

        setErrorMessage(
          pageError.message ||
            "Could not load payment settings."
        );
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [router]);

  const handleSave = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!supabase) {
      return;
    }

    setMessage("");
    setErrorMessage("");

    if (
      bkashEnabled &&
      !bkashNumber.trim()
    ) {
      setErrorMessage(
        "bKash number is required while bKash is enabled."
      );

      return;
    }

    if (
      nagadEnabled &&
      !nagadNumber.trim()
    ) {
      setErrorMessage(
        "Nagad number is required before enabling Nagad."
      );

      return;
    }

    if (
      bankEnabled &&
      (
        !bankName.trim() ||
        !bankAccountName.trim() ||
        !bankAccountNumber.trim()
      )
    ) {
      setErrorMessage(
        "Bank name, account name and account number are required while Bank Transfer is enabled."
      );

      return;
    }

    if (
      !bkashEnabled &&
      !nagadEnabled &&
      !bankEnabled
    ) {
      setErrorMessage(
        "At least one payment method must remain enabled."
      );

      return;
    }

    setSaving(true);

    try {
      /*
       * UI allows Owner only.
       *
       * payment_settings RLS is also
       * Owner-only, so Admin/Staff
       * cannot bypass this using API.
       */
      const {
        error,
      } = await supabase
        .from("payment_settings")
        .update({
          bkash_enabled:
            bkashEnabled,

          bkash_number:
            bkashNumber.trim() ||
            null,

          bkash_account_type:
            bkashAccountType.trim() ||
            null,

          nagad_enabled:
            nagadEnabled,

          nagad_number:
            nagadNumber.trim() ||
            null,

          nagad_account_type:
            nagadAccountType.trim() ||
            null,

          bank_enabled:
            bankEnabled,

          bank_name:
            bankName.trim() ||
            null,

          bank_account_name:
            bankAccountName.trim() ||
            null,

          bank_account_number:
            bankAccountNumber.trim() ||
            null,

          bank_branch:
            bankBranch.trim() ||
            null,

          bank_routing_number:
            bankRoutingNumber.trim() ||
            null,

          updated_at:
            new Date().toISOString(),
        })
        .eq("id", 1);

      if (error) {
        throw error;
      }

      setMessage(
        "Payment settings saved successfully."
      );
    } catch (error) {
      const saveError =
        error as {
          message?: string;
        };

      setErrorMessage(
        saveError.message ||
          "Could not save payment settings."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />

      <main className="section-shell page-space">
        <section className="settings-heading">
          <div>
            <div className="eyebrow">
              OWNER CONTROL
            </div>

            <h1>
              Payment Settings
            </h1>

            <p>
              Manage the official
              payment destinations shown
              to customers during
              checkout.
            </p>
          </div>

          <a
            href="/admin"
            className="ghost-button"
          >
            ← Dashboard
          </a>
        </section>

        <div className="owner-security-note">
          <div className="security-icon">
            🔒
          </div>

          <div>
            <strong>
              Owner-only settings
            </strong>

            <p>
              Admin and Staff may handle
              payment verification only
              when permitted. They cannot
              change these payment
              accounts.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="settings-message error">
            {errorMessage}
          </div>
        )}

        {message && (
          <div className="settings-message success">
            ✓ {message}
          </div>
        )}

        {loading ? (
          <div className="settings-loading">
            <span />

            Loading payment settings...
          </div>
        ) : (
          <form
            className="settings-form"
            onSubmit={handleSave}
          >
            {/* ================================
                BKASH
            ================================= */}

            <section className="payment-setting-card">
              <div className="setting-card-top">
                <div className="setting-brand">
                  <span className="brand-logo bkash">
                    b
                  </span>

                  <div>
                    <h2>
                      bKash
                    </h2>

                    <p>
                      Customer Send Money
                      destination
                    </p>
                  </div>
                </div>

                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={
                      bkashEnabled
                    }
                    onChange={(e) =>
                      setBkashEnabled(
                        e.target.checked
                      )
                    }
                    disabled={saving}
                  />

                  <span />

                  <strong>
                    {bkashEnabled
                      ? "Enabled"
                      : "Disabled"}
                  </strong>
                </label>
              </div>

              <div className="settings-grid">
                <label>
                  bKash Number

                  <input
                    value={bkashNumber}
                    onChange={(e) =>
                      setBkashNumber(
                        e.target.value
                      )
                    }
                    placeholder="01XXXXXXXXX"
                    disabled={saving}
                  />
                </label>

                <label>
                  Account Type

                  <select
                    value={
                      bkashAccountType
                    }
                    onChange={(e) =>
                      setBkashAccountType(
                        e.target.value
                      )
                    }
                    disabled={saving}
                  >
                    <option value="Personal">
                      Personal
                    </option>

                    <option value="Merchant">
                      Merchant
                    </option>

                    <option value="Agent">
                      Agent
                    </option>
                  </select>
                </label>
              </div>
            </section>

            {/* ================================
                BANK
            ================================= */}

            <section className="payment-setting-card">
              <div className="setting-card-top">
                <div className="setting-brand">
                  <span className="brand-logo bank">
                    B
                  </span>

                  <div>
                    <h2>
                      Bank Transfer
                    </h2>

                    <p>
                      Official bank account
                      shown at checkout
                    </p>
                  </div>
                </div>

                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={
                      bankEnabled
                    }
                    onChange={(e) =>
                      setBankEnabled(
                        e.target.checked
                      )
                    }
                    disabled={saving}
                  />

                  <span />

                  <strong>
                    {bankEnabled
                      ? "Enabled"
                      : "Disabled"}
                  </strong>
                </label>
              </div>

              <div className="settings-grid">
                <label>
                  Bank Name

                  <input
                    value={bankName}
                    onChange={(e) =>
                      setBankName(
                        e.target.value
                      )
                    }
                    placeholder="Bank name"
                    disabled={saving}
                  />
                </label>

                <label>
                  Account Name

                  <input
                    value={
                      bankAccountName
                    }
                    onChange={(e) =>
                      setBankAccountName(
                        e.target.value
                      )
                    }
                    placeholder="Account holder"
                    disabled={saving}
                  />
                </label>

                <label>
                  Account Number

                  <input
                    value={
                      bankAccountNumber
                    }
                    onChange={(e) =>
                      setBankAccountNumber(
                        e.target.value
                      )
                    }
                    placeholder="Account number"
                    disabled={saving}
                  />
                </label>

                <label>
                  Branch

                  <input
                    value={
                      bankBranch
                    }
                    onChange={(e) =>
                      setBankBranch(
                        e.target.value
                      )
                    }
                    placeholder="Branch"
                    disabled={saving}
                  />
                </label>

                <label className="wide-field">
                  Routing Number

                  <input
                    value={
                      bankRoutingNumber
                    }
                    onChange={(e) =>
                      setBankRoutingNumber(
                        e.target.value
                      )
                    }
                    placeholder="Routing number"
                    disabled={saving}
                  />
                </label>
              </div>
            </section>

            {/* ================================
                NAGAD
            ================================= */}

            <section className="payment-setting-card nagad-card">
              <div className="setting-card-top">
                <div className="setting-brand">
                  <span className="brand-logo nagad">
                    N
                  </span>

                  <div>
                    <h2>
                      Nagad
                    </h2>

                    <p>
                      Ready whenever you
                      want to activate it
                    </p>
                  </div>
                </div>

                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={
                      nagadEnabled
                    }
                    onChange={(e) =>
                      setNagadEnabled(
                        e.target.checked
                      )
                    }
                    disabled={saving}
                  />

                  <span />

                  <strong>
                    {nagadEnabled
                      ? "Enabled"
                      : "Disabled"}
                  </strong>
                </label>
              </div>

              <div className="settings-grid">
                <label>
                  Nagad Number

                  <input
                    value={nagadNumber}
                    onChange={(e) =>
                      setNagadNumber(
                        e.target.value
                      )
                    }
                    placeholder="Add later"
                    disabled={saving}
                  />
                </label>

                <label>
                  Account Type

                  <select
                    value={
                      nagadAccountType
                    }
                    onChange={(e) =>
                      setNagadAccountType(
                        e.target.value
                      )
                    }
                    disabled={saving}
                  >
                    <option value="Personal">
                      Personal
                    </option>

                    <option value="Merchant">
                      Merchant
                    </option>

                    <option value="Agent">
                      Agent
                    </option>
                  </select>
                </label>
              </div>

              {!nagadEnabled && (
                <div className="later-note">
                  Nagad is currently hidden
                  from customers. Add the
                  number and enable it here
                  whenever you are ready.
                </div>
              )}
            </section>

            <div className="settings-save-bar">
              <div>
                <strong>
                  Checkout updates
                </strong>

                <span>
                  Saved changes will be
                  used by the customer
                  checkout automatically.
                </span>
              </div>

              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Payment Settings"}
              </button>
            </div>
          </form>
        )}
      </main>

      <Footer />

      <style jsx>{`
        .settings-heading {
          display: flex;
          justify-content:
            space-between;
          align-items: flex-end;
          gap: 24px;
          padding: 28px 0 25px;
        }

        .settings-heading h1 {
          margin: 6px 0 10px;
          color: #1e2747;
          font-size:
            clamp(
              2.5rem,
              6vw,
              4.5rem
            );
          line-height: 0.95;
          letter-spacing:
            -0.06em;
        }

        .settings-heading p {
          max-width: 620px;
          margin: 0;
          color: #7a8090;
          line-height: 1.7;
        }

        .owner-security-note {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 22px;
          padding: 17px 19px;
          border: 1px solid
            #dfe5f1;
          border-radius: 18px;
          background:
            linear-gradient(
              135deg,
              #f7f9ff,
              #fbfcff
            );
        }

        .security-icon {
          display: grid;
          place-items: center;
          width: 45px;
          height: 45px;
          flex: 0 0 auto;
          border-radius: 14px;
          background: #202c52;
        }

        .owner-security-note
          strong {
          color: #303951;
        }

        .owner-security-note p {
          margin: 3px 0 0;
          color: #818798;
          font-size: 0.78rem;
          line-height: 1.5;
        }

        .settings-form {
          display: grid;
          gap: 18px;
          padding-bottom: 90px;
        }

        .payment-setting-card {
          padding: 25px;
          border: 1px solid
            #e4e7ed;
          border-radius: 23px;
          background: white;
          box-shadow:
            0 12px 35px
            rgba(
              31,
              41,
              77,
              0.035
            );
        }

        .setting-card-top {
          display: flex;
          justify-content:
            space-between;
          align-items: center;
          gap: 18px;
          margin-bottom: 22px;
        }

        .setting-brand {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .setting-brand h2 {
          margin: 0;
          color: #313951;
        }

        .setting-brand p {
          margin: 3px 0 0;
          color: #9297a5;
          font-size: 0.75rem;
        }

        .brand-logo {
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          border-radius: 15px;
          color: white;
          font-size: 1.2rem;
          font-weight: 900;
        }

        .brand-logo.bkash {
          background: #d61f63;
        }

        .brand-logo.bank {
          background: #27375f;
        }

        .brand-logo.nagad {
          background: #e56d25;
        }

        .settings-grid {
          display: grid;
          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );
          gap: 15px;
        }

        .settings-grid label {
          display: grid;
          gap: 8px;
          color: #5a6275;
          font-size: 0.78rem;
          font-weight: 720;
        }

        .wide-field {
          grid-column: 1 / -1;
        }

        .settings-grid
          :global(input),
        .settings-grid
          :global(select) {
          width: 100%;
          box-sizing: border-box;
          padding: 13px 14px;
          border: 1px solid
            #dadee7;
          border-radius: 13px;
          outline: none;
          background: #fafbfc;
          color: #293149;
          transition:
            border-color
              0.18s ease,
            box-shadow
              0.18s ease;
        }

        .settings-grid
          :global(input:focus),
        .settings-grid
          :global(select:focus) {
          border-color:
            #7784a9;
          box-shadow:
            0 0 0 4px
            rgba(
              73,
              89,
              139,
              0.08
            );
        }

        .toggle {
          display: flex;
          align-items: center;
          gap: 9px;
          cursor: pointer;
        }

        .toggle
          :global(input) {
          display: none;
        }

        .toggle > span {
          position: relative;
          width: 44px;
          height: 24px;
          border-radius: 999px;
          background: #d9dce4;
          transition:
            background 0.2s ease;
        }

        .toggle > span::after {
          content: "";
          position: absolute;
          top: 3px;
          left: 3px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          box-shadow:
            0 2px 5px
            rgba(
              0,
              0,
              0,
              0.16
            );
          transition:
            transform 0.2s ease;
        }

        .toggle
          :global(input:checked)
          + span {
          background: #26375f;
        }

        .toggle
          :global(input:checked)
          + span::after {
          transform:
            translateX(20px);
        }

        .toggle strong {
          color: #6e7586;
          font-size: 0.72rem;
        }

        .later-note {
          margin-top: 16px;
          padding: 12px 14px;
          border-radius: 13px;
          background: #fff8ed;
          color: #8b6c2a;
          font-size: 0.75rem;
          line-height: 1.55;
        }

        .settings-save-bar {
          display: flex;
          justify-content:
            space-between;
          align-items: center;
          gap: 20px;
          padding: 20px 22px;
          border-radius: 19px;
          background: #202b4f;
          color: white;
        }

        .settings-save-bar
          strong,
        .settings-save-bar
          span {
          display: block;
        }

        .settings-save-bar span {
          margin-top: 3px;
          color:
            rgba(
              255,
              255,
              255,
              0.65
            );
          font-size: 0.74rem;
        }

        .settings-message {
          margin-bottom: 18px;
          padding: 14px 16px;
          border-radius: 14px;
        }

        .settings-message.success {
          background: #edf9f1;
          color: #2f7549;
        }

        .settings-message.error {
          background: #fff1f1;
          color: #a23d3d;
        }

        .settings-loading {
          display: flex;
          align-items: center;
          justify-content:
            center;
          gap: 10px;
          min-height: 270px;
          border: 1px dashed
            #dce0e8;
          border-radius: 22px;
          color: #818798;
        }

        .settings-loading span {
          width: 18px;
          height: 18px;
          border: 2px solid
            #dadde5;
          border-top-color:
            #25345d;
          border-radius: 50%;
          animation:
            settingsSpin
            0.8s linear infinite;
        }

        @keyframes settingsSpin {
          to {
            transform:
              rotate(360deg);
          }
        }

        @media (
          max-width: 700px
        ) {
          .settings-heading {
            align-items:
              flex-start;
            flex-direction:
              column;
          }

          .setting-card-top {
            align-items:
              flex-start;
            flex-direction:
              column;
          }

          .settings-grid {
            grid-template-columns:
              1fr;
          }

          .wide-field {
            grid-column: auto;
          }

          .settings-save-bar {
            align-items:
              flex-start;
            flex-direction:
              column;
          }
        }

        @media (
          prefers-reduced-motion:
            reduce
        ) {
          .settings-loading span {
            animation: none;
          }

          .toggle > span,
          .toggle > span::after {
            transition: none;
          }
        }
      `}</style>
    </>
  );
}