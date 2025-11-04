export type InheritanceRule = {
	from: string;
	to: string;
	minYears?: number;
	extraRequirement?: string;
};

export function yearsBetween(start: Date, end: Date = new Date()): number {
	const diff = end.getTime() - start.getTime();
	return diff / (1000 * 60 * 60 * 24 * 365.25);
}

export function canProgress(
	current: string,
	target: string,
	doca: Date,
	rules: InheritanceRule[],
	now: Date = new Date()
): { allowed: boolean; reason?: string } {
	const rule = rules.find((r) => r.from === current && r.to === target);

	const yearsServed = yearsBetween(doca, now);
	if (rule?.minYears && yearsServed < rule?.minYears) {
		const result = {
			allowed: false,
			reason: `Requires at least ${
				rule?.minYears
			} years. You have ${yearsServed.toFixed(2)} years.`,
		};
		return result;
	}

	const result = {
		allowed: true,
		reason: `Eligible for progression from ${current} to ${target}`,
	};
	return result;
}

export function checkEligibility(
	job: any,
	applicantProfile: any,
	isAuthenticated: boolean,
	certificateLevels?: any[]
) {
	if (!isAuthenticated)
		return { eligible: false, reason: "You must be logged in to apply." };
	if (!applicantProfile)
		return { eligible: false, reason: "Applicant profile missing." };

	const education = applicantProfile.education || [];
	const employee = applicantProfile.employee;
	const isEmployee = applicantProfile.isEmployee;
	const employmentHistory = applicantProfile.employmentHistory || [];
	if (!education.length)
		return { eligible: false, reason: "No education records found." };

	if (
		!job.requiredStudyAreaId &&
		!job.certificateLevel &&
		!job.requiredSpecializationIds?.length
	) {
		return { eligible: true, reason: "No specific requirements for this job." };
	}

	const levelMap = new Map<number, string>();
	if (certificateLevels?.length) {
		for (const lvl of certificateLevels) {
			if (lvl?.id && lvl?.name) levelMap.set(Number(lvl.id), String(lvl.name));
		}
	} else {
		const uniqueIds = [
			...new Set(education.map((e: any) => e.certificateLevelId)),
		];
		for (const id of uniqueIds) {
			levelMap.set(Number(id), `Level-${id}`);
		}
	}

	let lastReason = "No matching record found.";

	for (const edu of education) {
		const currentLevel =
			levelMap.get(Number(edu.certificateLevelId)) || "Unknown";
		const targetLevel = levelMap.get(Number(job.certificateLevel)) || "Unknown";

		if (
			job.requiredStudyAreaId &&
			edu.studyAreaId !== job.requiredStudyAreaId
		) {
			lastReason = "Your study area does not match the required one.";
			continue;
		}

		if (
			job.requiredSpecializationIds?.length > 0 &&
			!job.requiredSpecializationIds.includes(edu.specializationId)
		) {
			lastReason = "Your specialization does not match the job requirements.";
			continue;
		}

		if (job.certificateLevel) {
			if (job.progressionAllowed) {
				const levels = (certificateLevels || []).map((lvl) => lvl.name);
				const orderedLevels = levels.length ? levels : [...levelMap.values()];
				const rules: InheritanceRule[] = [];
				for (let i = orderedLevels.length - 1; i > 0; i--) {
					rules.push({
						from: orderedLevels[i],
						to: orderedLevels[i - 1],
						minYears: Number(job.experience) || 0,
					});
				}

				let doca: Date;
				if (isEmployee && employee?.doca) {
					doca = new Date(employee.doca);
				} else if (employmentHistory.length > 0) {
					const earliestStart = new Date(
						Math.min(
							...employmentHistory.map((job: any) =>
								new Date(job.startDate).getTime()
							)
						)
					);
					doca = earliestStart;
				} else {
					const completionYear = edu.yearCompleted
						? new Date(`${edu.yearCompleted}-12-31`)
						: new Date();
					doca = completionYear;
				}

				const result = canProgress(currentLevel, targetLevel, doca, rules);
				if (!result.allowed) return { eligible: false, reason: result.reason };
			} else if (edu.certificateLevelId !== job.certificateLevel) {
				lastReason = `Required: ${targetLevel}. Yours: ${currentLevel}.`;
				continue;
			}
		}

		return { eligible: true, reason: "You meet the requirements." };
	}

	return { eligible: false, reason: lastReason };
}

export function getJobRequirements(
	job: any,
	studyAreas: any[],
	certificateLevels: any[],
	specializations: any[]
) {
	const studyArea = studyAreas.find((sa) => sa.id === job.requiredStudyAreaId);
	const certLevel = certificateLevels.find(
		(c) => c.id === job.certificateLevel
	);
	return {
		studyArea: studyArea?.name || null,
		specializations: (job.requiredSpecializationIds || [])
			.map((id: number) => specializations.find((s) => s.id === id)?.name)
			.filter(Boolean),
		certificateLevel: certLevel?.name || null,
		progressionAllowed: job.progressionAllowed || false,
	};
}
