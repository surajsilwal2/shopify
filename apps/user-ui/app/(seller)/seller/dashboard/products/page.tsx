"use client";

// app/(seller)/seller/dashboard/products/page.tsx
// Lists all seller products with edit/delete actions + pagination

import {
  useSellerProducts,
  useDeleteProduct,
  type Product,
} from "@/hooks/product-hook";
import { Box, Edit, MoreVertical, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  // deleteConfirm stores the ID of product pending deletion
  // null = no confirmation dialog open

  const { data, isLoading } = useSellerProducts(page);
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();

  // Client-side search filter
  // For production with 1000s of products, move this to backend query param
  const filtered =
    data?.products?.filter((p: Product) =>
      p.title.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  const handleDelete = (id: string) => {
    deleteProduct(id, {
      onSuccess: () => setDeleteConfirm(null),
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Header row ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Products</h2>
          <p className="text-sm text-white/30">
            {data?.pagination?.total ?? 0} total products
          </p>
        </div>
        <Link
          href="/seller/dashboard/products/create"
          className="flex items-center gap-2 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-bold text-black transition-all hover:from-emerald-400 hover:to-teal-400"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {/* ── Search ─────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full rounded-xl border border-white/8 bg-white/3 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/10 transition-all"
        />
      </div>

      {/* ── Product table ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/6 bg-white/2 overflow-hidden">
        {isLoading ? (
          // Skeleton rows while loading
          <div className="divide-y divide-white/5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="h-12 w-12 rounded-xl bg-white/5 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/5 animate-pulse rounded-lg w-1/3" />
                  <div className="h-3 bg-white/5 animate-pulse rounded-lg w-1/4" />
                </div>
                <div className="h-4 bg-white/5 animate-pulse rounded-lg w-16" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Box className="h-12 w-12 text-white/10 mb-4" />
            <p className="text-sm font-medium text-white/30">
              {search ? "No products match your search" : "No products yet"}
            </p>
            {!search && (
              <Link
                href="/seller/dashboard/products/create"
                className="mt-4 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Create your first product →
              </Link>
            )}
          </div>
        ) : (
          // Product rows
          <div className="divide-y divide-white/5">
            {filtered.map((product: Product) => (
              <ProductRow
                key={product.id}
                product={product}
                onDeleteClick={() => setDeleteConfirm(product.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/30">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))} 
              disabled={page === 1}
              className="rounded-xl border border-white/8 px-4 py-2 text-sm text-white/50 hover:border-white/20 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data.pagination.hasMore}
              className="rounded-xl border border-white/8 px-4 py-2 text-sm text-white/50 hover:border-white/20 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative rounded-2xl border border-white/8 bg-[#0f1523] p-6 w-full max-w-sm">
            <h3 className="text-base font-bold text-white mb-2">
              Delete product?
            </h3>
            <p className="text-sm text-white/40 mb-6">
              This action cannot be undone. The product will be permanently
              removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-xl border border-white/8 py-2.5 text-sm text-white/50 hover:border-white/20 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-red-500/90 py-2.5 text-sm font-bold text-white hover:bg-red-500 transition-all disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Product row component ─────────────────────────────────────────────────────
function ProductRow({
  product,
  onDeleteClick,
}: {
  product: Product;
  onDeleteClick: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Discount percentage — shown as a badge if discountPrice exists
  const discount = product.discountPrice
    ? Math.round(
        ((product.price - product.discountPrice) / product.price) * 100,
      )
    : null;

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-white/2 transition-colors">
      {/* Product image */}
      <div className="h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-white/5 border border-white/6">
        {product.images?.[0] ? (
          <img
            src={product.images[0].url}
            alt={product.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Box className="h-5 w-5 text-white/20" />
          </div>
        )}
      </div>

      {/* Title + category */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {product.title}
        </p>
        <p className="text-xs text-white/30">{product.category}</p>
      </div>

      {/* Price */}
      <div className="text-right shrink-0">
        {product.discountPrice ? (
          <div>
            <p className="text-sm font-bold text-white">
              ${product.discountPrice}
            </p>
            <p className="text-xs text-white/30 line-through">
              ${product.price}
            </p>
          </div>
        ) : (
          <p className="text-sm font-bold text-white">${product.price}</p>
        )}
        {discount && (
          <span className="text-[10px] font-medium text-emerald-400">
            -{discount}%
          </span>
        )}
      </div>

      {/* Stock badge */}
      <div
        className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium ${
          product.stock === 0
            ? "bg-red-500/10 text-red-400"
            : product.stock < 10
              ? "bg-amber-500/10 text-amber-400"
              : "bg-emerald-500/10 text-emerald-400"
        }`}
      >
        {product.stock === 0 ? "Out of stock" : `${product.stock} left`}
      </div>

      {/* Actions menu */}
      <div className="relative shrink-0">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:bg-white/5 hover:text-white transition-all"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {menuOpen && (
          <>
            {/* Backdrop to close menu */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-xl border border-white/8 bg-[#0f1523] p-1 shadow-2xl shadow-black/50">
              <Link
                href={`/seller/dashboard/products/${product.id}/edit`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all"
              >
                <Edit className="h-3.5 w-3.5" />
                Edit
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDeleteClick();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
