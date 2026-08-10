import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ChooseUsername() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        navigate("/login", { replace: true });
        return;
      }

      setUser(authUser);
    };

    loadUser();
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanUsername = username.trim().toLowerCase();

    if (!/^[a-zA-Z0-9._]{3,20}$/.test(cleanUsername)) {
      setError(
        "Username must be 3–20 characters using letters, numbers, dots or underscores."
      );
      return;
    }

    if (!user) return;

    try {
      setSaving(true);
      setError("");

      const { data: existing, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", cleanUsername)
        .neq("id", user.id)
        .limit(1);

      if (checkError) throw checkError;

      if (existing?.length) {
        setError("That username is already taken.");
        return;
      }

      const metadata = user.user_metadata || {};

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            username: cleanUsername,
            full_name:
              metadata.full_name ||
              metadata.name ||
              user.email?.split("@")[0] ||
              "SkillSwap Member",
            avatar_url: metadata.avatar_url || metadata.picture || null,
            is_active: true,
            profile_completed: false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (profileError) throw profileError;

      navigate("/profile-setup", { replace: true });
    } catch (err) {
      console.error("Choose username error:", err);
      setError("We couldn't save your username. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#060807] px-5 text-[#f2f4ef]">
      <div className="noise pointer-events-none fixed inset-0" />

      <div className="relative z-10 w-full max-w-lg border border-white/10 bg-[#0a0d0b]/90 p-7 md:p-10">
        <p className="text-xs uppercase tracking-[0.18em] text-[#c7ff39]">
          One last detail
        </p>

        <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em]">
          Choose your username.
        </h1>

        <p className="mt-3 text-sm leading-6 text-[#a1a1aa]">
          Google gave us your account details. Choose a unique SkillSwap+
          username before completing your profile.
        </p>

        {error && (
          <div className="mt-6 border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.04] px-4 py-3 text-sm text-[#ff8b8b]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-7">
          <label className="block text-sm font-medium">
            Username

            <div className="relative mt-2">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a1a1aa]">
                @
              </span>

              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="your.username"
                autoComplete="username"
                className="min-h-[52px] w-full rounded-md border border-white/15 bg-[#060807] pl-9 pr-4 text-[#f2f4ef] placeholder:text-white/25 transition hover:border-white/25 focus:border-[#c7ff39]/70 focus:outline-none focus:ring-1 focus:ring-[#c7ff39]/30"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={saving}
            className="mt-5 min-h-[52px] w-full bg-[#c7ff39] px-5 font-semibold text-[#071008] transition hover:bg-[#d2ff64] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]"
          >
            {saving ? "Saving..." : "Continue →"}
          </button>
        </form>
      </div>
    </main>
  );
}
