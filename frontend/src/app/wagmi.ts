"use client";

import { http, createConfig } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export const config = getDefaultConfig({
  appName: "PMBR",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [arbitrumSepolia],
  transports: {
    [arbitrumSepolia.id]: http(
      process.env.NEXT_PUBLIC_ARB_SEPOLIA_RPC || "https://sepolia-rollup.arbitrum.io/rpc"
    ),
  },
  ssr: true,
});
