"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { readContract } from "wagmi/actions";
import { motion } from "framer-motion";
import { config } from "../wagmi";
import { CONTRACT_ADDRESSES, GameFactoryABI } from "@/lib/contracts";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { SkeletonProfile } from "@/components/Skeleton";
import {
  TrophyIcon,
  UsersIcon,
  TargetIcon,
  LightningIcon,
  CrownIcon,
  CrosshairIcon,
} from "@/components/Icons";

interface PlayerRecord {
  id: number;
  wallet_address: string;
  games_played: number;
  wins: number;
  total_earned: string;
  created_at: string;
}

interface GameHistory {
  id: number;
  contract_address: string;
  stake_amount: string;
  max_players: number;
  state: number;
  created_at: string;
  prize_pool: string;
}

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const [player, setPlayer] = useState<PlayerRecord | null>(null);
  const [games, setGames] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!address) return;
    try {
      const [playerData, gamesData] = await Promise.all([
        supabase
          .from("players")
          .select("*")
          .eq("wallet_address", address.toLowerCase())
          .single(),
        supabase
          .from("games")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      if (playerData.data) setPlayer(playerData.data);

      const playerGames = gamesData.data?.filter(
        (g: any) =>
          g.creator_address?.toLowerCase() === address.toLowerCase()
      );
      setGames(playerGames || []);
    } catch (e) {
      console.error("loadProfile failed:", e);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (!isConnected) return;
    loadProfile();
  }, [isConnected, loadProfile]);

  if (!isConnected) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <UsersIcon className="mx-auto mb-4 h-12 w-12 text-primary-500" />
          <h1 className="mb-2 font-display text-2xl font-bold text-white">
            Connect Your Wallet
          </h1>
          <p className="text-surface-400">
            Connect to view your profile and stats
          </p>
        </motion.div>
      </main>
    );
  }

  const gamesPlayed = player?.games_played ?? games.length;
  const wins = player?.wins ?? 0;
  const winRate = gamesPlayed > 0 ? ((wins / gamesPlayed) * 100).toFixed(0) : "0";

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {loading ? (
          <SkeletonProfile />
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-2xl border border-surface-800 bg-gradient-to-b from-surface-900 to-surface-950 p-6"
            >
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-700/20">
                  <CrosshairIcon className="h-7 w-7 text-primary-400" />
                </div>
                <div>
                  <h1 className="font-display text-xl font-bold text-white">
                    Profile
                  </h1>
                  <p className="font-mono text-xs text-surface-500">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl bg-surface-950/50 p-4 text-center">
                  <UsersIcon className="mx-auto mb-2 h-5 w-5 text-cyber-400" />
                  <p className="font-display text-2xl font-bold text-white">
                    {gamesPlayed}
                  </p>
                  <p className="text-xs text-surface-500">Games</p>
                </div>
                <div className="rounded-xl bg-surface-950/50 p-4 text-center">
                  <CrownIcon className="mx-auto mb-2 h-5 w-5 text-success" />
                  <p className="font-display text-2xl font-bold text-white">
                    {wins}
                  </p>
                  <p className="text-xs text-surface-500">Wins</p>
                </div>
                <div className="rounded-xl bg-surface-950/50 p-4 text-center">
                  <TargetIcon className="mx-auto mb-2 h-5 w-5 text-warning" />
                  <p className="font-display text-2xl font-bold text-white">
                    {winRate}%
                  </p>
                  <p className="text-xs text-surface-500">Win Rate</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-surface-800 bg-surface-900 p-6"
            >
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-white">
                <TrophyIcon className="h-5 w-5 text-primary-400" />
                Game History
              </h2>

              {games.length === 0 ? (
                <div className="py-12 text-center">
                  <LightningIcon className="mx-auto mb-3 h-10 w-10 text-surface-600" />
                  <p className="text-surface-400">
                    No games played yet
                  </p>
                  <p className="mt-1 text-sm text-surface-600">
                    Join a lobby to get started!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {games.map((g, i) => (
                    <motion.div
                      key={g.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between rounded-xl bg-surface-950/50 p-3"
                    >
                      <div>
                        <p className="font-mono text-xs text-surface-500">
                          {g.contract_address.slice(0, 6)}...
                          {g.contract_address.slice(-4)}
                        </p>
                        <p className="text-xs text-surface-600">
                          {g.created_at
                            ? new Date(g.created_at).toLocaleDateString()
                            : "Recent"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-bold text-surface-300">
                          {g.prize_pool
                            ? (Number(g.prize_pool) / 1e18).toFixed(3)
                            : "0"}{" "}
                          ETH
                        </p>
                        <span
                          className={`text-xs ${
                            g.state === 2
                              ? "text-success"
                              : g.state === 1
                                ? "text-cyber-400"
                                : "text-surface-500"
                          }`}
                        >
                          {g.state === 2
                            ? "Completed"
                            : g.state === 1
                              ? "Active"
                              : "Open"}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </main>
  );
}
