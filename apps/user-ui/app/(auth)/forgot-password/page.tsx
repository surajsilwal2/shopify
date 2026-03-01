"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useForgotPassword } from "@/hooks/auth-hook";
import AuthLayout from "@/components/shared/auth/auth-layout";
import AuthInput from "@/components/shared/auth/auth-input";
import { AuthButton } from "@/components/shared/auth/auth-button";
import { ForgetPasswordBody, forgetPasswordContract } from "@repo/api-contract";
export default function ForgotPasswordPage() {
  const { mutate: forgotPassword, isPending } = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgetPasswordBody>({
    resolver: zodResolver(forgetPasswordContract.body),
    defaultValues: { email: "" },
  });
  return (
    <AuthLayout title="Reset your password" subtitle="We will send a verification code to your email">
      <div className="mb-6">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to login
        </Link>
      </div>
      <form onSubmit={handleSubmit((data) => forgotPassword(data))} className="space-y-5">
        <AuthInput
          label="Email address"
          type="email"
          placeholder="you@example.com"
          icon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register("email")}
        />
        <AuthButton loading={isPending} type="submit">Send Reset Code</AuthButton>
      </form>
    </AuthLayout>
  );
} 