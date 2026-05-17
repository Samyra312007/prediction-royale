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
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

function FloatingOrb({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 4, delay, repeat: Infinity, ease: "easeInOut" }}
      className={`absolute rounded-full blur-3xl ${className}`}
    />
  );
}

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 bg-mesh" />

      <nav className="relative z-40 mx-4 mt-4 sm:mx-6">
        <div className="glass-strong mx-auto flex h-14 max-w-7xl items-center justify-between rounded-2xl px-4 sm:px-5">
          <div className="flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-700/20"
            >
              <CrosshairIcon className="h-4 w-4 text-primary-400" />
            </motion.div>
            <span className="font-display text-lg font-bold tracking-tight text-white">
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
              accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
              showBalance={{ smallScreen: false, largeScreen: false }}
            />
          </div>
        </div>
      </nav>

      <section className="relative px-4 pb-20 pt-16 sm:pt-24">
        <FloatingOrb className="-left-32 -top-32 h-96 w-96 bg-primary-700/20" />
        <FloatingOrb className="-right-32 top-1/2 h-80 w-80 bg-cyber-500/10" delay={1.5} />
        <FloatingOrb className="bottom-0 left-1/2 h-64 w-64 bg-primary-500/10" delay={3} />

        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-[500px] w-[500px] animate-spin-slow rounded-full bg-gradient-to-br from-primary-700/10 via-transparent to-cyber-500/5 blur-[100px]" />
        </div>

        <motion.div
          initial="initial"
          animate="animate"
          variants={stagger}
          className="relative mx-auto max-w-4xl text-center"
        >
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mb-5"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-700/30 bg-primary-700/10 px-3 py-1 text-xs font-medium text-primary-400 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-400" />
              Now Live on Arbitrum Sepolia
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-5xl font-bold leading-[0.95] tracking-tight sm:text-7xl md:text-8xl"
          >
            PREDICT.
            <br />
            COMPETE.
            <br />
            <span className="text-gradient">SURVIVE.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-surface-400 sm:text-lg"
          >
            100 players. One prize pool. Last one standing takes the pot.
            Predict BTC price moves, survive elimination rounds, and win big.
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10"
          >
            {isConnected ? (
              <Link
                href="/lobby"
                className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-b from-primary-600 to-primary-700 px-8 py-4 font-display text-lg font-bold text-white shadow-lg shadow-primary-700/30 transition-all hover:from-primary-500 hover:to-primary-600 hover:shadow-xl hover:shadow-primary-700/40 hover:brightness-110"
              >
                ENTER LOBBY
                <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={openConnectModal}
                    className="animate-pulse-glow inline-flex items-center gap-2 rounded-2xl bg-gradient-to-b from-primary-600 to-primary-700 px-8 py-4 font-display text-lg font-bold text-white shadow-lg shadow-primary-700/30 transition-all hover:from-primary-500 hover:to-primary-600 hover:brightness-110"
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
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-16 flex justify-center gap-6 sm:gap-12"
          >
            {[
              { icon: UsersIcon, value: "100", label: "Players" },
              { icon: TrophyIcon, value: "70%", label: "To Winner" },
              { icon: LightningIcon, value: "30s", label: "Per Round" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                whileHover={{ y: -2 }}
                className="rounded-2xl border border-surface-800/60 bg-surface-900/40 px-6 py-4 backdrop-blur-sm transition-colors hover:border-surface-700"
              >
                <stat.icon className="mx-auto mb-2 h-5 w-5 text-cyber-400" />
                <p className="font-display text-2xl font-bold text-white sm:text-3xl">
                  {stat.value}
                </p>
                <p className="text-xs text-surface-500 sm:text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      <section className="relative px-4 py-20">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="mx-auto max-w-6xl"
        >
          <motion.h2
            variants={fadeUp}
            className="mb-4 text-center font-display text-3xl font-bold tracking-tight sm:text-4xl"
          >
            How It Works
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mb-12 text-center text-surface-400"
          >
            Four simple steps to glory
          </motion.p>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: WalletIcon,
                title: "Join",
                desc: "Connect your wallet & stake ETH to enter a lobby",
                color: "text-primary-400",
                bg: "bg-primary-500/10",
                border: "border-primary-500/20",
              },
              {
                icon: TargetIcon,
                title: "Predict",
                desc: "Vote YES or NO on BTC price movements each round",
                color: "text-cyber-400",
                bg: "bg-cyber-500/10",
                border: "border-cyber-500/20",
              },
              {
                icon: SkullIcon,
                title: "Survive",
                desc: "Wrong answers eliminate you. Last player wins.",
                color: "text-danger",
                bg: "bg-danger/10",
                border: "border-danger/20",
              },
              {
                icon: CrownIcon,
                title: "Win",
                desc: "Take 70% of the prize pool as champion",
                color: "text-warning",
                bg: "bg-warning/10",
                border: "border-warning/20",
              },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                variants={fadeUp}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className={`group relative overflow-hidden rounded-2xl border ${step.border} ${step.bg} p-6 transition-all duration-300 hover:shadow-lg`}
              >
                <div
                  className={`mb-4 inline-flex rounded-xl ${step.bg} p-3 ${step.color}`}
                >
                  <step.icon className="h-6 w-6" />
                </div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-bold text-surface-600">
                    STEP 0{i + 1}
                  </span>
                </div>
                <h3 className="mb-1.5 font-display text-lg font-bold text-white">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-surface-400">
                  {step.desc}
                </p>
                <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-white/5 blur-xl transition-all group-hover:bg-white/10" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="relative px-4 py-20">
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
          <motion.p variants={fadeUp} className="mb-12 text-surface-400">
            Rewards for the sharpest predictors
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="grid gap-4 sm:grid-cols-3"
          >
            {[
              {
                place: "1st",
                pct: "70%",
                color: "text-warning",
                icon: CrownIcon,
                gradient: "from-warning/10 to-transparent",
                border: "border-warning/20",
              },
              {
                place: "2nd",
                pct: "20%",
                color: "text-surface-300",
                icon: TrophyIcon,
                gradient: "from-surface-500/10 to-transparent",
                border: "border-surface-700",
              },
              {
                place: "3rd",
                pct: "10%",
                color: "text-warning/70",
                icon: TrophyIcon,
                gradient: "from-warning/5 to-transparent",
                border: "border-surface-700/60",
              },
            ].map((prize) => (
              <motion.div
                key={prize.place}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`rounded-2xl border ${prize.border} bg-gradient-to-b ${prize.gradient} bg-surface-900/40 p-6 backdrop-blur-sm transition-all`}
              >
                <prize.icon className={`mx-auto mb-3 h-8 w-8 ${prize.color}`} />
                <p className="font-display text-3xl font-bold text-white">
                  {prize.pct}
                </p>
                <p className="text-sm text-surface-400">{prize.place} Place</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      <footer className="relative border-t border-surface-800/50 px-4 py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <p className="text-sm text-surface-600">&copy; 2026 PMBR. Built on Arbitrum.</p>
          <p className="text-xs text-surface-700">Predict. Compete. Survive.</p>
        </div>
      </footer>
    </main>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}
