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

  // isLoading alone is not enough.
  // In TanStack Query v5:
  // - isLoading = true means "query is currently fetching for the first time"
  // - BUT if the query hasn't been triggered yet, isLoading can be false
  //   while data is still undefined
  //
  // The safest check is:
  // isPending = query has no data yet (includes initial state)
  // We don't redirect until we KNOW the fetch is complete and failed
  const isFetching = isLoading || fetchStatus === "fetching";

  useEffect(() => {
    // CRITICAL: Don't do anything while fetch is in progress
    // This is the fix — wait until we have a definitive answer
    if (isFetching) return;

    // Now we know the fetch is complete
    // If error or no data → not authenticated
    if (isError || !seller) {
      router.replace("/seller/login");
      return;
    }

    // Seller exists but no shop yet
    if (!seller.shop && pathname !== "/seller/onboarding") {
      router.replace("/seller/onboarding");
      return;
    }

    // Seller has shop but no stripe
    if (
      seller.shop &&
      !seller.stripeId &&
      pathname !== "/seller/connect-stripe"
    ) {
      router.replace("/seller/connect-stripe");
      return;
    }
  }, [seller, isFetching, isError, router, pathname]);

  // Show skeleton while ANY fetching is happening
  if (isFetching) {
    return <LoadingSkeleton />;
  }

  // Fetch complete but no seller → render nothing (redirect is firing)
  if (isError || !seller) return null;

  // All good — render the protected page
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
