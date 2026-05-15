"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { config } from "./wagmi";
import { NetworkGuard } from "@/components/NetworkGuard";
import { ToastContainer } from "@/components/Toast";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider coolMode>
          <NetworkGuard>
            {children}
          </NetworkGuard>
          <ToastContainer />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
