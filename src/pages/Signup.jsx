import { useEffect, useState } from "react";
import SignupHeader from "../components/SignupHeader";
import SignupIntro from "../components/SignupIntro";
import SignupForm from "../components/SignupForm";
import SignupFooter from "../components/SignupFooter";
import { supabase } from "../lib/supabase";
import "../styles/index.css";

const initialForm = {
  fullName: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  acceptedTerms: false,
};

function validate(form) {
  const errors = {};
  const normalizedUsername = form.username.trim().toLowerCase();

  if (!form.fullName.trim()) {
    errors.fullName = "Full name is required.";
  }

  if (!normalizedUsername) {
    errors.username = "Username is required.";
  } else if (!/^[a-z0-9._]{3,20}$/.test(normalizedUsername)) {
    errors.username =
      "Use 3–20 characters: lowercase letters, numbers, dots or underscores.";
  }

  if (!form.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!form.password) {
    errors.password = "Password is required.";
  } else if (
    form.password.length < 8 ||
    !/[A-Z]/.test(form.password) ||
    !/\d/.test(form.password)
  ) {
    errors.password = "Your password does not meet all requirements.";
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (!form.acceptedTerms) {
    errors.acceptedTerms = "You must accept the Terms and Privacy Policy.";
  }

  return errors;
}

function friendlySignupError(error) {
  const message = error?.message || "Something went wrong while creating your account.";
  const lower = message.toLowerCase();

  if (lower.includes("username") && (lower.includes("taken") || lower.includes("unique") || lower.includes("duplicate"))) {
    return "That username is already taken. Choose another one.";
  }

  if (lower.includes("already registered") || lower.includes("user already registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }

  if (lower.includes("password")) {
    return message;
  }

  return message;
}

export default function Signup() {
  const [visible, setVisible] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmationRequired, setConfirmationRequired] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleChange = (field, value) => {
    const nextValue = field === "username" ? value.toLowerCase() : value;

    setFormData((current) => ({
      ...current,
      [field]: nextValue,
    }));

    if (fieldErrors[field]) {
      setFieldErrors((current) => ({
        ...current,
        [field]: undefined,
      }));
    }

    if (generalError) {
      setGeneralError("");
    }
  };

  const checkUsernameAvailability = async (username) => {
    const { data, error } = await supabase.rpc("is_username_available", {
      p_username: username,
    });

    // If the optional RPC has not been installed yet, let the database's
    // unique constraint/trigger remain the final source of truth.
    if (error) {
      console.warn("Username availability RPC could not be used:", error.message);
      return true;
    }

    return data === true;
  };

  const handleCreateAccount = async (event) => {
    event.preventDefault();
    setGeneralError("");

    const errors = validate(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const fullName = formData.fullName.trim();
    const username = formData.username.trim().toLowerCase();
    const email = formData.email.trim().toLowerCase();

    try {
      setLoading(true);

      const usernameAvailable = await checkUsernameAvailability(username);
      if (!usernameAvailable) {
        setFieldErrors((current) => ({
          ...current,
          username: "That username is already taken. Choose another one.",
        }));
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          data: {
            username,
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/profile-setup`,
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error("Account could not be created.");

      // With Supabase email confirmation enabled, signUp returns a user but
      // no session. We show a confirmation state instead of pretending the
      // user can immediately access authenticated profile setup.
      setConfirmationRequired(!data.session);
      setSuccess(true);
    } catch (error) {
      console.error("Signup error:", error);
      setGeneralError(friendlySignupError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page relative min-h-screen overflow-hidden bg-[#060807] text-[#f2f4ef] antialiased">
      <div
        className="signup-noise pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
      />
      <div
        className="signup-radial pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
      />

      <SignupHeader />

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-73px)] max-w-[1400px] grid-cols-1 px-5 pb-16 pt-[104px] md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:pb-20 lg:pt-[112px]">
        <SignupIntro visible={visible} />

        <SignupForm
          visible={visible}
          formData={formData}
          fieldErrors={fieldErrors}
          generalError={generalError}
          loading={loading}
          success={success}
          confirmationRequired={confirmationRequired}
          onChange={handleChange}
          onSubmit={handleCreateAccount}
        />
      </main>

      <SignupFooter />
    </div>
  );
}
