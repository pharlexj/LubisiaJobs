// lib/date-utils.ts

/**
 * Format a deadline string into human-readable text + a color for UI.
 * Used for displaying when a job closes.
 * 
 * Examples:
 * - Expired
 * - Today
 * - Tomorrow
 * - 3 days left
 * - Closes on Sep 30, 2025
 */
export const formatDeadline = (deadline: string | null | undefined) => {
  if (!deadline) return null;

  const date = new Date(deadline);
  const now = new Date();

  // reset time for consistent day comparison
  date.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: "Expired", color: "text-red-600" };
  }
  if (diffDays === 0) {
    return { text: "Closes Today", color: "text-yellow-600" };
  }
  if (diffDays === 1) {
    return { text: "Closes Tomorrow", color: "text-yellow-600" };
  }
  if (diffDays <= 7) {
    return { text: `Closes in ${diffDays} days`, color: "text-yellow-600" };
  }

  return {
    text: `Closes on ${date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })}`,
    color: "text-gray-600",
  };
};

/**
 * Format a date range as a readable string.
 * Example: "Sep 1, 2025 – Sep 30, 2025"
 * If both dates are in the same month/year, compress output: "Sep 1–30, 2025"
 */
export const formatDateRange = (start?: string, end?: string) => {
  if (!start && !end) return "No dates provided";

  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;

  if (startDate && endDate) {
    const sameMonth =
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getFullYear() === endDate.getFullYear();

    if (sameMonth) {
      return `${startDate.toLocaleDateString(undefined, {
        month: "short",
      })} ${startDate.getDate()}–${endDate.getDate()}, ${endDate.getFullYear()}`;
    }

    return `${startDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })} – ${endDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })}`;
  }

  if (startDate && !endDate) {
    return `From ${startDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })}`;
  }

  if (!startDate && endDate) {
    return `Until ${endDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })}`;
  }

  return "";
};
