// stores/cart-store.ts
//
// WHAT IS THIS FILE?
// This is your global cart and wishlist state.
// Any component in the entire app can read or modify cart/wishlist
// by importing hooks from this file — no prop drilling needed.
//
// MENTAL MODEL:
// Think of this as a database table that lives in the browser's memory.
// When user adds to cart → we update this "table"
// When Header needs count → it reads from this "table"
// When CartPage needs items → it reads from this "table"
// They all share the SAME data — no sync needed
//
// PERSISTENCE:
// The "persist" middleware automatically saves state to localStorage.
// So if user refreshes the page, their cart is still there.
// This is how every real ecommerce site works.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ── Types ─────────────────────────────────────────────────────────────────────
// CartItem: a product that's been added to cart
// We store the full product data because:
// 1. We need price, title, image to display in cart
// 2. We don't want to refetch product data on every cart open
// 3. quantity tracks how many of this product is in cart
export type CartItem = {
  id: string; // product id
  title: string;
  price: number;
  discountPrice?: number;
  image: string; // first image URL
  stock: number; // to enforce max quantity
  sellerId: string;
  shopName: string;
  quantity: number; // how many in cart
};

// WishlistItem: a product the user wants to buy later
// Simpler than CartItem — no quantity needed
export type WishlistItem = {
  id: string;
  title: string;
  price: number;
  discountPrice?: number;
  image: string;
  stock: number;
};

// ── Store shape ───────────────────────────────────────────────────────────────
// This defines everything in the store:
// - the STATE (data)
// - the ACTIONS (functions that change data)
type CartStore = {
  // ── State ──────────────────────────────────────────────────────────────────
  cart: CartItem[];
  wishlist: WishlistItem[];

  // ── Cart actions ───────────────────────────────────────────────────────────
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // ── Wishlist actions ───────────────────────────────────────────────────────
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (item: WishlistItem) => void;

  // ── Computed values (derived from state) ───────────────────────────────────
  // These are FUNCTIONS not values — so they always compute fresh
  getCartTotal: () => number;
  getCartCount: () => number;
  isInWishlist: (productId: string) => boolean;
  isInCart: (productId: string) => boolean;
};

// ── Create the store ──────────────────────────────────────────────────────────
// create() returns a HOOK — useCartStore
// persist() wraps the store to add localStorage saving
// createJSONStorage() tells persist to use localStorage (vs sessionStorage)
export const useCartStore = create<CartStore>()(
  persist(
    // The first argument to create() is a function that receives:
    // set → updates state (like setState in React)
    // get → reads current state (needed inside actions)
    (set, get) => ({
      // ── Initial state ───────────────────────────────────────────────────────
      cart: [],
      wishlist: [],

      // ── addToCart ───────────────────────────────────────────────────────────
      // If product already in cart → increment quantity (max = stock)
      // If product not in cart → add it with quantity 1
      addToCart: (item) => {
        set((state) => {
          // Check if this product is already in cart
          const existing = state.cart.find((c) => c.id === item.id);

          if (existing) {
            // Already in cart — just increase quantity
            // Math.min prevents going above stock limit
            // e.g. stock=5, quantity=5 → Math.min(6, 5) = 5 (capped)
            return {
              cart: state.cart.map((c) =>
                c.id === item.id
                  ? { ...c, quantity: Math.min(c.quantity + 1, item.stock) }
                  : c,
              ),
            };
          }

          // Not in cart — add with quantity 1
          return {
            cart: [...state.cart, { ...item, quantity: 1 }],
          };
        });
      },

      // ── removeFromCart ──────────────────────────────────────────────────────
      // Filter out the item with matching id
      removeFromCart: (productId) => {
        set((state) => ({
          cart: state.cart.filter((c) => c.id !== productId),
        }));
      },

      // ── updateQuantity ──────────────────────────────────────────────────────
      // Called when user clicks +/- buttons in cart
      // If quantity reaches 0 → remove from cart entirely
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        set((state) => ({
          cart: state.cart.map((c) =>
            c.id === productId
              ? { ...c, quantity: Math.min(quantity, c.stock) }
              : c,
          ),
        }));
      },

      // ── clearCart ───────────────────────────────────────────────────────────
      // Called after successful order placement
      clearCart: () => set({ cart: [] }),

      // ── addToWishlist ───────────────────────────────────────────────────────
      // Don't add duplicates
      addToWishlist: (item) => {
        set((state) => {
          const exists = state.wishlist.some((w) => w.id === item.id);
          if (exists) return state; // no change
          return { wishlist: [...state.wishlist, item] };
        });
      },

      // ── removeFromWishlist ──────────────────────────────────────────────────
      removeFromWishlist: (productId) => {
        set((state) => ({
          wishlist: state.wishlist.filter((w) => w.id !== productId),
        }));
      },

      // ── toggleWishlist ──────────────────────────────────────────────────────
      // If in wishlist → remove. If not → add.
      // This is what the heart button calls — one function handles both states
      toggleWishlist: (item) => {
        const { isInWishlist, addToWishlist, removeFromWishlist } = get();
        if (isInWishlist(item.id)) {
          removeFromWishlist(item.id);
        } else {
          addToWishlist(item);
        }
      },

      // ── getCartTotal ────────────────────────────────────────────────────────
      // Sum of (price × quantity) for all items
      // Uses discountPrice if available, otherwise regular price
      // Why a function and not a value?
      // Values are computed ONCE. Functions are called fresh each time.
      // If it were a value: total = $50, user removes item, total still shows $50
      // As a function: getCartTotal() always calculates from current cart
      getCartTotal: () => {
        const { cart } = get();
        return cart.reduce((total, item) => {
          const price = item.discountPrice ?? item.price;
          return total + price * item.quantity;
        }, 0); // 0 is the starting value of total
      },

      // ── getCartCount ────────────────────────────────────────────────────────
      // Total number of ITEMS (not unique products)
      // e.g. 2x headphones + 1x cable = count of 3
      getCartCount: () => {
        const { cart } = get();
        return cart.reduce((count, item) => count + item.quantity, 0);
      },

      // ── isInWishlist ────────────────────────────────────────────────────────
      // Returns true/false — used to show filled/empty heart icon
      isInWishlist: (productId) => {
        return get().wishlist.some((w) => w.id === productId);
      },

      // ── isInCart ────────────────────────────────────────────────────────────
      isInCart: (productId) => {
        return get().cart.some((c) => c.id === productId);
      },
    }),

    // ── Persist config ────────────────────────────────────────────────────────
    {
      name: "shopify-cart", // localStorage key name
      storage: createJSONStorage(() => localStorage),
      // partialize: choose what to persist
      // We ONLY persist cart and wishlist arrays — not the functions
      // Functions can't be serialized to JSON anyway
      partialize: (state) => ({
        cart: state.cart,
        wishlist: state.wishlist,
      }),
    },
  ),
);
