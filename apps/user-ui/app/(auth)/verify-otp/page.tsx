"use client";

import { AuthButton } from "@/components/shared/auth/auth-button";
import AuthLayout from "@/components/shared/auth/auth-layout";
import { useRegister, useVerifyOtp } from "@/hooks/auth-hook";
import { zodResolver } from "@hookform/resolvers/zod";
import { VerifyBody, verifyContract } from "@repo/api-contract";
import { ShieldCheck } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

const COOLDOWN_SECONDS = 60;
const getExpiryKey = (email: string) => `otpExpiry:${email}`;

const VerifyOtpPage = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [timeLeft, setTimeLeft] = useState(0); // start at 0, useEffect will hydrate it
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { mutate: resend, isPending: isResending } = useRegister();
  const { mutate: verify, isPending } = useVerifyOtp();

  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<VerifyBody>({
    resolver: zodResolver(verifyContract.body),
    defaultValues: { otp: "" },
  });

  // Hydrate session data + restore timer now that email is available
  useEffect(() => {
    const pendingEmail = sessionStorage.getItem("pendingEmail") || "";
    const pendingName = sessionStorage.getItem("pendingName") || "";
    const pendingPassword = sessionStorage.getItem("pendingPassword") || "";

    setEmail(pendingEmail);
    setName(pendingName);
    setPassword(pendingPassword);

    // --- ADD THESE LINES TO SYNC THE FORM STATE ---
    setValue("email", pendingEmail);
    setValue("name", pendingName);
    setValue("password", pendingPassword);
    // ----------------------------------------------

    // Restore persisted cooldown using the per-email key
    if (pendingEmail) {
      const saved = localStorage.getItem(getExpiryKey(pendingEmail));
      if (saved) {
        const remaining = Math.round((Number(saved) - Date.now()) / 1000);
        if (remaining > 0) setTimeLeft(remaining);
      } else {
        // First visit — start the initial cooldown automatically
        // (OTP was already sent by the register step)
        const expiry = Date.now() + COOLDOWN_SECONDS * 1000;
        localStorage.setItem(getExpiryKey(pendingEmail), expiry.toString());
        setTimeLeft(COOLDOWN_SECONDS);
      }
    }

    inputRefs.current[0]?.focus();
  }, [setValue]);

  // Tick — derived from expiry timestamp to avoid drift
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

    return () => clearInterval(interval);
  }, [timeLeft, email]);

    const handleChange = (index: number, value: string) => {
      // this handles the copy paste of otp
    if (value.length === 6 && /^\d+$/.test(value)) {
      const digits = value.split("");
      setOtp(digits);
      setValue("otp", value, { shouldValidate: true });
      inputRefs.current[5]?.focus();
      return;
    }
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setValue("otp", next.join(""), { shouldValidate: true });
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const onSubmit = () => {
    verify({ name, email, password, otp: otp.join("") });
  };

  const handleResend = () => {
    if (!email || !name || timeLeft > 0) return;
    resend({ name, email, password });
    const expiry = Date.now() + COOLDOWN_SECONDS * 1000;
    localStorage.setItem(getExpiryKey(email), expiry.toString());
    setTimeLeft(COOLDOWN_SECONDS);
    setOtp(["", "", "", "", "", ""]);
    setValue("otp", "", { shouldValidate: false });
    inputRefs.current[0]?.focus();
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={`We sent a 6-digit code to ${email || "your email"}`}
      backLink={{ href: "/signup", label: "Go back", text: "Wrong email?" }}
    >
      <div className="mb-8 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10 border border-amber-400/20">
          <ShieldCheck className="h-7 w-7 text-amber-400" />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <div className="flex gap-2 justify-center">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
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
          Verify Account
        </AuthButton>
      </form>

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

export default VerifyOtpPage;
