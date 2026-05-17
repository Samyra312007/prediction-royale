export const CHAIN_ID = 421614;

function requireEnv(key: string): `0x${string}` {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val as `0x${string}`;
}

export const CONTRACT_ADDRESSES = {
  gameFactory: requireEnv("NEXT_PUBLIC_GAME_FACTORY_ADDRESS"),
  oracleAdapter: requireEnv("NEXT_PUBLIC_ORACLE_ADAPTER"),
} as const;

export const CHAINLINK_FEEDS = {
  btcUsd: "0x56a43EB56Da12C0dc1D972ACb089c06a5dEF8e69",
  ethUsd: "0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165",
} as const;

export const GAME_STATES = {
  0: "OPEN",
  1: "ACTIVE",
  2: "COMPLETED",
  3: "CANCELLED",
} as const;

import GameFactoryABI from "./abi/GameFactory.json";
import GameLobbyABI from "./abi/GameLobby.json";
import OracleAdapterABI from "./abi/OracleAdapter.json";
import PrizeVaultABI from "./abi/PrizeVault.json";

export { GameFactoryABI, GameLobbyABI, OracleAdapterABI, PrizeVaultABI };
