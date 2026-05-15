"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { readContract, writeContract, watchContractEvent, waitForTransactionReceipt } from "wagmi/actions";
import { config } from "../../wagmi";
import GameLobbyABI from "@/lib/abi/GameLobby.json";
import { GAME_STATES } from "@/lib/contracts";
import {
  generateSalt,
  computeCommitment,
  storeSalt,
  storeValue,
  getStoredSalt,
  getStoredValue,
} from "@/lib/commitReveal";
import { CountdownTimer } from "@/components/CountdownTimer";
import { SkeletonGameRound, SkeletonLeaderboard } from "@/components/Skeleton";
import { ShareButton } from "@/components/ShareButton";
import { showToast } from "@/components/Toast";
import Link from "next/link";

type GameState = "waiting" | "committing" | "revealing" | "resolving" | "eliminated" | "completed";

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
  const [price, setPrice] = useState(0);
  const [resolvedValue, setResolvedValue] = useState(0);
  const [winner, setWinner] = useState<`0x${string}` | null>(null);
  const [prizePool, setPrizePool] = useState(0n);
  const [loading, setLoading] = useState(true);
  const [finalRanks, setFinalRanks] = useState<{ addr: `0x${string}`; rank: number }[]>([]);

  useEffect(() => {
    if (!isConnected || !address) return;
    loadGameData();
  }, [isConnected, address]);

  useEffect(() => {
    if (!address) return;
    const unwatch = watchContractEvent(config, {
      address: gameAddress,
      abi: GameLobbyABI,
      eventName: "RoundStarted",
      onLogs(logs) {
        const log = logs[0] as any;
        if (log?.args) {
          setCurrentRound(Number(log.args.roundId));
          setCommitted(false);
          setRevealed(false);
          setGameState("committing");
          setRoundEndTime(Math.floor(Date.now() / 1000) + 30);
        }
      },
    });
    return () => unwatch();
  }, [gameAddress, address]);

  useEffect(() => {
    if (!address) return;
    const unwatch = watchContractEvent(config, {
      address: gameAddress,
      abi: GameLobbyABI,
      eventName: "RoundResolved",
      onLogs(logs) {
        const log = logs[0] as any;
        if (log?.args) {
          setResolvedValue(Number(log.args.result));
          setGameState("resolving");
        }
      },
    });
    return () => unwatch();
  }, [gameAddress, address]);

  useEffect(() => {
    if (!address) return;
    const unwatch = watchContractEvent(config, {
      address: gameAddress,
      abi: GameLobbyABI,
      eventName: "PlayerEliminated",
      onLogs(logs) {
        const log = logs[0] as any;
        if (log?.args?.player === address) {
          setIsEliminated(true);
          setGameState("eliminated");
        }
        loadPlayers();
      },
    });
    return () => unwatch();
  }, [gameAddress, address]);

  useEffect(() => {
    if (!address) return;
    const unwatch = watchContractEvent(config, {
      address: gameAddress,
      abi: GameLobbyABI,
      eventName: "GameCompleted",
      onLogs(logs) {
        const log = logs[0] as any;
        if (log?.args) {
          setWinner(log.args.winner as `0x${string}`);
          setGameState("completed");
          const ranks = sortedPlayers.map((addr, i) => ({
            addr,
            rank: i + 1,
          }));
          setFinalRanks(ranks);
        }
      },
    });
    return () => unwatch();
  }, [gameAddress, address]);

  async function loadGameData() {
    try {
      const [state, stake, maxP, rCount, pool] = await Promise.all([
        readContract(config, { address: gameAddress, abi: GameLobbyABI, functionName: "state" }),
        readContract(config, { address: gameAddress, abi: GameLobbyABI, functionName: "stakeAmount" }),
        readContract(config, { address: gameAddress, abi: GameLobbyABI, functionName: "maxPlayers" }),
        readContract(config, { address: gameAddress, abi: GameLobbyABI, functionName: "roundCount" }),
        readContract(config, { address: gameAddress, abi: GameLobbyABI, functionName: "prizePool" }),
      ]);
      setTotalRounds(Number(rCount));
      setPrizePool(pool as bigint);
      await loadPlayers();
    } catch (e) {
      console.error("Failed to load game:", e);
    } finally {
      setLoading(false);
    }
  }

  async function loadPlayers() {
    try {
      const p = await readContract(config, {
        address: gameAddress,
        abi: GameLobbyABI,
        functionName: "getPlayers",
      }) as `0x${string}`[];
      setPlayers(p);

      const scoreMap: Record<string, number> = {};
      for (const player of p) {
        const s = await readContract(config, {
          address: gameAddress,
          abi: GameLobbyABI,
          functionName: "scores",
          args: [player],
        });
        scoreMap[player] = Number(s);
      }
      setScores(scoreMap);
    } catch (e) {
      console.error("Failed to load players:", e);
    }
  }

  async function handlePredict(direction: "yes" | "no") {
    if (!address || !currentRound) return;
    const salt = `0x${generateSalt()}`;
    const targetVal = 100n;

    storeSalt(gameAddress, currentRound, address, salt);
    storeValue(gameAddress, currentRound, address, direction === "yes" ? "1" : "0");

    const commitment = computeCommitment(targetVal, salt as `0x${string}`, address);
    try {
      showToast("Submitting prediction...", "pending");
      const hash = await writeContract(config, {
        address: gameAddress,
        abi: GameLobbyABI,
        functionName: "submitCommitment",
        args: [commitment],
      });
      await waitForTransactionReceipt(config, { hash });
      setCommitted(true);
      showToast("Prediction locked!", "success");
    } catch (e) {
      showToast("Commit failed: " + (e as Error).message, "error");
      console.error("Commit failed:", e);
    }
  }

  async function handleReveal() {
    if (!address || !currentRound) return;
    const salt = getStoredSalt(gameAddress, currentRound, address);
    const val = getStoredValue(gameAddress, currentRound, address);
    if (!salt || !val) return;

    try {
      showToast("Revealing prediction...", "pending");
      const hash = await writeContract(config, {
        address: gameAddress,
        abi: GameLobbyABI,
        functionName: "revealPrediction",
        args: [BigInt(val), `0x${salt}` as `0x${string}`],
      });
      await waitForTransactionReceipt(config, { hash });
      setRevealed(true);
      showToast("Revealed successfully!", "success");
    } catch (e) {
      showToast("Reveal failed: " + (e as Error).message, "error");
      console.error("Reveal failed:", e);
    }
  }

  const isWinner = address && winner && address.toLowerCase() === winner.toLowerCase();
  const sortedPlayers = [...players].sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
  const poolEth = Number(prizePool) / 1e18;

  return (
    <main className="min-h-screen p-6">
      <nav className="flex items-center justify-between mb-6">
        <Link href="/lobby" className="text-[#94A3B8] hover:text-white">
          &larr; Back
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#94A3B8] font-mono">
            {gameAddress.slice(0, 6)}...{gameAddress.slice(-4)}
          </span>
        </div>
      </nav>

      {loading && !gameState ? (
        <SkeletonGameRound />
      ) : null}

      {gameState === "waiting" && (
        <div className="text-center py-20">
          <p className="text-xl font-bold mb-2">Waiting for game to start...</p>
          <p className="text-[#94A3B8]">{players.length} players joined</p>
        </div>
      )}

      {(gameState === "committing" || gameState === "revealing") && (
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-sm text-[#06B6D4] font-mono">
              Round {currentRound} / {totalRounds}
            </p>
            <h2 className="text-2xl font-bold mt-2">
              Will BTC be above $67,500 in 5 minutes?
            </h2>
            <p className="text-lg text-[#94A3B8] mt-1">
              Current BTC: $67,320 <span className="text-[#10B981]">▲ +0.3%</span>
            </p>
            {roundEndTime > 0 && (
              <div className="mt-4">
                <CountdownTimer targetTimestamp={roundEndTime} />
              </div>
            )}
          </div>

          {gameState === "committing" && !committed && (
            <div className="flex gap-4 justify-center mb-8">
              <button
                onClick={() => handlePredict("yes")}
                className="px-8 py-4 bg-[#10B981] text-white rounded-xl text-lg font-bold hover:bg-[#059669] transition-all hover:scale-105"
              >
                YES
              </button>
              <button
                onClick={() => handlePredict("no")}
                className="px-8 py-4 bg-[#EF4444] text-white rounded-xl text-lg font-bold hover:bg-[#DC2626] transition-all hover:scale-105"
              >
                NO
              </button>
            </div>
          )}

          {committed && !revealed && (
            <div className="text-center mb-8">
              <p className="text-[#10B981] text-lg font-bold mb-2">Prediction locked!</p>
              <button
                onClick={handleReveal}
                className="px-6 py-3 bg-[#7C3AED] rounded-xl hover:bg-[#6D28D9] transition-colors"
              >
                Reveal Prediction
              </button>
            </div>
          )}

          {revealed && (
            <p className="text-center text-[#10B981] mb-8">Revealed successfully!</p>
          )}
        </div>
      )}

      {gameState === "resolving" && (
        <div className="text-center py-20">
          <p className="text-xl mb-2">Oracle resolving...</p>
          <p className="text-[#94A3B8]">
            BTC final: ${(resolvedValue / 1e8).toLocaleString()}
          </p>
        </div>
      )}

      {gameState === "eliminated" && (
        <>
          <div className="text-center py-10">
            <p className="text-4xl mb-4">💀</p>
            <p className="text-2xl font-bold text-[#EF4444] mb-2">ELIMINATED</p>
            <p className="text-[#94A3B8]">You survived {currentRound - 1} rounds</p>
            <p className="text-sm text-[#94A3B8] mt-1">
              Spectating — watching remaining rounds play out
            </p>
          </div>
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-[#12121A] p-4 rounded-xl border border-[#1E1E2E]">
              <p className="text-center text-sm text-[#94A3B8]">
                Current Round: {currentRound} / {totalRounds} —{" "}
                {players.length - sortedPlayers.filter((p) => scores[p] > 0).length} players remaining
              </p>
            </div>
          </div>
        </>
      )}

      {gameState === "completed" && (
        <div className="text-center py-20">
          <p className="text-6xl mb-4">🏆</p>
          <p className="text-3xl font-bold mb-2">
            {isWinner ? "YOU WIN!" : "Game Over"}
          </p>
          <p className="text-lg text-[#94A3B8] mb-4">
            Prize Pool: {poolEth.toFixed(4)} ETH
          </p>
          <div className="bg-[#12121A] p-4 rounded-xl border border-[#1E1E2E] max-w-md mx-auto mb-6">
            {sortedPlayers.slice(0, 3).map((p, i) => {
              const isYou = p.toLowerCase() === address?.toLowerCase();
              return (
                <div key={p} className={`flex justify-between py-2 border-b border-[#1E1E2E] last:border-0 ${isYou ? "text-[#7C3AED] font-bold" : ""}`}>
                  <span>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}{" "}
                    {p.slice(0, 6)}...{p.slice(-4)}
                    {isYou ? " (YOU)" : ""}
                  </span>
                  <span>{scores[p] || 0} pts</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 justify-center">
            {address && (
              <ShareButton
                gameAddress={gameAddress}
                rank={sortedPlayers.findIndex((p) => p.toLowerCase() === address?.toLowerCase()) + 1}
                prizeEth={isWinner ? poolEth.toFixed(4) : "0"}
                roundsSurvived={currentRound}
              />
            )}
            <Link
              href="/lobby"
              className="inline-flex items-center px-6 py-3 bg-[#7C3AED] rounded-xl hover:bg-[#6D28D9] transition-colors"
            >
              Play Again
            </Link>
          </div>
        </div>
      )}

      <div className="mt-8 max-w-md mx-auto">
        <h3 className="text-lg font-bold mb-3">Leaderboard</h3>
        {loading ? (
          <SkeletonLeaderboard />
        ) : (
        <div className="space-y-2">
          {sortedPlayers.map((p, i) => (
            <div
              key={p}
              className={`flex justify-between items-center p-2 rounded-lg ${
                p.toLowerCase() === address?.toLowerCase()
                  ? "bg-[#7C3AED]/20 border border-[#7C3AED]"
                  : "bg-[#12121A]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[#94A3B8]">#{i + 1}</span>
                <span className="font-mono text-sm">
                  {p.slice(0, 6)}...{p.slice(-4)}
                </span>
              </div>
              <span>{scores[p] || 0} pts</span>
            </div>
          ))}
        </div>
        )}
      </div>
    </main>
  );
}
