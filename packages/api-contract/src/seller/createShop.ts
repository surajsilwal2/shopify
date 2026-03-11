import { z } from "zod";

export const createShopContract = {
  method: "post" as const,
  path: "/seller/shop",
  body: z.object({
    name: z.string().min(2),
    bio: z.string().optional(),
    category: z.string().min(1),
    address: z.string().optional(),
    openingHours: z.string().optional(),
    website: z.url().optional().or(z.literal("")),
  }),
  response: z.object({ message: z.string() }),
};

export type CreateShopBody = z.infer<typeof createShopContract.body>;
