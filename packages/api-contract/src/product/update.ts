import { z } from "zod";

export const updateProductContract = {
  method: "put" as const,
  path: "/seller/product/:id",
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(20).optional(),
    price: z.number().positive().optional(),
    discountPrice: z.number().positive().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    stock: z.number().int().min(0).optional(),
  }),
  response: z.object({ message: z.string() }),
};

export type UpdateProductBody = z.infer<typeof updateProductContract.body>;
