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
import { formatDeadline } from "@/lib/date-utils";

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
        {/* Study Area */}
        {studyArea && (
          <p className="text-sm text-gray-700">
            <span className="font-medium">Study Area:</span> {studyArea.name}
          </p>
        )}

        {/* Specializations */}
        {job.requiredSpecializationIds && job.requiredSpecializationIds.length > 0 && (
          <div>
            <p className="font-medium text-sm text-gray-700">Specializations:</p>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {job.requiredSpecializationIds.map((id: number) => {
                const spec = specializations.find((s: any) => s.id === id);
                return spec ? <li key={id}>{spec.name}</li> : null;
              })}
            </ul>
          </div>
        )}

        {/* Certificate Level */}
        {certLevel && (
          <p className="text-sm text-gray-700">
            <span className="font-medium">Certificate Level:</span> {certLevel.name}
          </p>
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

  // ----------------- Format Text -----------------
  const formatJobText = (text: string | null | undefined) => {
    if (!text) return "";

    let formatted = text
      .replace(/\b(i{1,3}|iv|v|vi{0,3}|ix|x)\./gi, (match) => `${match.toUpperCase()}`)
      .replace(/\n/g, "<br>")
      .replace(/\r\n/g, "<br>")
      .replace(/\.(\S)/g, ". $1");

    return DOMPurify.sanitize(formatted, {
      ALLOWED_TAGS: ["br", "p", "strong", "em", "u", "ol", "ul", "li"],
      ALLOWED_ATTR: [],
    });
  };

  // ----------------- Handle Apply -----------------
  const handleApply = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to apply for this position.",
        variant: "destructive",
      });
      return;
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

                      {isAuthenticated && !isEligible() && (
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
                  {!isEligible() && isAuthenticated ? (
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
                      (isAuthenticated && !isEligible())
                    }
                    data-testid="button-apply-modal"
                  >
                    {applyMutation.isPending
                      ? "Submitting..."
                      : !job.isActive
                      ? "Position Closed"
                      : isExpired
                      ? "Application Deadline Passed"
                      : isAuthenticated && !isEligible()
                      ? "Not Eligible"
                      : "Apply Now"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            onClick={handleApply}
            disabled={
              applyMutation.isPending ||
              !job.isActive ||
              isExpired ||
              (isAuthenticated && !isEligible())
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
            ) : isAuthenticated && !isEligible() ? (
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
  );
}
