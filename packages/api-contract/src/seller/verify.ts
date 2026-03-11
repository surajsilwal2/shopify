import { z } from "zod";

export const sellerVerifyContract = {
  method: "post" as const,
  path: "/seller/verify",
  body: z.object({
    email: z.email(),
    otp: z.string().length(6, "OTP must be 6 digits"),
    name: z.string(),
    phone: z.string(),
    country: z.string(),
    password: z.string(),
  }),
  response: z.object({ message: z.string() }),
};

export type SellerVerifyBody = z.infer<typeof sellerVerifyContract.body>;
