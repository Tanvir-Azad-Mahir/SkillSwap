import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Completing sign in...");

  useEffect(() => {
    let active = true;

    const routeUser = async (user) => {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("username, profile_completed")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("OAuth profile check error:", profileError);
        throw profileError;
      }

      // First-time Google user: no SkillSwap username yet.
      if (!profile?.username) {
        navigate("/choose-username", { replace: true });
        return;
      }

      if (!profile.profile_completed) {
        navigate("/profile-setup", { replace: true });
        return;
      }

      navigate("/dashboard", { replace: true });
    };

    const finishOAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        // Supports PKCE if a code is present.
        if (code) {
          const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) throw error;

          if (data.user) {
            await routeUser(data.user);
            return;
          }
        }

        // Supports the normal browser/implicit session flow.
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session?.user) {
          await routeUser(session.user);
          return;
        }

        if (active) {
          setMessage("We couldn't complete Google sign-in.");
        }
      } catch (err) {
        console.error("OAuth callback error:", err);

        if (active) {
          setMessage("We couldn't complete Google sign-in.");
        }
      }
    };

    finishOAuth();

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#060807] px-5 text-[#f2f4ef]">
      <div className="noise pointer-events-none fixed inset-0" />

      <div className="relative z-10 text-center">
        <div className="mx-auto mb-5 h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-[#c7ff39]" />

        <p className="text-xs uppercase tracking-[0.18em] text-[#a1a1aa]">
          {message}
        </p>
      </div>
    </main>
  );
}
