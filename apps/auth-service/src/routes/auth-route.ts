import express, { Router } from "express";
import {
  getMe,
  loginUser,
  logout,
  refreshToken,
  resetUserPassword,
  userForgetPassword,
  userRegistration,
  verifyForgetPasswordOtp,
  verifyUser,
} from "../controllers/auth-controller.js";



import { createRoute } from "../lib/createRoute.js";
import {
 
} from "@repo/api-contract";
import { isAuthenticated } from "../../../../packages/shared/src/middleware/isAuthenticated.js";
import { registerContract } from "@repo/api-contract/auth/register";
import { verifyContract } from "@repo/api-contract/auth/verify";
import { loginContract } from "@repo/api-contract/auth/login";
import { forgetPasswordContract } from "@repo/api-contract/auth/forgetPassword";
import { verifyForgetPasswordOtpContract } from "@repo/api-contract/auth/verifyForgetPasswordOtp";
import { resetPasswordContract } from "@repo/api-contract/auth/resetPassword";

const router: Router = express.Router();

router.post(
  `/user-registration`,
  createRoute(registerContract, userRegistration),
);
router.post("/user-verify", createRoute(verifyContract, verifyUser));
router.post("/login", createRoute(loginContract, loginUser));
router.post(
  "/forget-password",
  createRoute(forgetPasswordContract, userForgetPassword),
);
router.post(
  "/verify-forget-password-otp",
  createRoute(verifyForgetPasswordOtpContract, verifyForgetPasswordOtp),
);
router.post(
  "/reset-password",
  createRoute(resetPasswordContract, resetUserPassword),
);
router.post('/refresh-token', refreshToken)
router.get('/me', isAuthenticated, getMe)
router.get('/logout', logout)

export default router;
