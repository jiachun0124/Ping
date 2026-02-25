import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import MapPage from "./pages/MapPage.jsx";
import EventPage from "./pages/EventPage.jsx";
import CreateEventPage from "./pages/CreateEventPage.jsx";
import SavedPage from "./pages/SavedPage.jsx";
import { useAuth } from "./contexts/AuthContext.jsx";
import TopNav from "./components/TopNav.jsx";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Loading...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopNav />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/map"
          element={<MapPage />}
        />
        <Route
          path="/events/:eventId"
          element={<EventPage />}
        />
        <Route
          path="/events/new"
          element={
            <ProtectedRoute>
              <CreateEventPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/saved"
          element={
            <ProtectedRoute>
              <SavedPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/map" replace />} />
        <Route path="*" element={<Navigate to="/map" replace />} />
      </Routes>
    </div>
  );
};

export default App;
