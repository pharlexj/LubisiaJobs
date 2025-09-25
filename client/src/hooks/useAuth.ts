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
    applicantProfile: data?.applicantProfile ?? null, 
    user: data?.user ?? null,
    redirectUrl: data?.redirectUrl,
    isAuthenticated: !!data?.user,
    isLoading,
    error,
    logout,
    refetchUser: refetch,
  };
}
