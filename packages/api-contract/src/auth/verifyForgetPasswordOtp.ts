import {z} from "zod";

export const verifyForgetPasswordOtpContract = {
  method: "post",
  path: "/verify-forget-password-otp",

  body: z.object({
    email: z.email("Invalid email address"),
    otp: z.string().length(6, "OTP must be 6 digits"),
  }),
  response: z.object({
    message: z.string(),
  }),
};