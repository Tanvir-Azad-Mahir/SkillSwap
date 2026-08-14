import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import SignupHeader from "../components/SignupHeader";
import SignupIntro from "../components/SignupIntro";
import SignupForm from "../components/SignupForm";
import SignupFooter from "../components/SignupFooter";

import { supabase } from "../lib/supabase";

import "../styles/index.css";

/* =========================================================
   INITIAL FORM
========================================================= */

const initialForm = {
  fullName: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  acceptedTerms: false,
};

/* =========================================================
   FORM VALIDATION
========================================================= */

function validate(form) {
  const errors = {};

  const normalizedUsername = form.username
    .trim()
    .toLowerCase();

  /* Full name */
  if (!form.fullName.trim()) {
    errors.fullName = "Full name is required.";
  }

  /* Username */
  if (!normalizedUsername) {
    errors.username = "Username is required.";
  } else if (
    !/^[a-z0-9._]{3,20}$/.test(
      normalizedUsername
    )
  ) {
    errors.username =
      "Use 3–20 characters: lowercase letters, numbers, dots or underscores.";
  }

  /* Email */
  const cleanEmail = form.email.trim();

  if (!cleanEmail) {
    errors.email =
      "Email address is required.";
  } else if (
    !/^\S+@\S+\.\S+$/.test(cleanEmail)
  ) {
    errors.email =
      "Enter a valid email address.";
  }

  /* Password */
  if (!form.password) {
    errors.password =
      "Password is required.";
  } else if (
    form.password.length < 8 ||
    !/[A-Z]/.test(form.password) ||
    !/\d/.test(form.password)
  ) {
    errors.password =
      "Your password must contain at least 8 characters, one uppercase letter and one number.";
  }

  /* Confirm password */
  if (!form.confirmPassword) {
    errors.confirmPassword =
      "Confirm your password.";
  } else if (
    form.password !==
    form.confirmPassword
  ) {
    errors.confirmPassword =
      "Passwords do not match.";
  }

  /* Terms */
  if (!form.acceptedTerms) {
    errors.acceptedTerms =
      "You must accept the Terms and Privacy Policy.";
  }

  return errors;
}

/* =========================================================
   FRIENDLY SUPABASE ERRORS
========================================================= */

function friendlySignupError(error) {
  const code = error?.code || "";

  const status = error?.status;

  const message =
    error?.message?.toLowerCase() || "";

  console.error(
    "Supabase signup error:",
    {
      code,
      status,
      message: error?.message,
    }
  );

  /* Email rate limit */
  if (
    code ===
      "over_email_send_rate_limit" ||
    status === 429 ||
    message.includes(
      "email rate limit"
    )
  ) {
    return "Too many verification emails have been requested. Please wait a while and try again.";
  }

  /* General rate limit */
  if (
    code ===
      "over_request_rate_limit" ||
    message.includes("rate limit")
  ) {
    return "Too many signup attempts have been made. Please wait a few minutes and try again.";
  }

  /* Existing email */
  if (
    code === "user_already_exists" ||
    code === "email_exists" ||
    message.includes(
      "already registered"
    ) ||
    message.includes(
      "user already registered"
    )
  ) {
    return "An account with this email already exists. Try signing in instead.";
  }

  /* Invalid email */
  if (
    code === "email_address_invalid"
  ) {
    return "Enter a valid email address.";
  }

  /* Email not authorized */
  if (
    code ===
    "email_address_not_authorized"
  ) {
    return "This email address cannot currently receive verification emails.";
  }

  /* Weak password */
  if (
    code === "weak_password"
  ) {
    return "Please choose a stronger password.";
  }

  /* Signup disabled */
  if (
    code === "signup_disabled"
  ) {
    return "New account registration is currently unavailable.";
  }

  /* Email provider disabled */
  if (
    code ===
    "email_provider_disabled"
  ) {
    return "Email registration is currently unavailable.";
  }

  /* Username unique error */
  if (
    message.includes("username") &&
    (
      message.includes("unique") ||
      message.includes("duplicate") ||
      message.includes("taken")
    )
  ) {
    return "That username is already taken. Choose another one.";
  }

  return "We couldn't create your account right now. Please try again.";
}

/* =========================================================
   SIGNUP PAGE
========================================================= */

