import { useEffect, useState } from "react";
import { Loader2, Star, X } from "lucide-react";
import { supabase } from "../lib/supabase";

function getProfileName(profile) {
  return profile?.full_name || profile?.username || "your mentor";
}

export default function SessionReviewModal({
  session,
  reviewerId,
  revieweeId,
  onClose,
  onSubmitted,
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !submitting) {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, submitting]);

  const submitReview = async (event) => {
    event.preventDefault();

    if (submitting) return;

    if (!session?.id || !reviewerId || !revieweeId) {
      setError("This session does not have enough information to create a review.");
      return;
    }

    if (rating < 1 || rating > 5) {
      setError("Choose a rating from 1 to 5 stars.");
      return;
    }

    const cleanComment = comment.trim();

    try {
      setSubmitting(true);
      setError("");

      const { data: existingReview, error: existingError } = await supabase
        .from("reviews")
        .select("id, session_id, reviewer_id, reviewee_id, rating, comment, created_at, updated_at")
        .eq("session_id", session.id)
        .eq("reviewer_id", reviewerId)
        .eq("reviewee_id", revieweeId)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existingReview) {
        onSubmitted?.(existingReview);
        onClose?.();
        return;
      }

      const payload = {
        session_id: session.id,
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        rating,
        comment: cleanComment || null,
      };

      const { data: insertedReview, error: insertError } = await supabase
        .from("reviews")
        .insert(payload)
        .select("id, session_id, reviewer_id, reviewee_id, rating, comment, created_at, updated_at")
        .single();

      if (insertError) {
        throw insertError;
      }

      onSubmitted?.(
        insertedReview || {
          ...payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      );

      onClose?.();
    } catch (err) {
      console.error("SESSION REVIEW ERROR:", err);
      setError(err?.message || "Your review could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  };

  const mentorName = getProfileName(session?.counterpart);
  const visibleRating = hoverRating || rating;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/75 px-4 py-8 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onClose?.();
        }
      }}
    >
      <div
        className="w-full max-w-lg border border-white/10 bg-[#0a0d0b] text-[#f2f4ef] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-review-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 md:px-6">
          <div>
            <p className="text-[9px] uppercase tracking-[0.17em] text-[#c7ff39]">
              Session review
            </p>
            <h2
              id="session-review-title"
              className="mt-2 text-xl font-medium tracking-[-0.035em]"
            >
              Review {mentorName}
            </h2>
            <p className="mt-2 text-xs leading-6 text-[#a1a1aa]">
              Rate your completed mentorship session and leave optional feedback.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onClose?.()}
            disabled={submitting}
            className="grid h-9 w-9 shrink-0 place-items-center border border-white/10 text-[#a1a1aa] transition hover:border-white/20 hover:text-white disabled:opacity-50"
            aria-label="Close review form"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={submitReview} className="p-5 md:p-6">
          <div>
            <label className="text-[9px] uppercase tracking-[0.15em] text-white/40">
              Rating
            </label>

            <div className="mt-3 flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => {
                const active = value <= visibleRating;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHoverRating(value)}
                    onMouseLeave={() => setHoverRating(0)}
                    className={`grid h-11 w-11 place-items-center border transition ${
                      active
                        ? "border-[#c7ff39]/35 bg-[#c7ff39]/[0.08] text-[#c7ff39]"
                        : "border-white/10 bg-white/[0.02] text-white/25 hover:border-white/20 hover:text-white/60"
                    }`}
                    aria-label={`${value} star${value === 1 ? "" : "s"}`}
                    aria-pressed={rating === value}
                  >
                    <Star size={18} fill={active ? "currentColor" : "none"} />
                  </button>
                );
              })}
            </div>

            <p className="mt-2 text-xs text-[#a1a1aa]">
              {rating > 0 ? `${rating}/5 selected` : "Choose 1 to 5 stars"}
            </p>
          </div>

          <div className="mt-6">
            <label
              htmlFor="session-review-comment"
              className="text-[9px] uppercase tracking-[0.15em] text-white/40"
            >
              Comment <span className="normal-case tracking-normal">(optional)</span>
            </label>

            <textarea
              id="session-review-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={1000}
              rows={5}
              placeholder="What was useful about the session?"
              className="mt-3 w-full resize-none border border-white/10 bg-[#060807] px-4 py-3 text-sm leading-6 text-[#f2f4ef] outline-none transition placeholder:text-white/20 focus:border-[#c7ff39]/35"
            />

            <div className="mt-2 text-right text-[10px] text-white/30">
              {comment.length}/1000
            </div>
          </div>

          {error && (
            <div className="mt-5 border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.04] px-4 py-3 text-xs leading-6 text-[#ff8b8b]">
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={() => onClose?.()}
              disabled={submitting}
              className="inline-flex min-h-10 items-center justify-center border border-white/10 px-4 text-xs text-[#a1a1aa] transition hover:border-white/20 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || rating < 1}
              className="inline-flex min-h-10 items-center justify-center gap-2 bg-[#c7ff39] px-5 text-xs font-semibold text-[#071008] transition hover:bg-[#d4ff66] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <Loader2 size={13} className="animate-spin" />}
              Submit review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
