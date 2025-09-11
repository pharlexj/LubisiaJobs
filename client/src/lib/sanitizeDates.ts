/**
 * Convert form values into a proper Date or null.
 * Handles:
 *  - JS Date objects
 *  - "YYYY-MM-DD" strings from <input type="date">
 *  - numeric years (e.g., 2021 → Jan 1st of that year)
 *  - other strings (tries to parse)
 * Returns `null` if invalid.
 */
export function sanitizeDate(value: any): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  // Already a Date
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // Numeric year (e.g., 2021 → Jan 1, 2021)
  if (typeof value === "number") {
    const parsed = new Date(value, 0, 1);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  // YYYY-MM-DD string (from <input type="date">)
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00Z`);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  // Try parsing anything else (e.g., ISO string)
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}
export const filterEmptyFields = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(filterEmptyFields).filter((v) => v !== null && v !== undefined);
  }

  if (obj instanceof Date) {
    return obj; // ✅ keep real Date objects
  }

  if (typeof obj === "string") {
    // ✅ keep ISO date strings (YYYY-MM-DD...)
    if (/^\d{4}-\d{2}-\d{2}T/.test(obj)) return obj;
    if (obj.trim() === "") return null;
    return obj;
  }

  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .map(([k, v]) => [k, filterEmptyFields(v)])
        .filter(([_, v]) => v !== null && v !== undefined && v !== "")
    );
  }

  if (obj === null || obj === undefined) return null;

  return obj; // ✅ keep numbers, booleans, etc.
};
type AnyRecord = Record<string, any>;

interface NormalizeOptions {
  dateFields?: string[];
  protectCreatedAt?: boolean;
  setUpdatedAt?: boolean;
}

export function normalizeDates<T extends Record<string, any>>(
  input: T,
  options: NormalizeOptions = {}
): T {
  const {
    dateFields = [],
    protectCreatedAt = true,
    setUpdatedAt = true,
  } = options;

  const output: Record<string, any> = { ...input };

  // ✅ Convert provided fields into Dates
  for (const field of dateFields) {
    if (field in output && output[field]) {
      output[field] = new Date(output[field]);
    }
  }

  // ✅ Only strip createdAt on updates
  if (protectCreatedAt && "createdAt" in output && output.id) {
    delete output.createdAt;
  }

  // ✅ Always refresh updatedAt
  if (setUpdatedAt) {
    output.updatedAt = new Date();
  }

  return output as T;
}
// autoDateFields.ts
export const autoDateFields: Record<string, string[]> = {
  educationRecords: [], // none are actual Date columns, just yearFrom/yearCompleted (ints)
  shortCourse: ["startDate", "endDate"],
  professionalQualifications: ["startDate", "endDate"],
  employmentHistory: ["startDate", "endDate"],
  referees: [], // no dates
  documents: [], // no dates
};
