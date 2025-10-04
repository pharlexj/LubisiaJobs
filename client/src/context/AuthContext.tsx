// src/context/AuthContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";

type AuthMode = "login" | "signup" | "otp" | null;

interface AuthContextType {
  open: boolean;
  mode: AuthMode;
  phoneNumber: string;
  openAuth: (mode: AuthMode, phoneNumber?: string) => void;
  closeAuth: () => void;
  changeMode: (mode: AuthMode) => void;
  handleClick: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>(null);
  const [phoneNumber, setPhoneNumber] = useState("");

  const openAuth = (newMode: AuthMode, phone?: string) => {
    setMode(newMode);
    setOpen(true);
    setPhoneNumber(phone || ""); // always reset if not provided
  };
  const handleClick = () => {
    openAuth("login");
  };
  const closeAuth = () => {
    setOpen(false);
    setMode(null);
    setPhoneNumber("");
  };

  const changeMode = (newMode: AuthMode) => {
    setMode(newMode);
  };

  return (
    <AuthContext.Provider
      value={{ open, mode, phoneNumber, openAuth, closeAuth, changeMode, handleClick }}
    >
      {children}
    </AuthContext.Provider>
  );
}
  
export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside AuthProvider");
  return ctx;
}
