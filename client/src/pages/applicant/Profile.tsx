import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/layout/Navigation";
import Sidebar from "@/components/layout/Sidebar";
import ProgressIndicator from "@/components/applicant/ProgressIndicator";
import ProfileForm from "@/components/applicant/ProfileForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

// ------------------ Step type ------------------ //
type Step = 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

type ProfileResponse = {
  applicantProfile?: {
    id: number;
    isEmployee?: boolean;
    profileCompletionPercentage?: number;
    completedSteps?: number[];
    [key: string]: any;
  };
  [key: string]: any;
};

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ✅ Fetch profile from backend
  const { data: profile, isLoading } = useQuery<ProfileResponse>({
    queryKey: ["/api/auth/user"],
    enabled: !!user,
  });

  const isEmployeeVerified = profile?.applicantProfile?.isEmployee;

  // ✅ Helper to get next allowed step based on completion
  const getNextAllowedStep = (completedSteps: number[], isEmployee: boolean): Step => {
    if (completedSteps.length === 0) return 1; // Start at step 1
    
    const highestCompleted = Math.max(...completedSteps) as Step;
    
    // Map next allowed step based on highest completed
    if (highestCompleted === 1) {
      return isEmployee ? 1.5 : 2;
    } else if (highestCompleted === 1.5) {
      return 2;
    } else {
      return Math.min(8, (highestCompleted + 1)) as Step;
    }
  };

  // ✅ Calculate correct step based on data (will be computed in useEffect)
  const calculateCorrectStep = (): Step => {
    if (!profile?.applicantProfile) return 1;
    
    const searchParams = new URLSearchParams(window.location.search);
    const stepParam = searchParams.get("step");
    const completed = profile?.applicantProfile?.completedSteps || [];
    const maxAllowedStep = getNextAllowedStep(completed, !!isEmployeeVerified);

    if (stepParam) {
      const requestedStep = parseFloat(stepParam) as Step;
      // Validate requested step and clamp to allowed range
      if (requestedStep >= 1 && requestedStep <= 8 && [1, 1.5, 2, 3, 4, 5, 6, 7, 8].includes(requestedStep)) {
        return Math.min(requestedStep, maxAllowedStep) as Step;
      } else {
        return maxAllowedStep; // Invalid step requested, use max allowed
      }
    } else {
      return maxAllowedStep;
    }
  };

  const [currentStep, setCurrentStep] = useState<Step>(1);

  // ✅ Steps definition (with completed flag driven by DB)
  const steps = [
    {
      id: 1,
      name: "Personal Details",
      required: true,
      completed:
        profile?.applicantProfile?.completedSteps?.includes(1) ?? false,
    },
    {
      id: 1.5,
      name: "Employee Details",
      required: true,
      conditional: true,
      completed:
        profile?.applicantProfile?.completedSteps?.includes(1.5) ?? false,
    },
    {
      id: 2,
      name: "Address Information",
      required: true,
      completed:
        profile?.applicantProfile?.completedSteps?.includes(2) ?? false,
    },
    {
      id: 3,
      name: "Educational Background",
      required: true,
      completed:
        profile?.applicantProfile?.completedSteps?.includes(3) ?? false,
    },
    {
      id: 4,
      name: "Short Courses",
      required: false,
      completed:
        profile?.applicantProfile?.completedSteps?.includes(4) ?? false,
    },
    {
      id: 5,
      name: "Professional Qualifications",
      required: false,
      completed:
        profile?.applicantProfile?.completedSteps?.includes(5) ?? false,
    },
    {
      id: 6,
      name: "Employment History",
      required: true,
      completed:
        profile?.applicantProfile?.completedSteps?.includes(6) ?? false,
    },
    {
      id: 7,
      name: "Referees",
      required: true,
      completed:
        profile?.applicantProfile?.completedSteps?.includes(7) ?? false,
    },
    {
      id: 8,
      name: "Document Uploads",
      required: true,
      completed:
        profile?.applicantProfile?.completedSteps?.includes(8) ?? false,
    },
  ];

  // ✅ Mutation for saving
  const updateProfileMutation = useMutation({
    mutationFn: async (payload: any) => {      
      const { method, applicantId, step, data } = payload;
      if (step ===8) return await apiRequest("POST","/api/applicant/documents",{data,applicantId})
      if (method === "POST") {
        return await apiRequest("POST", "/api/applicant/profile", {
          data,
          applicantId,
        });
      }
      if (method === "PATCH") {
        return await apiRequest("PATCH", "/api/applicant/profile", {
          applicantId,
          step,
          data,
        });
      }
      throw new Error("Invalid method for profile mutation");
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => (window.location.href = "/"), 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // ✅ Save handler with automatic progression
  const handleSaveStep = (payload: any) => {
    updateProfileMutation.mutate(payload, {
      onSuccess: () => {
        // Determine next step based on current step and fresh payload data
        let nextStep: Step;
        
        if (currentStep === 1) {
          // Use fresh payload data for employee status
          nextStep = payload.data.isEmployee ? 1.5 : 2;
        } else if (currentStep < 8) {
          // For other steps, use current getNextStep logic
          nextStep = getNextStep(currentStep);
        } else {
          return; // Don't advance from step 8
        }
        
        setTimeout(() => setCurrentStep(nextStep), 500);
      },
    });
  };

  // ✅ Step navigation
  const getNextStep = (current: Step): Step => {
    if (current === 1 && isEmployeeVerified) return 1.5;
    if (current === 1 && !isEmployeeVerified) return 2;
    if (current === 1.5) return 2;
    return (current + 1) as Step;
  };
  const getPrevStep = (current: Step): Step => {
    if (current === 2 && isEmployeeVerified) return 1.5;
    if (current === 2 && !isEmployeeVerified) return 1;
    if (current === 1.5) return 1;
    return (current - 1) as Step;
  };

  // Step navigation now handled through validation in ProfileForm
  // No direct next step - user must save current step to advance
  const handlePrevStep = () => {
    const prev = getPrevStep(currentStep);
    if (prev >= 1) setCurrentStep(prev);
  };

  // ✅ Update current step when profile data loads
  useEffect(() => {
    if (!isLoading && profile?.applicantProfile) {
      const correctStep = calculateCorrectStep();
      setCurrentStep(correctStep);
    }
  }, [isLoading, profile?.applicantProfile, isEmployeeVerified]);

  // ✅ Auth check
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    }
  }, [isLoading, user, toast]);

  // ✅ Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="flex">
          <Sidebar userRole="applicant" />
          <main className="flex-1 p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ✅ Access control
  if (!user || user.role !== "applicant") {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Access Denied
              </h2>
              <p className="text-gray-600">
                You don't have permission to access this page.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ✅ Main render
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="flex">
        <Sidebar userRole="applicant" />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Complete Your Profile
              </h1>
              <p className="text-gray-600">
                Fill in all the required information to complete your
                application profile. You can save your progress and continue
                later.
              </p>
            </div>

            {/* Progress Indicator */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Profile Completion Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressIndicator
                  steps={steps}
                  currentStep={currentStep}
                  completedSteps={
                    profile?.applicantProfile?.completedSteps?.length || 0
                  }
                />
              </CardContent>
            </Card>

            {/* Profile Form */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Step {currentStep}:{" "}
                  {steps.find((s) => s.id === currentStep)?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileForm
                  step={currentStep}
                  profile={profile?.applicantProfile}
                  onSave={handleSaveStep}
                  isLoading={updateProfileMutation.isPending}
                />

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={handlePrevStep}
                    disabled={currentStep === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex space-x-4">
                    {currentStep < 8 ? (
                      <p className="text-sm text-gray-600 self-center">
                        Save this step to continue to the next step
                      </p>
                    ) : (
                      <Button
                        onClick={() => {
                          toast({
                            title: "Profile Complete!",
                            description:
                              "Your profile has been completed successfully. You can now apply for jobs.",
                          });
                        }}
                        disabled={updateProfileMutation.isPending}
                      >
                        Complete Profile
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
