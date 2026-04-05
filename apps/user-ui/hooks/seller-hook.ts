import { sellerLogin, SellerLoginInput, sellerRegister, SellerRegisterInput, sellerVerify, SellerVerifyInput } from "@/api/seller";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { redirect, useRouter } from "next/navigation";
import { toast } from "sonner";

// ── Step 1: Register ──────────────────────────────────────────────────────────
// On success → backend sent OTP, we tell the page to switch to OTP view
// Note: onSuccess receives the API response AND the variables we passed in
// We pass back the email so the OTP view knows where the code was sent
export const useSellerRegister = (onSuccess: (email: string) => void) => {
  return useMutation({
    mutationFn: (data: SellerRegisterInput) => sellerRegister(data),
    onSuccess: (_, variables) => {
      // variables = the data we passed to mutate()
      // _ = the response (we don't need it here)
      toast.success("OTP sent to your email!");
      onSuccess(variables.email); // tell parent page to switch to OTP view
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Registration failed",
      );
    },
  });
};

// ── Step 1.5: Verify OTP ──────────────────────────────────────────────────────
// On success → seller created in DB, redirect to login
export const useSellerVerify = (onSuccess: () => void) => {
  return useMutation({
    mutationFn: (data: SellerVerifyInput) => sellerVerify(data),
    onSuccess: () => {
      toast.success("Account verified! Please login.");
      onSuccess(); // tell parent to go to login
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Verification failed",
      );
    },
  });
};

// ── Seller Login ──────────────────────────────────────────────────────────────
// On success → cookies are set by backend, redirect based on shop existence
export const useSellerLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SellerLoginInput) => sellerLogin(data),
    onSuccess: (response) => {
      // Invalidate seller cache so useSellerMe refetches fresh data
      queryClient.invalidateQueries({ queryKey: ["sellerMe"] });
      toast.success("Welcome back!");

      // If seller has no shop yet → go to onboarding
      // If they have a shop → go to dashboard
      // Backend returns seller data including shop
      const seller = response.data?.seller;
      if (!seller?.shop) {
        router.push("/seller/onboarding");
      } else {
        router.push("/seller/dashboard");
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Login failed",
      );
    },
  });
};

// ── Create Shop (Step 2) ──────────────────────────────────────────────────────
// Protected — only works if sellerAccessToken cookie is valid
