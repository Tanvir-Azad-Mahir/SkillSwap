import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import ChooseUsername from "./pages/ChooseUsername";
import ProfileSetup from "./pages/ProfileSetup";

// Import Dashboard after you create it
// import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/signup" element={<Signup />} />

        <Route path="/login" element={<Login />} />

        <Route
          path="/auth/callback"
          element={<AuthCallback />}
        />

        <Route
          path="/choose-username"
          element={<ChooseUsername />}
        />

        <Route
          path="/profile-setup"
          element={<ProfileSetup />}
        />

        {/* Add after Dashboard is created */}
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
      </Routes>
    </BrowserRouter>
  );
}