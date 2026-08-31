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
import PublicProfile from "./pages/PublicProfile";
import Dashboard from "./pages/Dashboard";
import CourseCreation from "./pages/CourseCreation";
import History from "./pages/History";
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";
import EnrollmentRequests from "./pages/EnrollmentRequests";
import Messages from "./pages/Messages";
import Swaps from "./pages/Swaps";

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

        {/* Username setup */}
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

        {/* Public user profile */}
        <Route
          path="/profile/:username"
          element={<PublicProfile />}
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />
        <Route
          path="/courses/create"
          element={<CourseCreation />}
        />
        <Route
          path="/history"
          element={<History />}
        />
        <Route
        path="/courses"
        element={<Courses />}
        />
        <Route
        path="/courses/:courseId"
        element={<CourseDetails />}
        />
        <Route
          path="/enrollment-requests"
          element={<EnrollmentRequests />}
        />
        <Route
          path="/messages"
          element={<Messages />}
        />
        <Route
          path="/swaps"
          element={<Swaps />}
        />
      </Routes>
    </BrowserRouter>
  );
}