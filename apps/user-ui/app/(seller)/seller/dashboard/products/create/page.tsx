"use client";

// app/(seller)/seller/dashboard/products/create/page.tsx
//
// Create a new product — form + image upload
//
// IMAGE UPLOAD FLOW (important to understand):
// 1. Seller selects images → stored as File objects in state (not uploaded yet)
// 2. Seller fills form and submits
// 3. On submit: FIRST upload images → get back { url, fileId }[]
// 4. THEN create product with the returned image URLs
// Why this order? Because the product needs image URLs at creation time.
// We don't store product in DB until we have all the data.

import {
  useCreateProduct,
  useImageUpload,
  type ProductImage,
} from "@/hooks/product-hook";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlignLeft,
  DollarSign,
  Hash,
  ImagePlus,
  Layers,
  Tag,
  Type,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// ── Validation ────────────────────────────────────────────────────────────────
const productSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  price: z.coerce.number().positive("Price must be positive"),
  // z.coerce.number() converts string input from <input type="number"> to a number
  // Without coerce, RHF sends strings and Zod rejects them
  discountPrice: z.coerce.number().positive().optional().or(z.literal("")),
  category: z.string().min(1, "Category is required"),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  tags: z.string().optional(),
  // tags are entered as comma-separated string, split before API call
});

type ProductFormInput = z.input<typeof productSchema>;
type ProductFormOutput = z.output<typeof productSchema>;

const CATEGORIES = [
  "Electronics",
  "Fashion & Clothing",
  "Home & Garden",
  "Beauty & Health",
  "Sports & Outdoors",
  "Books & Education",
  "Toys & Games",
  "Food & Beverages",
  "Jewelry & Accessories",
  "Art & Crafts",
  "Automotive",
  "Pet Supplies",
  "Other",
];

export default function CreateProductPage() {
  // selectedFiles: what seller sees in the preview (File objects from <input>)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  // previews: local object URLs for rendering <img> previews without uploading
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: uploadImages, isPending: isUploading } =
    useImageUpload();
  const { mutate: createProduct, isPending: isCreating } = useCreateProduct();

