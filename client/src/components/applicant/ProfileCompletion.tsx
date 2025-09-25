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

  // ✅ Clamp value between 0 and 100
  const rawPercentage = profile?.applicantProfile?.profileCompletionPercentage ?? 0;
  const completionPercentage = Math.min(Math.max(rawPercentage, 0), 100);

  return (
    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
      <p className="text-xs font-medium text-gray-700 mb-2">Profile Completion</p>
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <span className="text-xs text-gray-600">{completionPercentage}%</span>
      </div>
    </div>
  );
}
