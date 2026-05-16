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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md rounded-2xl border border-surface-800 bg-surface-900 p-8 text-center"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-danger/10"
          >
            <ShieldIcon className="h-8 w-8 text-danger" />
          </motion.div>
          <h2 className="mb-2 font-display text-2xl font-bold text-white">
            Wrong Network
          </h2>
          <p className="mb-6 text-surface-400">
            Please switch to <strong className="text-white">Arbitrum Sepolia</strong> to use this
            application.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={async () => {
              try {
                await switchChain(config, { chainId: TARGET_CHAIN_ID });
              } catch {
                // user rejected
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
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
