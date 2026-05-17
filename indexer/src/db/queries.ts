import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || "";

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

export async function getGameId(lobbyAddress: string) {
  const { data } = await supabase
    .from("games")
    .select("id")
    .eq("contract_address", lobbyAddress)
    .single();
  return data?.id;
}
