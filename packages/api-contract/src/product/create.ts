import { z } from "zod";

export const createProductContract = {
  method: "post" as const,
  path: "/seller/product",
  body: z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z
      .string()
      .min(20, "Description must be at least 20 characters"),
    price: z.number().positive("Price must be positive"),
    discountPrice: z.number().positive().optional(),
    category: z.string().min(1, "Category is required"),
    tags: z.array(z.string()).optional().default([]),
    stock: z.number().int().min(0, "Stock cannot be negative"),
    // images come as array of {url, fileId} — uploaded separately before product creation
    images: z
      .array(
        z.object({
          url: z.string().url(),
          fileId: z.string(),
        }),
      )
      .min(1, "At least one image is required"),
  }),
  response: z.object({ message: z.string() }),
};

export type CreateProductBody = z.infer<typeof createProductContract.body>;
