import { useState } from "react";
import "../styles/login.css";

function MailIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function EyeIcon({ off }) {
  return off ? (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M6.6 6.7C4.5 8.1 3 10 3 12c0 0 3.5 6 9 6 1.8 0 3.4-.6 4.7-1.5M9.9 4.6A9.6 9.6 0 0 1 12 4.4c5.5 0 9 5.6 9 5.6a15.6 15.6 0 0 1-2.2 2.9" />
    </svg>
  ) : (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" width="18" height="18">
      <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z" />
      <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.9.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.9 10.7a5.4 5.4 0 0 1 0-3.4V5H.9a9 9 0 0 0 0 8l3-2.3z" />
      <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 .9 5l3 2.3C4.6 5.1 6.6 3.6 9 3.6z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M16.4 1c.1 1.1-.3 2.2-1 3-.7.8-1.8 1.5-2.9 1.4-.1-1.1.4-2.2 1-2.9.8-.9 2-1.5 2.9-1.5zM20 17.2c-.5 1.1-.8 1.6-1.4 2.6-.9 1.4-2.2 3.1-3.8 3.1-1.4 0-1.8-.9-3.7-.9-1.9 0-2.3.9-3.7.9-1.6 0-2.8-1.6-3.7-2.9C1.4 17.4.5 13.5 2 10.9c.9-1.6 2.5-2.6 4.2-2.6 1.5 0 2.4.9 3.7.9 1.2 0 2-1 3.7-1 1.4 0 2.9.8 3.9 2.1-3.5 2-2.9 6.8.5 7.9z" />
    </svg>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    // await supabase.auth.signInWithPassword({ email, password })
    console.log("Sign in submitted:", { email });
  }

  return (
    <>
      <div className="bg">
        <div className="blob blob-teal" />
        <div className="blob blob-amber" />
        <div className="blob blob-mint" />
      </div>

      <main className="wrap">
        <div className="card">
          <div className="brand">
            <span className="brand-mark">S+</span>
            <span className="brand-name">SkillSwap+</span>
          </div>

          <h1>Welcome back</h1>
          <p className="sub">Sign in to keep learning, teaching, and trading skills.</p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <div className="input-wrap">
                <MailIcon />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <div className="field-row">
                <label htmlFor="password">Password</label>
                <a href="#" className="link-muted">Forgot?</a>
              </div>
              <div className="input-wrap">
                <LockIcon />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className={`icon-btn${showPassword ? " is-active" : ""}`}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary">Sign in</button>
          </form>

          <div className="divider"><span>or continue with</span></div>

          <div className="oauth-row">
            <button type="button" className="btn-oauth">
              <GoogleIcon /> Google
            </button>
            <button type="button" className="btn-oauth">
              <AppleIcon /> Apple
            </button>
          </div>

          <p className="signup-line">
            Don't have an account? <a href="/signup">Sign up</a>
          </p>
        </div>
      </main>
    </>
  );
}
