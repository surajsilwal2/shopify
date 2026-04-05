"use client";

// app/(auth)/seller/register/page.tsx
//
// WHAT THIS PAGE DOES:
// Two views on the same URL — no page redirect between register and OTP verify
//
// View 1: "register" → user fills name, email, phone, country, password
//         → submits → backend sends OTP → we switch to view 2
//
// View 2: "otp" → user enters 6-digit code
//         → submits → backend creates seller in DB → redirect to /seller/login
//
// WHY SAME PAGE:
// All data stays in React state — no sessionStorage, no broken back button,
// no refresh issues. The email is right there in state when we need it.

import { useSellerRegister, useSellerVerify } from "@/hooks/seller-hook";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  Phone,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// ── Zod schemas ───────────────────────────────────────────────────────────────
// These mirror your backend contracts exactly
// If your backend changes validation, update here too (or import from @repo/api-contract)

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.email("Invalid email address"),
    phone: z.string().min(7, "Invalid phone number"),
    country: z.string().min(2, "Country is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"], // this tells RHF which field to attach the error to
  });

type RegisterForm = z.infer<typeof registerSchema>;

// OTP schema — just 6 digits
const otpSchema = z.object({
  otp: z.string().length(6, "Enter all 6 digits"),
});
type OtpForm = z.infer<typeof otpSchema>;

// ── Country list — extend as needed ──────────────────────────────────────────
const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Argentina",
  "Australia",
  "Austria",
  "Bangladesh",
  "Belgium",
  "Brazil",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "Czech Republic",
  "Denmark",
  "Egypt",
  "Ethiopia",
  "Finland",
  "France",
  "Germany",
  "Ghana",
  "Greece",
  "Hungary",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Japan",
  "Jordan",
  "Kenya",
  "Malaysia",
  "Mexico",
  "Morocco",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "Norway",
  "Pakistan",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Romania",
  "Russia",
  "Saudi Arabia",
  "South Africa",
  "South Korea",
  "Spain",
  "Sri Lanka",
  "Sweden",
  "Switzerland",
  "Thailand",
  "Turkey",
  "Ukraine",
  "United Kingdom",
  "United States",
  "Vietnam",
];

// ── Password strength calculator ──────────────────────────────────────────────
// Returns 0-4 based on complexity
// Used to show a visual strength bar below the password field
function getPasswordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColors = ["", "#ef4444", "#f97316", "#eab308", "#22c55e"];

// ── OTP cooldown key — per email to avoid collision ──────────────────────────
// Same pattern you used in verify-otp page
const getCooldownKey = (email: string) => `sellerOtpExpiry:${email}`;