const {
  register,
  handleSubmit,
  formState: { errors },
  watch,
} = useForm<ProductFormInput, any, ProductFormOutput>({
  resolver: zodResolver(productSchema),
  defaultValues: {
    stock: 0,
    tags: "",
  },
});

  const descValue = watch("description") ?? "";

  // ── Image selection ────────────────────────────────────────────────────────
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []); // array.from converts FileList to Array<File>
    if (!files.length) return;

    // Limit to 5 images total
    const combined = [...selectedFiles, ...files].slice(0, 5); // selectedFiles are existing images, files are newly added ones. We combine and slice to enforce max of 5.
    setSelectedFiles(combined);

    // Create local preview URLs
    // URL.createObjectURL() creates a temporary URL pointing to the file in memory
    // This lets us show <img> previews WITHOUT uploading to the server
    const newPreviews = combined.map((f) => URL.createObjectURL(f));
    setPreviews(newPreviews);
  };

  const removeImage = (index: number) => {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(previews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (data: ProductFormOutput) => {
    if (selectedFiles.length === 0) {
      alert("Please add at least one product image");
      return;
    }

    try {
      // Step 1: Upload images, get back URLs
      // mutateAsync returns the result (unlike mutate which is fire-and-forget)
      // We need the result (image URLs) to pass to the product creation
      const uploadedImages: ProductImage[] = await uploadImages(selectedFiles);

      // Step 2: Create product with image URLs
      const tagsArray = data.tags
        ? data.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      createProduct({
        title: data.title,
        description: data.description,
        price: Number(data.price),
        discountPrice: data.discountPrice
          ? Number(data.discountPrice)
          : undefined,
        category: data.category,
        stock: Number(data.stock),
        tags: tagsArray,
        images: uploadedImages,
      });
    } catch {
      // Upload failed — useImageUpload's onError already shows a toast
      // We just need to stop here
    }
  };

  const isSubmitting = isUploading || isCreating;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white">Create Product</h2>
        <p className="text-sm text-white/30">Add a new item to your store</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Image upload ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/6 bg-white/2 p-5">
          <p className="text-sm font-medium text-white mb-1">
            Product Images
            <span className="text-emerald-400 ml-1">*</span>
          </p>
          <p className="text-xs text-white/30 mb-4">
            Add up to 5 images. First image is the cover.
          </p>

          <div className="flex flex-wrap gap-3">
            {/* Preview boxes */}
            {previews.map((url, i) => (
              <div
                key={i}
                className="relative h-24 w-24 rounded-xl overflow-hidden border border-white/10"
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black transition-all"
                >
                  <X className="h-3 w-3" />
                </button>
                {/* "Cover" badge on first image */}
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 rounded-md bg-emerald-500/80 px-1.5 py-0.5 text-[9px] font-bold text-black">
                    Cover
                  </span>
                )}
              </div>
            ))}

            {/* Add more button — hidden when at 5 images */}
            {selectedFiles.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-24 w-24 flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/2 text-white/30 hover:border-white/25 hover:text-white/50 transition-all gap-1"
              >
                <ImagePlus className="h-5 w-5" />
                <span className="text-[10px]">Add photo</span>
              </button>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageSelect}
          />
        </div>

        {/* ── Basic details ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/6 bg-white/2 p-5 space-y-4">
          <p className="text-sm font-medium text-white">Basic Details</p>

          {/* Title */}
          <Field
            label="Product Title"
            icon={<Type className="h-4 w-4" />}
            error={errors.title?.message}
            required
          >
            <input
              {...register("title")}
              placeholder="e.g. Wireless Noise-Canceling Headphones"
              className={inputClass(!!errors.title)}
            />
          </Field>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium uppercase tracking-widest text-white/40 flex items-center gap-1">
              Description <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-white/20 pointer-events-none" />
              <textarea
                {...register("description")}
                placeholder="Describe your product in detail — features, materials, dimensions, etc."
                rows={4}
                className={`
                  w-full rounded-xl border bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white
                  placeholder:text-white/20 outline-none transition-all resize-none
                  ${
                    errors.description
                      ? "border-red-500/50 focus:border-red-500/70"
                      : "border-white/10 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/10"
                  }
                `}
              />
              <span
                className={`absolute bottom-2 right-3 text-[10px] ${descValue.length > 1800 ? "text-amber-400" : "text-white/20"}`}
              >
                {descValue.length}
              </span>
            </div>
            {errors.description && (
              <p className="text-xs text-red-400">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Category */}
          <Field
            label="Category"
            icon={<Layers className="h-4 w-4" />}
            error={errors.category?.message}
            required
          >
            <select
              {...register("category")}
              className={`${inputClass(!!errors.category)} appearance-none cursor-pointer`}
            >
              <option value="" className="bg-[#0f1523]">
                Select category
              </option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-[#0f1523]">
                  {c}
                </option>
              ))}
            </select>
          </Field>

          {/* Tags */}
          <Field
            label="Tags (comma separated)"
            icon={<Hash className="h-4 w-4" />}
            error={errors.tags?.message}
          >
            <input
              {...register("tags")}
              placeholder="wireless, bluetooth, headphones"
              className={inputClass(!!errors.tags)}
            />
          </Field>
        </div>

        {/* ── Pricing & Stock ───────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/6 bg-white/2 p-5 space-y-4">
          <p className="text-sm font-medium text-white">Pricing & Stock</p>

          <div className="grid grid-cols-2 gap-4">
            {/* Price */}
            <Field
              label="Price ($)"
              icon={<DollarSign className="h-4 w-4" />}
              error={errors.price?.message}
              required
            >
              <input
                {...register("price")}
                type="number"
                step="0.01"
                placeholder="0.00"
                className={inputClass(!!errors.price)}
              />
            </Field>

            {/* Discount price */}
            <Field
              label="Sale Price ($)"
              icon={<DollarSign className="h-4 w-4" />}
              error={errors.discountPrice?.message}
            >
              <input
                {...register("discountPrice")}
                type="number"
                step="0.01"
                placeholder="Optional"
                className={inputClass(!!errors.discountPrice)}
              />
            </Field>
          </div>

          {/* Stock */}
          <Field
            label="Stock Quantity"
            icon={<Tag className="h-4 w-4" />}
            error={errors.stock?.message}
            required
          >
            <input
              {...register("stock")}
              type="number"
              placeholder="0"
              className={inputClass(!!errors.stock)}
            />
          </Field>
        </div>

        {/* ── Submit ────────────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <a
            href="/seller/dashboard/products"
            className="flex-1 flex items-center justify-center rounded-xl border border-white/8 py-3 text-sm text-white/50 hover:border-white/20 hover:text-white transition-all"
          >
            Cancel
          </a>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 py-3 text-sm font-bold text-black transition-all hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                {isUploading ? "Uploading images..." : "Creating product..."}
              </span>
            ) : (
              "Create Product"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function Field({
  label,
  icon,
  error,
  required,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-medium uppercase tracking-widest text-white/40 flex items-center gap-1">
        {label} {required && <span className="text-emerald-400">*</span>}
      </label>
      <div className="relative flex items-center">
        <span className="absolute left-3 text-white/20 pointer-events-none z-10">
          {icon}
        </span>
        {children}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `
    w-full rounded-xl border bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white
    placeholder:text-white/20 outline-none transition-all duration-200
    ${
      hasError
        ? "border-red-500/50 focus:border-red-500/70 focus:ring-2 focus:ring-red-500/10"
        : "border-white/10 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/10"
    }
  `;
}
