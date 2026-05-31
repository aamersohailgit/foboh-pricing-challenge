import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

/** An error carrying an intended HTTP status. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function notFound(message: string): AppError {
  return new AppError(404, message);
}

/**
 * Wrap an async route handler so thrown/rejected errors reach the error
 * middleware instead of hanging the request.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

/**
 * Final error middleware. Maps Zod validation failures to 400, AppErrors to
 * their status, and anything else to 500. Always returns `{ error, details? }`.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express needs the 4-arg signature
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Validation failed", details: err.issues });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error("Unexpected error:", err);
  res.status(500).json({ error: "Internal server error" });
}
