import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Check,
} from "lucide-react";
import { supabase } from "../lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanEmail = email
      .trim()
      .toLowerCase();

    if (!cleanEmail) {
      setError(
        "Enter your email address."
      );

      return;
    }

    if (
      !/^\S+@\S+\.\S+$/.test(
        cleanEmail
      )
    ) {
      setError(
        "Enter a valid email address."
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      const {
        error: resetError,
      } =
        await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo:
              `${window.location.origin}/reset-password`,
          }
        );

      if (resetError) {
        console.error(
          "Password reset email error:",
          resetError
        );

        const message =
          resetError.message
            ?.toLowerCase() || "";

        if (
          resetError.code ===
            "over_email_send_rate_limit" ||
          resetError.status === 429 ||
          message.includes(
            "rate limit"
          )
        ) {
          setError(
            "Too many reset emails have been requested. Please wait a while and try again."
          );

          return;
        }

        setError(
          "We couldn't send a reset email right now. Please try again."
        );

        return;
      }

      /*
        Don't reveal whether the email
        actually belongs to an account.
      */

      setSuccess(true);
    } catch (err) {
      console.error(
        "Forgot password error:",
        err
      );

      setError(
        "We couldn't send a reset email right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#060807] px-5 py-20 text-[#f2f4ef]">
      <div className="noise pointer-events-none fixed inset-0" />

      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(199,255,57,.08), transparent 42%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <Link
          to="/login"
          className="mb-10 inline-flex items-center gap-2 text-sm text-[#a1a1aa] transition hover:text-[#f2f4ef]"
        >
          <ArrowLeft
            size={16}
            strokeWidth={1.5}
          />

          Back to sign in
        </Link>

        <div className="border border-white/10 bg-[#0a0d0b]/90 p-6 sm:p-8">
          {!success ? (
            <>
              <div className="mb-6 grid h-12 w-12 place-items-center border border-[#c7ff39]/30 bg-[#c7ff39]/[0.06] text-[#c7ff39]">
                <Mail
                  size={20}
                  strokeWidth={1.5}
                />
              </div>

              <p className="text-xs uppercase tracking-[0.18em] text-[#c7ff39]">
                Password recovery
              </p>

              <h1 className="mt-3 text-3xl font-medium tracking-[-0.04em]">
                Forgot your password?
              </h1>

              <p className="mt-3 text-sm leading-6 text-[#a1a1aa]">
                Enter the email associated
                with your SkillSwap+ account.
                We'll send you a secure link
                to create a new password.
              </p>

              {error && (
                <div
                  role="alert"
                  className="mt-6 border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.04] px-4 py-3 text-sm text-[#ff8b8b]"
                >
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="mt-7"
              >
                <label
                  htmlFor="reset-email"
                  className="block text-sm font-medium"
                >
                  Email address
                </label>

                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(
                      event.target.value
                    );

                    if (error) {
                      setError("");
                    }
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="mt-2 min-h-[52px] w-full rounded-md border border-white/15 bg-[#060807] px-4 text-[#f2f4ef] placeholder:text-white/25 transition hover:border-white/25 focus:border-[#c7ff39]/70 focus:outline-none focus:ring-1 focus:ring-[#c7ff39]/30"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-5 flex min-h-[52px] w-full items-center justify-center bg-[#c7ff39] px-5 font-semibold text-[#071008] transition hover:bg-[#d2ff64] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]"
                >
                  {loading
                    ? "Sending reset link..."
                    : "Send reset link →"}
                </button>
              </form>
            </>
          ) : (
            <div className="py-3">
              <div className="mb-6 grid h-12 w-12 place-items-center border border-[#c7ff39]/30 bg-[#c7ff39]/[0.06] text-[#c7ff39]">
                <Check
                  size={21}
                  strokeWidth={1.7}
                />
              </div>

              <p className="text-xs uppercase tracking-[0.18em] text-[#c7ff39]">
                Check your inbox
              </p>

              <h1 className="mt-3 text-3xl font-medium tracking-[-0.04em]">
                Reset link requested.
              </h1>

              <p className="mt-4 text-sm leading-6 text-[#a1a1aa]">
                If an account exists for{" "}
                <span className="text-[#f2f4ef]">
                  {email.trim()}
                </span>
                , a password reset link has
                been sent.
              </p>

              <p className="mt-3 text-xs leading-5 text-white/40">
                Check your spam or junk
                folder if you don't see the
                email.
              </p>

              <Link
                to="/login"
                className="mt-7 flex min-h-[50px] w-full items-center justify-center border border-white/15 text-sm font-medium transition hover:border-white/30 hover:bg-white/[0.03]"
              >
                Return to sign in
              </Link>

              <button
                type="button"
                onClick={() => {
                  setSuccess(false);
                  setError("");
                }}
                className="mt-3 w-full py-2 text-xs text-[#a1a1aa] transition hover:text-[#c7ff39]"
              >
                Send another reset link
              </button>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-white/30">
          © 2026 SkillSwap+
        </p>
      </div>
    </main>
  );
}