export default function Signup() {
  const [searchParams] =
    useSearchParams();

  const [visible, setVisible] =
    useState(false);

  const [
    formData,
    setFormData,
  ] = useState(initialForm);

  const [
    fieldErrors,
    setFieldErrors,
  ] = useState({});

  const [
    generalError,
    setGeneralError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    success,
    setSuccess,
  ] = useState(false);

  const [
    confirmationRequired,
    setConfirmationRequired,
  ] = useState(false);

  /* =======================================================
     PAGE ANIMATION
  ======================================================= */

  useEffect(() => {
    const frame =
      requestAnimationFrame(
        () => {
          setVisible(true);
        }
      );

    return () =>
      cancelAnimationFrame(frame);
  }, []);

  /* =======================================================
     GOOGLE LOGIN → ACCOUNT NOT FOUND

     AuthCallback redirects here:

     /signup?reason=google-account-not-found
  ======================================================= */

  useEffect(() => {
    const reason =
      searchParams.get("reason");

    if (
      reason ===
      "google-account-not-found"
    ) {
      setGeneralError(
        "No SkillSwap+ account was found for that Google account. Please create an account first."
      );
    }
  }, [searchParams]);

  /* =======================================================
     INPUT CHANGE
  ======================================================= */

  const handleChange = (
    field,
    value
  ) => {
    const nextValue =
      field === "username"
        ? value.toLowerCase()
        : value;

    setFormData(
      (current) => ({
        ...current,
        [field]: nextValue,
      })
    );

    /* Clear field error */
    if (
      fieldErrors[field]
    ) {
      setFieldErrors(
        (current) => ({
          ...current,
          [field]: undefined,
        })
      );
    }

    /*
      Clear Google account-not-found
      notice or other general error
      once user starts creating account.
    */

    if (generalError) {
      setGeneralError("");
    }
  };

  /* =======================================================
     USERNAME AVAILABILITY
  ======================================================= */

  const checkUsernameAvailability =
    async (username) => {
      const {
        data,
        error,
      } =
        await supabase.rpc(
          "is_username_available",
          {
            p_username:
              username,
          }
        );

      if (error) {
        console.error(
          "Username availability error:",
          error
        );

        throw new Error(
          "USERNAME_CHECK_FAILED"
        );
      }

      return data === true;
    };

  /* =======================================================
     CREATE ACCOUNT
  ======================================================= */

  const handleCreateAccount =
    async (event) => {
      event.preventDefault();

      if (
        loading ||
        success
      ) {
        return;
      }

      setGeneralError("");

      /* Validate frontend */

      const errors =
        validate(formData);

      if (
        Object.keys(errors)
          .length > 0
      ) {
        setFieldErrors(
          errors
        );

        return;
      }

      setFieldErrors({});

      const fullName =
        formData.fullName.trim();

      const username =
        formData.username
          .trim()
          .toLowerCase();

      const email =
        formData.email
          .trim()
          .toLowerCase();

      try {
        setLoading(true);

        /* ===============================================
           1. CHECK USERNAME
        =============================================== */

        let usernameAvailable;

        try {
          usernameAvailable =
            await checkUsernameAvailability(
              username
            );
        } catch (
          usernameError
        ) {
          console.error(
            "Username check failed:",
            usernameError
          );

          setGeneralError(
            "We couldn't verify that username right now. Please try again."
          );

          return;
        }

        if (
          !usernameAvailable
        ) {
          setFieldErrors(
            (current) => ({
              ...current,

              username:
                "That username is already taken. Choose another one.",
            })
          );

          return;
        }

        /* ===============================================
           2. CREATE SUPABASE AUTH USER
        =============================================== */

        const {
          data,
          error,
        } =
          await supabase.auth.signUp(
            {
              email,

              password:
                formData.password,

              options: {
                /*
                  Username + full name
                  are stored in Auth
                  metadata.
                */

                data: {
                  username,
                  full_name:
                    fullName,
                },

                /*
                  Email confirmation
                  returns user to
                  Profile Setup.
                */

                emailRedirectTo:
                  `${window.location.origin}/profile-setup`,
              },
            }
          );

        if (error) {
          throw error;
        }

        if (!data?.user) {
          throw new Error(
            "SIGNUP_USER_NOT_CREATED"
          );
        }

        /* ===============================================
           3. EMAIL CONFIRMATION
        =============================================== */

        const needsConfirmation =
          !data.session;

        setConfirmationRequired(
          needsConfirmation
        );

        setSuccess(true);
      } catch (error) {
        console.error(
          "Signup error:",
          error
        );

        setGeneralError(
          friendlySignupError(
            error
          )
        );
      } finally {
        setLoading(false);
      }
    };

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="signup-page relative min-h-screen overflow-hidden bg-[#060807] text-[#f2f4ef] antialiased">
      {/* Background noise */}

      <div
        className="signup-noise pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
      />

      {/* Radial background */}

      <div
        className="signup-radial pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
      />

      {/* Header */}

      <SignupHeader />

      {/* Main */}

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-73px)] max-w-[1400px] grid-cols-1 px-5 pb-16 pt-[104px] md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:pb-20 lg:pt-[112px]">
        <SignupIntro
          visible={visible}
        />

        <SignupForm
          visible={visible}
          formData={formData}
          fieldErrors={
            fieldErrors
          }
          generalError={
            generalError
          }
          loading={loading}
          success={success}
          confirmationRequired={
            confirmationRequired
          }
          onChange={
            handleChange
          }
          onSubmit={
            handleCreateAccount
          }
        />
      </main>

      {/* Footer */}

      <SignupFooter />
    </div>
  );
}