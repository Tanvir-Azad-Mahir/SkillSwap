import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  BookOpen,
  CircleUserRound,
  GraduationCap,
  Loader2,
  RefreshCw,
  Repeat2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

function StatCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="admin-panel group p-5 transition hover:-translate-y-0.5 hover:border-[#c7ff39]/25">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[9px] uppercase tracking-[0.16em] text-[#a1a1aa]">
          {label}
        </p>

        <span className="grid h-8 w-8 place-items-center border border-[#c7ff39]/20 bg-[#c7ff39]/[0.06] transition group-hover:bg-[#c7ff39]/[0.12]">
          <Icon
            size={15}
            className="text-[#c7ff39]"
          />
        </span>
      </div>

      <p className="mt-4 text-3xl font-medium tracking-[-0.05em]">
        {value ?? 0}
      </p>
    </div>
  );
}

export default function AdminOverview() {
  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const load = useCallback(
    async ({
      silent = false,
    } = {}) => {
      try {
        if (!silent) {
          setLoading(true);
        }

        setError("");

        const {
          data: result,
          error: rpcError,
        } =
          await supabase.rpc(
            "admin_get_overview"
          );

        if (rpcError) {
          throw rpcError;
        }

        setData(result || {});
      } catch (err) {
        setError(
          err?.message ||
            "Could not load admin overview."
        );
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const refresh = async () => {
    if (refreshing) {
      return;
    }

    try {
      setRefreshing(true);
      await load({
        silent: true,
      });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="admin-page mx-auto max-w-[1450px] px-5 py-8 md:px-8 lg:px-10 lg:py-10">
      <div className="admin-page-header flex flex-col justify-between gap-5 border-b border-white/10 pb-7 md:flex-row md:items-end">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#c7ff39]">
            Administration
          </p>

          <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em]">
            Overview.
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-[#a1a1aa]">
            Platform-wide counts for users, courses, skills, mentorships, and swaps.
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex min-h-10 items-center justify-center gap-2 border border-white/10 px-4 text-xs text-[#a1a1aa] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39] disabled:opacity-50"
        >
          {refreshing ? (
            <Loader2
              size={14}
              className="animate-spin"
            />
          ) : (
            <RefreshCw size={14} />
          )}

          Refresh
        </button>
      </div>

      {error && (
        <div className="mt-6 border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.04] px-4 py-3 text-sm text-[#ff8b8b]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid min-h-[360px] place-items-center">
          <Loader2
            size={24}
            className="animate-spin text-[#c7ff39]"
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Users}
            label="Total users"
            value={
              data?.total_users
            }
          />

          <StatCard
            icon={CircleUserRound}
            label="Active users"
            value={
              data?.active_users
            }
          />

          <StatCard
            icon={GraduationCap}
            label="Learners"
            value={
              data?.learners
            }
          />

          <StatCard
            icon={ShieldCheck}
            label="Mentors"
            value={
              data?.mentors
            }
          />

          <StatCard
            icon={Repeat2}
            label="Swap Masters"
            value={
              data?.swap_masters
            }
          />

          <StatCard
            icon={Sparkles}
            label="Pending role requests"
            value={
              data?.pending_role_requests
            }
          />

          <StatCard
            icon={BookOpen}
            label="Pending courses"
            value={
              data?.pending_courses
            }
          />

          <StatCard
            icon={BookOpen}
            label="Active courses"
            value={
              data?.active_courses
            }
          />

          <StatCard
            icon={Sparkles}
            label="Active skills"
            value={
              data?.active_skills
            }
          />

          <StatCard
            icon={ShieldCheck}
            label="Completed mentorships"
            value={
              data?.completed_mentorships
            }
          />

          <StatCard
            icon={Repeat2}
            label="Completed swaps"
            value={
              data?.completed_swaps
            }
          />
        </div>
      )}
    </div>
  );
}
