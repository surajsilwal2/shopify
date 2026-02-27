import {z} from "zod";

export const verifyContract = {
    method: 'post',
    path: '/user-verify',

  body: z.object({
    email: z.email("Invalid email address"),
    otp: z.string().length(6, "OTP must be 6 digits"),
    name: z.string().min(1, "Name is required"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
  }),
    response: z.object({
      message: z.string()
  })
};