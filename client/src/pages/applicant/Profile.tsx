import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/layout/Navigation';
import Sidebar from '@/components/layout/Sidebar';
import ProgressIndicator from '@/components/applicant/ProgressIndicator';
import ProfileForm from '@/components/applicant/ProfileForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';

export default function ApplicantProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    enabled: !!user,
  });

  const steps = [
    { id: 1, name: 'Personal Details', required: true },
    { id: 1.5, name: 'Employee Details', required: true, conditional: true }, // Only show if verified employee
    { id: 2, name: 'Address Information', required: true },
    { id: 3, name: 'Educational Background', required: true },
    { id: 4, name: 'Short Courses', required: false },
    { id: 5, name: 'Professional Qualifications', required: false },
    { id: 6, name: 'Employment History', required: true },
    { id: 7, name: 'Referees', required: true },
    { id: 8, name: 'Document Uploads', required: true },
  ];

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = profile?.applicantProfile ? 'PUT' : 'POST';
      return await apiRequest(method, '/api/applicant/profile', data);
    },
    onSuccess: () => {
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: 'Unauthorized',
          description: 'You are logged out. Logging in again...',
          variant: 'destructive',
        });
        setTimeout(() => {
          // window.location.href = '/api/login';
        }, 500);
        return;
      }
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });

  const handleSaveStep = (stepData: any) => {
    const profileData = {
      ...profile?.applicantProfile,
      ...stepData,
    };
    
    // Remove undefined fields to prevent database errors
    Object.keys(profileData).forEach(key => {
      if (profileData[key] === undefined) {
        delete profileData[key];
      }
    });
    
    updateProfileMutation.mutate(profileData);
    
    // After successful save on step 1 with employee verification, move to step 1.5
    if (currentStep === 1 && stepData.isVerifiedEmployee) {
      setTimeout(() => {
        setCurrentStep(1.5);
      }, 1000);
    }
  };

  const isEmployeeVerified = profile?.applicantProfile?.isEmployee && (profile?.applicantProfile?.employee || profile?.applicantProfile?.isVerifiedEmployee);
  
  const getNextStep = (current: number) => {
    if (current === 1 && isEmployeeVerified) {
      return 1.5; // Go to employee details if verified
    }
    if (current === 1 && !isEmployeeVerified) {
      return 2; // Skip employee details if not verified
    }
    if (current === 1.5) {
      return 2; // From employee details to address
    }
    return current + 1;
  };
  
  const getPrevStep = (current: number) => {
    if (current === 2 && isEmployeeVerified) {
      return 1.5; // Go back to employee details if verified
    }
    if (current === 2 && !isEmployeeVerified) {
      return 1; // Go back to personal details if not verified
    }
    if (current === 1.5) {
      return 1; // From employee details to personal
    }
    return current - 1;
  };

  const isEmployeeVerified = profile?.applicantProfile?.isEmployee && profile?.applicantProfile?.employee;
  
  const getNextStep = (current: number) => {
    if (current === 1 && isEmployeeVerified) {
      return 1.5; // Go to employee details if verified
    }
    if (current === 1 && !isEmployeeVerified) {
      return 2; // Skip employee details if not verified
    }
    if (current === 1.5) {
      return 2; // From employee details to address
    }
    return current + 1;
  };
  
  const getPrevStep = (current: number) => {
    if (current === 2 && isEmployeeVerified) {
      return 1.5; // Go back to employee details if verified
    }
    if (current === 2 && !isEmployeeVerified) {
      return 1; // Go back to personal details if not verified
    }
    if (current === 1.5) {
      return 1; // From employee details to personal
    }
    return current - 1;
  };

  const handleNextStep = () => {
    const next = getNextStep(currentStep);
    if (next <= 8) {
      setCurrentStep(next);
    }
  };

  const handlePrevStep = () => {
    const prev = getPrevStep(currentStep);
    if (prev >= 1) {
      setCurrentStep(prev);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: 'Unauthorized',
        description: 'You are logged out. Logging in again...',
        variant: 'destructive',
      });
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
      return;
    }
  }, [isLoading, user, toast]);

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

  if (!user || user.role !== 'applicant') {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600">You don't have permission to access this page.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      
      <div className="flex">
        <Sidebar userRole="applicant" />
        
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
              <p className="text-gray-600">
                Fill in all the required information to complete your application profile.
                You can save your progress and continue later.
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
                  completedSteps={profile?.applicantProfile?.profileCompletionPercentage || 0}
                />
              </CardContent>
            </Card>

            {/* Profile Form */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Step {currentStep}: {steps.find(s => s.id === currentStep)?.name}
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
                    <Button
                      variant="outline"
                      onClick={() => handleSaveStep({})}
                      disabled={updateProfileMutation.isPending}
                    >
                      Save Progress
                    </Button>
                    
                    {currentStep < 8 ? (
                      <Button onClick={handleNextStep}>
                        Next Step
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          handleSaveStep({});
                          toast({
                            title: 'Profile Complete!',
                            description: 'Your profile has been completed successfully. You can now apply for jobs.',
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

            {/* Help Text */}
            <Card className="mt-6">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">
                  <strong>Need Help?</strong> Your progress is automatically saved as you complete each step.
                  You can return to any previous step to make changes. All required fields must be completed
                  before you can submit job applications.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
