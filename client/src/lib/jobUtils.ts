// jobUtils.ts
export function checkEligibility(job: any, applicantProfile: any, isAuthenticated: boolean) {
  if (!isAuthenticated) {
    return { eligible: false, reason: "You must be logged in to apply." };
  }

  if (
    !job.requiredStudyAreaId &&
    !job.certificateLevel &&
    (!job.requiredSpecializationIds || job.requiredSpecializationIds.length === 0)
  ) {
    return { eligible: true };
  }

  if (!applicantProfile?.education || applicantProfile.education.length === 0) {
    return { eligible: false, reason: "No education records found." };
  }

  let lastReason = "No matching education record found.";
  for (const edu of applicantProfile.education) {
    if (job.requiredStudyAreaId && edu.studyAreaId !== job.requiredStudyAreaId) {
      lastReason = "Your study area does not match.";
      continue;
    }
    if (job.requiredSpecializationIds?.length > 0 && !job.requiredSpecializationIds.includes(edu.specializationId)) {
      lastReason = "Your specialization does not match.";
      continue;
    }
    if (job.certificateLevel) {
      if (job.progressionAllowed) {
        if (edu.certificateLevelId < job.certificateLevel) {
          lastReason = "Your certificate level is lower than required.";
          continue;
        }
      } else {
        if (edu.certificateLevelId !== job.certificateLevel) {
          lastReason = "This job requires an exact certificate level match.";
          continue;
        }
      }
    }
    return { eligible: true };
  }
  return { eligible: false, reason: lastReason };
}

export function getJobRequirements(job: any, studyAreas: any[], certificateLevels: any[], specializations: any[]) {
  const studyArea = studyAreas.find((sa) => sa.id === job.requiredStudyAreaId);
  const certLevel = certificateLevels.find((c) => c.id === job.certificateLevel);
  return {
    studyArea: studyArea?.name || null,
    specializations: (job.requiredSpecializationIds || [])
      .map((id: number) => specializations.find((s) => s.id === id)?.name)
      .filter(Boolean),
    certificateLevel: certLevel?.name || null,
    progressionAllowed: job.progressionAllowed || false,
  };
}
