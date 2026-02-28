import { z } from "zod";


export const forgetPasswordContract = {
  method: "post",
  path: "/forget-password",

  body: z.object({
    email: z.email("Invalid email address"),
  }),
  response: z.object({
    message: z.string(),
  }),
};

export type ForgetPasswordBody = z.infer<typeof forgetPasswordContract.body>;