// ── Main component ────────────────────────────────────────────────────────────
export default function SellerRegisterPage() {
  const router = useRouter();

  // This single state controls which view is shown
  // "register" → form, "otp" → OTP boxes
  const [view, setView] = useState<"register" | "otp">("register");

  // We store email and name in state after registration
  // so the OTP view can display "We sent a code to john@gmail.com"
  // and the verify mutation knows which email to verify
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [registeredName, setRegisteredName] = useState("");

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Cooldown timer (same pattern as user verify-otp page)
  const [timeLeft, setTimeLeft] = useState(0);

  // Watch password field for strength indicator
  const [passwordValue, setPasswordValue] = useState("");
  const strength = getPasswordStrength(passwordValue);

  // ── OTP state ─────────────────────────────────────────────────────────────
  // 6 separate string values — one per box
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Register form ──────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  // ── OTP form ───────────────────────────────────────────────────────────────
  const {
    setValue: setOtpValue,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
  } = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
    // defaultValues is CRITICAL here — without it RHF doesn't know
    // the "otp" field exists before setValue is called, causing silent
    // validation failures (submit button appears to do nothing)
  });

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { mutate: register_, isPending: isRegistering } = useSellerRegister(
    (email) => {
      // This callback runs on success
      // Switch to OTP view and start cooldown timer
      setRegisteredEmail(email);
      setView("otp");
      startCooldown(email);
    },
  );

  const { mutate: verify, isPending: isVerifying } = useSellerVerify(() => {
    // On successful verification → go to login
    router.push("/seller/login");
  });

  // ── Cooldown timer ─────────────────────────────────────────────────────────
  // Stores expiry TIMESTAMP in localStorage, not seconds remaining
  // Why? Because if user refreshes, we can recalculate from the stored timestamp
  // instead of resetting to 60. This survives page refreshes.
  const startCooldown = (email: string) => {
    const expiry = Date.now() + 60 * 1000;
    localStorage.setItem(getCooldownKey(email), String(expiry));
    setTimeLeft(60);
  };

  // Hydrate timer on mount (for when user refreshes during OTP view)
  useEffect(() => {
    if (view === "otp" && registeredEmail) {
      const stored = localStorage.getItem(getCooldownKey(registeredEmail));
      if (stored) {
        const remaining = Math.round((parseInt(stored) - Date.now()) / 1000);
        if (remaining > 0) setTimeLeft(remaining);
      }
    }
  }, [view, registeredEmail]);

  // Tick — derives from stored timestamp to avoid drift
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      const stored = localStorage.getItem(getCooldownKey(registeredEmail));
      if (!stored) return;
      const remaining = Math.round((parseInt(stored) - Date.now()) / 1000);
      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, registeredEmail]);

  // ── OTP input handlers ─────────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    // Only allow single digits
    if (!/^\d*$/.test(value)) return;

    const newValues = [...otpValues]; // square bracket indicates we want a new array copy, not mutation and ... indicates we want to spread the existing values into the new array
    
    newValues[index] = value.slice(-1); // take only last char if pasted multiple
    setOtpValues(newValues);

    // Sync combined value to React Hook Form
    const combined = newValues.join("");
    setOtpValue("otp", combined, { shouldValidate: combined.length === 6 });

    // Auto-advance to next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    // On backspace with empty field, go back to previous input
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newValues = [...otpValues];
    pasted.split("").forEach((char, i) => {
      newValues[i] = char;
    });
    setOtpValues(newValues);
    setOtpValue("otp", pasted, { shouldValidate: pasted.length === 6 });
    // Focus the next empty box after paste
    const nextEmpty = pasted.length < 6 ? pasted.length : 5;
    otpRefs.current[nextEmpty]?.focus();
  };

  // ── Submit handlers ────────────────────────────────────────────────────────
  const onRegisterSubmit = (data: RegisterForm) => {
    // Destructure confirmPassword — backend doesn't expect it
    const { confirmPassword, ...apiData } = data;
    setRegisteredName(data.name);
    register_(apiData);
  };

  const onOtpSubmit = (data: OtpForm) => {
    verify({ email: registeredEmail, otp: data.otp });
  };

  const handleResend = () => {
    if (timeLeft > 0) return; // guard — button should be disabled anyway
    register_({
      name: registeredName,
      email: registeredEmail,
      phone: "", // these were already validated in step 1
      country: "",
      password: "",
    });
    // Note: in a real resend, backend only needs email to resend OTP
    // You might want a separate /seller-resend-otp endpoint later
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background atmosphere — layered gradients + grid */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-150 h-150 rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-125 h-125 rounded-full bg-amber-500/5 blur-[100px]" />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md">
        {/* Logo / back link */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
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

        {/* AnimatePresence handles the enter/exit animation when view changes */}
        {/* mode="wait" means old view exits completely before new view enters */}
        <AnimatePresence mode="wait">
          {view === "register" ? (
            // ── VIEW 1: REGISTRATION FORM ─────────────────────────────────
            <motion.div
              key="register"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-xl p-8"
            >
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <Building2 className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] tracking-widest uppercase text-emerald-400/70 font-medium">
                      Step 1 of 3
                    </p>
                    <h1 className="text-xl font-bold text-white">
                      Create Seller Account
                    </h1>
                  </div>
                </div>
                <p className="text-sm text-white/40">
                  Start selling on our platform today
                </p>
              </div>

              {/* Progress bar */}
              <div className="flex gap-1.5 mb-8">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                      s === 1
                        ? "bg-linear-to-r from-emerald-400 to-teal-400"
                        : "bg-white/10"
                    }`}
                  />
                ))}
              </div>

              <form
                onSubmit={handleSubmit(onRegisterSubmit)}
                className="space-y-4"
              >
                {/* Name */}
                <Field
                  label="Full Name"
                  icon={<User className="h-4 w-4" />}
                  error={errors.name?.message}
                >
                  <input
                    {...register("name")}
                    placeholder="John Doe"
                    className={inputClass(!!errors.name)}
                  />
                </Field>

                {/* Email */}
                <Field
                  label="Email Address"
                  icon={<Mail className="h-4 w-4" />}
                  error={errors.email?.message}
                >
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="john@example.com"
                    className={inputClass(!!errors.email)}
                  />
                </Field>

                {/* Phone + Country in a row */}
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Phone"
                    icon={<Phone className="h-4 w-4" />}
                    error={errors.phone?.message}
                  >
                    <input
                      {...register("phone")}
                      placeholder="+1 234 567"
                      className={inputClass(!!errors.phone)}
                    />
                  </Field>

                  <Field
                    label="Country"
                    icon={<Globe className="h-4 w-4" />}
                    error={errors.country?.message}
                  >
                    <select
                      {...register("country")}
                      className={`${inputClass(!!errors.country)} pr-8 appearance-none cursor-pointer`}
                    >
                      <option value="" className="bg-[#0f1523]">
                        Select
                      </option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c} className="bg-[#0f1523]">
                          {c}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                {/* Password */}
                <Field
                  label="Password"
                  icon={<Lock className="h-4 w-4" />}
                  error={errors.password?.message}
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                >
                  <input
                    {...register("password", {
                      onChange: (e) => setPasswordValue(e.target.value),
                    })}
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 8 characters"
                    className={inputClass(!!errors.password)}
                  />
                  {/* Password strength bar */}
                  {passwordValue && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{
                              backgroundColor:
                                i <= strength
                                  ? strengthColors[strength]
                                  : "rgba(255,255,255,0.1)",
                            }}
                          />
                        ))}
                      </div>
                      <p
                        className="text-[10px]"
                        style={{ color: strengthColors[strength] }}
                      >
                        {strengthLabels[strength]}
                      </p>
                    </div>
                  )}
                </Field>

                {/* Confirm Password */}
                <Field
                  label="Confirm Password"
                  icon={<Lock className="h-4 w-4" />}
                  error={errors.confirmPassword?.message}
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                >
                  <input
                    {...register("confirmPassword")}
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat password"
                    className={inputClass(!!errors.confirmPassword)}
                  />
                </Field>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="mt-2 w-full rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 py-3 text-sm font-bold text-black transition-all hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isRegistering ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                      Sending OTP...
                    </span>
                  ) : (
                    "Continue →"
                  )}
                </button>

                {/* Login link */}
                <p className="text-center text-sm text-white/30">
                  Already have an account?{" "}
                  <Link
                    href="/seller/login"
                    className="text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </form>
            </motion.div>
          ) : (
            // ── VIEW 2: OTP VERIFICATION ──────────────────────────────────
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-xl p-8"
            >
              {/* Back button — takes user back to register view with data intact */}
              <button
                onClick={() => setView("register")}
                className="mb-6 flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              {/* Header */}
              <div className="mb-8 text-center">
                {/* Mail icon with pulse ring */}
                <div className="mx-auto mb-4 relative w-fit">
                  <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <Mail className="h-6 w-6 text-emerald-400" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Check your email
                </h2>
                <p className="text-sm text-white/40">
                  We sent a 6-digit code to
                </p>
                {/* Email display with change option */}
                <div className="mt-1 flex items-center justify-center gap-2">
                  <span className="text-sm font-medium text-white/70">
                    {registeredEmail}
                  </span>
                  <button
                    onClick={() => setView("register")}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Change
                  </button>
                </div>
              </div>

              <form onSubmit={handleOtpSubmit(onOtpSubmit)}>
                {/* OTP boxes */}
                <div
                  className="flex gap-3 justify-center mb-6"
                  onPaste={handleOtpPaste}
                >
                  {otpValues.map((val, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={val}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`
                        h-12 w-12 rounded-xl border text-center text-lg font-bold
                        transition-all duration-200 outline-none bg-white/5
                        ${
                          val
                            ? "border-emerald-400/60 text-white shadow-[0_0_12px_rgba(52,211,153,0.15)]"
                            : "border-white/10 text-white/60"
                        }
                        focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10
                      `}
                    />
                  ))}
                </div>

                {/* Error message from RHF */}
                {otpErrors.otp && (
                  <p className="text-center text-xs text-red-400 mb-4">
                    {otpErrors.otp.message}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isVerifying || otpValues.join("").length < 6}
                  className="w-full rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 py-3 text-sm font-bold text-black transition-all hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isVerifying ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                      Verifying...
                    </span>
                  ) : (
                    "Verify & Create Account"
                  )}
                </button>

                {/* Resend */}
                <div className="mt-4 text-center">
                  {timeLeft > 0 ? (
                    <p className="text-sm text-white/30">
                      Resend code in{" "}
                      <span className="font-mono font-bold text-emerald-400">
                        {timeLeft}s
                      </span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isRegistering}
                      className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-40"
                    >
                      {isRegistering ? "Sending..." : "Resend code"}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────
// These are small enough to live in this file — no need for separate files
// Extract to separate files only when used in 3+ places

// Field wrapper — label + icon + input slot + error message
function Field({
  label,
  icon,
  error,
  suffix,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  error?: string;
  suffix?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-medium uppercase tracking-widest text-white/40">
        {label}
      </label>
      <div className="relative flex items-center">
        {/* Left icon */}
        <span className="absolute left-3 text-white/20 pointer-events-none">
          {icon}
        </span>
        {/* The actual input — passed as children */}
        <div className="w-full">{children}</div>
        {/* Right slot — e.g. show/hide password button */}
        {suffix && <span className="absolute right-3">{suffix}</span>}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// Base input className — centralized so changing styles updates all inputs
// Takes hasError boolean to conditionally add red border
function inputClass(hasError: boolean) {
  return `
    w-full rounded-xl border bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white
    placeholder:text-white/20 outline-none transition-all duration-200
    ${
      hasError
        ? "border-red-500/50 focus:border-red-500/70 focus:ring-2 focus:ring-red-500/10"
        : "border-white/10 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/10"
    }
  `;
}
