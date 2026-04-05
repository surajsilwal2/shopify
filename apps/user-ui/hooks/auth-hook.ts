import {
  forgotPassword,
  getMe,
  login,
  logout,
  register,
  resetPassword,
  verifyForgotPasswordOtp,
  verifyOtp,
} from "@/api/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ─── Login ─────────────────────────────────────────────────────────────────
export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { email: string, password: string }) => login(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] }); // querykey is used to cache data in browser's memory so we don't have to ask what is the data, everytime we reload or fetch same data
      toast.success("Welcome back!");
      router.push("/home");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Login failed");
    },
  });
};

// ─── Register ─────────────────────────────────────────────────────────────────
export const useRegister = () => {
  const router = useRouter();
  return useMutation({
    mutationFn: (data: { name: string; email: string, password: string }) => register(data),
    onSuccess: (response, variables) => {
      toast.success("OTP sent! Check your email.");
        console.log("register response:", response); // check what comes back
        console.log("register variables:", variables);

      //store the data in session storage. because session storage only keep info until the tab is closed and retreving data from session is fast
      sessionStorage.setItem("pendingName", variables.name);
      sessionStorage.setItem("pendingEmail", variables.email);
      router.push("/verify-otp");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Registration failed");
    },
  });
};

// ─── Verify OTP ───────────────────────────────────────────────────────────────
export function useVerifyOtp() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: {
      name: string;
      email: string;
      password: string;
      otp: string;
    }) => verifyOtp(data),
    onSuccess: () => {
      toast.success("Account created! Please log in.");
      sessionStorage.removeItem("pendingEmail");
      sessionStorage.removeItem("pendingName");
      sessionStorage.removeItem("pendingPassword");
      router.push("/login");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Invalid OTP");
    },
  });
}

// ─── Forgot Password ──────────────────────────────────────────────────────────
export function useForgotPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: { email: string }) => forgotPassword(data),
    onSuccess: (_, variables) => {
      toast.success("OTP sent to your email.");
      sessionStorage.setItem("resetEmail", variables.email);
      router.push("/verify-reset-otp"); // ← goes to NEW page
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to send reset email");
    },
  });
}

// ─── Verify Forget Password OTP ───────────────────────────────────────────────
export function useVerifyResetOtp() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: { email: string; otp: string }) => verifyForgotPasswordOtp(data),
    onSuccess: () => {
      toast.success("OTP verified. Set your new password.");
      router.push("/reset-password"); // ← only now go to reset page
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Invalid OTP");
    },
  });
}

// ─── Reset Password ───────────────────────────────────────────────────────────
export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: { email: string; newPassword: string }) => resetPassword(data),
    onSuccess: () => {
      toast.success("Password reset! Please log in.");
      sessionStorage.removeItem("resetEmail");
      localStorage.clear();
      sessionStorage.clear();
      router.push("/login");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to reset password");
    },
  });
}

// ─── Get Me ───────────────────────────────────────────────────────────────────
export function useMe(enabled: boolean = true) {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => getMe().then((r) => r.data),
    retry: false,
    enabled,
  });
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export function useLogout() {
 const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => logout(),
    onSettled: () => {
      // Runs on both success AND error
      // queryClient.removeQueries on logout is important — without it, the cached user data stays in memory and the header still shows the user's name until the cache expires.
      queryClient.removeQueries({ queryKey: ["me"] });
      router.push("/login");
    }
  })

}