
import { ValidationError } from "@repo/shared";
import bcrypt from 'bcrypt'


import { checkOtpRestriction, sendOtp, trackOtpRequests, verifyOtp } from "./auth-service.js";
import { prisma, redis } from "database";
import { SellerRegisterBody } from "@repo/api-contract/seller/register";
import { SellerVerifyBody } from "@repo/api-contract/seller/verify";
import { CreateShopBody } from "@repo/api-contract/seller/createShop";
import { SellerLoginBody } from "@repo/api-contract/seller/login";

// ─── Reusing the exact same OTP restriction pattern from user auth ────────────
// This is intentional — same Redis keys structure, same logic, same limits.
// The only difference is the prefix "seller:" to avoid key collisions with user OTPs


// ─── Step 1: Register → Send OTP ─────────────────────────────────────────────
export const handleSellerRegister = async (body: SellerRegisterBody) => {
  const { name, email, phone, country, password } = body;

  const existingSeller = await (prisma as any).seller.findUnique({ where: { email } });
  if (existingSeller)
    throw new ValidationError("Email already registered as a seller");

  // Reusing exact same functions — just different prefix
  await checkOtpRestriction(email, "seller");
  await trackOtpRequests(email, "seller");

  // Store registration data in Redis temporarily
  // Why? Don't pollute DB with unverified sellers
  await redis.set(
    `otp:seller:${email}:data`,
    JSON.stringify({ name, phone, country, password }),
    "EX",
    300,
  );

  await sendOtp(name, email, "seller");

  return { message: "OTP sent to your email." };
};

// ─── Step 1.5: Verify OTP → Create Seller in DB ──────────────────────────────
export const handleSellerVerify = async (body: SellerVerifyBody) => {
  const { email, otp } = body;

  // Reusing exact same verifyOtp
  await verifyOtp(email, otp, "seller");

  // Retrieve stored registration data
  const stored = await redis.get(`otp:seller:${email}:data`);
  if (!stored)
    throw new ValidationError("Session expired. Please register again.");

  const { name, phone, country, password } = JSON.parse(stored);
  const hashedPassword = await bcrypt.hash(password, 10);

  await (prisma as any).seller.create({
    data: { name, email, phone, country, password: hashedPassword },
  });

  // Cleanup
  await redis.del(`otp:seller:${email}:data`);

  return { message: "Seller verified. Please login." };
};

// ─── Step 2: Create Shop ──────────────────────────────────────────────────────
// This route will be protected by isSellerAuthenticated middleware
export const handleCreateShop = async (
  sellerId: string,
  body: CreateShopBody,
) => {
  // Check if seller already has a shop
  const existing = await (prisma as any).shop.findUnique({ where: { sellerId } });
  if (existing) {
    throw new Error("You already have a shop.");
  }

  const shop = await (prisma as any).shop.create({
    data: {
      ...body,
      sellerId,
    },
  });

  return { message: "Shop created successfully.", shop };
};

// ─── Seller Login ─────────────────────────────────────────────────────────────
export const handleSellerLogin = async (
  body: SellerLoginBody,
  userAgent: string,
) => {
  const { email, password } = body;

  const seller = await (prisma as any).seller.findUnique({
    where: { email },
    include: { shop: true },
  });

  if (!seller) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(password, seller.password);
  if (!isMatch) throw new Error("Invalid credentials");

  return seller;
};
