"use client";

// hooks/product-hook.ts
// All product-related TanStack Query hooks for the seller dashboard

import { sellerApi } from "@/api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────
export type ProductImage = { url: string; fileId: string };

export type CreateProductInput = {
  title: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string;
  tags: string[];
  stock: number;
  images: ProductImage[];
};

export type UpdateProductInput = Partial<Omit<CreateProductInput, "images">>;

export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string;
  tags: string[];
  stock: number;
  sold: number;
  rating: number;
  images: (ProductImage & { id: string; productId: string })[];
  sellerId: string;
  shopId: string;
  createdAt: string;
  updatedAt: string;
};

// ── API functions (inline — simple enough to not need separate file) ───────────
const productApi = {
  create: (data: CreateProductInput) => sellerApi.post("/seller/product", data),
  getAll: (page = 1, limit = 10) =>
    sellerApi.get(`/seller/products?page=${page}&limit=${limit}`),
  getOne: (id: string) => sellerApi.get(`/seller/product/${id}`),
  update: (id: string, data: UpdateProductInput) =>
    sellerApi.put(`/seller/product/${id}`, data),
  delete: (id: string) => sellerApi.delete(`/seller/product/${id}`),
};

// ── useSellerProducts ─────────────────────────────────────────────────────────
// Fetches paginated product list for the seller
// useQuery because we're READING data (not mutating)
export const useSellerProducts = (page = 1) => {
  return useQuery({
    queryKey: ["sellerProducts", page],
    // queryKey includes page so each page has its own cache entry
    // Navigating back to page 1 shows cached data instantly
    queryFn: () => productApi.getAll(page).then((res) => res.data),
    staleTime: 1000 * 60 * 2, // cache for 2 minutes
  });
};

// ── useProduct ────────────────────────────────────────────────────────────────
// Fetches a single product by ID — used on the edit page
export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => productApi.getOne(id).then((res) => res.data),
    enabled: !!id, // don't run if id is empty/undefined
  });
};

// ── useCreateProduct ──────────────────────────────────────────────────────────
export const useCreateProduct = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
 
  return useMutation({
    mutationFn: (data: CreateProductInput) => productApi.create(data),
    onSuccess: () => {
      // Invalidate the products list cache so the new product appears immediately
      // Without this, the list would show stale data until cache expires
      queryClient.invalidateQueries({ queryKey: ["sellerProducts"] });
      toast.success("Product created successfully!");
      router.push("/seller/dashboard/products");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to create product"
      );
    },
  });
};


// ── useUpdateProduct ──────────────────────────────────────────────────────────
export const useUpdateProduct = (id: string) => {
  const router = useRouter();
  const queryClient = useQueryClient();
 
  return useMutation({
    mutationFn: (data: UpdateProductInput) => productApi.update(id, data),
    onSuccess: () => {
      // Invalidate both the list AND the individual product cache
      queryClient.invalidateQueries({ queryKey: ["sellerProducts"] });
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      toast.success("Product updated!");
      router.push("/seller/dashboard/products");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update product");
    },
  });
};

// ── useDeleteProduct ──────────────────────────────────────────────────────────
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
 
  return useMutation({
    mutationFn: (id: string) => productApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sellerProducts"] });
      toast.success("Product deleted");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete product");
    },
  });
};
 

// ── useImageUpload ────────────────────────────────────────────────────────────
// Uploads images to your file storage (Cloudinary/ImageKit) BEFORE creating product
// Why before? Because the product needs image URLs at creation time.
// This is a separate mutation — upload first, then create product with URLs.
export const useImageUpload = () => {
  return useMutation({
    mutationFn: async (files: File[]): Promise<ProductImage[]> => {
      // Create FormData — the standard way to send files over HTTP
      const formData = new FormData();
      files.forEach((file) => formData.append("images", file));
 
      const response = await sellerApi.post("/seller/upload-images", formData, {
        headers: {
          // When sending FormData, axios sets Content-Type automatically
          // DO NOT manually set "Content-Type": "multipart/form-data"
          // Axios needs to set the boundary parameter itself
          "Content-Type": "multipart/form-data",
        },
      });
 
      // Returns array of { url, fileId } — stored on the product
      return response.data.images;
    },
    onError: () => {
      toast.error("Image upload failed. Please try again.");
    },
  });
};