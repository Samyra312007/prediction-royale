"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { readContract, writeContract, waitForTransactionReceipt } from "wagmi/actions";
import { config } from "../wagmi";
import { CONTRACT_ADDRESSES, GameFactoryABI, GameLobbyABI, CHAINLINK_FEEDS } from "@/lib/contracts";
import { Navbar } from "@/components/Navbar";
import { SkeletonList } from "@/components/Skeleton";
import { showToast } from "@/components/Toast";
import {
  TrophyIcon,
  UsersIcon,
  LightningIcon,
  TargetIcon,
  CrosshairIcon,
  XIcon,
  ArrowRightIcon,
  FlameIcon,
} from "@/components/Icons";

interface LobbyData {
  address: `0x${string}`;
  stakeAmount: bigint;
  maxPlayers: number;
  playerCount: number;
  roundCount: number;
  eliminationPercent: number;
  state: number;
  prizePool: bigint;
}

function LobbyCard({
  lobby,
  onJoin,
  isJoining,
}: {
  lobby: LobbyData;
  onJoin: () => void;
  isJoining: boolean;
}) {
  const poolEth = Number(lobby.prizePool) / 1e18;
  const stakeEth = Number(lobby.stakeAmount) / 1e18;
  const fill = lobby.playerCount / lobby.maxPlayers;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", bounce: 0.15 }}
      className="group relative overflow-hidden rounded-2xl border border-surface-800/60 bg-surface-900/40 p-5 backdrop-blur-sm transition-all hover:border-primary-700/40 hover:shadow-lg hover:shadow-primary-700/5"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary-700/5 blur-2xl transition-all group-hover:bg-primary-700/10" />

      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <TargetIcon className="h-4 w-4 text-primary-400" />
            <span className="font-mono text-xs text-surface-500">
              {lobby.address.slice(0, 6)}...{lobby.address.slice(-4)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {lobby.state === 0 ? (
              <>
                <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
                <span className="text-xs font-medium text-success">Open</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-warning" />
                <span className="text-xs font-medium text-warning">In Progress</span>
              </>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-bold text-white">
            {stakeEth.toFixed(3)}
            <span className="ml-1 text-sm font-normal text-surface-400">ETH</span>
          </p>
          <p className="text-xs text-surface-500">stake</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-surface-950/50 p-3 text-center">
          <UsersIcon className="mx-auto mb-1 h-4 w-4 text-cyber-400" />
          <p className="font-mono text-sm font-bold text-white">
            {lobby.playerCount}/{lobby.maxPlayers}
          </p>
          <p className="text-[10px] text-surface-500">Players</p>
        </div>
        <div className="rounded-xl bg-surface-950/50 p-3 text-center">
          <LightningIcon className="mx-auto mb-1 h-4 w-4 text-warning" />
          <p className="font-mono text-sm font-bold text-white">{lobby.roundCount}</p>
          <p className="text-[10px] text-surface-500">Rounds</p>
        </div>
        <div className="rounded-xl bg-surface-950/50 p-3 text-center">
          <TrophyIcon className="mx-auto mb-1 h-4 w-4 text-primary-400" />
          <p className="font-mono text-sm font-bold text-white">
            {poolEth.toFixed(3)}
          </p>
          <p className="text-[10px] text-surface-500">Pool</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-surface-500">
          <span>Capacity</span>
          <span>{Math.round(fill * 100)}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${fill * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-primary-700 to-cyber-400"
          />
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onJoin}
        disabled={isJoining || lobby.playerCount >= lobby.maxPlayers}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-primary-600 to-primary-700 py-2.5 font-semibold text-white shadow-lg shadow-primary-700/15 transition-all hover:from-primary-500 hover:to-primary-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isJoining ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
          />
        ) : lobby.playerCount >= lobby.maxPlayers ? (
          "Full"
        ) : (
          <>
            JOIN GAME
            <ArrowRightIcon className="h-4 w-4" />
          </>
        )}
      </motion.button>
    </motion.div>
  );
}

