import { z } from "zod";

export const resetPasswordContract = {
  method: "post",
  path: "/reset-password",

  body: z.object({
    email: z.email("Invalid email address"),
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters long"),
  }),
  response: z.object({
    message: z.string(),
  }),
};

export type ResetPasswordBody = z.infer<typeof resetPasswordContract.body>;