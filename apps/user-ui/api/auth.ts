import { api } from "./client";

export const login = (data: any) => api.post("/login", data);
export const register = (data: any) => api.post("/user-registration", data);
export const verifyOtp = (data: any) => api.post("/user-verify", data);
export const forgotPassword = (data: any) => api.post("/forget-password", data);
export const verifyForgotPasswordOtp = (data: any) =>
  api.post("/verify-forget-password-otp", data);
export const resetPassword = (data: any) => api.post("/reset-password", data);
export const getMe = () => api.get("/me");
export const logout = () => api.post('/logout')
