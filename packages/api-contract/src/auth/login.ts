import {z} from "zod";

export const loginContract = {
  method: "post",
  path: "/login",

  body: z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
  }),
  response: z.object({
    message: z.string(),
  }),
};