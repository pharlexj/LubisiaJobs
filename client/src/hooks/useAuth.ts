import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export function useAuth() {
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000,
  });

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } finally {
      queryClient.clear();
      setLocation("/");
    }
  };

  return {
    applicantProfile: (data as any)?.applicantProfile ?? null, 
    user: (data as any)?.user ?? null,
    redirectUrl: (data as any)?.redirectUrl,
    isAuthenticated: !!(data as any)?.user,
    isLoading,
    error,
    logout,
    refetchUser: refetch,
  };
}
