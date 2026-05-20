import http from "http";
import { ethers } from "ethers";
import { supabase, upsertPlayer } from "./db/queries";

const RPC_URL = process.env.ARB_SEPOLIA_RPC || "https://sepolia-rollup.arbitrum.io/rpc";
const FACTORY_ADDRESS = process.env.GAME_FACTORY_ADDRESS || "";

const GAME_FACTORY_ABI = [
  "event GameCreated(uint256 indexed gameId, address gameAddress, address creator)",
  "function games(uint256) view returns (address)",
  "function gameCount() view returns (uint256)",
  "function gameVaults(address) view returns (address)",
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

const PRIZE_VAULT_ABI = [
  "event Deposited(address indexed from, uint256 amount)",
  "event PayoutAllocated(address indexed player, uint256 amount)",
  "event PayoutClaimed(address indexed player, uint256 amount)",
  "function pendingPayouts(address) view returns (uint256)",
  "function hasClaimed(address) view returns (bool)",
];

const activeLobbies: Set<string> = new Set();
let provider: ethers.JsonRpcProvider;

function getProvider() {
  if (!provider) provider = new ethers.JsonRpcProvider(RPC_URL);
  return provider;
}

async function getGameId(lobbyAddress: string) {
  const { data } = await supabase.from("games").select("id").eq("contract_address", lobbyAddress).single();
  return data?.id;
}

async function getVaultForLobby(lobbyAddress: string) {
  const factory = new ethers.Contract(FACTORY_ADDRESS, GAME_FACTORY_ABI, getProvider());
  try { return await factory.gameVaults(lobbyAddress); } catch { return null; }
}

async function main() {
  const p = getProvider();

  p.on("error", (err) => console.error("Provider error:", err));

  await startListening();
}

async function startListening() {
  const p = getProvider();
  const factory = new ethers.Contract(FACTORY_ADDRESS, GAME_FACTORY_ABI, p);

  console.log("Starting PMBR Event Indexer...");
  console.log(`Factory: ${FACTORY_ADDRESS}`);

  factory.on("GameCreated", async (gameId, gameAddress, creator, event) => {
    console.log(`Game #${gameId} created at ${gameAddress} by ${creator}`);
    activeLobbies.add(gameAddress);
    const txHash = event?.log?.transactionHash || "";
    const lobby = new ethers.Contract(gameAddress, GAME_LOBBY_ABI, getProvider());
    const [stake, maxP, rounds, elimPct, feed] = await Promise.all([
      lobby.stakeAmount(), lobby.maxPlayers(), lobby.roundCount(),
      lobby.eliminationPercent(), lobby.oracleFeed(),
    ]);
    await supabase.from("games").upsert({
      contract_address: gameAddress, factory_game_id: Number(gameId), state: "OPEN", tx_hash_created: txHash,
      stake_amount_wei: stake.toString(), max_players: Number(maxP), round_count: Number(rounds),
      elimination_percent: Number(elimPct), oracle_feed: feed,
    }, { onConflict: "contract_address" });
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
  const p = getProvider();
  const lobby = new ethers.Contract(lobbyAddress, GAME_LOBBY_ABI, p);

  lobby.on("PlayerJoined", async (player, totalPlayers, event) => {
    console.log(`Player ${player} joined lobby ${lobbyAddress}`);
    const playerId = await upsertPlayer(player);
    const txHash = event?.log?.transactionHash || "";
    const gameId = await getGameId(lobbyAddress);
    if (gameId && playerId) {
      await supabase.from("game_participants").upsert({
        game_id: gameId, player_id: playerId, wallet_address: player, join_tx_hash: txHash,
      }, { onConflict: "game_id,wallet_address" });
      await supabase.from("games").update({ current_players: Number(totalPlayers) }).eq("id", gameId);
    }
  });

  lobby.on("GameStarted", async () => {
    console.log(`Game started at ${lobbyAddress}`);
    await supabase.from("games").update({ state: "ACTIVE", started_at: new Date().toISOString() }).eq("contract_address", lobbyAddress);
  });

  lobby.on("RoundStarted", async (roundId, targetValue) => {
    console.log(`Round ${roundId} started at ${lobbyAddress}`);
    const gameId = await getGameId(lobbyAddress);
    if (gameId) {
      await supabase.from("rounds").insert({
        game_id: gameId, round_number: Number(roundId), target_value: Number(targetValue) / 1e8,
        commit_start: new Date().toISOString(), commit_end: new Date(Date.now() + 30000).toISOString(),
      });
      await supabase.from("games").update({ current_round: Number(roundId) }).eq("id", gameId);
    }
  });

  lobby.on("PredictionCommitted", async (player, roundId) => {
    console.log(`Player ${player} committed in round ${roundId}`);
    const gameId = await getGameId(lobbyAddress);
    if (gameId) {
      await supabase.from("predictions").upsert({
        player_address: player, round_number: Number(roundId), game_contract: lobbyAddress,
        is_committed: true, committed_at: new Date().toISOString(),
      }, { onConflict: "player_address,round_number,game_contract" });
    }
  });

  lobby.on("PredictionRevealed", async (player, roundId, value) => {
    console.log(`Player ${player} revealed ${value} in round ${roundId}`);
    const gameId = await getGameId(lobbyAddress);
    if (gameId) {
      await supabase.from("predictions").update({
        is_revealed: true, predicted_value: Number(value) / 1e8, revealed_at: new Date().toISOString(),
      }).eq("player_address", player).eq("round_number", Number(roundId)).eq("game_contract", lobbyAddress);
    }
  });

  lobby.on("RoundResolved", async (roundId, result) => {
    console.log(`Round ${roundId} resolved with ${result} at ${lobbyAddress}`);
    const gameId = await getGameId(lobbyAddress);
    if (gameId) {
      await supabase.from("rounds").update({
        resolved_price: Number(result) / 1e8, is_resolved: true, resolved_at: new Date().toISOString(),
      }).eq("game_id", gameId).eq("round_number", Number(roundId));
    }
  });

  lobby.on("PlayerEliminated", async (player, roundId) => {
    console.log(`Player ${player} eliminated in round ${roundId}`);
    const gameId = await getGameId(lobbyAddress);
    if (gameId) {
      await supabase.from("game_participants").update({ is_eliminated: true, eliminated_round: Number(roundId) })
        .eq("game_id", gameId).eq("wallet_address", player);
    }
  });

  lobby.on("GameCompleted", async (winner) => {
    console.log(`Game completed at ${lobbyAddress}, winner: ${winner}`);
    await supabase.from("games").update({ state: "COMPLETED", winner_address: winner, completed_at: new Date().toISOString() })
      .eq("contract_address", lobbyAddress);
  });

  listenToVault(lobbyAddress);
}

async function listenToVault(lobbyAddress: string) {
  const vaultAddr = await getVaultForLobby(lobbyAddress);
  if (!vaultAddr || vaultAddr === ethers.ZeroAddress) return;
  const p = getProvider();
  const vault = new ethers.Contract(vaultAddr, PRIZE_VAULT_ABI, p);

  vault.on("Deposited", async (from, amount) => {
    console.log(`Vault deposit: ${amount} wei from ${from} for ${lobbyAddress}`);
    const gameId = await getGameId(lobbyAddress);
    if (gameId) {
      try { await supabase.from("game_prizes").insert({
        game_id: gameId, vault_address: vaultAddr, event_type: "deposited", amount: Number(amount), from_address: from,
      }); } catch {}
    }
  });

  vault.on("PayoutAllocated", async (player, amount) => {
    console.log(`Payout allocated: ${amount} wei to ${player} from ${lobbyAddress}`);
    const gameId = await getGameId(lobbyAddress);
    if (gameId) {
      try { await supabase.from("game_prizes").insert({
        game_id: gameId, vault_address: vaultAddr, event_type: "allocated", amount: Number(amount), player_address: player,
      }); } catch {}
    }
  });

  vault.on("PayoutClaimed", async (player, amount) => {
    console.log(`Payout claimed: ${amount} wei by ${player} from ${lobbyAddress}`);
    const gameId = await getGameId(lobbyAddress);
    if (gameId) {
      try { await supabase.from("game_prizes").insert({
        game_id: gameId, vault_address: vaultAddr, event_type: "claimed", amount: Number(amount), player_address: player,
      }); } catch {}
    }
  });
}

const healthPort = Number(process.env.PORT) || 10000;
http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "ok", uptime: process.uptime() }));
}).listen(healthPort, () => console.log(`Health server on port ${healthPort}`));

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
