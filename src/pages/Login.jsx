import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const routeUser = async (user) => {
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("profile_completed")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      console.error(
        "Profile check error:",
        profileError
      );

      throw new Error("PROFILE_CHECK_FAILED");
    }

    if (!profile?.profile_completed) {
      navigate("/profile-setup", {
        replace: true,
      });

      return;
    }

    navigate("/dashboard", {
      replace: true,
    });
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError(
        "Enter your email and password."
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      const {
        data,
        error: loginError,
      } =
        await supabase.auth.signInWithPassword({
          email: email
            .trim()
            .toLowerCase(),

          password,
        });

      if (loginError) {
        console.error(
          "Login error:",
          loginError
        );

        setError(
          "Invalid email or password."
        );

        return;
      }

      if (!data?.user) {
        setError(
          "We couldn't sign you in. Please try again."
        );

        return;
      }

      await routeUser(data.user);
    } catch (err) {
      console.error(
        "Login flow error:",
        err
      );

      setError(
        "We couldn't sign you in right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError("");

      const {
        error: googleError,
      } =
        await supabase.auth.signInWithOAuth({
          provider: "google",

          options: {
            redirectTo:
              `${window.location.origin}/auth/callback`,
          },
        });

      if (googleError) {
        console.error(
          "Google login error:",
          googleError
        );

        setError(
          "Google sign-in could not be started."
        );

        setGoogleLoading(false);
      }
    } catch (err) {
      console.error(
        "Google login error:",
        err
      );

      setError(
        "Google sign-in could not be started."
      );

      setGoogleLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#060807] text-[#f2f4ef]">
      <div className="noise pointer-events-none fixed inset-0" />

      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 22% 38%, rgba(199,255,57,.08), transparent 42%)",
        }}
      />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-2">
        {/* LEFT */}

        <section className="hidden border-r border-white/10 px-10 py-10 lg:flex lg:flex-col lg:justify-between">
          <Link
            to="/"
            className="w-fit text-lg font-semibold tracking-[-0.03em] text-[#f2f4ef]"
          >
            SKILLSWAP
            <span className="text-[#c7ff39]">
              +
            </span>
          </Link>

          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.18em] text-[#c7ff39]">
              Welcome back
            </p>

            <h1 className="mt-5 text-5xl font-medium leading-[1.02] tracking-[-0.055em] xl:text-7xl">
              Learn what you need.
              <br />
              Share what you know.
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-[#a1a1aa]">
              Sign in to continue your
              SkillSwap+ journey, connect
              with members, learn new skills
              and earn SS Credits by teaching.
            </p>
          </div>

          <p className="text-xs text-white/30">
            © 2026 SkillSwap+
          </p>
        </section>

        {/* RIGHT */}

        <section className="flex min-h-screen items-center justify-center px-5 py-24 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <Link
              to="/"
              className="mb-12 inline-block text-lg font-semibold tracking-[-0.03em] lg:hidden"
            >
              SKILLSWAP
              <span className="text-[#c7ff39]">
                +
              </span>
            </Link>

            <p className="text-xs uppercase tracking-[0.18em] text-[#c7ff39]">
              Sign in
            </p>

            <h2 className="mt-3 text-4xl font-medium tracking-[-0.045em]">
              Continue to SkillSwap+.
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#a1a1aa]">
              Enter your account details or
              continue with Google.
            </p>

            {/* ERROR */}

            {error && (
              <div
                role="alert"
                className="mt-6 border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.04] px-4 py-3 text-sm text-[#ff8b8b]"
              >
                {error}
              </div>
            )}

            {/* GOOGLE */}

            <button
              type="button"
              onClick={handleGoogleLogin}
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

            {/* DIVIDER */}

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />

              <span className="text-[10px] uppercase tracking-[0.16em] text-white/30">
                or
              </span>

              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* LOGIN FORM */}

            <form
              onSubmit={handleLogin}
              className="space-y-5"
            >
              {/* EMAIL */}

              <label className="block text-sm font-medium">
                Email

                <input
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
              </label>

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
                    value={password}
                    onChange={(event) => {
                      setPassword(
                        event.target.value
                      );

                      if (error) {
                        setError("");
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
                        (current) =>
                          !current
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center text-[#a1a1aa] transition hover:text-white"
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

                {/* FORGOT PASSWORD */}

                <div className="mt-2 flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-[#c7ff39] transition hover:underline focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]"
                  >
                    Forgot password?
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

            {/* SIGN UP */}

            <p className="mt-7 text-center text-sm text-[#a1a1aa]">
              New to SkillSwap+?{" "}

              <Link
                to="/signup"
                className="font-medium text-[#c7ff39] hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}