import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Copy,
  Download,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export default function Certificate() {
  const navigate = useNavigate();
  const { certificateId } = useParams();

  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    const loadCertificate = async () => {
      try {
        setLoading(true);
        setError("");

        if (!certificateId) {
          throw new Error("CERTIFICATE_ID_MISSING");
        }

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          navigate("/login", { replace: true });
          return;
        }

        const { data, error: certificateError } = await supabase
          .from("certificates")
          .select(
            `
              id,
              enrollment_id,
              course_id,
              learner_id,
              instructor_id,
              learner_name,
              course_title,
              instructor_name,
              certificate_number,
              verification_code,
              final_score,
              issued_at
            `
          )
          .eq("id", certificateId)
          .maybeSingle();

        if (certificateError) throw certificateError;

        if (!data) {
          throw new Error("CERTIFICATE_NOT_FOUND");
        }

        if (
          data.learner_id !== user.id &&
          data.instructor_id !== user.id
        ) {
          throw new Error("CERTIFICATE_ACCESS_DENIED");
        }

        setCertificate(data);
      } catch (err) {
        console.error("CERTIFICATE LOAD ERROR:", err);

        const message = err?.message || "";

        if (message === "CERTIFICATE_NOT_FOUND") {
          setError("Certificate not found.");
        } else if (message === "CERTIFICATE_ACCESS_DENIED") {
          setError("You do not have access to this certificate.");
        } else if (message === "CERTIFICATE_ID_MISSING") {
          setError("Certificate ID is missing.");
        } else {
          setError(message || "The certificate could not be loaded.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadCertificate();
  }, [certificateId, navigate]);

  const copyValue = async (value, label) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);

      window.setTimeout(() => {
        setCopied("");
      }, 1800);
    } catch (err) {
      console.error("COPY ERROR:", err);
    }
  };

  const printCertificate = () => {
    window.print();
  };

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#060807] text-[#f2f4ef]">
        <div className="text-center">
          <Loader2
            size={28}
            className="mx-auto animate-spin text-[#c7ff39]"
          />

          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[#a1a1aa]">
            Loading certificate
          </p>
        </div>
      </main>
    );
  }

  if (error || !certificate) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#060807] px-5 text-[#f2f4ef]">
        <div className="w-full max-w-lg border border-white/10 bg-[#0a0d0b]/80 p-8 text-center">
          <Award size={30} className="mx-auto text-white/25" />

          <h1 className="mt-5 text-2xl font-medium">
            Certificate unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#a1a1aa]">
            {error || "This certificate could not be loaded."}
          </p>

          <button
            type="button"
            onClick={() => navigate("/my-courses")}
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 border border-white/10 px-5 text-sm text-[#f2f4ef] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39]"
          >
            <ArrowLeft size={15} />
            Back to My Courses
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#060807] text-[#f2f4ef]">
      <div className="noise pointer-events-none fixed inset-0 print:hidden" />

      <div
        className="pointer-events-none fixed inset-0 print:hidden"
        style={{
          background:
            "radial-gradient(ellipse at 80% 0%, rgba(199,255,57,.07), transparent 38%)",
        }}
      />

      <div className="relative z-10">
        {/* =================================================
            TOP BAR
        ================================================= */}

        <header className="border-b border-white/10 bg-[#060807]/90 backdrop-blur-xl print:hidden">
          <div className="mx-auto flex min-h-[72px] max-w-[1500px] items-center justify-between gap-4 px-5 md:px-8 lg:px-10">
            <button
              type="button"
              onClick={() => navigate("/my-courses")}
              className="inline-flex items-center gap-2 text-sm text-[#a1a1aa] transition hover:text-[#c7ff39]"
            >
              <ArrowLeft size={16} />
              My Courses
            </button>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => navigate("/certificates/verify")}
                className="inline-flex min-h-10 items-center justify-center gap-2 border border-white/10 px-4 text-xs font-medium text-[#f2f4ef] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39]"
              >
                <ShieldCheck size={14} />
                Verify certificate
              </button>

              <button
                type="button"
                onClick={printCertificate}
                className="inline-flex min-h-10 items-center justify-center gap-2 bg-[#c7ff39] px-4 text-xs font-semibold text-[#071008] transition hover:bg-[#d4ff66]"
              >
                <Download size={14} />
                Print / Save PDF
              </button>
            </div>
          </div>
        </header>

        {/* =================================================
            CERTIFICATE WRAPPER
        ================================================= */}

        <div className="mx-auto max-w-[1280px] px-5 py-10 md:px-8 lg:px-10 print:max-w-none print:p-0">
          <section
            id="certificate-sheet"
            className="relative mx-auto aspect-[1.414/1] w-full max-w-[1120px] overflow-hidden bg-[#f7f2e8] text-[#151912] shadow-[0_28px_80px_rgba(0,0,0,.45)] print:aspect-auto print:min-h-screen print:max-w-none print:shadow-none"
          >
            {/* Outer frame */}
            <div className="pointer-events-none absolute inset-4 border border-[#151912]/25 md:inset-6" />
            <div className="pointer-events-none absolute inset-7 border border-[#151912]/10 md:inset-10" />

            {/* Corner accents */}
            <div className="pointer-events-none absolute left-4 top-4 h-16 w-16 border-l-2 border-t-2 border-[#8cab21] md:left-6 md:top-6 md:h-24 md:w-24" />
            <div className="pointer-events-none absolute right-4 top-4 h-16 w-16 border-r-2 border-t-2 border-[#8cab21] md:right-6 md:top-6 md:h-24 md:w-24" />
            <div className="pointer-events-none absolute bottom-4 left-4 h-16 w-16 border-b-2 border-l-2 border-[#8cab21] md:bottom-6 md:left-6 md:h-24 md:w-24" />
            <div className="pointer-events-none absolute bottom-4 right-4 h-16 w-16 border-b-2 border-r-2 border-[#8cab21] md:bottom-6 md:right-6 md:h-24 md:w-24" />

            {/* Decorative wash */}
            <div
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{
                background:
                  "radial-gradient(circle at 50% 48%, rgba(199,255,57,.08), transparent 32%)",
              }}
            />

            <div className="relative z-10 flex h-full flex-col px-8 py-9 sm:px-12 sm:py-10 md:px-16 md:py-12 lg:px-20 lg:py-14 print:px-16 print:py-14">
              {/* Brand */}
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-[0.42em] text-[#73910f] sm:text-[10px] md:text-xs">
                  SkillSwap+
                </p>

                <div className="mx-auto mt-3 h-px w-20 bg-[#151912]/25 md:w-28" />

                <h1 className="mt-5 text-2xl font-medium uppercase tracking-[0.13em] sm:text-3xl md:text-4xl lg:text-5xl">
                  Certificate of Completion
                </h1>

                <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-[#151912]/50 sm:text-xs">
                  Achievement · Learning · Skill Exchange
                </p>
              </div>

              {/* Recipient */}
              <div className="flex flex-1 flex-col items-center justify-center py-6 text-center md:py-8">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#151912]/50 sm:text-xs">
                  This certificate is proudly presented to
                </p>

                <h2 className="mt-4 max-w-4xl text-3xl font-semibold tracking-[-0.035em] sm:text-4xl md:text-5xl lg:text-6xl">
                  {certificate.learner_name}
                </h2>

                <div className="mt-4 h-px w-36 bg-[#151912]/20 sm:w-48 md:w-64" />

                <p className="mt-6 max-w-3xl text-xs leading-6 text-[#151912]/60 sm:text-sm md:text-base md:leading-7">
                  has successfully completed all required learning activities and
                  received instructor approval for
                </p>

                <h3 className="mt-4 max-w-4xl text-2xl font-medium tracking-[-0.025em] text-[#73910f] sm:text-3xl md:text-4xl">
                  {certificate.course_title}
                </h3>

                {certificate.final_score !== null &&
                  certificate.final_score !== undefined && (
                    <div className="mt-5 inline-flex items-center gap-2 border border-[#151912]/15 px-4 py-2">
                      <span className="text-[9px] uppercase tracking-[0.14em] text-[#151912]/45 sm:text-[10px]">
                        Final Score
                      </span>

                      <span className="text-sm font-semibold text-[#151912] sm:text-base">
                        {certificate.final_score}/100
                      </span>
                    </div>
                  )}
              </div>

              {/* Signature / Date / Seal */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4 sm:gap-6 md:gap-10">
                <div className="text-center">
                  <p className="mx-auto max-w-[220px] truncate text-sm italic sm:text-base md:text-lg">
                    {certificate.instructor_name}
                  </p>

                  <div className="mx-auto mt-2 h-px max-w-[220px] bg-[#151912]/35" />

                  <p className="mt-2 text-[8px] uppercase tracking-[0.15em] text-[#151912]/45 sm:text-[9px]">
                    Instructor
                  </p>
                </div>

                {/* Seal */}
                <div className="relative grid h-20 w-20 place-items-center rounded-full border-2 border-[#73910f] text-center sm:h-24 sm:w-24 md:h-28 md:w-28">
                  <div className="absolute inset-1.5 rounded-full border border-[#73910f]/45" />

                  <div>
                    <Award
                      size={22}
                      className="mx-auto text-[#73910f] sm:h-6 sm:w-6"
                    />

                    <p className="mt-1 text-[7px] font-semibold uppercase tracking-[0.16em] text-[#73910f] sm:text-[8px]">
                      SkillSwap+
                    </p>

                    <p className="mt-0.5 text-[6px] uppercase tracking-[0.12em] text-[#151912]/50 sm:text-[7px]">
                      Verified
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm font-medium sm:text-base md:text-lg">
                    {formatDate(certificate.issued_at)}
                  </p>

                  <div className="mx-auto mt-2 h-px max-w-[220px] bg-[#151912]/35" />

                  <p className="mt-2 text-[8px] uppercase tracking-[0.15em] text-[#151912]/45 sm:text-[9px]">
                    Date Issued
                  </p>
                </div>
              </div>

              {/* Footer verification */}
              <div className="mt-7 grid gap-3 border-t border-[#151912]/12 pt-4 text-[8px] sm:grid-cols-2 sm:text-[9px] md:text-[10px]">
                <div className="min-w-0">
                  <p className="uppercase tracking-[0.12em] text-[#151912]/40">
                    Certificate Number
                  </p>

                  <div className="mt-1 flex items-center justify-center gap-2 sm:justify-start">
                    <p className="truncate font-mono text-[#151912]/70">
                      {certificate.certificate_number}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        copyValue(
                          certificate.certificate_number,
                          "certificate"
                        )
                      }
                      className="shrink-0 text-[#151912]/45 transition hover:text-[#73910f] print:hidden"
                      aria-label="Copy certificate number"
                    >
                      {copied === "certificate" ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="min-w-0 text-center sm:text-right">
                  <p className="uppercase tracking-[0.12em] text-[#151912]/40">
                    Verification Code
                  </p>

                  <div className="mt-1 flex items-center justify-center gap-2 sm:justify-end">
                    <p className="truncate font-mono text-[#151912]/70">
                      {certificate.verification_code}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        copyValue(
                          certificate.verification_code,
                          "verification"
                        )
                      }
                      className="shrink-0 text-[#151912]/45 transition hover:text-[#73910f] print:hidden"
                      aria-label="Copy verification code"
                    >
                      {copied === "verification" ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="mx-auto mt-5 flex max-w-[1120px] items-center justify-center gap-2 text-center text-xs text-[#a1a1aa] print:hidden">
            <ShieldCheck size={14} className="text-[#c7ff39]" />
            Certificate authenticity can be checked using the verification code above.
          </div>
        </div>
      </div>
    </main>
  );
}
