// store/auth.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type UserType = "APPLICANT" | "ADMIN" | "COMMITTEE";

type AuthState = {
  user: {
    email: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
    role: UserType;
  } | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthState["user"]) => void;
  logout: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setAuth: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: "auth-store" }
  )
);
