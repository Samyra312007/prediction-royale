"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import {
  readContract,
  writeContract,
  watchContractEvent,
  waitForTransactionReceipt,
} from "wagmi/actions";
import { motion, AnimatePresence } from "framer-motion";
import { config } from "../../wagmi";
import GameLobbyABI from "@/lib/abi/GameLobby.json";
import { Navbar } from "@/components/Navbar";
import { CountdownTimer } from "@/components/CountdownTimer";
import { PredictionButtons } from "@/components/PredictionButtons";
import { ShareButton } from "@/components/ShareButton";
import { SkeletonGameRound, SkeletonLeaderboard } from "@/components/Skeleton";
import { showToast } from "@/components/Toast";
import {
  generateSalt,
  computeCommitment,
  storeSalt,
  storeValue,
  getStoredSalt,
  getStoredValue,
} from "@/lib/commitReveal";
import { useBTCPrice } from "@/hooks/useBTCPrice";
import {
  TrophyIcon,
  CrownIcon,
  SkullIcon,
  TargetIcon,
  LightningIcon,
  UsersIcon,
  CheckIcon,
  ClockIcon,
} from "@/components/Icons";

type GameState =
  | "waiting"
  | "committing"
  | "revealing"
  | "resolving"
  | "eliminated"
  | "completed";

