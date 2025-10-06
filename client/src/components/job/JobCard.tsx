import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Building,
  Calendar,
  CheckCircle,
  GraduationCap,
  MapPin,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";
import DOMPurify from "dompurify";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePublicConfig } from "@/hooks/usePublicConfig";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { formatDeadline, formatJobText } from "@/lib/date-utils";
import { useInheritance } from '@/hooks/useInheritance';

interface JobCardProps {
  job: any;
  applicantProfile?: any;
  applyToJob: (jobId: number) => Promise<any>;
}

export default function JobCard({
  job,
  applicantProfile,
  applyToJob,
}: JobCardProps) {
  const { isAuthenticated } = useAuth();
  const { data: config } = usePublicConfig();

  const departments = config?.departments || [];
  const jobGroups = config?.jobGroups || [];
  const studyAreas = config?.studyAreas || [];
  const specializations = config?.specializations || [];
  const certificateLevels = config?.certificateLevels || [];

  const [showDetails, setShowDetails] = useState(false);
  const specialized = showDetails? job.requiredSpecializationIds: job.requiredSpecializationIds.slice(0, 2);

  const applyMutation = useMutation({
  mutationFn: () => applyToJob(job.id),
  onSuccess: () => {
    toast({
      title: "Application Submitted",
      description: "Your application has been received.",
    });
  },
  onError: (error: any) => {
    let message = "Something went wrong while applying. Please try again.";

    // handle backend error message if available
    if (error instanceof Response) {
      error.json?.().then((err) => {
        toast({
          title: "Application Failed",
          description: err.message || message,
          variant: "destructive",
        });
      });
      return;
    }

    if (error?.message) {
      message = error.message;
    }

    toast({
      title: "Application Failed",
      description: message,
      variant: "destructive",
    });
  },
});

 // --- Intelligent Eligibility Check with Reason ---
  function getEligibility() {
    if (!isAuthenticated) {
      return { eligible: false, reason: 'Please log in to check eligibility.' };
    }
    if (!applicantProfile?.education || applicantProfile.education.length === 0) {
      return { eligible: false, reason: 'No education records found in your profile.' };
    }
    const requiredStudyArea = studyAreas.find((sa: any) => sa.id === job.requiredStudyAreaId);
    const requiredCertLevel = certificateLevels.find((c: any) => c.id === job.certificateLevel);
    if (!requiredStudyArea && !requiredCertLevel && !job.requiredSpecializationIds?.length) {
      return { eligible: true, reason: 'No specific education requirements for this job.' };
    }
    // Scan all education records for a match
    for (const edu of applicantProfile.education) {
      if (requiredStudyArea && edu.studyAreaId !== requiredStudyArea.id) {
        continue;
      }
      if (job.requiredSpecializationIds?.length > 0 && !job.requiredSpecializationIds.includes(edu.specializationId)) {
        continue;
      }
      if (requiredCertLevel) {
        // Use inheritance logic if progression allowed
        if (job.progressionAllowed) {
          // Map certificateLevelId to QualificationLevel string
          const certMap: Record<number, import('@/lib/inheritanceUtils').QualificationLevel> = { 1: 'Certificate', 2: 'Ordinary Diploma', 3: 'Bachelor\'s Degree', 4: 'Master\'s Degree' };
          const currentLevel: import('@/lib/inheritanceUtils').QualificationLevel = certMap[Number(edu.certificateLevelId)] || 'Certificate';
          const targetLevel: import('@/lib/inheritanceUtils').QualificationLevel = certMap[Number(requiredCertLevel.id)] || 'Certificate';
          // Comprehensive progression rules based on certificateLevel order
          const certificateLevel = [
            "Master's Degree",
            "Bachelor's Degree",
            "Diploma Higher",
            "Advanced Diploma",
            "Ordinary Diploma",
            "Certificate",
            "O-Level",
            "A-Level",
            "KCSE",
            "KCPE",
            "Craft Certificate",
            "PhD",
            "Certification"
          ];
          const rules: import('@/lib/inheritanceUtils').InheritanceRule[] = [];
          for (let i = certificateLevel.length - 1; i > 0; i--) {
            rules.push({
              from: certificateLevel[i] as import('@/lib/inheritanceUtils').QualificationLevel,
              to: certificateLevel[i - 1] as import('@/lib/inheritanceUtils').QualificationLevel,
              minYears: 2 // You can customize minYears per transition
            });
          }
          const result = useInheritance(
            currentLevel,
            targetLevel,
            edu.doca ? new Date(edu.doca) : new Date(),
            rules
          );
          if (!result.allowed) {
            return { eligible: false, reason: result.reason || 'Progression not allowed.' };
          } else {
            if (edu.certificateLevelId !== requiredCertLevel.id) {
              continue;
            }
          }
        }
        // If all checks pass
        return { eligible: true, reason: 'You meet all education requirements.' };
      }
      // If no education record matches
    let reason = 'You do not meet the required qualifications.';
    if (requiredStudyArea && applicantProfile.education.every((edu: any) => edu.studyAreaId !== requiredStudyArea.id)) {
      reason = `Required study area: ${requiredStudyArea.name}`;
    } else if (job.requiredSpecializationIds?.length > 0 && applicantProfile.education.every((edu: any) => !job.requiredSpecializationIds.includes(edu.specializationId))) {
      reason = 'Required specialization not found in your education records.';
    } else if (requiredCertLevel && applicantProfile.education.every((edu: any) => edu.certificateLevelId !== (requiredCertLevel as any).id)) {
      reason = `Required certificate level: ${(requiredCertLevel as any).name}`;
    }
    return { eligible: false, reason };
  }
  }    
  const eligibility = getEligibility();

  // ----------------- Eligibility Check -----------------
  const isEligible = () => {
    if (!isAuthenticated) return false;

    const requiredStudyArea = studyAreas.find(
      (sa: any) => sa.id === job.requiredStudyAreaId
    );
    const requiredCertLevel = certificateLevels.find(
      (c: any) => c.id === job.certificateLevel
    );

    // If no specific requirements → allow
    if (!requiredStudyArea && !requiredCertLevel && !job.requiredSpecializationIds?.length) {
      return true;
    }

    // Applicant must have education records
    if (!applicantProfile?.education || applicantProfile.education.length === 0) {
      return false;
    }

    // Check each education record
    return applicantProfile.education.some((edu: any) => {
      // Study area must match
      if (requiredStudyArea && edu.studyAreaId !== requiredStudyArea.id) return false;

      // Specialization must match (if required)
      if (job.requiredSpecializationIds?.length > 0) {
        if (!job.requiredSpecializationIds.includes(edu.specializationId)) return false;
      }

      // Certificate Level must match
      if (requiredCertLevel) {
        if (job.progressionAllowed) {
          // progression: allow equal or higher level
          return edu.certificateLevelId >= requiredCertLevel.id;
        } else {
          // strict match
          return edu.certificateLevelId === requiredCertLevel.id;
        }
      }

      return true;
    });
  };

  // ----------------- Required Qualifications Renderer -----------------
  const getRequiredQualifications = () => {
    const studyArea = studyAreas.find((sa: any) => sa.id === job.requiredStudyAreaId);
    const certLevel = certificateLevels.find((c: any) => c.id === job.certificateLevel);

    return (
      <div className="space-y-2">
        {/* Specializations */}
        {job.requiredSpecializationIds && job.requiredSpecializationIds.length > 0 && (
          <div>
            <p className="font-medium text-sm text-gray-700">{`${certLevel?.name} either ` } in :</p>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {specialized.map((id: number) => {
                const spec = specializations.find((s: any) => s.id === id);
                return spec ? <li key={id}>{spec.name}; </li> : null;
              })}
            </ul>
          </div>
        )}
        {/* Progression Allowed */}
        {job.progressionAllowed && (
          <p className="text-sm text-green-700">
            Higher education levels accepted (progression allowed)
          </p>
        )}
      </div>
    );
  };
  // ----------------- Handle Apply -----------------
  const handleApply = () => {
     if (!eligibility?.eligible) {
      toast({
        title: eligibility?.eligible ? "Eligible" : "Not Eligible",
        description: eligibility?.reason,
        variant: eligibility?.eligible ? "default" : "destructive",
      });
      if (!eligibility?.eligible) return;
    }

    if (!isEligible()) {
      toast({
        title: "Application Not Eligible",
        description:
          "You do not meet the required education qualifications for this position.",
        variant: "destructive",
      });
      return;
    }

    applyMutation.mutate();
  };

  const deadline = formatDeadline(job.endDate);
  
  const isExpired = deadline?.color === "text-red-600" && deadline?.text === "Expired";

// const isExpired = new Date(job.endDate) < new Date(); // separate check

  const hasRequirements =
    job.requiredStudyAreaId || job.certificateLevel || job.requiredSpecializationIds?.length;

  // ----------------- Render -----------------
  return (
    <Card className="hover:shadow-md transition-shadow border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
              {job.title}
            </h3>
            <div className="flex items-center text-gray-600 text-sm mb-1">
              <Building className="w-4 h-4 mr-2" />
              <span>
                {departments.find((dept: any) => dept.id === job.departmentId)?.name ||
                  "Department not specified"}
              </span>
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
            {job.description ||
              "Job description not available. Click to view more details about this position."}
          </p>

          <div className="space-y-2">
            <div className="flex items-start text-sm text-gray-600">
              <GraduationCap className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium mb-1">Required Qualifications:</div>
                {hasRequirements ? (
                  getRequiredQualifications()
                ) : (
                  <span className="text-xs text-gray-500">
                    General qualifications apply
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="w-4 h-4 mr-2" />
              <span>Trans Nzoia County</span>
            </div>

            {deadline && (
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 mr-2" />
                <span className={deadline.color}>Deadline: {deadline.text}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                data-testid={`button-view-details-${job.id}`}
              >
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
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Department
                    </h4>
                    <p className="text-gray-600">
                      {
                        departments.find((dept: any) => dept.id === job.departmentId)
                          ?.name
                      }
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Job Group
                    </h4>
                    <p className="text-gray-600">
                      {jobGroups.find((j: any) => j.id === job.jg)?.name}
                    </p>
                  </div>
                </div>

                {/* Required Qualifications Section */}
                {hasRequirements && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Required Qualifications
                    </h4>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center mb-3">
                        <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                        <span className="font-medium text-blue-900">
                          Education Requirements
                        </span>
                      </div>

                      {getRequiredQualifications()}

                      {isAuthenticated && !eligibility?.eligible && (
                        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
                          <AlertCircle className="w-4 h-4 inline mr-1" />
                          Your current qualifications may not meet these
                          requirements.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Job Description
                  </h4>
                  <div
                    className="text-gray-600"
                    dangerouslySetInnerHTML={{
                      __html:
                        formatJobText(job.description) ||
                        "Detailed job description will be provided upon application.",
                    }}
                  />
                </div>

                {job.requirements && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Requirements
                    </h4>
                    <div
                      className="text-gray-600"
                      dangerouslySetInnerHTML={{
                        __html: formatJobText(
                          typeof job.requirements === "string"
                            ? job.requirements
                            : JSON.stringify(job.requirements, null, 2)
                        ),
                      }}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Application Deadline
                    </h4>
                    <p className="text-gray-600">
                      {deadline?.text || "Open until filled"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Status</h4>
                    <Badge
                      className={
                        job.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {job.isActive ? "Active" : "Closed"}
                    </Badge>
                  </div>
                </div>

                <div className="pt-4 border-t flex-shrink-0">
                  {!eligibility?.eligible && isAuthenticated ? (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        You do not meet the required education qualifications for
                        this position.
                      </p>
                    </div>
                  ) : null}
                  <Button
                    className="w-full"
                    onClick={handleApply}
                    disabled={
                      applyMutation.isPending ||
                      !job.isActive ||
                      isExpired ||
                      !eligibility?.eligible
                    }
                    data-testid="button-apply-modal"
                  >
                    {applyMutation.isPending
                      ? "Submitting..."
                      : !job.isActive
                      ? "Position Closed"
                      : isExpired
                      ? "Application Deadline Passed"
                      : isAuthenticated && !eligibility?.eligible
                      ? "Not Eligible"
                      : "Apply Now"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
           {/* Eligibility summary block */}
          <div className="flex flex-col items-end space-y-2">
            <div className={`text-sm ${eligibility?.eligible ? 'text-green-700' : 'text-red-600'} font-medium mb-1`}>
              {eligibility?.eligible ? 'You qualify for this job.' : 'You do not qualify.'}
            </div>
            <div className="text-xs text-gray-500 mb-2 max-w-xs text-right">
              {eligibility?.reason}
            </div>
            <Button
              onClick={handleApply}
              disabled={
                applyMutation.isPending ||
                !job.isActive ||
                isExpired ||
                !eligibility?.eligible
              }
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
              ) : !eligibility?.eligible ? (
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
        </div>
      </CardContent>
    </Card>
  );
}
