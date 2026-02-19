import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { api } from "../api/client.js";

const TopNav = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      navigate("/login");
    }
  };

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-semibold">
            P
          </div>
          <span className="font-semibold text-lg">Ping</span>
        </div>
        {user && (
          <nav className="flex items-center gap-4 text-sm">
            <NavLink
              to="/map"
              className={({ isActive }) =>
                isActive ? "text-indigo-600 font-semibold" : "text-slate-600"
              }
            >
              Map
            </NavLink>
            <NavLink
              to="/saved"
              className={({ isActive }) =>
                isActive ? "text-indigo-600 font-semibold" : "text-slate-600"
              }
            >
              Saved
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                isActive ? "text-indigo-600 font-semibold" : "text-slate-600"
              }
            >
              Profile
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className="text-slate-600 hover:text-slate-900"
            >
              Log out
            </button>
          </nav>
        )}
      </div>
    </header>
  );
};

export default TopNav;
