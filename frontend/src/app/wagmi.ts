"use client";

import { http, fallback } from "wagmi";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

const RPC_1 = process.env.NEXT_PUBLIC_ARB_SEPOLIA_RPC || "https://sepolia-rollup.arbitrum.io/rpc";
const RPC_2 = "https://arbitrum-sepolia.publicnode.com";

export const arbitrumSepolia = {
  id: 421614,
  name: "Arbitrum Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_1, RPC_2] },
  },
  blockExplorers: {
    default: { name: "Arbiscan", url: "https://sepolia.arbiscan.io" },
  },
  testnet: true,
} as const;

export const config = getDefaultConfig({
  appName: "PMBR",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [arbitrumSepolia],
  transports: {
    [arbitrumSepolia.id]: fallback([http(RPC_1), http(RPC_2)]),
  },
  ssr: true,
});
