import { useState } from "react";
import {
  ArrowRight,
  AtSign,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
  User,
} from "lucide-react";
import AuthInput from "./AuthInput";
import PasswordRequirements from "./PasswordRequirements";

const focusClass =
  "focus:outline-none focus:ring-2 focus:ring-[#c7ff39] focus:ring-offset-4 focus:ring-offset-[#060807]";

function VisibilityButton({ visible, onToggle, label }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      className={`grid h-9 w-9 place-items-center rounded-md text-[#a1a1aa] transition hover:bg-white/[0.04] hover:text-white ${focusClass}`}
    >
      {visible ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  );
}

export default function SignupForm({
  visible,
  formData,
  fieldErrors,
  generalError,
  loading,
  success,
  confirmationRequired,
  onChange,
  onSubmit,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (success) {
    return (
      <section
        className={`reveal ${visible ? "is-visible" : ""} flex items-center lg:pl-12`}
      >
        <div className="ml-auto w-full max-w-[570px] border border-white/10 bg-[#0a0d0b]/80 p-6 md:p-8 lg:p-10">
          <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#a1a1aa]">
                01 / 02
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#c7ff39]">
                Account
              </p>
            </div>
            <div className="grid h-10 w-10 place-items-center border border-[#c7ff39]/30 bg-[#c7ff39]/10 text-[#c7ff39]">
              <Check size={18} strokeWidth={2} />
            </div>
          </div>

          <h2 className="text-3xl font-medium tracking-[-0.03em] text-[#f2f4ef]">
            {confirmationRequired ? "Check your email." : "Account created."}
          </h2>

          <p className="mt-4 max-w-md text-sm leading-6 text-[#a1a1aa] md:text-base">
            {confirmationRequired
              ? "Your account was created. Confirm your email address, then sign in to continue building your SkillSwap+ profile."
              : "Your SkillSwap+ account is ready. Let's build your profile."}
          </p>

          <a
            href={confirmationRequired ? "/login" : "/profile-setup"}
            className={`group mt-8 inline-flex min-h-12 w-full items-center justify-between bg-[#c7ff39] px-5 font-semibold text-[#071008] transition hover:bg-[#d2ff64] ${focusClass}`}
          >
            {confirmationRequired ? "Go to sign in" : "Continue to profile"}
            <ArrowRight
              size={18}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </a>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`reveal ${visible ? "is-visible" : ""} flex items-center lg:pl-12`}
      aria-labelledby="create-account-heading"
    >
      <div className="ml-auto w-full max-w-[570px] border border-white/10 bg-[#0a0d0b]/80 p-6 md:p-8 lg:p-10">
        <div className="mb-8 flex items-start justify-between gap-6 border-b border-white/10 pb-6">
          <div>
            <h2
              id="create-account-heading"
              className="text-2xl font-medium tracking-[-0.03em] text-[#f2f4ef] md:text-3xl"
            >
              Create your account
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-[#a1a1aa]">
              Start swapping skills with people who want to learn what you know.
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#a1a1aa]">
              01 / 02
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#c7ff39]">
              Account
            </p>
          </div>
        </div>

        {generalError && (
          <div
            role="alert"
            className="mb-6 border border-[#ff6b6b]/25 bg-[#ff6b6b]/[0.04] px-4 py-3 text-sm leading-6 text-[#ff8a8a]"
          >
            {generalError}
          </div>
        )}

        <form onSubmit={onSubmit} noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <AuthInput
              id="fullName"
              label="Full name"
              icon={User}
              type="text"
              autoComplete="name"
              placeholder="Your name"
              value={formData.fullName}
              onChange={(e) => onChange("fullName", e.target.value)}
              error={fieldErrors.fullName}
            />

            <AuthInput
              id="username"
              label="Username"
              icon={AtSign}
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck="false"
              placeholder="your.username"
              value={formData.username}
              onChange={(e) => onChange("username", e.target.value)}
              error={fieldErrors.username}
            />
          </div>

          <AuthInput
            id="email"
            label="Email address"
            icon={Mail}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => onChange("email", e.target.value)}
            error={fieldErrors.email}
            className="mt-5"
          />

          <div className="mt-5">
            <AuthInput
              id="password"
              label="Password"
              icon={Lock}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) => onChange("password", e.target.value)}
              error={fieldErrors.password}
              rightControl={
                <VisibilityButton
                  visible={showPassword}
                  onToggle={() => setShowPassword((value) => !value)}
                  label={showPassword ? "Hide password" : "Show password"}
                />
              }
            />

            <PasswordRequirements password={formData.password} />
          </div>

          <AuthInput
            id="confirmPassword"
            label="Confirm password"
            icon={Lock}
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Enter your password again"
            value={formData.confirmPassword}
            onChange={(e) => onChange("confirmPassword", e.target.value)}
            error={fieldErrors.confirmPassword}
            className="mt-5"
            rightControl={
              <VisibilityButton
                visible={showConfirmPassword}
                onToggle={() =>
                  setShowConfirmPassword((value) => !value)
                }
                label={
                  showConfirmPassword
                    ? "Hide confirmed password"
                    : "Show confirmed password"
                }
              />
            }
          />

          <div className="mt-6">
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-[#a1a1aa]">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={formData.acceptedTerms}
                onChange={(e) => onChange("acceptedTerms", e.target.checked)}
              />

              <span
                className={`mt-1 grid h-[18px] w-[18px] shrink-0 place-items-center border transition ${
                  formData.acceptedTerms
                    ? "border-[#c7ff39] bg-[#c7ff39] text-[#061008]"
                    : "border-white/20 bg-transparent"
                } peer-focus:ring-2 peer-focus:ring-[#c7ff39] peer-focus:ring-offset-4 peer-focus:ring-offset-[#060807]`}
                aria-hidden="true"
              >
                {formData.acceptedTerms && <Check size={12} strokeWidth={3} />}
              </span>

              <span>
                I agree to the{" "}
                <a
                  href="/terms"
                  className={`text-[#f2f4ef] underline decoration-white/30 underline-offset-4 transition hover:decoration-[#c7ff39] ${focusClass}`}
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  className={`text-[#f2f4ef] underline decoration-white/30 underline-offset-4 transition hover:decoration-[#c7ff39] ${focusClass}`}
                >
                  Privacy Policy
                </a>
                .
              </span>
            </label>

            {fieldErrors.acceptedTerms && (
              <p className="mt-2 text-xs text-[#ff6b6b]">
                {fieldErrors.acceptedTerms}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`group mt-7 inline-flex min-h-12 w-full items-center justify-between bg-[#c7ff39] px-5 font-semibold text-[#071008] transition hover:bg-[#d2ff64] disabled:cursor-not-allowed disabled:opacity-60 ${focusClass}`}
          >
            <span className="inline-flex items-center gap-2">
              {loading && (
                <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
              )}
              {loading ? "Creating account..." : "Create account"}
            </span>

            {!loading && (
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            )}
          </button>

          <div className="my-7 flex items-center gap-4" aria-hidden="true">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#a1a1aa]">
              Account access
            </span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <p className="text-center text-sm text-[#a1a1aa]">
            Already have an account?{" "}
            <a
              href="/login"
              className={`font-medium text-[#c7ff39] underline-offset-4 hover:underline ${focusClass}`}
            >
              Sign in
            </a>
          </p>
        </form>
      </div>
    </section>
  );
}
