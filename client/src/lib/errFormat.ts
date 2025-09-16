import { ZodError } from "zod";
import { Request, Response, NextFunction } from "express";

// Utility to format Zod errors into user-friendly messages
export function formatZodError(error: ZodError) {
  const formatted: Record<string, string> = {};

  error.errors.forEach((err) => {
    const fieldPath = err.path.join(".");
    formatted[fieldPath] = err.message;
  });

  return formatted;
}

// Express middleware for handling validation errors
export function validationErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      errors: formatZodError(err),
    });
  }
  return next(err);
}
