export const CHAIN_ID = 421614;

export const CONTRACT_ADDRESSES = {
  gameFactory: (process.env.NEXT_PUBLIC_GAME_FACTORY_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
  oracleAdapter: "0x7e691D4CD5C4005F3681aB31C2584f4Ba5911310" as `0x${string}`,
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

export { GameFactoryABI, GameLobbyABI, OracleAdapterABI };
