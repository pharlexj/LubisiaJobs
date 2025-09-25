import React from "react";
import { FieldError, FieldErrors } from "react-hook-form";

// Optional overrides for nicer names
const fieldLabels: Record<string, string> = {
  "employee.dutyStation": "Duty Station",
  "employee.jg": "Job Group",
  "employee.departmentId": "Department",
  "employee.dofa": "Date of First Appointment",
  "employee.doca": "Date of Current Appointment",
  // add more overrides if you want
};

// Convert field paths into human-friendly labels
function formatFieldLabel(fieldPath: string): string {
  if (fieldLabels[fieldPath]) return fieldLabels[fieldPath];

  const parts = fieldPath.split(".");
  const last = parts.pop() || fieldPath;

  let label = last
    .replace(/\[\d+\]/g, "") // strip [0]
    .replace(/([A-Z])/g, " $1") // split camelCase
    .replace(/_/g, " ") // snake_case → spaced
    .replace(/^\w/, (c) => c.toUpperCase());

  // Array awareness: education[0].institution → Education 1 – Institution
  const arrayMatch = fieldPath.match(/(\w+)\[(\d+)\]/);
  if (arrayMatch) {
    const [, arrayName, index] = arrayMatch;
    const arrayLabel = arrayName
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/^\w/, (c) => c.toUpperCase());
    label = `${arrayLabel} ${parseInt(index, 10) + 1} – ${label}`;
  }

  return label;
}

// Recursive renderer
export function renderErrors(
  errors: FieldErrors<any>,
  parentKey = ""
): JSX.Element[] {
  return Object.entries(errors).reduce<JSX.Element[]>((acc, [key, error]) => {
    const fieldPath = parentKey ? `${parentKey}.${key}` : key;

    if ((error as FieldError)?.message) {
      const label = formatFieldLabel(fieldPath);
      acc.push(
        <li key={fieldPath}>
          <strong>{label}:</strong> {(error as FieldError).message}
        </li>
      );
    } else if (typeof error === "object" && error !== null) {
      // allow recursion into nested errors
      acc.push(...renderErrors(error as FieldErrors<any>, fieldPath));
    }

    return acc;
  }, []);
}
