export const CHAIN_ID = 421614;

// Deployed on Arbitrum Sepolia — update if redeployed
const FACTORY = "0x9C91a7555de8F2D5Db08c8ec07965213225Bf642";
const ORACLE = "0xcDAC89a61E933d908650712a0eb42e6Cd0094a70";

export const CONTRACT_ADDRESSES = {
  gameFactory: FACTORY as `0x${string}`,
  oracleAdapter: ORACLE as `0x${string}`,
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
