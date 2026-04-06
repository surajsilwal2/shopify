import { createShop, CreateShopInput, getSellerMe, sellerLogin, SellerLoginInput, sellerLogout, sellerRegister, SellerRegisterInput, sellerVerify, SellerVerifyInput } from "@/api/seller";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
export const useCreateShop = () => {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateShopInput) => createShop(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sellerMe"] });
      toast.success("Shop created! Let's connect Stripe.");
      router.push("/seller/connect-stripe");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to create shop",
      );
    },
  });
}


// ── Get current seller ────────────────────────────────────────────────────────
// useQuery (not useMutation) because we're fetching, not mutating
// enabled: false means it won't auto-fetch — call refetch() manually when needed
// OR keep enabled: true to always fetch on mount (for protected pages)
export const useSellerMe = () => {
  return useQuery({
    queryKey: ["sellerMe"],
    queryFn: () => getSellerMe().then((res) => res.data),
    retry: false,        // ← CRITICAL: don't retry on 401, fail fast
    staleTime: 1000 * 60 * 5,
  });
};

// ── Logout ────────────────────────────────────────────────────────────────────
export const useSellerLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
 
  return useMutation({
    mutationFn: () => sellerLogout(),
    onSuccess: () => {
      // Remove cached seller data immediately
      // Without this the header would still show seller name until cache expires
      queryClient.removeQueries({ queryKey: ["sellerMe"] });
      toast.success("Logged out");
      router.push("/seller/login");
    },
    onError: () => {
      // Even if logout API fails, clear local state
      queryClient.removeQueries({ queryKey: ["sellerMe"] });
      router.push("/seller/login");
    },
  });
};
