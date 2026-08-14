import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import ChooseUsername from "./pages/ChooseUsername";
import ProfileSetup from "./pages/ProfileSetup";
import EditProfile from "./pages/EditProfile";
import Dashboard from "./pages/Dashboard";
import PublicProfile from "./pages/PublicProfile";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing */}
        <Route
          path="/"
          element={<Landing />}
        />

        {/* Authentication */}
        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        {/* Forgot password */}
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        {/* Reset password */}
        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        {/* OAuth callback */}
        <Route
          path="/auth/callback"
          element={<AuthCallback />}
        />

        {/* Google first-time username */}
        <Route
          path="/choose-username"
          element={<ChooseUsername />}
        />

        {/* New-user onboarding */}
        <Route
          path="/profile-setup"
          element={<ProfileSetup />}
        />

        {/* Existing-user profile editing */}
        <Route
          path="/profile/edit"
          element={<EditProfile />}
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        {/* Public profile */}
        <Route
          path="/profile/:username"
          element={<PublicProfile />}
        />
      </Routes>
    </BrowserRouter>
  );
}