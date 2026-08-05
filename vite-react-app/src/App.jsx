import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Landing from "./pages/landing";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/profile";

// Landing already renders its own Navbar/Footer internally — render it bare.
function LandingLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Landing />
    </div>
  );
}

// Auth pages: no site chrome at all.
function AuthLayout({ children }) {
  return <>{children}</>;
}

// Logged-in app pages: shared app nav/footer (reuse Navbar/Footer,
// or swap in dedicated app-shell versions later if the landing nav
// doesn't fit a logged-in context).
function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingLayout />} />

        <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
        <Route path="/signup" element={<AuthLayout><Signup /></AuthLayout>} />

        <Route path="/home" element={<AppLayout><Home /></AppLayout>} />
        <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
      </Routes>
    </BrowserRouter>
  );
}
