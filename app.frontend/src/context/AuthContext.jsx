import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "ai-review-auth";

const AuthContext = createContext(null);

const readStoredAuth = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: null, user: null };

    const parsed = JSON.parse(raw);
    if (typeof parsed?.token !== "string") {
      localStorage.removeItem(STORAGE_KEY);
      return { token: null, user: null };
    }

    return {
      token: parsed.token,
      user: parsed.user ?? null,
    };
  } catch (error) {
    console.warn("Failed to parse stored auth payload:", error);
    localStorage.removeItem(STORAGE_KEY);
    return { token: null, user: null };
  }
};

export const AuthProvider = ({ children }) => {
  const [{ token, user }, setAuthState] = useState(() => readStoredAuth());
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  useEffect(() => {
    setIsCheckingToken(false);
  }, []);

  useEffect(() => {
    if (!token) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    const payload = JSON.stringify({ token, user });
    localStorage.setItem(STORAGE_KEY, payload);
  }, [token, user]);

  const login = useCallback((nextToken, nextUser) => {
    setAuthState({ token: nextToken, user: nextUser ?? null });
  }, []);

  const logout = useCallback(() => {
    setAuthState({ token: null, user: null });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      login,
      logout,
      isCheckingToken,
      isAuthenticated: Boolean(token),
    }),
    [token, user, login, logout, isCheckingToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};
