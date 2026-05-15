"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

export default function ProfilePage() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Connect Wallet</h1>
        <ConnectButton />
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <nav className="flex items-center justify-between mb-8">
        <Link href="/lobby" className="text-xl font-bold text-[#7C3AED]">PMBR</Link>
        <ConnectButton />
      </nav>

      <div className="max-w-2xl mx-auto">
        <div className="bg-[#12121A] p-6 rounded-xl border border-[#1E1E2E] mb-6">
          <h2 className="text-xl font-bold mb-2">Profile</h2>
          <p className="font-mono text-sm text-[#94A3B8] mb-4">{address}</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-[#06B6D4]">0</p>
              <p className="text-sm text-[#94A3B8]">Games</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#10B981]">0</p>
              <p className="text-sm text-[#94A3B8]">Wins</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#F59E0B]">0%</p>
              <p className="text-sm text-[#94A3B8]">Accuracy</p>
            </div>
          </div>
        </div>

        <div className="bg-[#12121A] p-6 rounded-xl border border-[#1E1E2E]">
          <h3 className="text-lg font-bold mb-4">Game History</h3>
          <p className="text-[#94A3B8] text-center py-8">
            No games played yet. Join a lobby to get started!
          </p>
        </div>
      </div>
    </main>
  );
}
