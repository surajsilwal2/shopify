"use client";


import { useResetPassword } from "@/hooks/auth-hook";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordContract } from "@repo/api-contract";
import { z } from "zod";
import { KeyRound, Lock } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import AuthLayout from "@/components/shared/auth/auth-layout";
import AuthInput from "@/components/shared/auth/auth-input";
import { AuthButton } from "@/components/shared/auth/auth-button";

/**
 * EXTENDING THE SCHEMA:
 * We take the 'body' from  contract (which only has email/password)
 * and add 'confirmPassword' for frontend validation.
 *
 * .omit({ email: true }) is used because the user doesn't type their email here;
 * it's already stored in sessionStorage from the previous steps.
 */
const resetSchema = resetPasswordContract.body
  .extend({
    confirmPassword: z.string(),
  })
  // .refine is a "Super-Check" that looks at both password fields to see if they match
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // Attaches the error message to the confirm field specifically
  });

type ResetForm = z.infer<typeof resetSchema>;

const ResetPasswordPage = () => {
  const [email, setEmail] = useState("");
  const { mutate: resetPassword, isPending } = useResetPassword();

  /**
   * HYDRATION:
   * We pull the email from sessionStorage so the API knows WHICH user
   * is changing their password.
   */

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  // 2. Sync email into the form state immediately
  useEffect(() => {
    const savedEmail = sessionStorage.getItem("resetEmail") || "";
    setEmail(savedEmail)
    // This tells React Hook Form that the email field is filled
    setValue("email", savedEmail, { shouldValidate: true });
  }, [setValue]);

  /**
   * SUBMIT HANDLER:
   * We destructure 'newPassword' out of the validated data.
   * 'confirmPassword' is discarded here because the Backend API doesn't want it.
   */
 const onSubmit = (data: ResetForm) => {
   resetPassword({
     email: data.email,
     newPassword: data.newPassword,
   });
 };

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Choose a strong password for your account"
      backLink={{
        href: "/verify-reset-otp",
        label: "Go back",
        text: "Need to re-verify?",
      }}
    >
      <div className="mb-6 flex justify-center">
        {/* Visual Icon Header */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 border border-amber-400/20">
          <KeyRound className="h-6 w-6 text-amber-400" />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* NEW PASSWORD INPUT */}
        <AuthInput
          label="New password"
          type="password"
          placeholder="••••••••"
          icon={<Lock className="h-4 w-4" />}
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />

        {/* CONFIRM PASSWORD INPUT */}
        <AuthInput
          label="Confirm new password"
          type="password"
          placeholder="••••••••"
          icon={<Lock className="h-4 w-4" />}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {/* LOADING BUTTON: Automatically shows spinner when isPending is true */}
        <AuthButton loading={isPending} type="submit">
          Reset Password
        </AuthButton>
      </form>
    </AuthLayout>
  );
};;

export default ResetPasswordPage;
