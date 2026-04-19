// apps/product-service/src/routes/product.route.ts

import express from "express";
import {
  createProduct,
  getAllProducts,
  getProduct,
  getSellerProducts,
  updateProduct,
  deleteProduct,
  uploadImages,
} from "../controllers/product-controller.js";
import { createRoute, isSellerAuthenticated } from "@repo/shared";

import multer from "multer";
import { createProductContract, updateProductContract } from "@repo/api-contract";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ── Public — no validation needed (GET, no body) ──────────────────────────────
router.get("/", getAllProducts);
router.get("/:id", getProduct);

// ── Seller — body validation via createRoute ──────────────────────────────────
// createRoute(contract, handler):
//   → validates req.body against contract.body (Zod schema)
//   → returns 400 if invalid
//   → calls handler only if valid
//
// isSellerAuthenticated:
//   → verifies sellerAccessToken cookie
//   → attaches req.seller if valid
//   → returns 401 if invalid
//
// Middleware runs LEFT TO RIGHT:
//   isSellerAuthenticated → createRoute → handler
//   If auth fails → createRoute and handler never run
//   If validation fails → handler never runs
router.post(
  "/",
  isSellerAuthenticated,
  createRoute(createProductContract, createProduct),
);

router.get(
  "/seller/my-products",
  isSellerAuthenticated,
  getSellerProducts,
  // No createRoute here — no request body to validate
  // Query params (?page=1&limit=10) are validated inside the controller
);

router.put(
  "/:id",
  isSellerAuthenticated,
  createRoute(updateProductContract, updateProduct),
);

router.delete(
  "/:id",
  isSellerAuthenticated,
  deleteProduct,
  // No createRoute — no body, just URL param :id
);

// Image upload — multer runs BEFORE createRoute
// multer parses multipart/form-data and populates req.files
// No Zod contract needed — files aren't JSON
router.post(
  "/upload-images",
  isSellerAuthenticated,
  upload.array("images", 5),
  uploadImages,
);

export default router;
