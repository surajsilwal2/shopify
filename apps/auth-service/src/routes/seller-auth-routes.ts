import express, { Router } from "express";
import {
  sellerRegister,
  sellerVerify,
  sellerLogin,
  createShop,
  getSellerMe,
  sellerLogout,
  sellerRefreshToken,
 
} from "../controllers/seller-auth-controller.js";

import { createRoute } from "../lib/createRoute.js";
import { sellerRegisterContract } from "@repo/api-contract/seller/register";
import { sellerVerifyContract } from "@repo/api-contract/seller/verify";
import { sellerLoginContract } from "@repo/api-contract/seller/login";
import { createShopContract } from "@repo/api-contract/seller/createShop";
import { isSellerAuthenticated } from "../../../../packages/shared/src/middleware/isSellerAuthenticated.js";

const router: Router = express.Router();

// ── Public routes — no authentication needed ──────────────────────────────────
router.post(
  "/seller-register",
  createRoute(sellerRegisterContract, sellerRegister),
);
router.post("/seller-verify", createRoute(sellerVerifyContract, sellerVerify));
router.post("/seller-login", createRoute(sellerLoginContract, sellerLogin));
router.post("/seller-refresh-token", sellerRefreshToken);

// ── Protected routes — must have valid sellerAccessToken cookie ───────────────
router.post(
  "/seller-create-shop",
  isSellerAuthenticated,
  createRoute(createShopContract, createShop),
);
router.get("/seller-me", isSellerAuthenticated, getSellerMe);
router.get("/seller-logout", isSellerAuthenticated, sellerLogout);

export default router;
