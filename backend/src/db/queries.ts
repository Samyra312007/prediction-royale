import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function upsertPlayer(walletAddress: string) {
  const { data: existing } = await supabase
    .from("players")
    .select("id, total_games")
    .eq("wallet_address", walletAddress)
    .single();

  if (existing) {
    await supabase
      .from("players")
      .update({ last_active: new Date().toISOString() })
      .eq("wallet_address", walletAddress);
    return existing.id;
  } else {
    const { data } = await supabase
      .from("players")
      .insert({ wallet_address: walletAddress })
      .select("id")
      .single();
    return data?.id;
  }
}
