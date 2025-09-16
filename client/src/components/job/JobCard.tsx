import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import { usePublicConfig } from "@/hooks/usePublicConfig";
import { useAuth } from '@/hooks/useAuth';
import DOMPurify from 'dompurify';
import { 
  Calendar, 
  GraduationCap, 
  MapPin, 
  Building, 
  Clock, 
  Users,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

interface JobCardProps {
  job: any;
  isAuthenticated: boolean;
}

export default function JobCard({ job, isAuthenticated }: JobCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDetails, setShowDetails] = useState(false);
  const { data: config } = usePublicConfig();
  const { user } = useAuth();
  
  // Get applicant's education records to check eligibility
  const { data: applicantProfile } = useQuery({
    queryKey: ['/api/applicant/profile'],
    enabled: isAuthenticated && user?.role === 'applicant'
  }) as { data: { education?: any[] } | undefined };

  const jobGroups = config?.jobGroups || [];
  const departments = config?.departments || [];

  const applyMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/applicant/apply', { jobId: job.id });
    },
    onSuccess: () => {
      toast({
        title: 'Application Submitted',
        description: 'Your application has been submitted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/applicant/applications'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: 'Application Failed',
        description: error.message || 'Failed to submit application',
        variant: 'destructive',
      });
    },
  });

  const formatDeadline = (deadline: string) => {
    if (!deadline) return null;
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Expired', color: 'text-red-600' };
    if (diffDays === 0) return { text: 'Today', color: 'text-red-600' };
    if (diffDays === 1) return { text: 'Tomorrow', color: 'text-yellow-600' };
    if (diffDays <= 7) return { text: `${diffDays} days left`, color: 'text-yellow-600' };
    return { text: date.toLocaleDateString(), color: 'text-gray-600' };
  };

  // Check if applicant is eligible based on education requirements
  const isEligible = () => {
    if (!isAuthenticated) {
      return false; // Must be authenticated
    }
    
    // If no specific requirements, allow application for authenticated users
    if (!job.requiredCourses && !job.certificateLevel) {
      return true;
    }
    
    // If requirements exist but no education records, not eligible
    if (!applicantProfile?.education || applicantProfile.education.length === 0) {
      return false;
    }
    
    // Parse required courses from varchar field (could be comma/space separated)
    const requiredCourseIds = new Set<number>();
    if (job.requiredCourses) {
      const courseStr = job.requiredCourses.toString().trim();
      if (courseStr) {
        courseStr.split(/[,\s]+/).forEach((id: string) => {
          const parsed = parseInt(id.trim());
          if (!isNaN(parsed)) requiredCourseIds.add(parsed);
        });
      }
    }
    
    // Check if applicant has matching education qualifications
    const hasMatchingEducation = applicantProfile.education.some((education: any) => {
      // Check course match if required courses are specified
      const courseMatch = requiredCourseIds.size === 0 || 
        (education.courseId && requiredCourseIds.has(education.courseId));
      
      // For certificate level, we'll be more lenient since there may be schema mismatch
      // TODO: This needs proper mapping between certificate_level and awards tables
      const levelMatch = !job.certificateLevel || 
        education.certificateLevelId === job.certificateLevel ||
        education.awardId === job.certificateLevel; // Try both possible fields
      
      return courseMatch && levelMatch;
    });
    
    return hasMatchingEducation;
  };
  
  const handleApply = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to apply for this position.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!isEligible()) {
      toast({
        title: 'Application Not Eligible',
        description: 'You do not meet the required education qualifications for this position.',
        variant: 'destructive',
      });
      return;
    }
    
    applyMutation.mutate();
  };
  
  // Format and sanitize text with proper roman numerals and formatting
  const formatJobText = (text: string | null | undefined) => {
    if (!text) return '';
    
    // Replace roman numerals with proper formatting
    let formatted = text
      .replace(/\b(i{1,3}|iv|v|vi{0,3}|ix|x)\./gi, (match) => 
        `${match.toUpperCase()}`
      )
      // Handle common formatting patterns
      .replace(/\n/g, '<br>')
      .replace(/\r\n/g, '<br>')
      // Ensure proper spacing around periods
      .replace(/\.(\S)/g, '. $1');
    
    // Sanitize HTML to prevent XSS attacks
    return DOMPurify.sanitize(formatted, {
      ALLOWED_TAGS: ['br', 'p', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
      ALLOWED_ATTR: []
    });
  };

  const deadline = formatDeadline(job.endDate);
  const isExpired = deadline?.color === 'text-red-600' && deadline?.text === 'Expired';

  return (
    <>
      <Card className="hover:shadow-md transition-shadow border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{job.title}</h3>
              <div className="flex items-center text-gray-600 text-sm mb-1">
                <Building className="w-4 h-4 mr-2" />
                <span>{departments.find(dept => dept.id === job.departmentId)?.name || 'Department not specified'}</span>
              </div>
              <div className="flex items-center text-primary font-medium text-sm">
                <Badge variant="outline" className="border-primary text-primary">
                  Job Group {jobGroups.find((d: any) => d.id === job.jg)?.name}
                </Badge>
              </div>
            </div>
            <div className="ml-4">
              {job.isActive ? (
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              ) : (
                <Badge variant="secondary">Closed</Badge>
              )}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-gray-600 text-sm mb-3 line-clamp-3">
              {job.description || 'Job description not available. Click to view more details about this position.'}
            </p>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-500">
                <GraduationCap className="w-4 h-4 mr-2" />
                <span>Qualifications as per job requirements</span>
              </div>

              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="w-4 h-4 mr-2" />
                <span>Trans Nzoia County</span>
              </div>

              {deadline && (
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className={deadline.color}>
                    Deadline: {deadline.text}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" data-testid={`button-view-details-${job.id}`}>
                  View Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle className="pr-6">{job.title}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Department</h4>
                      <p className="text-gray-600">{departments.find(dept => dept.id === job.departmentId)?.name}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Job Group</h4>
                      <p className="text-gray-600">{jobGroups.find((j: any) => j.id === job.jg)?.name}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Job Description</h4>
                    <div className="text-gray-600" dangerouslySetInnerHTML={{
                      __html: formatJobText(job.description) || 'Detailed job description will be provided upon application.'
                    }} />
                  </div>

                  {job.requirements && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Requirements</h4>
                      <div className="text-gray-600" dangerouslySetInnerHTML={{
                        __html: formatJobText(typeof job.requirements === 'string' 
                          ? job.requirements 
                          : JSON.stringify(job.requirements, null, 2))
                      }} />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Application Deadline</h4>
                      <p className="text-gray-600">
                        {deadline?.text || 'Open until filled'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Status</h4>
                      <Badge className={job.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {job.isActive ? 'Active' : 'Closed'}
                      </Badge>
                    </div>
                  </div>

                  <div className="pt-4 border-t flex-shrink-0">
                    {!isEligible() && isAuthenticated ? (
                      <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800">
                          <AlertCircle className="w-4 h-4 inline mr-1" />
                          You do not meet the required education qualifications for this position.
                        </p>
                      </div>
                    ) : null}
                    <Button 
                      className="w-full" 
                      onClick={handleApply}
                      disabled={applyMutation.isPending || !job.isActive || isExpired || (isAuthenticated && !isEligible())}
                      data-testid="button-apply-modal"
                    >
                      {applyMutation.isPending ? 'Submitting...' : 
                       !job.isActive ? 'Position Closed' :
                       isExpired ? 'Application Deadline Passed' :
                       (isAuthenticated && !isEligible()) ? 'Not Eligible' :
                       'Apply Now'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              onClick={handleApply}
              disabled={applyMutation.isPending || !job.isActive || isExpired || (isAuthenticated && !isEligible())}
              className="ml-2"
              data-testid={`button-apply-${job.id}`}
            >
              {applyMutation.isPending ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : !job.isActive ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Closed
                </>
              ) : isExpired ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Expired
                </>
              ) : (isAuthenticated && !isEligible()) ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Not Eligible
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Apply Now
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
