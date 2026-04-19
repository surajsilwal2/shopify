// apps/product-service/src/index.ts
//
// This is a completely standalone Express app.
// It knows nothing about auth-service or any other service.
// It only knows:
// 1. Its own routes
// 2. The shared database (Prisma)
// 3. The shared middleware (isAuthenticated, isSellerAuthenticated)
//
// The API Gateway is the one that decides to send traffic here.
// This service just handles whatever arrives.

import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import {errorMiddleware} from '@repo/shared'

// import productRouter from "./routes/product.route.js";

const app = express();
const PORT = process.env.PORT || 4002; 

 // ── Middleware ────────────────────────────────────────────────────────────────
 app.use(
   cors({
     origin: "http://localhost:3000",
     allowedHeaders: ["Authorization", "Content-Type"],
     credentials: true,
   }),
 );

 app.use(express.json());
 app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────────────────────
// Note the prefix here is /api/products — matching API Gateway routing rule
// API Gateway: /api/products/* → product-service
// This service: mounts at /api/products
// app.use("/api/products", productRouter);

// ── Health check ──────────────────────────────────────────────────────────────
// Every microservice should have this.
// API Gateway (or Kubernetes later) pings this to know if the service is alive.
// If it returns 200 → service is healthy
// If it times out or 500 → take this instance out of rotation
app.get("/health", (_, res) => {
  res.json({ status: "ok", service: "product-service", port: PORT });
});

// ── Global error handler ──────────────────────────────────────────────────────
// Must be LAST — after all routes
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Product service running on http://localhost:${PORT}`);
});
