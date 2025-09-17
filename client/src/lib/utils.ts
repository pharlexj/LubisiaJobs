import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ChangeEvent } from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Capitalizes the first letter of each word in a string
 * Handles multiple words separated by spaces, hyphens, or apostrophes
 * Correctly formats names like "O'Neill", "Mary-Jane", "De La Cruz"
 */
export function capitalizeWords(str: string): string {
  if (!str) return str;
  
  return str
    .toLowerCase()
    .replace(/(^|[\s-'])(\w)/g, (match, separator, letter) => separator + letter.toUpperCase());
}

/**
 * Creates a capitalization handler for input fields that integrates with React Hook Form
 * Returns an onChange handler that capitalizes text and properly updates form state
 */
export function createCapitalizeHandler(setValue: (value: string) => void) {
  return (e: ChangeEvent<HTMLInputElement>) => {
    const capitalizedValue = capitalizeWords(e.target.value);
    setValue(capitalizedValue);
  };
}
