import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  const [message, setMessage] =
    useState("Completing Google sign-in...");

  const [accountNotFound, setAccountNotFound] =
    useState(false);

  const [secondsLeft, setSecondsLeft] =
    useState(5);

  useEffect(() => {
    let active = true;

    const clearGoogleIntent = () => {
      localStorage.removeItem(
        "googleAuthIntent"
      );
    };

    /* =========================================================
       ACCOUNT NOT FOUND
    ========================================================= */

    const showAccountNotFound = () => {
      if (!active) return;

      clearGoogleIntent();

      setAccountNotFound(true);

      setMessage(
        "Account not found. Please create an account first to continue."
      );

      setSecondsLeft(5);

      /*
        Countdown shown to user
      */

      const countdown =
        window.setInterval(() => {
          setSecondsLeft(
            (current) => {
              if (current <= 1) {
                window.clearInterval(
                  countdown
                );

                return 0;
              }

              return current - 1;
            }
          );
        }, 1000);

      /*
        Redirect after 5 seconds
      */

      window.setTimeout(() => {
        window.clearInterval(
          countdown
        );

        navigate(
          "/signup",
          {
            replace: true,
          }
        );
      }, 5000);
    };

    /* =========================================================
       ROUTE EXISTING USER
    ========================================================= */

    const routeExistingUser =
      async (user) => {
        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            `
              id,
              username,
              profile_completed,
              is_active
            `
          )
          .eq(
            "id",
            user.id
          )
          .maybeSingle();

        if (profileError) {
          console.error(
            "OAuth profile check error:",
            profileError
          );

          throw profileError;
        }

        /*
          Extra protection.

          Google login should only work
          for an existing SkillSwap+ account.
        */

        if (
          !profile ||
          !profile.username
        ) {
          await supabase.auth.signOut({
            scope: "local",
          });

          showAccountNotFound();

          return;
        }

        /* Disabled account */

        if (
          profile.is_active === false
        ) {
          clearGoogleIntent();

          await supabase.auth.signOut({
            scope: "local",
          });

          if (active) {
            setMessage(
              "This SkillSwap+ account is currently unavailable."
            );
          }

          return;
        }

        /* Existing but onboarding unfinished */

        if (
          !profile.profile_completed
        ) {
          clearGoogleIntent();

          navigate(
            "/profile-setup",
            {
              replace: true,
            }
          );

          return;
        }

        /* Normal existing user */

        clearGoogleIntent();

        navigate(
          "/dashboard",
          {
            replace: true,
          }
        );
      };

    /* =========================================================
       FINISH GOOGLE AUTH
    ========================================================= */

    const finishOAuth = async () => {
      try {
        /*
          Supabase may return an OAuth error
          in the query string.
        */

        const searchParams =
          new URLSearchParams(
            window.location.search
          );

        /*
          Some OAuth responses may use the
          hash instead.
        */

        const hashParams =
          new URLSearchParams(
            window.location.hash.replace(
              /^#/,
              ""
            )
          );

        const getParameter = (
          key
        ) =>
          searchParams.get(key) ??
          hashParams.get(key);

        const oauthError =
          getParameter("error");

        const oauthErrorCode =
          getParameter(
            "error_code"
          );

        const oauthErrorDescription =
          getParameter(
            "error_description"
          ) || "";

        console.log(
          "OAuth error:",
          oauthError
        );

        console.log(
          "OAuth error code:",
          oauthErrorCode
        );

        console.log(
          "OAuth description:",
          oauthErrorDescription
        );

        /* =====================================================
           NEW GOOGLE ACCOUNT BLOCKED
        ===================================================== */

        if (oauthError) {
          const normalizedDescription =
            oauthErrorDescription
              .toLowerCase();

          if (
            normalizedDescription.includes(
              "google_account_not_registered"
            ) ||
            normalizedDescription.includes(
              "not registered"
            )
          ) {
            showAccountNotFound();

            return;
          }

          /*
            If Google login was explicitly
            started from Login and Supabase
            rejected user creation, also treat
            it as account not found.
          */

          const intent =
            localStorage.getItem(
              "googleAuthIntent"
            );

          if (
            intent === "login" &&
            (
              oauthErrorCode ===
                "hook_rejected" ||
              oauthError ===
                "access_denied" ||
              oauthErrorDescription
                .toLowerCase()
                .includes(
                  "hook"
                )
            )
          ) {
            showAccountNotFound();

            return;
          }

          throw new Error(
            oauthErrorDescription ||
              oauthError
          );
        }

        /* =====================================================
           PKCE CODE
        ===================================================== */

        const code =
          searchParams.get(
            "code"
          );

        if (code) {
          setMessage(
            "Verifying Google account..."
          );

          const {
            data,
            error,
          } =
            await supabase.auth
              .exchangeCodeForSession(
                code
              );

          if (error) {
            console.error(
              "OAuth code exchange error:",
              error
            );

            /*
              If Supabase reports our
              server-side rejection here.
            */

            const errorMessage =
              error.message
                ?.toLowerCase() ||
              "";

            if (
              errorMessage.includes(
                "google_account_not_registered"
              )
            ) {
              showAccountNotFound();

              return;
            }

            throw error;
          }

          if (
            data?.user
          ) {
            await routeExistingUser(
              data.user
            );

            return;
          }
        }

        /* =====================================================
           EXISTING SESSION
        ===================================================== */

        const {
          data: {
            session,
          },
          error:
            sessionError,
        } =
          await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (
          session?.user
        ) {
          await routeExistingUser(
            session.user
          );

          return;
        }

        /*
          Google login was requested but
          there is no resulting session.
        */

        const intent =
          localStorage.getItem(
            "googleAuthIntent"
          );

        if (
          intent === "login"
        ) {
          showAccountNotFound();

          return;
        }

        clearGoogleIntent();

        if (active) {
          setMessage(
            "We couldn't complete Google sign-in."
          );
        }
      } catch (err) {
        console.error(
          "OAuth callback error:",
          err
        );

        /*
          Our custom server rejection
        */

        const errorMessage =
          err?.message
            ?.toLowerCase() ||
          "";

        if (
          errorMessage.includes(
            "google_account_not_registered"
          )
        ) {
          showAccountNotFound();

          return;
        }

        clearGoogleIntent();

        if (active) {
          setMessage(
            "We couldn't complete Google sign-in."
          );
        }
      }
    };

    finishOAuth();

    return () => {
      active = false;
    };
  }, [navigate]);

  /* =========================================================
     ACCOUNT NOT FOUND SCREEN
  ========================================================= */

  if (accountNotFound) {
    return (
      <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#060807] px-5 text-[#f2f4ef]">
        <div className="noise pointer-events-none fixed inset-0" />

        <div
          className="pointer-events-none fixed inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 45%, rgba(255,107,107,.07), transparent 38%)",
          }}
        />

        <div className="relative z-10 w-full max-w-lg border border-[#ff6b6b]/25 bg-[#0a0d0b]/90 p-7 sm:p-9">
          <div className="grid h-12 w-12 place-items-center border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.05] text-[#ff8b8b]">
            <AlertCircle
              size={21}
              strokeWidth={1.6}
            />
          </div>

          <p className="mt-6 text-xs uppercase tracking-[0.18em] text-[#ff8b8b]">
            Account not found
          </p>

          <h1 className="mt-3 text-3xl font-medium tracking-[-0.04em]">
            Create an account first.
          </h1>

          <p className="mt-4 text-sm leading-6 text-[#a1a1aa]">
            We couldn't find a registered
            SkillSwap+ account connected to
            this Google email.
          </p>

          <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">
            Please create a SkillSwap+
            account before using Google to
            sign in.
          </p>

          <div className="mt-7 border border-white/10 bg-white/[0.02] px-4 py-3">
            <p className="text-xs text-[#a1a1aa]">
              Redirecting to signup in{" "}
              <span className="font-semibold text-[#c7ff39]">
                {secondsLeft}
              </span>{" "}
              seconds...
            </p>
          </div>

          <Link
            to="/signup"
            className="mt-5 flex min-h-[50px] w-full items-center justify-center bg-[#c7ff39] px-5 text-sm font-semibold text-[#071008] transition hover:bg-[#d2ff64]"
          >
            Create account now →
          </Link>

          <Link
            to="/login"
            className="mt-3 flex min-h-[48px] w-full items-center justify-center border border-white/15 text-sm text-[#a1a1aa] transition hover:border-white/30 hover:text-white"
          >
            Back to sign in
          </Link>
        </div>
      </main>
    );
  }

  /* =========================================================
     NORMAL CALLBACK LOADING
  ========================================================= */

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#060807] px-5 text-[#f2f4ef]">
      <div className="noise pointer-events-none fixed inset-0" />

      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(199,255,57,.07), transparent 38%)",
        }}
      />

      <div className="relative z-10 text-center">
        <div className="mx-auto mb-5 h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-[#c7ff39]" />

        <p className="text-xs uppercase tracking-[0.18em] text-[#a1a1aa]">
          {message}
        </p>
      </div>
    </main>
  );
}