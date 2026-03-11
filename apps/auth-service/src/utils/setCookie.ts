import { prisma } from "database";
import { Response } from "express";
import jwt from 'jsonwebtoken'
export const setCookie = (res: Response, name: string, value: string) => {
  res.cookie(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const setSellerCookies = async (res: Response, seller: any) => {
  const accessToken = jwt.sign(
    { sellerId: seller.id, role: "seller" },
    process.env.ACCESS_SECRET as string,
    { expiresIn: "15m" },
  );

  const refreshToken = jwt.sign(
    { sellerId: seller.id },
    process.env.REFRESH_SECRET as string,
    { expiresIn: "7d" },
  );

  // Store refresh token in SellerSession
  await (prisma as any).sellerSession.create({
    data: {
      sellerId: seller.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  };

  res.cookie("sellerAccessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("sellerRefreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};