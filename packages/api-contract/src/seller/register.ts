import { z } from "zod";

export const sellerRegisterContract = {
  method: "post" as const,
  path: "/seller/register",
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.email("Invalid email"),
    phone: z.string().min(7, "Invalid phone number"),
    country: z.string().min(2, "Country is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  }),
  response: z.object({ message: z.string() }),
};

export type SellerRegisterBody = z.infer<typeof sellerRegisterContract.body>;
