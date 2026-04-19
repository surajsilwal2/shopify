// packages/shared/index.ts
export * from "./error-handler/error.middleware.js";
export * from "./error-handler/index.js"; 
export { sendEmail } from "./sendEmail/sendEmail.js";
export { isAuthenticated } from "./middleware/isAuthenticated.js";
export { isSellerAuthenticated } from "./middleware/isSellerAuthenticated.js"; // ← add this
export * from "./lib/createRoute.js"; // ← add this
