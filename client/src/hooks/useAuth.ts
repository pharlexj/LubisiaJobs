import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useEffect } from "react";

export function useAuth() {
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Enable mounting fetch for auth check
    refetchInterval: false,
    refetchIntervalInBackground: false,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Handle redirects based on server response
  useEffect(() => {
    if (user && user.redirectUrl && user.redirectUrl !== location) {
      // Only redirect if we're on a public page or login page
      const publicPages = ['/', '/about', '/gallery', '/faqs', '/notices', '/jobs'];
      const isOnPublicPage = publicPages.includes(location);
      const isOnLoginPage = location.includes('login') || location.includes('auth');
      
      if (isOnPublicPage || isOnLoginPage) {
        console.log('Redirecting to:', user.redirectUrl);
        setLocation(user.redirectUrl);
      }
    }
  }, [user, location, setLocation]);

  const logout = () => {
    queryClient.clear();
    window.location.href = '/api/logout';
  };

  const refetchUser = () => {
    return refetch();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    logout,
    refetchUser,
  };
}
