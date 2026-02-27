import { Request, Response, NextFunction } from "express";

export const createRoute =
  (contract: any, handler: any) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
    const result = contract.body.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json(result.error);
    }

    return handler(req, res, next);
    } catch (err) {
      next(err);
    }
  };
