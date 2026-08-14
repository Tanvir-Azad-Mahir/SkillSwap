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

// Admin Imports
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetails from "./pages/admin/AdminUserDetails";
import AdminMentorship from "./pages/admin/AdminMentorship";
import AdminSessions from "./pages/admin/AdminSessions";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminSkills from "./pages/admin/AdminSkills";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminCredits from "./pages/admin/AdminCredits";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminReports from "./pages/admin/AdminReports";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminMedia from "./pages/admin/AdminMedia";
import AdminManagement from "./pages/admin/AdminManagement";
import AdminSettings from "./pages/admin/AdminSettings";

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

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:id" element={<AdminUserDetails />} />
          <Route path="mentorship" element={<AdminMentorship />} />
          <Route path="sessions" element={<AdminSessions />} />
          <Route path="courses" element={<AdminCourses />} />
          
          <Route path="skills" element={<AdminSkills />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="credits" element={<AdminCredits />} />
          <Route path="transactions" element={<AdminTransactions />} />
          
          <Route path="reports" element={<AdminReports />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="media" element={<AdminMedia />} />
          <Route path="management" element={<AdminManagement />} />
          <Route path="settings" element={<AdminSettings />} />
          
          {/* Fallback for unbuilt admin pages */}
          <Route path="*" element={<div className="p-8 text-[#a1a1aa] flex items-center justify-center h-full border border-white/10 bg-[#0a0d0b] rounded">This page is under construction.</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}