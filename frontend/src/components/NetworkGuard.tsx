"use client";

import { useAccount, useChainId } from "wagmi";
import { TARGET_CHAIN_ID } from "@/lib/network";

export function NetworkGuard({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  if (!isConnected) return <>{children}</>;

  if (chainId !== TARGET_CHAIN_ID) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0F] flex items-center justify-center z-50">
        <div className="bg-[#12121A] p-8 rounded-xl border border-[#1E1E2E] text-center max-w-md">
          <p className="text-2xl mb-4">⚠️</p>
          <h2 className="text-xl font-bold mb-2">Wrong Network</h2>
          <p className="text-[#94A3B8] mb-6">
            Please switch to Arbitrum Sepolia to use this app.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
