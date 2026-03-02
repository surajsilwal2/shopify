import { api } from "./client";

export const login = (data: any) => api.post("/api/login", data);
export const register = (data: any) => api.post("/api/user-registration", data);
export const verifyOtp = (data: any) => api.post("/api/user-verify", data);
export const forgotPassword = (data: any) => api.post("/api/forget-password", data);
export const verifyForgotPasswordOtp = (data: any) =>
  api.post("/api/verify-forget-password-otp", data);
export const resetPassword = (data: any) => api.post("/api/reset-password", data);
export const getMe = () => api.get("/api/me");
