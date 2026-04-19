// packages/shared/src/lib/createRoute.ts

import { Request, Response, NextFunction } from "express";

// WHY THIS EXISTS:
// Without createRoute, every controller would repeat this pattern:
//   const result = contract.body.safeParse(req.body)
//   if (!result.success) return res.status(400).json(result.error)
//
// createRoute extracts that into one place.
// Controller only runs if body is valid — clean separation of concerns.

export const createRoute =
  (contract: { body: { safeParse: (data: any) => any } }, handler: any) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = contract.body.safeParse(req.body);

      if (!result.success) {
        // Return structured Zod errors so frontend knows exactly which field failed
        return res.status(400).json({
          error: "Validation failed",
          details: result.error.errors, // array of { path, message }
        });
      }

      // Body is valid — attach parsed (type-safe) data to req
      // req.body is now guaranteed to match the contract shape
      req.body = result.data;

      return handler(req, res, next);
    } catch (err) {
      next(err);
    }
  };
