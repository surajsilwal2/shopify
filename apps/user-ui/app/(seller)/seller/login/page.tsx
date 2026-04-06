"use client";

// app/(auth)/seller/login/page.tsx
//
// Simple login page — email + password
// On success → backend sets cookies → redirect based on whether shop exists

import { useSellerLogin } from "@/hooks/seller-hook";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const loginSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function SellerLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: login, isPending } = useSellerLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (data: LoginForm) => login(data);

  return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-125 h-125 rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-100 h-100 rounded-full bg-teal-500/5 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="rounded-xl bg-linear-to-br from-emerald-400 to-teal-500 px-3 py-1.5 text-sm font-black tracking-tight text-black">
              SHOP
            </span>
            <span className="text-sm font-light tracking-widest text-white/30 uppercase">
              ify
            </span>
          </Link>
          <span className="text-xs text-white/20 tracking-widest uppercase font-medium">
            Seller Portal
          </span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-xl p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Building2 className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] tracking-widest uppercase text-emerald-400/70 font-medium">
                  Seller Portal
                </p>
                <h1 className="text-xl font-bold text-white">Welcome back</h1>
              </div>
            </div>
            <p className="text-sm text-white/40">
              Sign in to manage your store
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium uppercase tracking-widest text-white/40">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 pointer-events-none" />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="john@example.com"
                  className={`w-full rounded-xl border bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/20 outline-none transition-all ${
                    errors.email
                      ? "border-red-500/50 focus:border-red-500/70"
                      : "border-white/10 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/10"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium uppercase tracking-widest text-white/40">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 pointer-events-none" />
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  className={`w-full rounded-xl border bg-white/5 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-white/20 outline-none transition-all ${
                    errors.password
                      ? "border-red-500/50 focus:border-red-500/70"
                      : "border-white/10 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/10"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <Link
                href="/seller/forgot-password"
                className="text-xs text-emerald-400/70 hover:text-emerald-400 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 py-3 text-sm font-bold text-black transition-all hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  Signing in...
                </span>
              ) : (
                "Sign In →"
              )}
            </button>

            {/* Register link */}
            <p className="text-center text-sm text-white/30">
              New seller?{" "}
              <Link
                href="/seller/register"
                className="text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Create account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
