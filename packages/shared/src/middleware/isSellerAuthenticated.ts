import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// This middleware protects seller-only routes
// It reads sellerAccessToken from cookies (separate from user's accessToken)
// This separation means a user token can never access seller routes and vice versa
export const isSellerAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies.sellerAccessToken;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_SECRET as string) as {
      sellerId: string;
      role: string;
    };
    console.log("decoded:", decoded);

    // Now req.seller is available in every route handler after this middleware
    // TypeScript knows about this because of express.d.ts above
    req.seller = decoded;
    next();
  } catch (error) {
    // jwt.verify throws if token is expired or tampered
    next(error);
  }
};
