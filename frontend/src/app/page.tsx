"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <main className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#1E1E2E]">
        <h1 className="text-xl font-bold font-space text-[#7C3AED]">PMBR</h1>
        <ConnectButton />
      </nav>

      <section className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <h2 className="text-5xl md:text-7xl font-bold font-space mb-6 leading-tight">
          PREDICT.<br />
          COMPETE.<br />
          <span className="text-[#7C3AED]">SURVIVE.</span>
        </h2>
        <p className="text-lg md:text-xl text-[#94A3B8] max-w-2xl mb-10">
          100 players. One prize pool. Last one standing takes the pot.
          Can you outsmart the crowd?
        </p>
        {isConnected ? (
          <Link
            href="/lobby"
            className="px-8 py-4 bg-[#7C3AED] text-white rounded-xl text-lg font-semibold hover:bg-[#6D28D9] transition-colors animate-pulse-glow"
          >
            ENTER LOBBY
          </Link>
        ) : (
          <div className="text-[#94A3B8]">
            <p className="mb-4">Connect your wallet to start playing</p>
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button
                  onClick={openConnectModal}
                  className="px-8 py-4 bg-[#7C3AED] text-white rounded-xl text-lg font-semibold hover:bg-[#6D28D9] transition-colors"
                >
                  CONNECT WALLET
                </button>
              )}
            </ConnectButton.Custom>
          </div>
        )}

        <div className="flex gap-8 mt-16 text-center">
          <div className="p-4">
            <p className="text-2xl font-bold text-[#06B6D4]">0</p>
            <p className="text-sm text-[#94A3B8]">Live Players</p>
          </div>
          <div className="p-4">
            <p className="text-2xl font-bold text-[#06B6D4]">$0</p>
            <p className="text-sm text-[#94A3B8]">In Pools</p>
          </div>
          <div className="p-4">
            <p className="text-2xl font-bold text-[#06B6D4]">0</p>
            <p className="text-sm text-[#94A3B8]">Games Today</p>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-4 gap-6 max-w-3xl">
          {[
            ["1", "Join", "Connect wallet & stake ETH"],
            ["2", "Predict", "YES/NO on price moves"],
            ["3", "Survive", "Wrong answers eliminate you"],
            ["4", "Win", "Last one takes 70% of the pot"],
          ].map(([num, title, desc]) => (
            <div key={num} className="p-4 bg-[#12121A] rounded-xl border border-[#1E1E2E]">
              <p className="text-[#7C3AED] font-bold text-lg">{num}</p>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-[#94A3B8]">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
