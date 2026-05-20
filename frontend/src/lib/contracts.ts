export const CHAIN_ID = 421614;

// Deployed on Arbitrum Sepolia — update if redeployed
const FACTORY = "0xa6A24F191d68E2C1A69cECbAe79Bc8251CFf45Bb";
const ORACLE = "0x97DF9a62ECc905ea2Eb294A5867181a94cfff69b";

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
