"use client";

import { useSellerMe } from "@/hooks/seller-hook";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SellerGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: seller, isLoading, isError, fetchStatus } = useSellerMe();
  const router = useRouter();
  const pathname = usePathname();

  const isFetching = isLoading || fetchStatus === "fetching";

  useEffect(() => {
    if (isFetching) return;

    // Not logged in
    if (isError || !seller) {
      router.replace("/seller/login");
      return;
    }

    // Must create shop first
    if (!seller.shop && pathname !== "/seller/onboarding") {
      router.replace("/seller/onboarding");
      return;
    }

    // If already has shop and visits onboarding manually
    if (seller.shop && pathname === "/seller/onboarding") {
      router.replace("/seller/dashboard");
      return;
    }

    // NO forced stripe redirect anymore
  }, [seller, isFetching, isError, pathname, router]);

  if (isFetching) return <LoadingSkeleton />;
  if (isError || !seller) return null;

  return <>{children}</>;
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center">
      <div className="space-y-4 w-full max-w-md px-4">
        <div className="h-8 rounded-xl bg-white/5 animate-pulse" />
        <div className="h-8 rounded-xl bg-white/5 animate-pulse w-3/4" />
        <div className="h-48 rounded-2xl bg-white/5 animate-pulse mt-8" />
      </div>
    </div>
  );
}
