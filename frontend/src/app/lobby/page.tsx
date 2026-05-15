"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { readContract, writeContract, waitForTransactionReceipt } from "wagmi/actions";
import { config } from "../wagmi";
import { CONTRACT_ADDRESSES, GameFactoryABI, GameLobbyABI, GAME_STATES } from "@/lib/contracts";
import { SkeletonList } from "@/components/Skeleton";
import Link from "next/link";

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

export default function LobbyPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [lobbies, setLobbies] = useState<LobbyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    stake: "0.01",
    maxPlayers: "10",
    rounds: "5",
    elimPercent: "20",
  });

  useEffect(() => {
    if (!isConnected) return;
    loadLobbies();
    const interval = setInterval(loadLobbies, 5000);
    return () => clearInterval(interval);
  }, [isConnected]);

  async function loadLobbies() {
    try {
      const addrs = await readContract(config, {
        address: CONTRACT_ADDRESSES.gameFactory,
        abi: GameFactoryABI,
        functionName: "getActiveGames",
      }) as `0x${string}`[];

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
          const players = await readContract(config, {
            address: addr,
            abi: GameLobbyABI,
            functionName: "getPlayers",
          }) as `0x${string}`[];

          return {
            address: addr,
            stakeAmount: stakeAmount as bigint,
            maxPlayers: Number(maxPlayers),
            playerCount: players.length,
            roundCount: Number(roundCount),
            eliminationPercent: Number(eliminationPercent),
            state: Number(state),
            prizePool: prizePool as bigint,
          };
        })
      );
      setLobbies(lobbyData.filter((l) => l.state === 0));
    } catch (e) {
      console.error("Failed to load lobbies:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!address) return;
    try {
      const hash = await writeContract(config, {
        address: CONTRACT_ADDRESSES.gameFactory,
        abi: GameFactoryABI,
        functionName: "createGame",
        args: [
          BigInt(parseFloat(createForm.stake) * 1e18),
          BigInt(createForm.maxPlayers),
          BigInt(createForm.rounds),
          BigInt(createForm.elimPercent),
          "0x56a43EB56Da12C0dc1D972ACb089c06a5dEF8e69",
        ],
      });
      await waitForTransactionReceipt(config, { hash });
      setShowCreate(false);
      loadLobbies();
    } catch (e) {
      console.error("Failed to create game:", e);
    }
  }

  async function handleJoin(lobby: LobbyData) {
    if (!address) return;
    try {
      const hash = await writeContract(config, {
        address: lobby.address,
        abi: GameLobbyABI,
        functionName: "joinGame",
        value: lobby.stakeAmount,
      });
      await waitForTransactionReceipt(config, { hash });
      router.push(`/game/${lobby.address}`);
    } catch (e) {
      console.error("Failed to join game:", e);
    }
  }

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
        <Link href="/" className="text-xl font-bold text-[#7C3AED]">PMBR</Link>
        <div className="flex items-center gap-4">
          <ConnectButton />
        </div>
      </nav>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Active Lobbies</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-[#7C3AED] rounded-lg hover:bg-[#6D28D9] transition-colors"
        >
          + Create Lobby
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#12121A] p-6 rounded-xl border border-[#1E1E2E] w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Create Lobby</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-[#94A3B8]">Stake (ETH)</label>
                <input
                  type="number"
                  value={createForm.stake}
                  onChange={(e) => setCreateForm({ ...createForm, stake: e.target.value })}
                  className="w-full p-2 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm text-[#94A3B8]">Max Players</label>
                <select
                  value={createForm.maxPlayers}
                  onChange={(e) => setCreateForm({ ...createForm, maxPlayers: e.target.value })}
                  className="w-full p-2 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg"
                >
                  {[5, 10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-[#94A3B8]">Rounds</label>
                <select
                  value={createForm.rounds}
                  onChange={(e) => setCreateForm({ ...createForm, rounds: e.target.value })}
                  className="w-full p-2 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg"
                >
                  {[3, 5, 10].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleCreate}
                  className="flex-1 py-2 bg-[#7C3AED] rounded-lg hover:bg-[#6D28D9]"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2 bg-[#1E1E2E] rounded-lg hover:bg-[#2E2E3E]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <SkeletonList count={3} />
      ) : lobbies.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#94A3B8] text-lg mb-4">No active lobbies</p>
          <p className="text-sm text-[#94A3B8]">Create one to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {lobbies.map((lobby) => (
            <div
              key={lobby.address}
              className="p-4 bg-[#12121A] border border-[#1E1E2E] rounded-xl flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-mono text-[#94A3B8]">
                  {lobby.address.slice(0, 6)}...{lobby.address.slice(-4)}
                </p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span>Stake: <strong>{Number(lobby.stakeAmount) / 1e18} ETH</strong></span>
                  <span>Players: <strong>{lobby.playerCount}/{lobby.maxPlayers}</strong></span>
                  <span>Rounds: <strong>{lobby.roundCount}</strong></span>
                  <span>Pool: <strong>{Number(lobby.prizePool) / 1e18} ETH</strong></span>
                </div>
              </div>
              <button
                onClick={() => handleJoin(lobby)}
                className="px-4 py-2 bg-[#7C3AED] rounded-lg hover:bg-[#6D28D9] transition-colors"
              >
                JOIN
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
