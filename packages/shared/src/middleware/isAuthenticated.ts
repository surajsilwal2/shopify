import { Response, NextFunction, Request } from "express";
import jwt from "jsonwebtoken";

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_SECRET as string) as {
      userId: string;
      role: string;
    };

    req.user = decoded;

    next();
  } catch (error) {
    next(error);
  }
};
