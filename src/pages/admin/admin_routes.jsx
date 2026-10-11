// Example React Router setup.
//
// Adjust import paths if your App.jsx/router file is located elsewhere.

import AdminRoute from "./components/admin/AdminRoute";
import AdminLayout from "./components/admin/AdminLayout";

import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminRoleRequests from "./pages/admin/AdminRoleRequests";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminSkills from "./pages/admin/AdminSkills";


// Inside <Routes> for admin routes, add the following:

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
    element={
      <AdminOverview />
    }
  />

  <Route
    path="users"
    element={
      <AdminUsers />
    }
  />

  <Route
    path="role-requests"
    element={
      <AdminRoleRequests />
    }
  />

  <Route
    path="courses"
    element={
      <AdminCourses />
    }
  />

  <Route
    path="skills"
    element={
      <AdminSkills />
    }
  />
</Route>
