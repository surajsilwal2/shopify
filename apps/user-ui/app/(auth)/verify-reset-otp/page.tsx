"use client";

import { AuthButton } from "@/components/shared/auth/auth-button";
import AuthLayout from "@/components/shared/auth/auth-layout";
import { useVerifyResetOtp, useForgotPassword } from "@/hooks/auth-hook";
import { zodResolver } from "@hookform/resolvers/zod";
import { VerifyForgetPasswordOtpBody, verifyForgetPasswordOtpContract } from "@repo/api-contract";

import { ShieldCheck } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

/**
 * CONSTANTS: Define global values here so they are easy to change later.
 */
const COOLDOWN_SECONDS = 60;

/**
 * DYNAMIC KEY GENERATOR: Creates a unique LocalStorage key for each email.
 * This prevents Timer A (user1) from blocking Timer B (user2) on the same computer.
 */
const getExpiryKey = (email: string) => `resetOtpExpiry:${email}`;

const VerifyResetOtpPage = () => {
  // 1. UI STATE: Manages the 6 individual boxes on the screen
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);

  // 2. REFS: Used to physically move the cursor (focus) between input boxes
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 3. API HOOKS: Mutate functions to talk to your backend
  const { mutate: verify, isPending } = useVerifyResetOtp();
  const { mutate: resend, isPending: isResending } = useForgotPassword();

  // 4. FORM BRAIN: React Hook Form + Zod for validation
  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<VerifyForgetPasswordOtpBody>({
    resolver: zodResolver(verifyForgetPasswordOtpContract.body),
  });

  /**
   * ON PAGE LOAD: Runs once to "Hydrate" the page with saved data.
   */
  useEffect(() => {
    // Grab the email we saved on the previous 'Forgot Password' page
    const resetEmail = sessionStorage.getItem("resetEmail") || "";

    // 1. Set the local state
    setEmail(resetEmail);

    // 2. Set the FORM state directly using the variable, NOT the 'email' state
    // This is the key fix:
    setValue("email", resetEmail, { shouldValidate: true });

    // If we have an email, check if there's a countdown currently running in LocalStorage
    if (resetEmail) {
      const saved = localStorage.getItem(getExpiryKey(resetEmail));
      if (saved) {
        // MATH: (Deadline Timestamp - Current Time) / 1000 = Seconds Left
        const remaining = Math.round((Number(saved) - Date.now()) / 1000);
        if (remaining > 0) setTimeLeft(remaining);
      }
    }

    // Auto-focus the first box so the user can start typing immediately
    inputRefs.current[0]?.focus();
  }, [setValue]);

  /**
   * THE TICKER: Re-calculates the remaining time every 1 second.
   * We use "Math against a Timestamp" to avoid timer drift if the tab is hidden.
   */
  useEffect(() => {
    if (timeLeft <= 0) {
      localStorage.removeItem(getExpiryKey(email));
      return;
    }

    const interval = setInterval(() => {
      const saved = localStorage.getItem(getExpiryKey(email));
      if (!saved) {
        setTimeLeft(0);
        return;
      }

      const remaining = Math.round((Number(saved) - Date.now()) / 1000);
      setTimeLeft(remaining > 0 ? remaining : 0);
    }, 1000);

    return () => clearInterval(interval); // Cleanup: Stops the timer if user leaves page
  }, [timeLeft, email]);

  /**
   * INPUT HANDLER: Moves focus forward and syncs the 6 boxes with the Zod Brain.
   */
  const handleChange = (index: number, value: string) => {
    // A. Handle Bulk Paste (User pastes 123456)
    if (value.length === 6 && /^\d+$/.test(value)) {
      const digits = value.split("");
      setOtp(digits);
      setValue("otp", value, { shouldValidate: true });
      inputRefs.current[5]?.focus();
      return;
    }

    // B. Block non-numeric characters
    if (!/^\d*$/.test(value)) return;

    // C. Handle Single Character Entry
    const next = [...otp];
    next[index] = value.slice(-1); // Only keep the newest digit
    setOtp(next);

    // Sync the joined string (e.g. "123") with React Hook Form
    setValue("otp", next.join(""), { shouldValidate: true });

    // Auto-advance focus to the next box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  /**
   * BACKSPACE HANDLER: Moves focus backward if a box is empty.
   */
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  /**
   * SUBMIT HANDLER: Called by handleSubmit only if Zod says the OTP is 6 digits.
   */
  const onSubmit = () => {
    verify({ email, otp: otp.join("") });
  };

  /**
   * RESEND HANDLER: Resets the timer and asks the backend for a new code.
   */
  const handleResend = () => {
    if (!email || timeLeft > 0) return; // Prevent clicking if timer is active

    resend({ email });

    // Set new deadline 60s into the future
    const expiry = Date.now() + COOLDOWN_SECONDS * 1000;
    localStorage.setItem(getExpiryKey(email), expiry.toString());

    // Reset UI
    setTimeLeft(COOLDOWN_SECONDS);
    setOtp(["", "", "", "", "", ""]);
    setValue("otp", "", { shouldValidate: false });
    inputRefs.current[0]?.focus();
  };

  return (
    <AuthLayout
      title="Check your email"
      subtitle={`We sent a reset code to ${email || "your email"}`}
      backLink={{
        href: "/forgot-password",
        label: "Try again",
        text: "Wrong email?",
      }}
    >
      <div className="mb-8 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10 border border-amber-400/20">
          <ShieldCheck className="h-7 w-7 text-amber-400" />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          {/* OTP INPUT GRID */}
          <div className="flex gap-2 justify-center">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }} // Assign this input to our ref array
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`h-12 w-12 rounded-xl border text-center text-lg font-bold text-white transition-all duration-200 outline-none ${
                  digit
                    ? "border-amber-400/60 bg-amber-400/10 ring-2 ring-amber-400/20"
                    : "border-white/10 bg-white/5 focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20"
                }`}
              />
            ))}
          </div>

          {/* ERROR MESSAGE (From Zod) */}
          {errors.otp && (
            <p className="mt-2 text-center text-xs text-red-400">
              {errors.otp.message}
            </p>
          )}
        </div>

        <AuthButton
          loading={isPending}
          type="submit"
          disabled={!otp.every(Boolean)}
        >
          Verify Code
        </AuthButton>
      </form>

      {/* FOOTER: Cooldown Logic */}
      <p className="mt-5 text-center text-sm text-slate-600">
        Did not receive it?{" "}
        {timeLeft > 0 ? (
          <span className="text-slate-500">
            Resend in{" "}
            <span className="font-mono font-semibold text-amber-400">
              {timeLeft}s
            </span>
          </span>
        ) : (
          <button
            onClick={handleResend}
            disabled={isResending}
            className="text-amber-400/70 hover:text-amber-400 transition-colors font-medium disabled:opacity-50"
          >
            {isResending ? "Sending..." : "Resend code"}
          </button>
        )}
      </p>
    </AuthLayout>
  );
};

export default VerifyResetOtpPage;
