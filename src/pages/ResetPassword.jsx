import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  Eye,
  EyeOff,
  Check,
  LockKeyhole,
} from "lucide-react";

import { supabase } from "../lib/supabase";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [checking, setChecking] =
    useState(true);

  const [validRecovery, setValidRecovery] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  /* =========================================================
     VERIFY RECOVERY SESSION
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } =
          await supabase.auth.getSession();

        if (sessionError) {
          console.error(
            "Recovery session error:",
            sessionError
          );
        }

        if (
          mounted &&
          session
        ) {
          setValidRecovery(true);
        }
      } catch (err) {
        console.error(
          "Recovery check error:",
          err
        );
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    };

    checkSession();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (event, session) => {
          if (!mounted) return;

          if (
            event ===
              "PASSWORD_RECOVERY" &&
            session
          ) {
            setValidRecovery(true);
            setChecking(false);
          }
        }
      );

    return () => {
      mounted = false;

      subscription.unsubscribe();
    };
  }, []);

  /* =========================================================
     RESET PASSWORD
  ========================================================= */

  const handleResetPassword =
    async (event) => {
      event.preventDefault();

      setError("");

      if (!password) {
        setError(
          "Enter your new password."
        );

        return;
      }

      if (password.length < 8) {
        setError(
          "Your password must contain at least 8 characters."
        );

        return;
      }

      if (!/[A-Z]/.test(password)) {
        setError(
          "Your password must contain at least one uppercase letter."
        );

        return;
      }

      if (!/\d/.test(password)) {
        setError(
          "Your password must contain at least one number."
        );

        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        setError(
          "Passwords do not match."
        );

        return;
      }

      try {
        setLoading(true);

        const {
          error: updateError,
        } =
          await supabase.auth.updateUser({
            password,
          });

        if (updateError) {
          console.error(
            "Password update error:",
            updateError
          );

          if (
            updateError.code ===
            "same_password"
          ) {
            setError(
              "Your new password must be different from your current password."
            );

            return;
          }

          if (
            updateError.code ===
            "weak_password"
          ) {
            setError(
              "Please choose a stronger password."
            );

            return;
          }

          setError(
            "We couldn't update your password. Please request a new reset link."
          );

          return;
        }

        setSuccess(true);

        /*
          End the recovery session.

          User signs in normally with
          the new password afterward.
        */

        await supabase.auth.signOut();
      } catch (err) {
        console.error(
          "Reset password error:",
          err
        );

        setError(
          "We couldn't update your password. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     CHECKING LINK
  ========================================================= */

  if (checking) {
    return (
      <main className="auth-page relative grid min-h-screen place-items-center overflow-hidden bg-[#060807] text-[#f2f4ef]">
        <div className="noise pointer-events-none fixed inset-0" />

        <div className="relative z-10 text-center">
          <div className="mx-auto mb-5 h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-[#c7ff39]" />

          <p className="text-xs uppercase tracking-[0.18em] text-[#a1a1aa]">
            Checking reset link
          </p>
        </div>
      </main>
    );
  }

  /* =========================================================
     SUCCESS
  ========================================================= */

  if (success) {
    return (
      <main className="auth-page relative grid min-h-screen place-items-center overflow-hidden bg-[#060807] px-5 text-[#f2f4ef]">
        <div className="noise pointer-events-none fixed inset-0" />

        <div className="relative z-10 w-full max-w-md border border-white/10 bg-[#0a0d0b]/90 p-8">
          <div className="grid h-12 w-12 place-items-center border border-[#c7ff39]/30 bg-[#c7ff39]/[0.06] text-[#c7ff39]">
            <Check
              size={21}
              strokeWidth={1.7}
            />
          </div>

          <p className="mt-6 text-xs uppercase tracking-[0.18em] text-[#c7ff39]">
            Password updated
          </p>

          <h1 className="mt-3 text-3xl font-medium tracking-[-0.04em]">
            Your new password is ready.
          </h1>

          <p className="mt-4 text-sm leading-6 text-[#a1a1aa]">
            Your SkillSwap+ password was
            changed successfully. You can
            now sign in using your new
            password.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/login", {
                replace: true,
              })
            }
            className="mt-7 min-h-[52px] w-full bg-[#c7ff39] px-5 font-semibold text-[#071008] transition hover:bg-[#d2ff64]"
          >
            Sign in →
          </button>
        </div>
      </main>
    );
  }

  /* =========================================================
     INVALID / EXPIRED LINK
  ========================================================= */

  if (!validRecovery) {
    return (
      <main className="auth-page relative grid min-h-screen place-items-center overflow-hidden bg-[#060807] px-5 text-[#f2f4ef]">
        <div className="noise pointer-events-none fixed inset-0" />

        <div className="relative z-10 w-full max-w-md border border-white/10 bg-[#0a0d0b]/90 p-8">
          <p className="text-xs uppercase tracking-[0.18em] text-[#ff8b8b]">
            Invalid reset link
          </p>

          <h1 className="mt-3 text-3xl font-medium tracking-[-0.04em]">
            This link isn't available.
          </h1>

          <p className="mt-4 text-sm leading-6 text-[#a1a1aa]">
            The password reset link may
            have expired or already been
            used. Request a new one to
            continue.
          </p>

          <Link
            to="/forgot-password"
            className="mt-7 flex min-h-[52px] w-full items-center justify-center bg-[#c7ff39] px-5 font-semibold text-[#071008]"
          >
            Request new reset link →
          </Link>

          <Link
            to="/login"
            className="mt-3 flex min-h-[48px] w-full items-center justify-center border border-white/15 text-sm text-[#a1a1aa] transition hover:text-white"
          >
            Back to sign in
          </Link>
        </div>
      </main>
    );
  }

  /* =========================================================
     RESET FORM
  ========================================================= */

  return (
    <main className="auth-page relative grid min-h-screen place-items-center overflow-hidden bg-[#060807] px-5 py-20 text-[#f2f4ef]">
      <div className="noise pointer-events-none fixed inset-0" />

      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(199,255,57,.08), transparent 42%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md border border-white/10 bg-[#0a0d0b]/90 p-6 sm:p-8">
        <div className="grid h-12 w-12 place-items-center border border-[#c7ff39]/30 bg-[#c7ff39]/[0.06] text-[#c7ff39]">
          <LockKeyhole
            size={20}
            strokeWidth={1.5}
          />
        </div>

        <p className="mt-6 text-xs uppercase tracking-[0.18em] text-[#c7ff39]">
          Password recovery
        </p>

        <h1 className="mt-3 text-3xl font-medium tracking-[-0.04em]">
          Create a new password.
        </h1>

        <p className="mt-3 text-sm leading-6 text-[#a1a1aa]">
          Choose a strong password for
          your SkillSwap+ account.
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
          onSubmit={
            handleResetPassword
          }
          className="mt-7 space-y-5"
        >
          {/* NEW PASSWORD */}

          <div>
            <label
              htmlFor="new-password"
              className="block text-sm font-medium"
            >
              New password
            </label>

            <div className="relative mt-2">
              <input
                id="new-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) => {
                  setPassword(
                    event.target.value
                  );

                  if (error) {
                    setError("");
                  }
                }}
                placeholder="Enter new password"
                autoComplete="new-password"
                className="min-h-[52px] w-full rounded-md border border-white/15 bg-[#060807] px-4 pr-12 text-[#f2f4ef] placeholder:text-white/25 transition hover:border-white/25 focus:border-[#c7ff39]/70 focus:outline-none focus:ring-1 focus:ring-[#c7ff39]/30"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) =>
                      !current
                  )
                }
                className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center text-[#a1a1aa] hover:text-white"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff
                    size={17}
                    strokeWidth={1.5}
                  />
                ) : (
                  <Eye
                    size={17}
                    strokeWidth={1.5}
                  />
                )}
              </button>
            </div>
          </div>

          {/* CONFIRM */}

          <div>
            <label
              htmlFor="confirm-new-password"
              className="block text-sm font-medium"
            >
              Confirm new password
            </label>

            <div className="relative mt-2">
              <input
                id="confirm-new-password"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(
                    event.target.value
                  );

                  if (error) {
                    setError("");
                  }
                }}
                placeholder="Confirm new password"
                autoComplete="new-password"
                className="min-h-[52px] w-full rounded-md border border-white/15 bg-[#060807] px-4 pr-12 text-[#f2f4ef] placeholder:text-white/25 transition hover:border-white/25 focus:border-[#c7ff39]/70 focus:outline-none focus:ring-1 focus:ring-[#c7ff39]/30"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    (current) =>
                      !current
                  )
                }
                className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center text-[#a1a1aa] hover:text-white"
                aria-label={
                  showConfirmPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff
                    size={17}
                    strokeWidth={1.5}
                  />
                ) : (
                  <Eye
                    size={17}
                    strokeWidth={1.5}
                  />
                )}
              </button>
            </div>
          </div>

          <div className="border border-white/10 bg-white/[0.02] px-4 py-3">
            <p className="text-xs leading-5 text-[#a1a1aa]">
              Use at least 8 characters,
              including one uppercase letter
              and one number.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex min-h-[52px] w-full items-center justify-center bg-[#c7ff39] px-5 font-semibold text-[#071008] transition hover:bg-[#d2ff64] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]"
          >
            {loading
              ? "Updating password..."
              : "Update password →"}
          </button>
        </form>
      </div>
    </main>
  );
}