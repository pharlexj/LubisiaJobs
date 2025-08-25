// src/components/ProtectedRoute.tsx
import { Route } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import React from "react";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  allowedRoles: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  path,
  component: Component,
  allowedRoles,
}) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Route path={path} component={NotFound} />;
  }

  return <Route path={path} component={() => <Component />} />;
};
