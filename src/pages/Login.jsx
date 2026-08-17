import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import {
  Eye,
  EyeOff,
} from "lucide-react";

import { supabase } from "../lib/supabase";

export default function Login() {
  const navigate =
    useNavigate();

  const [email, setEmail] =
    useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    googleLoading,
    setGoogleLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* =========================================================
     ROUTE USER AFTER LOGIN
  ========================================================= */

  const routeUser =
    async (user) => {
      if (!user?.id) {
        throw new Error(
          "AUTH_USER_MISSING"
        );
      }

      console.log(
        "LOGIN USER:",
        user.id
      );

      /* =====================================================
         GET PROFILE
      ===================================================== */

      const {
        data: profile,
        error:
          profileError,
      } =
        await supabase
          .from(
            "profiles"
          )
          .select(
            `
              id,
              username,
              full_name,
              is_active,
              profile_completed
            `
          )
          .eq(
            "id",
            user.id
          )
          .maybeSingle();

      console.log(
        "LOGIN PROFILE:",
        profile
      );

      if (profileError) {
        console.error(
          "PROFILE CHECK ERROR:",
          profileError
        );

        throw profileError;
      }

      /* =====================================================
         PROFILE ROW DOES NOT EXIST
      ===================================================== */

      if (!profile) {
        console.error(
          "No profile row found for auth user:",
          user.id
        );

        await supabase.auth.signOut({
          scope: "local",
        });

        throw new Error(
          "PROFILE_NOT_FOUND"
        );
      }

      /* =====================================================
         DISABLED ACCOUNT
      ===================================================== */

      if (
        profile.is_active ===
        false
      ) {
        await supabase.auth.signOut({
          scope: "local",
        });

        throw new Error(
          "ACCOUNT_INACTIVE"
        );
      }

      /* =====================================================
         PROFILE NOT FINISHED
      ===================================================== */

      if (
        profile.profile_completed !==
        true
      ) {
        console.log(
          "Profile incomplete -> Profile Setup"
        );

        navigate(
          "/profile-setup",
          {
            replace: true,
          }
        );

        return;
      }

      /* =====================================================
         COMPLETED PROFILE
      ===================================================== */

      console.log(
        "Profile completed -> Dashboard"
      );

      navigate(
        "/dashboard",
        {
          replace: true,
        }
      );
    };

  /* =========================================================
     EMAIL + PASSWORD LOGIN
  ========================================================= */

  const handleLogin =
    async (event) => {
      event.preventDefault();

      if (loading) {
        return;
      }

      const cleanEmail =
        email
          .trim()
          .toLowerCase();

      /* =====================================================
         FRONTEND VALIDATION
      ===================================================== */

      if (
        !cleanEmail ||
        !password
      ) {
        setError(
          "Enter your email and password."
        );

        return;
      }

      try {
        setLoading(true);

        setError("");

        console.log(
          "Starting login for:",
          cleanEmail
        );

        /* ===================================================
           SUPABASE LOGIN
        =================================================== */

        const {
          data,
          error:
            loginError,
        } =
          await supabase.auth
            .signInWithPassword(
              {
                email:
                  cleanEmail,

                password,
              }
            );

        console.log(
          "LOGIN DATA:",
          data
        );

        if (loginError) {
          console.error(
            "SUPABASE LOGIN ERROR:",
            loginError
          );

          const message =
            String(
              loginError.message ||
                ""
            ).toLowerCase();

          /* Invalid credentials */

          if (
            message.includes(
              "invalid login credentials"
            ) ||
            message.includes(
              "invalid credentials"
            )
          ) {
            setError(
              "Invalid email or password."
            );

            return;
          }

          /* Email not confirmed */

          if (
            message.includes(
              "email not confirmed"
            )
          ) {
            setError(
              "Confirm your email address before signing in."
            );

            return;
          }

          /* Rate limit */

          if (
            loginError.status ===
              429 ||
            message.includes(
              "rate limit"
            )
          ) {
            setError(
              "Too many sign-in attempts. Please wait a few minutes and try again."
            );

            return;
          }

          /* Development: show actual Auth error */

          setError(
            loginError.message ||
              "We couldn't sign you in."
          );

          return;
        }

        /* ===================================================
           VERIFY AUTH RESPONSE
        =================================================== */

        if (
          !data?.user ||
          !data?.session
        ) {
          console.error(
            "Login returned no user/session:",
            data
          );

          setError(
            "We couldn't create a login session. Please try again."
          );

          return;
        }

        /* ===================================================
           ROUTE USER
        =================================================== */

        await routeUser(
          data.user
        );
      } catch (err) {
        console.error(
          "LOGIN FLOW ERROR:",
          err
        );

        if (
          err?.message ===
          "PROFILE_NOT_FOUND"
        ) {
          setError(
            "Your account exists, but your SkillSwap+ profile could not be found."
          );

          return;
        }

        if (
          err?.message ===
          "ACCOUNT_INACTIVE"
        ) {
          setError(
            "This SkillSwap+ account is currently inactive."
          );

          return;
        }

        if (
          err?.message ===
          "AUTH_USER_MISSING"
        ) {
          setError(
            "We couldn't verify your account. Please sign in again."
          );

          return;
        }

        /*
          Show actual database error during development.
        */

        setError(
          err?.message ||
            "We couldn't sign you in right now. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     GOOGLE LOGIN

     GOOGLE IS LOGIN ONLY.
     Registration with Google is not allowed.
  ========================================================= */

  const handleGoogleLogin =
    async () => {
      if (
        googleLoading ||
        loading
      ) {
        return;
      }

      try {
        setGoogleLoading(
          true
        );

        setError("");

        /*
          AuthCallback uses this to know
          that Google authentication was
          started from Login.
        */

        localStorage.setItem(
          "googleAuthIntent",
          "login"
        );

        const {
          error:
            googleError,
        } =
          await supabase.auth
            .signInWithOAuth({
              provider:
                "google",

              options: {
                redirectTo:
                  `${window.location.origin}/auth/callback`,
              },
            });

        if (googleError) {
          console.error(
            "GOOGLE LOGIN ERROR:",
            googleError
          );

          localStorage.removeItem(
            "googleAuthIntent"
          );

          setError(
            googleError.message ||
              "Google sign-in could not be started."
          );

          setGoogleLoading(
            false
          );
        }
      } catch (err) {
        console.error(
          "GOOGLE LOGIN ERROR:",
          err
        );

        localStorage.removeItem(
          "googleAuthIntent"
        );

        setError(
          err?.message ||
            "Google sign-in could not be started."
        );

        setGoogleLoading(
          false
        );
      }
    };

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#060807] text-[#f2f4ef]">
      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="noise pointer-events-none fixed inset-0" />

      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 22% 38%, rgba(199,255,57,.08), transparent 42%)",
        }}
      />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-2">
        {/* ===================================================
            LEFT
        =================================================== */}

        <section className="hidden border-r border-white/10 px-10 py-10 lg:flex lg:flex-col lg:justify-between">
          {/* LOGO */}

          <Link
            to="/"
            className="w-fit text-lg font-semibold tracking-[-0.03em] text-[#f2f4ef]"
          >
            SKILLSWAP
            <span className="text-[#c7ff39]">
              +
            </span>
          </Link>

          {/* HERO */}

          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.18em] text-[#c7ff39]">
              Welcome back
            </p>

            <h1 className="mt-5 text-5xl font-medium leading-[1.02] tracking-[-0.055em] xl:text-7xl">
              Learn what you
              need.
              <br />
              Share what you
              know.
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-[#a1a1aa]">
              Sign in to
              continue your
              SkillSwap+
              journey,
              connect with
              members, learn
              new skills and
              earn SS Credits
              by teaching.
            </p>
          </div>

          <p className="text-xs text-white/30">
            © 2026
            SkillSwap+
          </p>
        </section>

        {/* ===================================================
            RIGHT
        =================================================== */}

        <section className="flex min-h-screen items-center justify-center px-5 py-24 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            {/* MOBILE LOGO */}

            <Link
              to="/"
              className="mb-12 inline-block text-lg font-semibold tracking-[-0.03em] lg:hidden"
            >
              SKILLSWAP
              <span className="text-[#c7ff39]">
                +
              </span>
            </Link>

            {/* HEADING */}

            <p className="text-xs uppercase tracking-[0.18em] text-[#c7ff39]">
              Sign in
            </p>

            <h2 className="mt-3 text-4xl font-medium tracking-[-0.045em]">
              Continue to
              SkillSwap+.
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#a1a1aa]">
              Enter your
              account details
              or continue with
              Google.
            </p>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <div
                role="alert"
                className="mt-6 border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.04] px-4 py-3 text-sm text-[#ff8b8b]"
              >
                {error}
              </div>
            )}

            {/* =================================================
                GOOGLE
            ================================================= */}

            <button
              type="button"
              onClick={
                handleGoogleLogin
              }
              disabled={
                googleLoading ||
                loading
              }
              className="mt-7 flex min-h-[52px] w-full items-center justify-center gap-3 border border-white/15 bg-[#0a0d0b] px-4 text-sm font-medium transition hover:border-white/30 hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-xs font-bold text-black">
                G
              </span>

              {googleLoading
                ? "Opening Google..."
                : "Continue with Google"}
            </button>

            {/* =================================================
                DIVIDER
            ================================================= */}

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />

              <span className="text-[10px] uppercase tracking-[0.16em] text-white/30">
                or
              </span>

              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={
                handleLogin
              }
              className="space-y-5"
            >
              {/* EMAIL */}

              <div>
                <label
                  htmlFor="login-email"
                  className="block text-sm font-medium text-[#f2f4ef]"
                >
                  Email
                </label>

                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(
                    event
                  ) => {
                    setEmail(
                      event
                        .target
                        .value
                    );

                    if (error) {
                      setError(
                        ""
                      );
                    }
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="mt-2 min-h-[52px] w-full rounded-md border border-white/15 bg-[#060807] px-4 text-[#f2f4ef] placeholder:text-white/25 transition hover:border-white/25 focus:border-[#c7ff39]/70 focus:outline-none focus:ring-1 focus:ring-[#c7ff39]/30"
                />
              </div>

              {/* PASSWORD */}

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-[#f2f4ef]"
                >
                  Password
                </label>

                <div className="relative mt-2">
                  <input
                    id="login-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      password
                    }
                    onChange={(
                      event
                    ) => {
                      setPassword(
                        event
                          .target
                          .value
                      );

                      if (
                        error
                      ) {
                        setError(
                          ""
                        );
                      }
                    }}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="min-h-[52px] w-full rounded-md border border-white/15 bg-[#060807] px-4 pr-12 text-[#f2f4ef] placeholder:text-white/25 transition hover:border-white/25 focus:border-[#c7ff39]/70 focus:outline-none focus:ring-1 focus:ring-[#c7ff39]/30"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (
                          current
                        ) =>
                          !current
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center text-[#a1a1aa] transition hover:text-white focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff
                        size={
                          17
                        }
                        strokeWidth={
                          1.5
                        }
                      />
                    ) : (
                      <Eye
                        size={
                          17
                        }
                        strokeWidth={
                          1.5
                        }
                      />
                    )}
                  </button>
                </div>

                {/* FORGOT PASSWORD */}

                <div className="mt-2 flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-[#c7ff39] transition hover:underline focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]"
                  >
                    Forgot
                    password?
                  </Link>
                </div>
              </div>

              {/* SIGN IN */}

              <button
                type="submit"
                disabled={
                  loading ||
                  googleLoading
                }
                className="flex min-h-[52px] w-full items-center justify-center bg-[#c7ff39] px-5 font-semibold text-[#071008] transition hover:bg-[#d2ff64] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]"
              >
                {loading
                  ? "Signing in..."
                  : "Sign in →"}
              </button>
            </form>

            {/* CREATE ACCOUNT */}

            <p className="mt-7 text-center text-sm text-[#a1a1aa]">
              New to
              SkillSwap+?{" "}

              <Link
                to="/signup"
                className="font-medium text-[#c7ff39] transition hover:underline"
              >
                Create an
                account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}