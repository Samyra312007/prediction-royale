import { getPublicClient, writeContract } from "wagmi/actions";
import { config } from "@/app/wagmi";

export async function tx(args: Record<string, any>) {
  const client = getPublicClient(config)!;
  let maxFeePerGas = 1000000000n;
  let maxPriorityFeePerGas = 100000000n;
  try {
    const fees = await client.estimateFeesPerGas();
    maxFeePerGas = (fees.maxFeePerGas * 150n) / 100n;
    maxPriorityFeePerGas = (fees.maxPriorityFeePerGas * 150n) / 100n;
  } catch {
    console.warn("Gas estimation failed, using defaults");
  }
  return writeContract(config as any, {
    ...args,
    maxFeePerGas,
    maxPriorityFeePerGas,
  } as any);
}
