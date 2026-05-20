export const CHAIN_ID = 421614;

// Deployed on Arbitrum Sepolia — update if redeployed
const FACTORY = "0x2be8AD237E1D950cbA5aD0eaAE68E31645F7Cfa5";
const ORACLE = "0x5e3A926E9dc1407aeD442e95839855f73fc5baEe";

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
