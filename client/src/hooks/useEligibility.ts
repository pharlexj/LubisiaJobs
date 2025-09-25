// hooks/useEligibility.ts
export interface EducationRecord {
  studyAreaId: number;
  specializationId: number;
  certificateLevelId: number;
}

export interface JobRequirement {
  requiredStudyAreaId?: number;
  requiredSpecializationIds?: number[];
  certificateLevel?: number;
  progressionAllowed?: boolean;
}

export interface ApplicantProfile {
  education?: EducationRecord[];
}

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}

export function useEligibility(
  job: JobRequirement,
  applicantProfile: ApplicantProfile | null,
  isAuthenticated: boolean
): EligibilityResult {
  if (!isAuthenticated) {
    return { eligible: false, reasons: ["You must be logged in to apply."] };
  }

  // If job has no specific requirements → open to all
  if (
    !job.requiredStudyAreaId &&
    !job.certificateLevel &&
    (!job.requiredSpecializationIds || job.requiredSpecializationIds.length === 0)
  ) {
    return { eligible: true, reasons: [] };
  }

  if (!applicantProfile?.education || applicantProfile.education.length === 0) {
    return { eligible: false, reasons: ["No education records found."] };
  }

  let reasons: string[] = [];

  for (const edu of applicantProfile.education) {
    let recordReasons: string[] = [];

    if (job.requiredStudyAreaId && edu.studyAreaId !== job.requiredStudyAreaId) {
      recordReasons.push("Your study area does not match.");
    }

    if (
      job.requiredSpecializationIds &&
      job.requiredSpecializationIds.length > 0 &&
      !job.requiredSpecializationIds.includes(edu.specializationId)
    ) {
      recordReasons.push("Your specialization does not match.");
    }

    if (job.certificateLevel) {
      if (job.progressionAllowed) {
        if (edu.certificateLevelId < job.certificateLevel) {
          recordReasons.push("Your certificate level is lower than required.");
        }
      } else {
        if (edu.certificateLevelId !== job.certificateLevel) {
          recordReasons.push("This job requires an exact certificate level match.");
        }
      }
    }

    // ✅ If no issues for this record → eligible
    if (recordReasons.length === 0) {
      return { eligible: true, reasons: [] };
    }

    // ❌ keep track of failures
    reasons = [...reasons, ...recordReasons];
  }

  return { eligible: false, reasons };
}

