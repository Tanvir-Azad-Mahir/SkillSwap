import { useEffect, useMemo, useState } from "react";
import { Pencil, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

import DashboardHeader from "../components/DashboardHeader";
import WelcomePanel from "../components/WelcomePanel";
import QuickActions from "../components/QuickActions";
import SkillSection from "../components/SkillSection";
import UpcomingSessions from "../components/UpcomingSessions";
import CreditActivity from "../components/CreditActivity";
import DashboardStats from "../components/DashboardStats";
import DashboardCourses from "../components/DashboardCourses";
import RecommendedMentors from "../components/RecommendedMentors";

const TEACH_TYPE = "offering";

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [teaching, setTeaching] = useState([]);
  const [learning, setLearning] = useState([]);
  const [mentorProfiles, setMentorProfiles] = useState([]);
  const [mentorOfferings, setMentorOfferings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // Course system is not connected to a database yet.
  // These arrays keep the dashboard ready for that feature.
  const [takenCourses] = useState([]);
  const [finishedCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!authUser) {
          navigate("/login", { replace: true });
          return;
        }

        setUser(authUser);

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            "id, username, full_name, avatar_url, role, career_goal, location, profile_completed"
          )
          .eq("id", authUser.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profileData?.profile_completed) {
          navigate("/profile-setup", { replace: true });
          return;
        }

        if (!active) return;
        setProfile(profileData);

        const results = await Promise.all([
          supabase
            .from("skills")
            .select("id, name, description, difficulty_level")
            .eq("is_active", true)
            .order("name"),

          supabase
            .from("user_skills")
            .select(
              "id, skill_id, proficiency_level, years_experience, is_verified"
            )
            .eq("user_id", authUser.id)
            .eq("type", TEACH_TYPE),

          supabase
            .from("user_interests")
            .select("id, skill_id, interest_text, weight")
            .eq("user_id", authUser.id),

          supabase
            .from("sessions")
            .select(
              "id, learner_id, mentor_id, skill_id, scheduled_at, duration_minutes, meeting_url, status"
            )
            .or(`learner_id.eq.${authUser.id},mentor_id.eq.${authUser.id}`)
            .order("scheduled_at", { ascending: true })
            .limit(10),

          supabase
            .from("credit_wallets")
            .select("id, balance, total_earned, total_spent")
            .eq("user_id", authUser.id)
            .maybeSingle(),

          supabase
            .from("credit_transactions")
            .select("id, amount, transaction_type, description, created_at")
            .eq("user_id", authUser.id)
            .order("created_at", { ascending: false })
            .limit(8),

          // Active mentors + swap masters for dashboard search
          supabase
            .from("profiles")
            .select("id, username, full_name, avatar_url, role, bio, location")
            .eq("is_active", true)
            .in("role", ["mentor", "swap_master"])
            .neq("id", authUser.id)
            .order("full_name")
            .limit(100),

          // Teaching skills for mentor matching
          supabase
            .from("user_skills")
            .select(
              "id, user_id, skill_id, proficiency_level, years_experience, is_verified"
            )
            .eq("type", TEACH_TYPE),
        ]);

        if (!active) return;

        const [
          skillsResult,
          teachingResult,
          learningResult,
          sessionsResult,
          walletResult,
          transactionsResult,
          mentorsResult,
          mentorOfferingsResult,
        ] = results;

        if (skillsResult.error) console.error("Skills:", skillsResult.error);
        else setSkills(skillsResult.data || []);

        if (teachingResult.error)
          console.error("Teaching:", teachingResult.error);
        else setTeaching(teachingResult.data || []);

        if (learningResult.error)
          console.error("Learning:", learningResult.error);
        else setLearning(learningResult.data || []);

        if (sessionsResult.error)
          console.error("Sessions:", sessionsResult.error);
        else {
          const now = Date.now();

          setSessions(
            (sessionsResult.data || []).filter((item) => {
              if (!item.scheduled_at) return false;

              const status = String(item.status || "").toLowerCase();

              return (
                new Date(item.scheduled_at).getTime() >= now &&
                !["completed", "cancelled", "canceled"].includes(status)
              );
            })
          );
        }

        if (walletResult.error)
          console.error("Wallet:", walletResult.error);
        else setWallet(walletResult.data || null);

        if (transactionsResult.error)
          console.error("Transactions:", transactionsResult.error);
        else setTransactions(transactionsResult.data || []);

        if (mentorsResult.error)
          console.error("Mentors:", mentorsResult.error);
        else setMentorProfiles(mentorsResult.data || []);

        if (mentorOfferingsResult.error)
          console.error("Mentor offerings:", mentorOfferingsResult.error);
        else setMentorOfferings(mentorOfferingsResult.data || []);
      } catch (err) {
        console.error("Dashboard load error:", err);

        if (active) {
          setError(
            "We couldn't load your dashboard right now. Please refresh and try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [navigate]);

  const skillMap = useMemo(
    () => new Map(skills.map((skill) => [skill.id, skill])),
    [skills]
  );

  const learningItems = useMemo(
    () =>
      learning
        .map((item) => ({
          ...item,
          skill: skillMap.get(item.skill_id),
        }))
        .sort((a, b) => Number(b.weight || 0) - Number(a.weight || 0)),
    [learning, skillMap]
  );

  const teachingItems = useMemo(
    () =>
      teaching.map((item) => ({
        ...item,
        skill: skillMap.get(item.skill_id),
      })),
    [teaching, skillMap]
  );

  const sessionItems = useMemo(
    () =>
      sessions.map((item) => ({
        ...item,
        skill: skillMap.get(item.skill_id),
        viewerRole: item.mentor_id === user?.id ? "Mentor" : "Learner",
      })),
    [sessions, skillMap, user]
  );

  const mentors = useMemo(() => {
    const offeringsByUser = new Map();

    mentorOfferings.forEach((offering) => {
      const list = offeringsByUser.get(offering.user_id) || [];

      list.push({
        ...offering,
        skill: skillMap.get(offering.skill_id),
      });

      offeringsByUser.set(offering.user_id, list);
    });

    return mentorProfiles.map((mentor) => ({
      ...mentor,
      teachingSkills: offeringsByUser.get(mentor.id) || [],
    }));
  }, [mentorProfiles, mentorOfferings, skillMap]);

  const handleLogout = async () => {
    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      console.error("Logout error:", logoutError);
      return;
    }

    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#060807] text-[#f2f4ef]">
        <div className="noise pointer-events-none fixed inset-0" />

        <div className="relative z-10 text-center">
          <div className="mx-auto mb-5 h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-[#c7ff39]" />

          <p className="text-xs uppercase tracking-[0.18em] text-[#a1a1aa]">
            Loading dashboard
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#060807] text-[#f2f4ef]">
      <div className="noise pointer-events-none fixed inset-0 z-0" />

      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 78% 5%, rgba(199,255,57,.06), transparent 36%)",
        }}
      />

      <div className="relative z-10">
        <DashboardHeader
          profile={profile}
          skills={skills}
          mentors={mentors}
          learningSkills={learning}
          teachingSkills={teaching}
          onLogout={handleLogout}
        />

        <div className="mx-auto max-w-[1500px] px-5 pb-20 pt-24 md:px-8 lg:px-10 lg:pt-28">
          {error && (
            <div className="mb-6 border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.04] px-4 py-3 text-sm text-[#ff8b8b]">
              {error}
            </div>
          )}

          <div className="relative">
            <WelcomePanel profile={profile} wallet={wallet} />
          </div>

          <QuickActions role={profile?.role} navigate={navigate} />

          <DashboardStats
            takenCourses={takenCourses.length}
            finishedCourses={finishedCourses.length}
            upcomingSessions={sessionItems.length}
            credits={wallet?.balance ?? 0}
          />

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_.75fr]">
            <div className="grid gap-6 lg:grid-cols-2">
              <SkillSection
                type="learning"
                title="Learning"
                eyebrow="Your focus"
                items={learningItems}
                onAdd={() =>
                  navigate("/profile/edit?tab=learning")
                }
              />

              <SkillSection
                type="teaching"
                title="Teaching"
                eyebrow="What you share"
                items={teachingItems}
                onAdd={() =>
                  navigate("/profile/edit?tab=teaching")
                }
              />
            </div>

            <div className="space-y-6">
              <UpcomingSessions sessions={sessionItems} />

              <CreditActivity
                wallet={wallet}
                transactions={transactions}
              />
            </div>
          </div>

          <DashboardCourses
            title="Taken courses"
            eyebrow="Continue learning"
            type="taken"
            courses={takenCourses}
            emptyTitle="You haven't taken a course yet."
            emptyText="Courses you enroll in will appear here with progress and mentor details."
            actionLabel="Explore courses"
            onAction={() => {}}
          />

          <DashboardCourses
            title="Finished courses"
            eyebrow="Your achievements"
            type="finished"
            courses={finishedCourses}
            emptyTitle="No finished courses yet."
            emptyText="Completed courses will appear here with completion date and certificates."
            actionLabel="View learning skills"
            onAction={() =>
              navigate("/profile/edit?tab=learning")
            }
          />

          <RecommendedMentors
            mentors={mentors}
            onEditLearning={() =>
              navigate("/profile/edit?tab=learning")
            }
          />

          <section className="mt-8 border border-white/10 bg-[#0a0d0b]/70 p-6 md:p-8">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div>
                <p className="text-[10px] uppercase tracking-[0.17em] text-[#a1a1aa]">
                  Keep your profile accurate
                </p>

                <h2 className="mt-2 text-2xl font-medium tracking-[-0.035em]">
                  Better profile. Better matches.
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a1a1aa]">
                  Update your teaching skills, learning interests, bio and
                  preferences whenever your goals change.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/profile/edit?tab=profile")
                }
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 bg-[#c7ff39] px-5 text-sm font-semibold text-[#071008] transition hover:bg-[#d4ff66]"
              >
                Edit profile
                <ArrowRight size={15} />
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
