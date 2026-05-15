import { keccak256, encodePacked } from "viem";

export function generateSalt(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function computeCommitment(
  value: bigint,
  salt: `0x${string}`,
  playerAddress: `0x${string}`
): `0x${string}` {
  return keccak256(
    encodePacked(
      ["int256", "bytes32", "address"],
      [value, salt, playerAddress]
    )
  );
}

export function getStoredSalt(gameId: string, roundId: number, wallet: string): string | null {
  try {
    return localStorage.getItem(`pmbr_salt_${gameId}_${roundId}_${wallet.toLowerCase()}`);
  } catch {
    return null;
  }
}

export function storeSalt(gameId: string, roundId: number, wallet: string, salt: string): void {
  try {
    localStorage.setItem(`pmbr_salt_${gameId}_${roundId}_${wallet.toLowerCase()}`, salt);
  } catch {}
}

export function getStoredValue(gameId: string, roundId: number, wallet: string): string | null {
  try {
    return localStorage.getItem(`pmbr_val_${gameId}_${roundId}_${wallet.toLowerCase()}`);
  } catch {
    return null;
  }
}

export function storeValue(gameId: string, roundId: number, wallet: string, value: string): void {
  try {
    localStorage.setItem(`pmbr_val_${gameId}_${roundId}_${wallet.toLowerCase()}`, value);
  } catch {}
}
