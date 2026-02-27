// error-middleware.ts
import { NextFunction, Request, Response } from "express";
import { APIError } from "./index.js";


export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (error instanceof APIError) {
    console.log(`Error ${req.method}- ${req.url} --${error.message}`);
    return res.status(error.statusCode).json({
      status: "error",
      message: error.message,
      ...(error.details && { details: error.details }),
    });
  }

  console.log("unhandled error", error);
  return res.status(500).json({
    error: "Internal Server Error",
  });
};
