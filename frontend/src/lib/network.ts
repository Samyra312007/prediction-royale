import { arbitrumSepolia } from "wagmi/chains";
import { switchChain } from "wagmi/actions";
import { config } from "@/app/wagmi";

const TARGET_CHAIN = arbitrumSepolia;
const TARGET_CHAIN_ID = TARGET_CHAIN.id;

export async function ensureCorrectNetwork(): Promise<boolean> {
  try {
    await switchChain(config, { chainId: TARGET_CHAIN_ID });
    return true;
  } catch {
    return false;
  }
}

export { TARGET_CHAIN, TARGET_CHAIN_ID };
