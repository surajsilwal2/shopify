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
  loginContract,
  registerContract,
  verifyContract,
  forgetPasswordContract,
  verifyForgetPasswordOtpContract,
  resetPasswordContract,
} from "@repo/api-contract";
import { isAuthenticated } from "../../../../packages/shared/src/middleware/isAuthenticated.js";

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
