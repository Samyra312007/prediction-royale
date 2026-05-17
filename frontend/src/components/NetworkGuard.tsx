"use client";

import { useAccount, useChainId } from "wagmi";
import { switchChain } from "wagmi/actions";
import { config } from "@/app/wagmi";
import { TARGET_CHAIN_ID } from "@/lib/network";
import { motion } from "framer-motion";
import { ShieldIcon } from "./Icons";

export function NetworkGuard({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  if (!isConnected) return <>{children}</>;

  if (chainId !== TARGET_CHAIN_ID) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-mesh" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          className="relative w-full max-w-md rounded-2xl border border-surface-800 bg-surface-900/80 p-8 text-center shadow-2xl backdrop-blur-2xl"
        >
          <motion.div
            animate={{ rotate: [0, -12, 12, -12, 0] }}
            transition={{ duration: 1, delay: 0.3 }}
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10"
          >
            <ShieldIcon className="h-8 w-8 text-danger" />
          </motion.div>
          <h2 className="mb-2 font-display text-2xl font-bold text-white">
            Wrong Network
          </h2>
          <p className="mb-6 text-surface-400">
            Switch to{" "}
            <strong className="text-white">Arbitrum Sepolia</strong> to use this
            application.
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={async () => {
              try {
                await switchChain(config, { chainId: TARGET_CHAIN_ID });
              } catch {}
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-700/20 transition-colors hover:bg-primary-600"
          >
            <ShieldIcon className="h-4 w-4" />
            Switch Network
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
