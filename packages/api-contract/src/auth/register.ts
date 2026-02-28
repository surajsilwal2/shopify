import { z } from "zod";

export const registerContract = {
 
    method: 'post',
    path: '/user-registration',

  // why body because express-validator uses req.body for validation and we want to keep the schema consistent with that
  body: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
  }),

    response: z.object({
      message: z.string()
  })
}

export type RegisterBody = z.infer<typeof registerContract.body>;

