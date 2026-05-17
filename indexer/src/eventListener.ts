import { ethers } from "ethers";
import { supabase, upsertPlayer } from "../db/queries";

const RPC_URL = process.env.ARB_SEPOLIA_RPC || "https://sepolia-rollup.arbitrum.io/rpc";
const FACTORY_ADDRESS = process.env.GAME_FACTORY_ADDRESS || "";

const GAME_FACTORY_ABI = [
  "event GameCreated(uint256 indexed gameId, address gameAddress, address creator)",
  "function games(uint256) view returns (address)",
  "function gameCount() view returns (uint256)",
];

const GAME_LOBBY_ABI = [
  "event PlayerJoined(address indexed player, uint256 totalPlayers)",
  "event GameStarted(uint256 timestamp)",
  "event RoundStarted(uint256 roundId, int256 targetValue)",
  "event PredictionCommitted(address indexed player, uint256 roundId)",
  "event PredictionRevealed(address indexed player, uint256 roundId, int256 value)",
  "event RoundResolved(uint256 roundId, int256 result)",
  "event PlayerEliminated(address indexed player, uint256 roundId)",
  "event GameCompleted(address indexed winner, uint256 prizeAmount)",
  "event PayoutClaimed(address indexed player, uint256 amount)",
  "function state() view returns (uint8)",
  "function stakeAmount() view returns (uint256)",
  "function maxPlayers() view returns (uint256)",
  "function roundCount() view returns (uint256)",
  "function eliminationPercent() view returns (uint256)",
  "function oracleFeed() view returns (address)",
  "function prizePool() view returns (uint256)",
  "function currentRound() view returns (uint256)",
  "function getPlayers() view returns (address[])",
  "function scores(address) view returns (uint256)",
  "function isEliminated(address) view returns (bool)",
  "function winner() view returns (address)",
];

const activeLobbies: Set<string> = new Set();

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const factory = new ethers.Contract(FACTORY_ADDRESS, GAME_FACTORY_ABI, provider);

  console.log("Starting PMBR Event Indexer...");
  console.log(`Factory: ${FACTORY_ADDRESS}`);

  factory.on("GameCreated", async (gameId, gameAddress, creator, event) => {
    console.log(`Game #${gameId} created at ${gameAddress} by ${creator}`);
    activeLobbies.add(gameAddress);

    const count = await factory.gameCount();
    const txHash = event?.log?.transactionHash || "";

    await supabase.from("games").upsert({
      contract_address: gameAddress,
      factory_game_id: Number(gameId),
      state: "OPEN",
      tx_hash_created: txHash,
    });

    listenToLobby(gameAddress);
  });

  const gameCount = await factory.gameCount();
  console.log(`Found ${gameCount} existing games`);
  for (let i = 1; i <= Number(gameCount); i++) {
    const addr = await factory.games(i);
    if (addr && addr !== ethers.ZeroAddress) {
      activeLobbies.add(addr);
      listenToLobby(addr);
    }
  }
}

function listenToLobby(lobbyAddress: string) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const lobby = new ethers.Contract(lobbyAddress, GAME_LOBBY_ABI, provider);

  lobby.on("PlayerJoined", async (player, totalPlayers, event) => {
    console.log(`Player ${player} joined lobby ${lobbyAddress}`);
    const playerId = await upsertPlayer(player);
    const txHash = event?.log?.transactionHash || "";

    const { data: game } = await supabase
      .from("games")
      .select("id")
      .eq("contract_address", lobbyAddress)
      .single();

    if (game) {
      await supabase.from("game_participants").upsert({
        game_id: game.id,
        player_id: playerId,
        wallet_address: player,
        join_tx_hash: txHash,
      });

      await supabase
        .from("games")
        .update({ current_players: Number(totalPlayers) })
        .eq("id", game.id);
    }
  });

  lobby.on("GameStarted", async () => {
    console.log(`Game started at ${lobbyAddress}`);
    await supabase
      .from("games")
      .update({ state: "ACTIVE", started_at: new Date().toISOString() })
      .eq("contract_address", lobbyAddress);
  });

  lobby.on("RoundStarted", async (roundId, targetValue) => {
    console.log(`Round ${roundId} started at ${lobbyAddress}`);
    const { data: game } = await supabase
      .from("games")
      .select("id")
      .eq("contract_address", lobbyAddress)
      .single();

    if (game) {
      await supabase.from("rounds").insert({
        game_id: game.id,
        round_number: Number(roundId),
        target_value: Number(targetValue) / 1e8,
        commit_start: new Date().toISOString(),
        commit_end: new Date(Date.now() + 30000).toISOString(),
      });

      await supabase
        .from("games")
        .update({ current_round: Number(roundId) })
        .eq("id", game.id);
    }
  });

  lobby.on("PlayerEliminated", async (player, roundId) => {
    console.log(`Player ${player} eliminated in round ${roundId}`);
    const { data: game } = await supabase
      .from("games")
      .select("id")
      .eq("contract_address", lobbyAddress)
      .single();

    if (game) {
      await supabase
        .from("game_participants")
        .update({ is_eliminated: true, eliminated_round: Number(roundId) })
        .eq("game_id", game.id)
        .eq("wallet_address", player);
    }
  });

  lobby.on("GameCompleted", async (winner) => {
    console.log(`Game completed at ${lobbyAddress}, winner: ${winner}`);
    await supabase
      .from("games")
      .update({
        state: "COMPLETED",
        winner_address: winner,
        completed_at: new Date().toISOString(),
      })
      .eq("contract_address", lobbyAddress);
  });
}

async function start() {
  for (let i = 0; i < 10; i++) {
    try { await main(); break; }
    catch (e) { console.error("Indexer error, retrying in", Math.pow(2, i) + "s:", e); await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000)); }
  }
}
start();

process.on("SIGINT", () => {
  console.log("Shutting down indexer...");
  process.exit(0);
});
