import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./lib/ThemeContext";

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
import MyCourses from "./pages/MyCourses";
import Sessions from "./pages/Sessions";
import UpcomingSessions from "./pages/UpcomingSessions";
import CourseManage from "./pages/CourseManage";
import CourseLearn from "./pages/CourseLearn";
import Certificate from "./pages/Certificate";
import CertificateVerify from "./pages/CertificateVerify";
import MentorshipRequests from "./pages/MentorshipRequests";
import AdminRoute from "./components/admin/AdminRoute";
import AdminLayout from "./components/admin/AdminLayout";

import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminRoleRequests from "./pages/admin/AdminRoleRequests";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminSkills from "./pages/admin/AdminSkills";
import AdminActivityLog from "./pages/admin/AdminActivityLog";

export default function App() {
  return (
    <ThemeProvider>
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
          path="/messages/:conversationId"
          element={<Messages />}
        />
        <Route
          path="/swaps"
          element={<Swaps />}
        />
        <Route
          path="/sessions"
          element={<Sessions />}
        />
        <Route
          path="/upcoming-sessions"
          element={<UpcomingSessions />}
        />
        <Route
          path="/my-courses"
          element={<MyCourses />}
        />
        <Route
  path="/my-courses/:courseId/manage"
  element={<CourseManage />}
/>
        <Route
          path="/my-courses/:courseId/learn"
          element={<CourseLearn />}
        />
        <Route
        path="/certificates/:certificateId"
  element={<Certificate />}
      />
      <Route
  path="/certificates/verify"
  element={<CertificateVerify />}
/>
        <Route
  path="/mentorship-requests"
  element={<MentorshipRequests />}
/>
<Route
  path="/admin"
  element={
    <AdminRoute>
      <AdminLayout />
    </AdminRoute>
  }
>
  <Route
    index
    element={<AdminOverview />}
  />

  <Route
    path="users"
    element={<AdminUsers />}
  />

  <Route
    path="role-requests"
    element={<AdminRoleRequests />}
  />

  <Route
    path="courses"
    element={<AdminCourses />}
  />

  <Route
    path="skills"
    element={<AdminSkills />}
  />
  <Route
    path="activity"
    element={
      <AdminActivityLog />
    }
  />
  </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}