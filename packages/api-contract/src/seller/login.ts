import { z } from "zod";

export const sellerLoginContract = {
  method: "post" as const,
  path: "/seller/login",
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
  response: z.object({ message: z.string() }),
};

export type SellerLoginBody = z.infer<typeof sellerLoginContract.body>;
