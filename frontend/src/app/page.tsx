"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CrosshairIcon,
  TrophyIcon,
  UsersIcon,
  LightningIcon,
  TargetIcon,
  SkullIcon,
  CrownIcon,
  ArrowRightIcon,
} from "@/components/Icons";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <main className="min-h-screen">
      <nav className="sticky top-0 z-40 border-b border-surface-800 bg-surface-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <CrosshairIcon className="h-6 w-6 text-primary-500" />
            <span className="font-display text-xl font-bold tracking-tight text-white">
              PMBR
            </span>
          </div>
          <div className="flex items-center gap-4">
            {isConnected && (
              <Link
                href="/lobby"
                className="hidden text-sm font-medium text-surface-400 transition-colors hover:text-surface-200 sm:block"
              >
                Lobby
              </Link>
            )}
            <ConnectButton
              accountStatus={{
                smallScreen: "avatar",
                largeScreen: "full",
              }}
              showBalance={{ smallScreen: false, largeScreen: false }}
            />
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden px-4 pb-20 pt-20 sm:pt-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-950/40 via-transparent to-transparent" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-[600px] w-[600px] rounded-full bg-primary-700/10 blur-[120px]" />
        </div>

        <motion.div
          initial="initial"
          animate="animate"
          variants={stagger}
          className="relative mx-auto max-w-4xl text-center"
        >
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mb-4"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-700/30 bg-primary-700/10 px-3 py-1 text-xs font-medium text-primary-400">
              <LightningIcon className="h-3 w-3" />
              Now Live on Arbitrum Sepolia
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-5xl font-bold leading-tight tracking-tight sm:text-7xl md:text-8xl"
          >
            PREDICT.
            <br />
            COMPETE.
            <br />
            <span className="bg-gradient-to-r from-primary-400 to-cyber-400 bg-clip-text text-transparent">
              SURVIVE.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-surface-400 sm:text-xl"
          >
            100 players. One prize pool. Last one standing takes the pot.
            Predict BTC price moves, survive elimination rounds, and win big.
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10"
          >
            {isConnected ? (
              <Link
                href="/lobby"
                className="group inline-flex items-center gap-2 rounded-2xl bg-primary-700 px-8 py-4 font-display text-lg font-bold text-white shadow-lg shadow-primary-700/30 transition-all hover:bg-primary-600 hover:shadow-xl hover:shadow-primary-700/40"
              >
                ENTER LOBBY
                <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openConnectModal}
                    className="animate-pulse-glow inline-flex items-center gap-2 rounded-2xl bg-primary-700 px-8 py-4 font-display text-lg font-bold text-white shadow-lg shadow-primary-700/30 transition-all hover:bg-primary-600 hover:shadow-xl hover:shadow-primary-700/40"
                  >
                    <LightningIcon className="h-5 w-5" />
                    CONNECT WALLET
                  </motion.button>
                )}
              </ConnectButton.Custom>
            )}
          </motion.div>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 flex justify-center gap-8 sm:gap-16"
          >
            {[
              { icon: UsersIcon, value: "100", label: "Players" },
              { icon: TrophyIcon, value: "70%", label: "To Winner" },
              { icon: LightningIcon, value: "30s", label: "Per Round" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="mx-auto mb-2 h-5 w-5 text-cyber-400" />
                <p className="font-display text-2xl font-bold text-white sm:text-3xl">
                  {stat.value}
                </p>
                <p className="text-xs text-surface-500 sm:text-sm">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      <section className="border-t border-surface-800 px-4 py-20">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="mx-auto max-w-6xl"
        >
          <motion.h2
            variants={fadeUp}
            className="mb-12 text-center font-display text-3xl font-bold tracking-tight sm:text-4xl"
          >
            How It Works
          </motion.h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: WalletIcon,
                title: "Join",
                desc: "Connect your wallet & stake ETH to enter a lobby",
                color: "text-primary-400",
                bg: "bg-primary-700/10",
              },
              {
                icon: TargetIcon,
                title: "Predict",
                desc: "Vote YES or NO on BTC price movements each round",
                color: "text-cyber-400",
                bg: "bg-cyber-400/10",
              },
              {
                icon: SkullIcon,
                title: "Survive",
                desc: "Wrong answers eliminate you. Last player wins.",
                color: "text-danger",
                bg: "bg-danger/10",
              },
              {
                icon: CrownIcon,
                title: "Win",
                desc: "Take 70% of the prize pool as champion",
                color: "text-warning",
                bg: "bg-warning/10",
              },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                variants={fadeUp}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group relative rounded-2xl border border-surface-800 bg-surface-900 p-6 transition-colors hover:border-surface-700"
              >
                <div
                  className={`mb-4 inline-flex rounded-xl ${step.bg} p-3 ${step.color}`}
                >
                  <step.icon className="h-6 w-6" />
                </div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-bold text-surface-500">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mb-1.5 font-display text-lg font-bold text-white">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-surface-400">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="border-t border-surface-800 px-4 py-20">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={stagger}
          className="mx-auto max-w-4xl text-center"
        >
          <motion.h2
            variants={fadeUp}
            className="mb-4 font-display text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Prize Distribution
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mb-12 text-surface-400"
          >
            Rewards for the sharpest predictors
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="grid gap-4 sm:grid-cols-3"
          >
            {[
              { place: "1st", pct: "70%", color: "text-warning", icon: CrownIcon },
              { place: "2nd", pct: "20%", color: "text-surface-300", icon: TrophyIcon },
              { place: "3rd", pct: "10%", color: "text-warning/70", icon: TrophyIcon },
            ].map((prize) => (
              <div
                key={prize.place}
                className="rounded-2xl border border-surface-800 bg-surface-900 p-6"
              >
                <prize.icon
                  className={`mx-auto mb-3 h-8 w-8 ${prize.color}`}
                />
                <p className="font-display text-3xl font-bold text-white">
                  {prize.pct}
                </p>
                <p className="text-sm text-surface-400">{prize.place} Place</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      <footer className="border-t border-surface-800 px-4 py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <p className="text-sm text-surface-600">
            &copy; 2026 PMBR. Built on Arbitrum.
          </p>
          <p className="text-xs text-surface-700">Predict. Compete. Survive.</p>
        </div>
      </footer>
    </main>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}