export default function LobbyPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [lobbies, setLobbies] = useState<LobbyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    stake: "0.01",
    maxPlayers: "10",
    rounds: "5",
    elimPercent: "20",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isConnected) return;
    loadLobbies();
    const interval = setInterval(loadLobbies, 8000);
    return () => clearInterval(interval);
  }, [isConnected]);

  async function loadLobbies() {
    try {
      const addrs = (await readContract(config, {
        address: CONTRACT_ADDRESSES.gameFactory,
        abi: GameFactoryABI,
        functionName: "getActiveGames",
      })) as `0x${string}`[];

      const lobbyData = await Promise.all(
        addrs.map(async (addr) => {
          const [stakeAmount, maxPlayers, roundCount, eliminationPercent, state, prizePool] =
            await Promise.all([
              readContract(config, { address: addr, abi: GameLobbyABI, functionName: "stakeAmount" }),
              readContract(config, { address: addr, abi: GameLobbyABI, functionName: "maxPlayers" }),
              readContract(config, { address: addr, abi: GameLobbyABI, functionName: "roundCount" }),
              readContract(config, { address: addr, abi: GameLobbyABI, functionName: "eliminationPercent" }),
              readContract(config, { address: addr, abi: GameLobbyABI, functionName: "state" }),
              readContract(config, { address: addr, abi: GameLobbyABI, functionName: "prizePool" }),
            ]);
          const players = (await readContract(config, {
            address: addr, abi: GameLobbyABI, functionName: "getPlayers",
          })) as `0x${string}`[];

          return {
            address: addr, stakeAmount: stakeAmount as bigint,
            maxPlayers: Number(maxPlayers), playerCount: players.length,
            roundCount: Number(roundCount), eliminationPercent: Number(eliminationPercent),
            state: Number(state), prizePool: prizePool as bigint,
          };
        })
      );
      setLobbies(lobbyData.filter((l) => l.state === 0 || l.state === 1));
    } catch (e) {
      console.error("loadLobbies failed:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!address || creating) return;
    setCreating(true);
    try {
      showToast("Creating game lobby...", "pending");
      const hash = await writeContract(config, {
        address: CONTRACT_ADDRESSES.gameFactory,
        abi: GameFactoryABI,
        functionName: "createGame",
        args: [
          BigInt(parseFloat(createForm.stake) * 1e18),
          BigInt(createForm.maxPlayers),
          BigInt(createForm.rounds),
          BigInt(createForm.elimPercent),
          CHAINLINK_FEEDS.btcUsd,
        ],
      });
      await waitForTransactionReceipt(config, { hash });
      showToast("Lobby created!", "success");
      setShowCreate(false);
      loadLobbies();
    } catch (e) {
      showToast("Failed to create lobby", "error");
      console.error("createGame failed:", e);
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(lobby: LobbyData) {
    if (!address || joining) return;
    setJoining(lobby.address);
    try {
      showToast("Joining game...", "pending");
      const hash = await writeContract(config, {
        address: lobby.address,
        abi: GameLobbyABI,
        functionName: "joinGame",
        value: lobby.stakeAmount,
      });
      await waitForTransactionReceipt(config, { hash });
      showToast("Joined! Redirecting...", "success");
      router.push(`/game/${lobby.address}`);
    } catch (e) {
      showToast("Failed to join game", "error");
      console.error("joinGame failed:", e);
    } finally {
      setJoining(null);
    }
  }

  if (!isConnected) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="pointer-events-none fixed inset-0 bg-mesh" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", bounce: 0.2 }}
          className="relative text-center"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <CrosshairIcon className="mx-auto mb-4 h-14 w-14 text-primary-500" />
          </motion.div>
          <h1 className="mb-2 font-display text-2xl font-bold text-white">
            Connect Your Wallet
          </h1>
          <p className="text-surface-400">Connect to browse lobbies and join games</p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 bg-mesh" />
      <Navbar />
      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl"
            >
              Game Lobbies
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="mt-1 text-sm text-surface-400"
            >
              {loading
                ? "Loading lobbies..."
                : `${lobbies.length} active lobby${lobbies.length !== 1 ? "ies" : "y"}`}
            </motion.p>
          </div>
          <motion.button
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-primary-600 to-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-700/20 transition-all hover:from-primary-500 hover:to-primary-600"
          >
            <CrosshairIcon className="h-4 w-4" />
            Create Lobby
          </motion.button>
        </div>

        {loading ? (
          <SkeletonList count={4} />
        ) : lobbies.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-surface-800/60 bg-surface-900/40 py-20 text-center backdrop-blur-sm"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <TargetIcon className="mx-auto mb-4 h-14 w-14 text-surface-600" />
            </motion.div>
            <p className="mb-2 text-lg font-medium text-surface-300">No active lobbies</p>
            <p className="mb-6 text-sm text-surface-500">Create one to start playing!</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-primary-600 to-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-700/20 transition-all hover:from-primary-500 hover:to-primary-600"
            >
              <FlameIcon className="h-4 w-4" />
              Create Your First Lobby
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <AnimatePresence>
              {lobbies.map((lobby) => (
                <LobbyCard
                  key={lobby.address}
                  lobby={lobby}
                  onJoin={() => handleJoin(lobby)}
                  isJoining={joining === lobby.address}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", bounce: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-surface-800/60 bg-surface-900/80 p-6 shadow-2xl backdrop-blur-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-white">Create Lobby</h2>
                <motion.button
                  whileHover={{ rotate: 90 }}
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg p-1.5 text-surface-500 transition-colors hover:bg-surface-800 hover:text-surface-300"
                >
                  <XIcon className="h-5 w-5" />
                </motion.button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-surface-300">
                    Stake Amount (ETH)
                  </label>
                  <input
                    type="number"
                    value={createForm.stake}
                    onChange={(e) => setCreateForm({ ...createForm, stake: e.target.value })}
                    step="0.001"
                    min="0.001"
                    className="w-full rounded-xl border border-surface-800 bg-surface-950/50 px-4 py-2.5 text-sm text-white placeholder-surface-600 backdrop-blur-sm transition-colors focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
                    placeholder="0.01"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-surface-300">
                    Max Players
                  </label>
                  <select
                    value={createForm.maxPlayers}
                    onChange={(e) => setCreateForm({ ...createForm, maxPlayers: e.target.value })}
                    className="w-full rounded-xl border border-surface-800 bg-surface-950/50 px-4 py-2.5 text-sm text-white backdrop-blur-sm transition-colors focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
                  >
                    {[5, 10, 25, 50, 100].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-surface-300">
                    Rounds
                  </label>
                  <select
                    value={createForm.rounds}
                    onChange={(e) => setCreateForm({ ...createForm, rounds: e.target.value })}
                    className="w-full rounded-xl border border-surface-800 bg-surface-950/50 px-4 py-2.5 text-sm text-white backdrop-blur-sm transition-colors focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
                  >
                    {[3, 5, 10].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCreate}
                    disabled={creating}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-primary-600 to-primary-700 py-2.5 font-semibold text-white shadow-lg shadow-primary-700/15 transition-all hover:from-primary-500 hover:to-primary-600 disabled:opacity-50"
                  >
                    {creating ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                      />
                    ) : (
                      "Create"
                    )}
                  </motion.button>
                  <button
                    onClick={() => setShowCreate(false)}
                    className="flex-1 rounded-xl bg-surface-800 py-2.5 font-semibold text-surface-300 transition-colors hover:bg-surface-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
