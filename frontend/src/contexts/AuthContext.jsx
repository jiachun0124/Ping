import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, clearAuthToken, setAuthToken } from "../api/client.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const data = await api.authMe();
      setUser(data);
    } catch (error) {
      if (error?.status === 401) {
        clearAuthToken();
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const authToken = currentUrl.searchParams.get("auth_token");
    if (authToken) {
      setAuthToken(authToken);
      currentUrl.searchParams.delete("auth_token");
      window.history.replaceState(
        {},
        document.title,
        `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`
      );
    }
    refresh();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      setUser,
      refresh
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
