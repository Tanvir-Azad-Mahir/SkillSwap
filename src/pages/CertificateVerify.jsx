import { useState } from "react";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Loader2,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export default function CertificateVerify() {
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [certificate, setCertificate] = useState(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const verifyCertificate = async (event) => {
    event?.preventDefault();

    const cleanCode = code.trim();

    if (!cleanCode) {
      setError(
        "Enter a certificate number or verification code."
      );
      setCertificate(null);
      setSearched(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setCertificate(null);
      setSearched(false);

      const {
        data,
        error: verifyError,
      } = await supabase.rpc(
        "verify_certificate",
        {
          p_code: cleanCode,
        }
      );

      if (verifyError) {
        throw verifyError;
      }

      const result =
        Array.isArray(data) &&
        data.length > 0
          ? data[0]
          : null;

      setCertificate(result);
      setSearched(true);
    } catch (err) {
      console.error(
        "CERTIFICATE VERIFY ERROR:",
        err
      );

      setError(
        err?.message ||
          "The certificate could not be verified."
      );

      setCertificate(null);
      setSearched(false);
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setCode("");
    setCertificate(null);
    setSearched(false);
    setError("");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#060807] text-[#f2f4ef]">
      <div className="noise pointer-events-none fixed inset-0" />

      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 80% 0%, rgba(199,255,57,.07), transparent 38%)",
        }}
      />

      <div className="relative z-10">
        {/* =================================================
            HEADER
        ================================================= */}

        <header className="border-b border-white/10 bg-[#060807]/90 backdrop-blur-xl">
          <div className="mx-auto flex min-h-[72px] max-w-[1300px] items-center justify-between gap-4 px-5 md:px-8 lg:px-10">
            <button
              type="button"
              onClick={() =>
                navigate("/dashboard")
              }
              className="inline-flex items-center gap-2 text-sm text-[#a1a1aa] transition hover:text-[#c7ff39]"
            >
              <ArrowLeft size={16} />
              Home
            </button>

            <div className="inline-flex items-center gap-2 text-xs text-[#a1a1aa]">
              <ShieldCheck
                size={15}
                className="text-[#c7ff39]"
              />

              Certificate verification
            </div>
          </div>
        </header>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="mx-auto max-w-[1000px] px-5 pb-20 pt-12 md:px-8 lg:px-10">
          <section className="mx-auto max-w-3xl text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center border border-[#c7ff39]/25 bg-[#c7ff39]/[0.04] text-[#c7ff39]">
              <Award size={26} />
            </div>

            <p className="mt-6 text-[10px] uppercase tracking-[0.2em] text-[#c7ff39]">
              SkillSwap+
            </p>

            <h1 className="mt-3 text-3xl font-medium tracking-[-0.05em] md:text-5xl">
              Verify a certificate
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#a1a1aa]">
              Enter the certificate number or verification code shown on a SkillSwap+ certificate.
            </p>
          </section>

          {/* =================================================
              SEARCH
          ================================================= */}

          <section className="mx-auto mt-10 max-w-2xl border border-white/10 bg-[#0a0d0b]/75 p-5 md:p-7">
            <form
              onSubmit={
                verifyCertificate
              }
            >
              <label
                htmlFor="certificate-code"
                className="text-[10px] uppercase tracking-[0.15em] text-[#a1a1aa]"
              >
                Certificate number or verification code
              </label>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  id="certificate-code"
                  value={code}
                  onChange={(
                    event
                  ) => {
                    setCode(
                      event.target.value
                    );

                    if (error) {
                      setError("");
                    }
                  }}
                  placeholder="e.g. SS-CERT-... or verification code"
                  autoComplete="off"
                  className="min-h-12 flex-1 border border-white/10 bg-white/[0.025] px-4 text-sm text-[#f2f4ef] outline-none transition placeholder:text-white/25 focus:border-[#c7ff39]/40"
                />

                <button
                  type="submit"
                  disabled={
                    loading
                  }
                  className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#c7ff39] px-5 text-sm font-semibold text-[#071008] transition hover:bg-[#d4ff66] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Search
                      size={15}
                    />
                  )}

                  {loading
                    ? "Checking"
                    : "Verify"}
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-4 border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.04] px-4 py-3 text-sm text-[#ff8b8b]">
                {error}
              </div>
            )}
          </section>

          {/* =================================================
              VALID CERTIFICATE
          ================================================= */}

          {searched &&
            certificate && (
              <section className="mx-auto mt-6 max-w-2xl border border-[#c7ff39]/25 bg-[#0a0d0b]/80">
                <div className="flex items-start gap-4 border-b border-white/10 p-6">
                  <div className="grid h-11 w-11 shrink-0 place-items-center border border-[#c7ff39]/30 bg-[#c7ff39]/[0.05] text-[#c7ff39]">
                    <CheckCircle2
                      size={21}
                    />
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#c7ff39]">
                      Verified
                    </p>

                    <h2 className="mt-1 text-xl font-medium">
                      Valid SkillSwap+ certificate
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">
                      The certificate details below match an issued SkillSwap+ certificate.
                    </p>
                  </div>
                </div>

                <div className="grid gap-px bg-white/10 sm:grid-cols-2">
                  {[
                    [
                      "Learner",
                      certificate.learner_name,
                    ],
                    [
                      "Course",
                      certificate.course_title,
                    ],
                    [
                      "Instructor",
                      certificate.instructor_name,
                    ],
                    [
                      "Issued",
                      formatDate(
                        certificate.issued_at
                      ),
                    ],
                    [
                      "Certificate no.",
                      certificate.certificate_number,
                    ],
                    [
                      "Final score",
                      certificate.final_score !==
                        null &&
                      certificate.final_score !==
                        undefined
                        ? `${certificate.final_score}/100`
                        : "—",
                    ],
                  ].map(
                    ([
                      label,
                      value,
                    ]) => (
                      <div
                        key={
                          label
                        }
                        className="bg-[#0a0d0b] p-5"
                      >
                        <p className="text-[9px] uppercase tracking-[0.14em] text-white/30">
                          {label}
                        </p>

                        <p className="mt-2 break-words text-sm font-medium text-[#f2f4ef]">
                          {value}
                        </p>
                      </div>
                    )
                  )}
                </div>

                <div className="flex flex-col justify-between gap-3 border-t border-white/10 p-5 sm:flex-row sm:items-center">
                  <div className="inline-flex items-center gap-2 text-xs text-[#a1a1aa]">
                    <ShieldCheck
                      size={14}
                      className="text-[#c7ff39]"
                    />

                    Authenticity confirmed
                  </div>

                  <button
                    type="button"
                    onClick={
                      resetSearch
                    }
                    className="min-h-10 border border-white/10 px-4 text-xs font-medium text-[#f2f4ef] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39]"
                  >
                    Verify another
                  </button>
                </div>
              </section>
            )}

          {/* =================================================
              INVALID CERTIFICATE
          ================================================= */}

          {searched &&
            !certificate && (
              <section className="mx-auto mt-6 max-w-2xl border border-[#ff6b6b]/25 bg-[#0a0d0b]/80 p-6">
                <div className="flex items-start gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.04] text-[#ff8b8b]">
                    <XCircle
                      size={21}
                    />
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#ff8b8b]">
                      Not verified
                    </p>

                    <h2 className="mt-1 text-xl font-medium">
                      Certificate not found
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">
                      No issued SkillSwap+ certificate matched the certificate number or verification code you entered.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    resetSearch
                  }
                  className="mt-5 min-h-10 border border-white/10 px-4 text-xs font-medium text-[#f2f4ef] transition hover:border-[#c7ff39]/30 hover:text-[#c7ff39]"
                >
                  Try another code
                </button>
              </section>
            )}
        </div>
      </div>
    </main>
  );
}
