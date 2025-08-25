// components/LogoutButton.tsx
import { useAuth } from "@/store/auth";

export default function LogoutButton() {
  const logout = useAuth((s) => s.logout);

  return (
    <button
      onClick={() => {
        fetch("/api/logout").then(() => logout());
      }}
      className="btn-danger"
    >
      Logout
    </button>
  );
}
