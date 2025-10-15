// src/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient"; // Centralized API request helper

type AuthMode = "login" | "signup" | "otp" | "mobile" | null;

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  profilePhoto?: string;
  [key: string]: any;
}

interface AuthContextType {
  open: boolean;
  mode: AuthMode;
  phoneNumber: string;
  user: User | null;
  openAuth: (mode: AuthMode, phoneNumber?: string) => void;
  closeAuth: () => void;
  changeMode: (mode: AuthMode) => void;
  handleClick: () => void;
  setPhoneNumber: (phone: string) => void;
  refreshUser: () => Promise<User | null>;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [user, setUser] = useState<User | null>(null);

  const queryClient = useQueryClient();

  // ✅ Load user on mount
  useEffect(() => {
    (async () => {
      const data = await refreshUser();
      if (data) setUser(data);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Refresh user (integrates your refreshSession idea)
  const refreshUser = async (): Promise<User | null> => {
    try {
      const data = await apiRequest("GET", "/api/auth/me");
      setUser(data);
      queryClient.setQueryData(["/api/auth/me"], data);
      return data;
    } catch (err: any) {
      // Auto logout if session expired
      if (err?.status === 401) {
        console.warn("Session expired, logging out...");
        logout();
      } else {
        console.error("Failed to refresh user:", err);
      }
      return null;
    }
  };

  // ✅ Logout handler (clears everything)
  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch (e) {
      console.warn("Logout error:", e);
    } finally {
      setUser(null);
      queryClient.clear();
    }
  };

  // ✅ Auth modal helpers
  const openAuth = (newMode: AuthMode, phone?: string) => {
    setMode(newMode);
    setOpen(true);
    if (phone !== undefined) setPhoneNumber(phone);
  };
  const handleClick = () => openAuth("login");
  const closeAuth = () => {
    setOpen(false);
    setMode(null);
  };
  const changeMode = (newMode: AuthMode) => setMode(newMode);

  return (
    <AuthContext.Provider
      value={{
        open,
        mode,
        phoneNumber,
        user,
        setUser,
        openAuth,
        closeAuth,
        changeMode,
        handleClick,
        setPhoneNumber,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error("useAuthContext must be used inside an AuthProvider");
  return ctx;
}
