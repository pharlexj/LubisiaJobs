import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

type ProfileResponse = {
  applicantProfile?: {
    profileCompletionPercentage?: number;
  };
};

export default function ProfileCompletion() {
  const { user } = useAuth();
  
  const { data: profile } = useQuery<ProfileResponse>({
    queryKey: ["/api/auth/user"],
    enabled: !!user,
  });

  const completionPercentage = profile?.applicantProfile?.profileCompletionPercentage || 0;

  return (
    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
      <p className="text-xs font-medium text-gray-700 mb-2">Profile Completion</p>
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        <span className="text-xs text-gray-600">{completionPercentage}%</span>
      </div>
    </div>
  );
}