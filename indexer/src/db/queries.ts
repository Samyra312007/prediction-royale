import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function upsertPlayer(walletAddress: string) {
  const { data } = await supabase
    .from("players")
    .upsert({ wallet_address: walletAddress, last_active: new Date().toISOString() }, { onConflict: "wallet_address", ignoreDuplicates: false })
    .select("id")
    .single();
  return data?.id;
}

export async function getGameId(lobbyAddress: string) {
  const { data } = await supabase
    .from("games")
    .select("id")
    .eq("contract_address", lobbyAddress)
    .single();
  return data?.id;
}