function GameStatusBadge({ gameState }: { gameState: GameState }) {
  const config: Record<GameState, { label: string; color: string; bg: string; dot: string }> = {
    waiting: { label: "Waiting", color: "text-warning", bg: "bg-warning/10", dot: "bg-warning" },
    committing: { label: "Committing", color: "text-cyber-400", bg: "bg-cyber-500/10", dot: "bg-cyber-400" },
    revealing: { label: "Revealing", color: "text-primary-400", bg: "bg-primary-500/10", dot: "bg-primary-400" },
    resolving: { label: "Resolving", color: "text-warning", bg: "bg-warning/10", dot: "bg-warning" },
    eliminated: { label: "Eliminated", color: "text-danger", bg: "bg-danger/10", dot: "bg-danger" },
    completed: { label: "Completed", color: "text-success", bg: "bg-success/10", dot: "bg-success" },
  };
  const c = config[gameState];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${c.bg} ${c.color} backdrop-blur-sm`}>
      <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

export default function GamePage() {
  const params = useParams();
  const gameAddress = params.id as `0x${string}`;
  const { address, isConnected } = useAccount();

  const [gameState, setGameState] = useState<GameState>("waiting");
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [players, setPlayers] = useState<`0x${string}`[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [isEliminated, setIsEliminated] = useState(false);
  const [committed, setCommitted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [roundEndTime, setRoundEndTime] = useState(0);
  const [resolvedValue, setResolvedValue] = useState(0);
  const [winner, setWinner] = useState<`0x${string}` | null>(null);
  const [prizePool, setPrizePool] = useState(0n);
  const [stakeAmount, setStakeAmount] = useState(0n);
  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(true);

  const { formattedPrice, change24h, isLoading: priceLoading } = useBTCPrice();

  const btcPrice = formattedPrice;
  const btcChange = change24h;
  const questionText = currentRound > 0
    ? `Will BTC/USD go UP or DOWN from $${btcPrice}?`
    : "Will BTC/USD go UP or DOWN in the next 5 minutes?";

  const loadPlayers = useCallback(async () => {
    try {
      const p = (await readContract(config, {
        address: gameAddress, abi: GameLobbyABI, functionName: "getPlayers",
      })) as `0x${string}`[];
      setPlayers(p);
      const scoreMap: Record<string, number> = {};
      for (const player of p) {
        const s = await readContract(config, {
          address: gameAddress, abi: GameLobbyABI, functionName: "scores", args: [player],
        });
        scoreMap[player] = Number(s);
      }
      setScores(scoreMap);
    } catch (e) {
      console.error("loadPlayers failed:", e);
    }
  }, [gameAddress]);

  const loadGameData = useCallback(async () => {
    try {
      const [state, stake, rCount, pool] = await Promise.all([
        readContract(config, { address: gameAddress, abi: GameLobbyABI, functionName: "state" }),
        readContract(config, { address: gameAddress, abi: GameLobbyABI, functionName: "stakeAmount" }),
        readContract(config, { address: gameAddress, abi: GameLobbyABI, functionName: "roundCount" }),
        readContract(config, { address: gameAddress, abi: GameLobbyABI, functionName: "prizePool" }),
      ]);
      setTotalRounds(Number(rCount));
      setPrizePool(pool as bigint);
      setStakeAmount(stake as bigint);
      const stateNum = Number(state);
      if (stateNum === 2) setGameState("completed");
      else if (stateNum === 3) setGameState("waiting");
      await loadPlayers();
    } catch (e) {
      console.error("loadGameData failed:", e);
    } finally {
      setLoading(false);
    }
  }, [gameAddress, loadPlayers]);

  useEffect(() => {
    if (!isConnected) return;
    loadGameData();
  }, [isConnected, loadGameData]);

  useEffect(() => {
    if (!address) return;
    const unsubs: (() => void)[] = [];

    unsubs.push(
      watchContractEvent(config, {
        address: gameAddress, abi: GameLobbyABI, eventName: "RoundStarted",
        onLogs(logs) {
          const log = logs[0] as any;
          if (log?.args) {
            setCurrentRound(Number(log.args.roundId));
            setCommitted(false); setRevealed(false);
            setGameState("committing");
            setRoundEndTime(Math.floor(Date.now() / 1000) + 30);
          }
        },
      })
    );
    unsubs.push(
      watchContractEvent(config, {
        address: gameAddress, abi: GameLobbyABI, eventName: "RoundResolved",
        onLogs(logs) {
          const log = logs[0] as any;
          if (log?.args) {
            setResolvedValue(Number(log.args.result));
            setGameState("resolving");
          }
        },
      })
    );
    unsubs.push(
      watchContractEvent(config, {
        address: gameAddress, abi: GameLobbyABI, eventName: "PlayerEliminated",
        onLogs(logs) {
          const log = logs[0] as any;
          if (log?.args?.player === address) {
            setIsEliminated(true);
            setGameState("eliminated");
          }
          loadPlayers();
        },
      })
    );
    unsubs.push(
      watchContractEvent(config, {
        address: gameAddress, abi: GameLobbyABI, eventName: "GameCompleted",
        onLogs(logs) {
          const log = logs[0] as any;
          if (log?.args) {
            setWinner(log.args.winner as `0x${string}`);
            setGameState("completed");
          }
        },
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [gameAddress, address, loadPlayers]);

  async function handlePredict(direction: "yes" | "no") {
    if (!address || !currentRound) return;
    const salt = generateSalt();
    const saltWithPrefix = `0x${salt}` as `0x${string}`;
    const targetVal = 100n;
    storeSalt(gameAddress, currentRound, address, salt);
    storeValue(gameAddress, currentRound, address, direction === "yes" ? "1" : "0");
    const commitment = computeCommitment(targetVal, saltWithPrefix, address);
    try {
      showToast("Locking in your prediction...", "pending");
      const hash = await writeContract(config, {
        address: gameAddress, abi: GameLobbyABI,
        functionName: "submitCommitment", args: [commitment],
      });
      await waitForTransactionReceipt(config, { hash });
      setCommitted(true);
      showToast("Prediction locked! 🔒", "success");
    } catch (e) {
      showToast("Failed to submit prediction", "error");
      console.error("commit failed:", e);
    }
  }

  async function handleReveal() {
    if (!address || !currentRound || revealing) return;
    const salt = getStoredSalt(gameAddress, currentRound, address);
    const val = getStoredValue(gameAddress, currentRound, address);
    if (!salt || !val) {
      showToast("Missing stored prediction data", "error");
      return;
    }
    setRevealing(true);
    try {
      showToast("Revealing prediction...", "pending");
      const hash = await writeContract(config, {
        address: gameAddress, abi: GameLobbyABI,
        functionName: "revealPrediction",
        args: [BigInt(val), `0x${salt}` as `0x${string}`],
      });
      await waitForTransactionReceipt(config, { hash });
      setRevealed(true);
      showToast("Revealed! ✅", "success");
    } catch (e) {
      showToast("Failed to reveal", "error");
      console.error("reveal failed:", e);
    } finally {
      setRevealing(false);
    }
  }

  const isWinner = address && winner && address.toLowerCase() === winner.toLowerCase();
  const sortedPlayers = [...players].sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
  const poolEth = Number(prizePool) / 1e18;
  const stakeEth = Number(stakeAmount) / 1e18;
  const myRank = address ? sortedPlayers.findIndex((p) => p.toLowerCase() === address.toLowerCase()) + 1 : 0;
  const aliveCount = sortedPlayers.length;

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 bg-mesh" />
      <Navbar />
      <div className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <GameStatusBadge gameState={gameState} />
            {currentRound > 0 && (
              <span className="font-mono text-sm text-surface-500">
                R{currentRound}/{totalRounds}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {address && myRank > 0 && gameState !== "waiting" && (
              <span className="rounded-lg bg-primary-700/10 px-2.5 py-1 font-mono text-xs text-primary-400">
                #{myRank}
              </span>
            )}
            <span className="font-mono text-xs text-surface-600">
              {gameAddress.slice(0, 6)}...{gameAddress.slice(-4)}
            </span>
          </div>
        </div>

        {loading ? (
          <SkeletonGameRound />
        ) : (
          <AnimatePresence mode="wait">
            {gameState === "waiting" && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-2xl border border-surface-800/60 bg-surface-900/40 py-16 text-center backdrop-blur-sm"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10"
                >
                  <ClockIcon className="h-7 w-7 text-primary-400" />
                </motion.div>
                <h2 className="mb-2 font-display text-2xl font-bold text-white">Waiting for game to start</h2>
                <p className="mb-6 text-surface-400">
                  {players.length} player{players.length !== 1 ? "s" : ""} joined &middot; {stakeEth.toFixed(3)} ETH stake
                </p>
                <div className="mx-auto max-w-xs">
                  <div className="flex items-center justify-between text-xs text-surface-500">
                    <span>Players</span>
                    <span>{players.length}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, players.length * 10)}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-primary-700 to-cyber-400"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {(gameState === "committing" || gameState === "revealing") && (
              <motion.div
                key="playing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6"
              >
                <div className="mb-6 overflow-hidden rounded-2xl border border-surface-800/60 bg-surface-900/40 p-6 text-center backdrop-blur-sm sm:p-8">
                  <div className="mb-4 flex items-center justify-center gap-2">
                    <span className="rounded-full bg-cyber-500/10 px-3 py-1 text-xs font-medium text-cyber-400">
                      ROUND {currentRound}
                    </span>
                    <span className="text-xs text-surface-500">of {totalRounds}</span>
                  </div>
                  <h2 className="mb-2 font-display text-xl font-bold text-white sm:text-2xl">
                    {questionText}
                  </h2>
                  <p className="mb-5 text-sm text-surface-400">
                    Current BTC:{" "}
                    <span className="font-mono text-surface-300">
                      {priceLoading ? "---" : `$${btcPrice}`}
                    </span>{" "}
                    {btcChange !== null && (
                      <span className={btcChange >= 0 ? "text-success" : "text-danger"}>
                        {btcChange >= 0 ? "▲" : "▼"} {btcChange >= 0 ? "+" : ""}
                        {btcChange.toFixed(2)}%
                      </span>
                    )}
                  </p>
                  {roundEndTime > 0 && <CountdownTimer targetTimestamp={roundEndTime} />}
                </div>

                {gameState === "committing" && !committed && (
                  <div className="mb-6">
                    <PredictionButtons onPredict={handlePredict} />
                  </div>
                )}

                {committed && !revealed && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6 overflow-hidden rounded-2xl border border-success/20 bg-success/5 p-8 text-center backdrop-blur-sm"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10"
                    >
                      <CheckIcon className="h-7 w-7 text-success" />
                    </motion.div>
                    <p className="mb-1 font-display text-xl font-bold text-success">Prediction Locked!</p>
                    <p className="mb-6 text-sm text-surface-400">Now reveal to register your answer on-chain</p>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleReveal}
                      disabled={revealing}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-primary-600 to-primary-700 px-8 py-3 font-semibold text-white shadow-lg shadow-primary-700/20 transition-all hover:from-primary-500 hover:to-primary-600"
                    >
                      {revealing ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                        />
                      ) : (
                        <>
                          <LightningIcon className="h-4 w-4" />
                          Reveal Prediction
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                )}

                {revealed && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 rounded-xl border border-success/20 bg-success/5 p-4 text-center backdrop-blur-sm"
                  >
                    <p className="flex items-center justify-center gap-2 font-semibold text-success">
                      <CheckIcon className="h-4 w-4" />
                      Revealed &mdash; waiting for round to end
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {gameState === "resolving" && (
              <motion.div
                key="resolving"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-2xl border border-surface-800/60 bg-surface-900/40 py-16 text-center backdrop-blur-sm"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-surface-700 border-t-cyber-400"
                />
                <h2 className="mb-2 font-display text-xl font-bold text-white">Oracle Resolving...</h2>
                <p className="text-surface-400">
                  BTC final: ${resolvedValue > 0 ? (resolvedValue / 1e8).toLocaleString() : "..."}
                </p>
              </motion.div>
            )}

            {gameState === "eliminated" && (
              <motion.div
                key="eliminated"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-6"
              >
                <div className="mb-4 overflow-hidden rounded-2xl border border-danger/20 bg-danger/5 py-12 text-center backdrop-blur-sm">
                  <motion.div
                    animate={{ y: [0, -8, 0], rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 1.5 }}
                    className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-danger/10"
                  >
                    <SkullIcon className="h-10 w-10 text-danger" />
                  </motion.div>
                  <h2 className="mb-2 font-display text-3xl font-bold text-danger">ELIMINATED</h2>
                  <p className="mb-1 text-surface-300">
                    Survived {currentRound - 1} round{currentRound - 1 !== 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-surface-500">Spectating remaining rounds</p>
                </div>
                <div className="rounded-xl border border-surface-800/60 bg-surface-900/40 p-4 text-center backdrop-blur-sm">
                  <p className="text-sm text-surface-400">
                    Round {currentRound}/{totalRounds} &middot; {aliveCount} player{aliveCount !== 1 ? "s" : ""} remaining
                  </p>
                </div>
              </motion.div>
            )}

            {gameState === "completed" && (
              <motion.div
                key="completed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-6"
              >
                <div className="mb-4 overflow-hidden rounded-2xl border border-warning/20 bg-gradient-to-b from-warning/5 to-transparent py-12 text-center backdrop-blur-sm">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-warning/10"
                  >
                    <CrownIcon className="h-10 w-10 text-warning" />
                  </motion.div>
                  <h2 className="mb-2 font-display text-3xl font-bold text-white">
                    {isWinner ? "YOU WIN!" : "Game Over"}
                  </h2>
                  <p className="mb-1 text-lg text-surface-300">
                    Prize Pool: <span className="font-bold text-gradient-warm">{poolEth.toFixed(4)} ETH</span>
                  </p>
                  {isWinner && (
                    <p className="text-sm text-surface-400">
                      You take home{" "}
                      <span className="font-bold text-gradient-success">{(poolEth * 0.7).toFixed(4)} ETH</span>
                    </p>
                  )}
                </div>

                <div className="mb-6 overflow-hidden rounded-2xl border border-surface-800/60 bg-surface-900/40 p-4 backdrop-blur-sm">
                  <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-white">
                    <TrophyIcon className="h-5 w-5 text-primary-400" />
                    Final Standings
                  </h3>
                  <div className="space-y-2">
                    {sortedPlayers.slice(0, 5).map((p, i) => {
                      const isYou = p.toLowerCase() === address?.toLowerCase();
                      const medals = ["🥇", "🥈", "🥉"];
                      return (
                        <div
                          key={p}
                          className={`flex items-center justify-between rounded-xl p-3 ${
                            isYou
                              ? "border border-primary-700/30 bg-primary-700/10"
                              : "bg-surface-950/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 text-center text-sm font-bold text-surface-400">
                              {i < 3 ? medals[i] : `#${i + 1}`}
                            </span>
                            <span className="font-mono text-sm">
                              {p.slice(0, 6)}...{p.slice(-4)}
                              {isYou && (
                                <span className="ml-1.5 text-xs text-primary-400">(YOU)</span>
                              )}
                            </span>
                          </div>
                          <span className="font-mono text-sm font-bold text-surface-300">
                            {scores[p] || 0} pts
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  {address && (
                    <ShareButton
                      gameAddress={gameAddress}
                      rank={myRank}
                      prizeEth={isWinner ? poolEth.toFixed(4) : "0"}
                      roundsSurvived={currentRound}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        <div className="mt-8">
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="mb-4 flex w-full items-center justify-between rounded-xl border border-surface-800/60 bg-surface-900/40 px-4 py-3 text-left backdrop-blur-sm transition-colors hover:bg-surface-800/50"
          >
            <span className="flex items-center gap-2 font-display font-bold text-white">
              <TrophyIcon className="h-4 w-4 text-primary-400" />
              Leaderboard
            </span>
            <span className="text-xs text-surface-500">
              {sortedPlayers.length} player{sortedPlayers.length !== 1 ? "s" : ""}
            </span>
          </button>

          <AnimatePresence>
            {showLeaderboard && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                {loading ? (
                  <SkeletonLeaderboard />
                ) : sortedPlayers.length === 0 ? (
                  <div className="rounded-xl bg-surface-900/40 py-8 text-center backdrop-blur-sm">
                    <UsersIcon className="mx-auto mb-2 h-8 w-8 text-surface-600" />
                    <p className="text-sm text-surface-500">No players yet</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {sortedPlayers.map((p, i) => {
                      const isYou = p.toLowerCase() === address?.toLowerCase();
                      return (
                        <motion.div
                          key={p}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className={`flex items-center justify-between rounded-xl px-4 py-2.5 ${
                            isYou
                              ? "border border-primary-700/20 bg-primary-700/10"
                              : "bg-surface-900/30"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-5 text-center text-xs font-bold ${i < 3 ? "text-primary-400" : "text-surface-600"}`}>
                              #{i + 1}
                            </span>
                            <span className="font-mono text-sm text-surface-300">
                              {p.slice(0, 6)}...{p.slice(-4)}
                            </span>
                            {isYou && (
                              <span className="rounded bg-primary-700/20 px-1.5 py-0.5 text-[10px] font-medium text-primary-400">
                                YOU
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-sm font-medium text-surface-400">
                            {scores[p] || 0} pts
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
