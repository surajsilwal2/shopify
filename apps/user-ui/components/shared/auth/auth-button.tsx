"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
}

export function AuthButton({
  loading,
  children,
  className,
  disabled,
  ...props
}: AuthButtonProps) {
  return (
    <button
      disabled={loading || disabled}
      className={cn(
        "w-full rounded-xl bg-linear-to-r from-amber-400 to-orange-500 px-6 py-3 text-sm font-bold tracking-wide text-black",
        "transition-all duration-200 hover:from-amber-300 hover:to-orange-400 hover:shadow-lg hover:shadow-amber-500/20",
        "active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        "flex items-center justify-center gap-2",
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
