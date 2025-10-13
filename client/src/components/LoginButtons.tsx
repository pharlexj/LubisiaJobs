// components/LoginButtons.tsx
import { useEffect } from "react";
import { useAuth } from "@/store/auth";

export default function LoginButtons() {
  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.email) {
          useAuth.getState().setAuth(data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-x-4">
      <a href="/api/google/login" className="btn-primary">Login with Google</a>
      <a href="/api/facebook/login" className="btn-secondary">Login with Facebook</a>
    </div>
  );
}
