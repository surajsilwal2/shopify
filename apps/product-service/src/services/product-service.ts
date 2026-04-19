import { ValidationError } from "@repo/shared";
import { v2 as cloudinary } from "cloudinary";
import { resolve } from "node:dns";
import { prisma } from "../../../../packages/database/src";

// ── Cloudinary config ─────────────────────────────────────────────────────────
// Cloudinary is a cloud image storage service
// It gives you: image hosting, CDN delivery, auto-optimization, transformations
// Alternative: ImageKit, AWS S3 + CloudFront
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Types ─────────────────────────────────────────────────────────────────────
type CreateProductInput = {
  title: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string;
  tags: string[];
  stock: number;
  images: { url: string; fileId: string }[];
  sellerId: string;
};

type GetAllProductsInput = {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "price_asc" | "price_desc" | "newest" | "rating";
};

// ── Upload images to Cloudinary ───────────────────────────────────────────────
// Takes raw file buffers from multer, uploads to Cloudinary
// Returns array of { url, fileId } to store on the product
export const handleUploadImages = async (
  files: Express.Multer.File[],
): Promise<{ url: string; fileId: string }[]> => {
  if (!files || files.length === 0) {
    throw new ValidationError("No files provided");
  }

  // Upload all files in parallel — Promise.all is much faster than sequential await
  // If one fails, all fail (Promise.all rejects on first rejection)
  const uploaded = await Promise.all(
    files.map((file) => {
      return new Promise<{ url: string; fileId: string }>((resolve, reject) => {
        // cloudinary.uploader.upload_stream: uploads from a stream/buffer
        // (as opposed to upload() which takes a file path)
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "shopify/products", // organized in Cloudinary dashboard
            resource_type: "image",
          },
          (error, result) => {
            if (error || !result) return reject(error);
            resolve({
              url: result.secure_url, // URL to serve the image from Cloudinary's CDN
              fileId: result.public_id, // ID to delete the image later
            });
          },
        );
        // Write the buffer into the stream
        stream.end(file.buffer);
      });
    }),
  );

  return uploaded;
};

// ── Create product ────────────────────────────────────────────────────────────
export const handleCreateProduct = async (input: CreateProductInput) => {
  const { images, sellerId, ...productData } = input;

  // Verify seller has a shop
  const shop = await (prisma as any).shop.findUnique({ where: { sellerId } });
  if (!shop) throw new ValidationError("Create a shop before adding products");

  const product = await (prisma as any).product.create({
    data: {
      ...productData,
      sellerId,
      shopId: shop.id,
      images: { create: images },
    },
    include: { images: true },
  });

  return { message: "Product created", product };
};

// ── Get all products (public — for customers) ─────────────────────────────────
// This is what the homepage and product listing page calls
export const handleGetAllProducts = async (input: GetAllProductsInput) => {
  const { page = 1, limit = 12, category, search, minPrice, maxPrice, sort } = input;
  const skip = (page - 1) * limit;

  // Build filter dynamically
  // Only add conditions that were actually provided
  const where: any = {};
  if (category) where.category = category;
  if (search) {
    // Search in title and description
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { tags: { has: search } },
    ];
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  // Build sort order
  const orderBy: any =
    sort === "price_asc"  ? { price: "asc" } :
    sort === "price_desc" ? { price: "desc" } :
    sort === "rating"     ? { rating: "desc" } :
                            { createdAt: "desc" }; // newest (default)

  // Run count and fetch IN PARALLEL — halves the database time
  const [products, total] = await Promise.all([
    (prisma as any).product.findMany({
      where,
      include: {
        images: { take: 1 }, // only first image for listing cards
        seller: { select: { name: true } },
        shop: { select: { name: true, rating: true } },
      },
      orderBy,
      skip,
      take: limit,
    }),
    (prisma as any).product.count({ where }),
  ]);

  return {
    products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit), // total for all records, divide by limit to get total page
      hasMore: skip + products.length < total, // skip means how many records we have already skipped, products.length is how many we just fetched, if their sum is less than total, there are more records to fetch
    },
  };
};

// ── Get single product ────────────────────────────────────────────────────────
export const handleGetProduct = async (productId: string) => {
  const product = await (prisma as any).product.findUnique({
    where: { id: productId },
    include: {
      images: true,
      reviews: true,
      seller: { select: { name: true, email: true } },
      shop: { select: { name: true, rating: true, avatar: true } },
    },
  });
  if (!product) throw new ValidationError("Product not found");
  return product;
};

// ── Get seller's own products ─────────────────────────────────────────────────
export const handleGetSellerProducts = async (
  sellerId: string,
  page = 1,
  limit = 10
) => {
  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    (prisma as any).product.findMany({
      where: { sellerId },
      include: { images: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    (prisma as any).product.count({ where: { sellerId } }),
  ]);
  return {
    products,
    pagination: {
      total, page, limit,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + products.length < total,
    },
  };
};


// ── Update product ────────────────────────────────────────────────────────────
export const handleUpdateProduct = async (
  productId: string,
  sellerId: string,
  data: any
) => {
  const existing = await (prisma as any).product.findFirst({
    where: { id: productId, sellerId },
  });
  if (!existing) throw new ValidationError("Product not found");

  const updated = await (prisma as any).product.update({
    where: { id: productId },
    data,
    include: { images: true },
  });
  return { message: "Product updated", product: updated };
};

// ── Delete product ────────────────────────────────────────────────────────────
export const handleDeleteProduct = async (
  productId: string,
  sellerId: string
) => {
  const existing = await (prisma as any).product.findFirst({
    where: { id: productId, sellerId },
    include: { images: true },
  });
  if (!existing) throw new ValidationError("Product not found");

  // Delete images from Cloudinary FIRST (before DB deletion)
  // Why? If DB deletion succeeds but Cloudinary deletion fails,
  // you'd have orphaned images in Cloudinary with no way to find them.
  // Better to clean storage first, then clean DB.
  await Promise.all(
    existing.images.map((img: any) =>
      cloudinary.uploader.destroy(img.fileId)
    )
  );

  // Then delete from DB (child records first)
  await (prisma as any).productImage.deleteMany({ where: { productId } });
  await (prisma as any).product.delete({ where: { id: productId } });

  return { message: "Product deleted" };
};
