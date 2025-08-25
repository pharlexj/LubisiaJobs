import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

const NotFound = () => {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  const isLoggedIn = !!user;
  const role = user?.role;

  const getRedirectPath = () => {
    switch (role) {
      case "admin":
        return "/admin";
      case "board":
        return "/board";
      case "applicant":
        return "/dashboard";
      default:
        return "/";
    }
  };

  const handleRedirect = () => {
    setLocation(getRedirectPath());
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900"> 404 Page Not Available</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            {isLoggedIn
              ? `You are logged in as "${role}", but this page either doesn't exist or you don't have permission to access it.`
              : `You are not logged in. This page either doesn't exist or requires authentication.`}
          </p>

          <p className="mt-2 text-xs text-gray-500 italic">
            { role==="admin" ? `Did you forget to add ${location} to the router?`: `You are not allowed to this page!!`}
          </p>

          <div className="mt-6 flex justify-center">
            <Button onClick={handleRedirect}>
              {isLoggedIn ? "Go to Dashboard" : "Go to Home"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
