import { getPublicClient, writeContract } from "wagmi/actions";
import { config } from "@/app/wagmi";

export async function tx(args: Record<string, any>) {
  const client = getPublicClient(config)!;
  const fees = await client.estimateFeesPerGas();
  return writeContract(config as any, {
    ...args,
    maxFeePerGas: (fees.maxFeePerGas * 150n) / 100n,
    maxPriorityFeePerGas: (fees.maxPriorityFeePerGas * 150n) / 100n,
  } as any);
}
