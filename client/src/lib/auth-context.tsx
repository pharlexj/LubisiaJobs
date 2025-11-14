import { createContext, useContext, useState, useEffect } from "react";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isOfficer: boolean;
  isReviewer: boolean;
  isAuditor: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("dial_user");
    if (stored) {
      const parsed = JSON.parse(stored);
      // Set a default user ID if not present (for demo purposes)
      if (!parsed.id) {
        parsed.id = `user-${parsed.role}-${Date.now()}`;
      }
      return parsed;
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("dial_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("dial_user");
    }
  }, [user]);

  const isOfficer = user?.role === "officer";
  const isReviewer = user?.role === "reviewer";
  const isAuditor = user?.role === "auditor";
  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, setUser, isOfficer, isReviewer, isAuditor, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
