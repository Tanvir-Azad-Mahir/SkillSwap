import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  AlertCircle,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import { useTheme } from "../lib/ThemeContext";

export default function AuthCallback() {
  const navigate =
    useNavigate();
  const { setTheme } = useTheme();

  const [
    message,
    setMessage,
  ] = useState(
    "Completing Google sign-in..."
  );

  const [
    accountNotFound,
    setAccountNotFound,
  ] = useState(false);

  const [
    secondsLeft,
    setSecondsLeft,
  ] = useState(5);

  const intervalRef =
    useRef(null);

  const timeoutRef =
    useRef(null);

  /* =========================================================
     CLEAR TIMERS
  ========================================================= */

  const clearTimers = () => {
    if (
      intervalRef.current
    ) {
      window.clearInterval(
        intervalRef.current
      );

      intervalRef.current =
        null;
    }

    if (
      timeoutRef.current
    ) {
      window.clearTimeout(
        timeoutRef.current
      );

      timeoutRef.current =
        null;
    }
  };

  /* =========================================================
     CALLBACK
  ========================================================= */

  useEffect(() => {
    let active = true;

    /* =======================================================
       GOOGLE INTENT
    ======================================================= */

    const clearGoogleIntent =
      () => {
        localStorage.removeItem(
          "googleAuthIntent"
        );
      };

    /* =======================================================
       ACCOUNT NOT FOUND
    ======================================================= */

    const showAccountNotFound =
      async () => {
        if (!active) {
          return;
        }

        clearTimers();

        clearGoogleIntent();

        /*
          Make sure no temporary local
          session remains.
        */

        try {
          await supabase.auth.signOut({
            scope: "local",
          });
        } catch (signOutError) {
          console.warn(
            "Temporary session cleanup failed:",
            signOutError
          );
        }

        if (!active) {
          return;
        }

        setAccountNotFound(
          true
        );

        setMessage(
          "Account not found. Please create an account first to continue."
        );

        setSecondsLeft(5);

        /* COUNTDOWN */

        intervalRef.current =
          window.setInterval(
            () => {
              setSecondsLeft(
                (current) => {
                  if (
                    current <=
                    1
                  ) {
                    if (
                      intervalRef.current
                    ) {
                      window.clearInterval(
                        intervalRef.current
                      );

                      intervalRef.current =
                        null;
                    }

                    return 0;
                  }

                  return (
                    current -
                    1
                  );
                }
              );
            },
            1000
          );

        /* REDIRECT */

        timeoutRef.current =
          window.setTimeout(
            () => {
              clearTimers();

              if (
                !active
              ) {
                return;
              }

              navigate(
                "/signup",
                {
                  replace: true,
                }
              );
            },
            5000
          );
      };

    /* =======================================================
       ROUTE EXISTING SKILLSWAP USER
    ======================================================= */

    const routeExistingUser =
      async (user) => {
        if (!user?.id) {
          throw new Error(
            "GOOGLE_USER_MISSING"
          );
        }

        console.log(
          "GOOGLE AUTH USER:",
          user.id,
          user.email
        );

        const {
          data: settings,
          error: settingsError,
        } = await supabase
          .from("user_settings")
          .select("theme")
          .eq("user_id", user.id)
          .maybeSingle();

        if (settingsError) {
          console.warn("GOOGLE THEME LOAD ERROR:", settingsError);
        } else if (
          settings?.theme === "dark" ||
          settings?.theme === "light" ||
          settings?.theme === "system"
        ) {
          setTheme(settings.theme);
        }

        /* ===============================================
           PROFILE
        =============================================== */

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
          "GOOGLE PROFILE:",
          profile
        );

        if (
          profileError
        ) {
          console.error(
            "OAuth profile check error:",
            profileError
          );

          throw profileError;
        }

        /* ===============================================
           NO SKILLSWAP PROFILE

           Google registration is NOT allowed.
        =============================================== */

        if (
          !profile ||
          !profile.username
        ) {
          console.log(
            "No existing SkillSwap+ profile found."
          );

          await showAccountNotFound();

          return;
        }

        /* ===============================================
           INACTIVE ACCOUNT
        =============================================== */

        if (
          profile.is_active ===
          false
        ) {
          clearGoogleIntent();

          await supabase.auth.signOut({
            scope: "local",
          });

          if (
            active
          ) {
            setMessage(
              "This SkillSwap+ account is currently unavailable."
            );
          }

          return;
        }

        /* ===============================================
           PROFILE NOT COMPLETED
        =============================================== */

        if (
          profile.profile_completed !==
          true
        ) {
          clearGoogleIntent();

          console.log(
            "Google user profile incomplete -> profile setup"
          );

          navigate(
            "/profile-setup",
            {
              replace: true,
            }
          );

          return;
        }

        /* ===============================================
           COMPLETED PROFILE
        =============================================== */

        clearGoogleIntent();

        console.log(
          "Google user profile complete -> dashboard"
        );

        navigate(
          "/dashboard",
          {
            replace: true,
          }
        );
      };

    /* =======================================================
       FINISH GOOGLE AUTH
    ======================================================= */

    const finishOAuth =
      async () => {
        try {
          /* ===============================================
             QUERY PARAMETERS
          =============================================== */

          const searchParams =
            new URLSearchParams(
              window.location.search
            );

          const hashParams =
            new URLSearchParams(
              window.location.hash.replace(
                /^#/,
                ""
              )
            );

          const getParameter =
            (key) =>
              searchParams.get(
                key
              ) ??
              hashParams.get(
                key
              );

          const oauthError =
            getParameter(
              "error"
            );

          const oauthErrorCode =
            getParameter(
              "error_code"
            );

          const oauthErrorDescription =
            getParameter(
              "error_description"
            ) || "";

          const intent =
            localStorage.getItem(
              "googleAuthIntent"
            );

          console.log(
            "Google auth intent:",
            intent
          );

          console.log(
            "OAuth error:",
            oauthError
          );

          console.log(
            "OAuth error code:",
            oauthErrorCode
          );

          console.log(
            "OAuth error description:",
            oauthErrorDescription
          );

          /* ===============================================
             OAUTH ERROR
          =============================================== */

          if (
            oauthError
          ) {
            const normalized =
              oauthErrorDescription
                .toLowerCase();

            /*
              Our Supabase Before User Created
              hook blocks new Google users.
            */

            const isBlockedNewGoogleUser =
              normalized.includes(
                "google_account_not_registered"
              ) ||
              normalized.includes(
                "not registered"
              ) ||
              oauthErrorCode ===
                "hook_rejected" ||
              (
                intent ===
                  "login" &&
                normalized.includes(
                  "hook"
                )
              );

            if (
              isBlockedNewGoogleUser
            ) {
              await showAccountNotFound();

              return;
            }

            /*
              Google authorization was cancelled
              or another genuine OAuth error occurred.
            */

            clearGoogleIntent();

            throw new Error(
              oauthErrorDescription ||
                oauthError
            );
          }

          /* ===============================================
             PKCE CODE
          =============================================== */

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
              error:
                exchangeError,
            } =
              await supabase.auth
                .exchangeCodeForSession(
                  code
                );

            if (
              exchangeError
            ) {
              console.error(
                "OAuth code exchange error:",
                exchangeError
              );

              const exchangeMessage =
                String(
                  exchangeError.message ||
                    ""
                ).toLowerCase();

              if (
                exchangeMessage.includes(
                  "google_account_not_registered"
                ) ||
                exchangeMessage.includes(
                  "not registered"
                )
              ) {
                await showAccountNotFound();

                return;
              }

              throw exchangeError;
            }

            if (
              data?.user
            ) {
              await routeExistingUser(
                data.user
              );

              return;
            }

            if (
              data?.session
                ?.user
            ) {
              await routeExistingUser(
                data.session.user
              );

              return;
            }
          }

          /* ===============================================
             CHECK EXISTING SESSION

             This also handles cases where Supabase
             already processed the callback.
          =============================================== */

          const {
            data: {
              session,
            },
            error:
              sessionError,
          } =
            await supabase.auth
              .getSession();

          if (
            sessionError
          ) {
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

          /* ===============================================
             NO SESSION

             Do NOT automatically say "account not found"
             unless we have evidence the account was blocked.
          =============================================== */

          clearGoogleIntent();

          if (
            active
          ) {
            setMessage(
              "We couldn't complete Google sign-in. Please return to the login page and try again."
            );
          }
        } catch (err) {
          console.error(
            "OAuth callback error:",
            err
          );

          const errorMessage =
            String(
              err?.message ||
                ""
            ).toLowerCase();

          /* ===============================================
             BLOCKED GOOGLE REGISTRATION
          =============================================== */

          if (
            errorMessage.includes(
              "google_account_not_registered"
            ) ||
            errorMessage.includes(
              "not registered"
            )
          ) {
            await showAccountNotFound();

            return;
          }

          clearGoogleIntent();

          if (
            active
          ) {
            setMessage(
              err?.message ||
                "We couldn't complete Google sign-in."
            );
          }
        }
      };

    finishOAuth();

    /* =======================================================
       CLEANUP
    ======================================================= */

    return () => {
      active = false;

      clearTimers();
    };
  }, [navigate]);

  /* =========================================================
     ACCOUNT NOT FOUND
  ========================================================= */

  if (
    accountNotFound
  ) {
    return (
      <main className="auth-page relative grid min-h-screen place-items-center overflow-hidden bg-[#060807] px-5 text-[#f2f4ef]">
        {/* BACKGROUND */}

        <div className="noise pointer-events-none fixed inset-0" />

        <div
          className="pointer-events-none fixed inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 45%, rgba(255,107,107,.07), transparent 38%)",
          }}
        />

        {/* CARD */}

        <div className="relative z-10 w-full max-w-lg border border-[#ff6b6b]/25 bg-[#0a0d0b]/90 p-7 sm:p-9">
          <div className="grid h-12 w-12 place-items-center border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.05] text-[#ff8b8b]">
            <AlertCircle
              size={21}
              strokeWidth={
                1.6
              }
            />
          </div>

          <p className="mt-6 text-xs uppercase tracking-[0.18em] text-[#ff8b8b]">
            Account not
            found
          </p>

          <h1 className="mt-3 text-3xl font-medium tracking-[-0.04em]">
            Create an
            account first.
          </h1>

          <p className="mt-4 text-sm leading-6 text-[#a1a1aa]">
            Account not
            found. Please
            create an account
            first to continue.
          </p>

          <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">
            Google can only
            be used to sign
            in to an existing
            SkillSwap+
            account.
          </p>

          {/* COUNTDOWN */}

          <div className="mt-7 border border-white/10 bg-white/[0.02] px-4 py-3">
            <p className="text-xs text-[#a1a1aa]">
              Redirecting to
              signup in{" "}

              <span className="font-semibold text-[#c7ff39]">
                {
                  secondsLeft
                }
              </span>{" "}
              seconds...
            </p>
          </div>

          {/* SIGNUP */}

          <Link
            to="/signup"
            className="mt-5 flex min-h-[50px] w-full items-center justify-center bg-[#c7ff39] px-5 text-sm font-semibold text-[#071008] transition hover:bg-[#d2ff64]"
          >
            Create account
            now →
          </Link>

          {/* LOGIN */}

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
     NORMAL CALLBACK
  ========================================================= */

  return (
    <main className="auth-page relative grid min-h-screen place-items-center overflow-hidden bg-[#060807] px-5 text-[#f2f4ef]">
      <div className="noise pointer-events-none fixed inset-0" />

      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(199,255,57,.07), transparent 38%)",
        }}
      />

      <div className="relative z-10 max-w-lg text-center">
        <div className="mx-auto mb-5 h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-[#c7ff39]" />

        <p className="text-xs uppercase tracking-[0.18em] text-[#a1a1aa]">
          {message}
        </p>

        {message.includes(
          "couldn't complete"
        ) && (
          <Link
            to="/login"
            className="mt-6 inline-flex min-h-[46px] items-center justify-center border border-white/15 px-5 text-sm text-[#f2f4ef] transition hover:border-white/30"
          >
            Return to sign in
          </Link>
        )}
      </div>
    </main>
  );
}