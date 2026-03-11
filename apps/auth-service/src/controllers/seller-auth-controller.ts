import { Request, Response, NextFunction } from "express";
import {
  handleCreateShop,
  handleSellerLogin,
  handleSellerRegister,
  handleSellerVerify,
} from "../services/seller-auth-service.js";
import { setSellerCookies } from "../utils/setCookie.js";
import { sellerRegisterContract } from "@repo/api-contract/seller/register";
import { sellerVerifyContract } from "@repo/api-contract/seller/verify";
import { sellerLoginContract } from "@repo/api-contract/seller/login";
import { createShopContract } from "@repo/api-contract/seller/createShop";
import { prisma } from "database";
import jwt from "jsonwebtoken";
import { setCookie } from "../utils/setCookie.js";

export const sellerRegister = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Contract already validated by createRoute middleware
    // so req.body is safe to use here
    const body = sellerRegisterContract.body.parse(req.body);
    const result = await handleSellerRegister(body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const sellerVerify = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = sellerVerifyContract.body.parse(req.body);
    const result = await handleSellerVerify(body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const sellerLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = sellerLoginContract.body.parse(req.body);
    const seller = await handleSellerLogin(body, req.headers["user-agent"] || "");

    // setSellerCookies signs JWTs, stores session in DB, sets httpOnly cookies
    await setSellerCookies(res, seller);

    res.status(200).json({ message: "Logged in successfully" });
  } catch (error) {
    next(error);
  }
};

export const createShop = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = createShopContract.body.parse(req.body);

    // req.seller is guaranteed to exist here because
    // isSellerAuthenticated middleware runs before this handler
    const result = await handleCreateShop(req.seller!.sellerId, body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// ── Get current logged-in seller ──────────────────────────────────────────────
export const getSellerMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const seller = await (prisma as any).seller.findUnique({
      where: { id: req.seller!.sellerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        country: true,
        stripeId: true,
        shop: true, // include shop so frontend knows if step 2 is done
      },
    });
    res.json(seller);
  } catch (error) {
    next(error);
  }
};

// ── Refresh seller access token ───────────────────────────────────────────────
// Same pattern as user refreshToken — just uses sellerSession and sellerCookies
export const sellerRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const oldToken = req.cookies.sellerRefreshToken;

    if (!oldToken) {
      return res.status(401).json({ message: "Missing refresh token" });
    }

    const session = await (prisma as any).sellerSession.findFirst({
      where: { refreshToken: oldToken },
    });

    // Reuse detection — same logic as user auth
    if (!session || session.refreshToken !== oldToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    if (session.expiresAt < new Date()) {
      await (prisma as any).sellerSession.delete({ where: { id: session.id } });
      return res.status(401).json({ message: "Refresh token expired" });
    }

    let decoded: { sellerId: string };
    try {
      decoded = jwt.verify(oldToken, process.env.REFRESH_SECRET!) as {
        sellerId: string;
      };
    } catch {
      await (prisma as any).sellerSession.delete({ where: { id: session.id } });
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = jwt.sign(
      { sellerId: decoded.sellerId, role: "seller" },
      process.env.ACCESS_SECRET!,
      { expiresIn: "15m" },
    );

    const newRefreshToken = jwt.sign(
      { sellerId: decoded.sellerId },
      process.env.REFRESH_SECRET!,
      { expiresIn: "7d" },
    );

    setCookie(res, "sellerAccessToken", newAccessToken);
    setCookie(res, "sellerRefreshToken", newRefreshToken);

    await (prisma as any).sellerSession.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({ success: true });
  } catch {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

// ── Seller logout ─────────────────────────────────────────────────────────────
export const sellerLogout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const refreshToken = req.cookies.sellerRefreshToken;
  if (refreshToken) {
    await (prisma as any).sellerSession.deleteMany({
      where: { refreshToken },
    });
  }
  res.clearCookie("sellerAccessToken");
  res.clearCookie("sellerRefreshToken");
  res.json({ success: true, message: "Logged out successfully" });
};