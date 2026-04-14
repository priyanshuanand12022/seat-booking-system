import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "../services/api";

const STORAGE_KEY = "seat-booking-auth";
const AuthContext = createContext(null);

const readStoredAuth = () => {
  const rawValue = localStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return { token: "", user: null };
  }

  try {
    return JSON.parse(rawValue);
  } catch (_error) {
    localStorage.removeItem(STORAGE_KEY);
    return { token: "", user: null };
  }
};

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(readStoredAuth().token));

  useEffect(() => {
    if (!auth.token) {
      setIsBootstrapping(false);
      return;
    }

    let isMounted = true;

    apiRequest("/auth/me", { token: auth.token })
      .then((response) => {
        if (!isMounted) {
          return;
        }

        const nextAuth = { token: auth.token, user: response.user };
        setAuth(nextAuth);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth));
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        localStorage.removeItem(STORAGE_KEY);
        setAuth({ token: "", user: null });
      })
      .finally(() => {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [auth.token]);

  const persistAuth = (payload) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setAuth(payload);
  };

  const login = async (credentials) => {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: credentials,
    });

    persistAuth({ token: response.token, user: response.user });
    return response;
  };

  const register = async (payload) => {
    const response = await apiRequest("/auth/register", {
      method: "POST",
      body: payload,
    });

    persistAuth({ token: response.token, user: response.user });
    return response;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth({ token: "", user: null });
  };

  const value = {
    token: auth.token,
    user: auth.user,
    isAuthenticated: Boolean(auth.token && auth.user),
    isBootstrapping,
    login,
    register,
    logout,
    setAuthUser: (user) => persistAuth({ token: auth.token, user }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
