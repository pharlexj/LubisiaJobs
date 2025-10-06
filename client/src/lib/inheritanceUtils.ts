export type QualificationLevel =
  | "Certificate"
  | "Ordinary Diploma"
  | "Bachelor's Degree"
  | "Master's Degree"
  | "Diploma Higher"
  | "Advanced Diploma"
  | "O-Level"
  | "A-Level"
  | "KCSE"
  | "KCPE"
  | "Craft Certificate"
  | "PhD"
  | "Certification";
export type InheritanceRule = {
  from: QualificationLevel;
  to: QualificationLevel;
  minYears?: number;
  extraRequirement?: string;
};

// Calculate precise years between two dates
export function yearsBetween(doca: Date, now: Date = new Date()): number {
  const diff = now.getTime() - doca.getTime();
  return diff / (1000 * 60 * 60 * 24 * 365.25);
}

// Accept doca (date of attainment) instead of yearsServed
export function canProgress(
  current: QualificationLevel,
  target: QualificationLevel,
  doca: Date,
  rules: InheritanceRule[],
  now: Date = new Date()
): { allowed: boolean; reason?: string } {
  const rule = rules.find(r => r.from === current && r.to === target);
  if (!rule) return { allowed: false, reason: "No progression rule found." };
  const yearsServed = yearsBetween(doca, now);
  if (rule.minYears && yearsServed < rule.minYears)
    return { allowed: false, reason: `Requires at least ${rule.minYears} years served. You have ${yearsServed.toFixed(2)} years.` };
  if (rule.extraRequirement)
    return { allowed: true, reason: `Requires: ${rule.extraRequirement}` };
  return { allowed: true };
}