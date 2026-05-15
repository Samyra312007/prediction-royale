import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export async function getGames() {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getGame(id: number) {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function getGameByContract(contractAddress: string) {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("contract_address", contractAddress)
    .single();
  if (error) throw error;
  return data;
}

export async function getPlayersByGame(gameId: number) {
  const { data, error } = await supabase
    .from("game_participants")
    .select("*, players(*)")
    .eq("game_id", gameId);
  if (error) throw error;
  return data;
}

export async function getLeaderboard(gameId: number) {
  const { data, error } = await supabase
    .from("round_scores")
    .select("*, players(*)")
    .eq("game_id", gameId)
    .order("cumulative_score", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getPlayer(address: string) {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("wallet_address", address)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function getPlayerGames(address: string) {
  const { data, error } = await supabase
    .from("game_participants")
    .select("*, games(*)")
    .eq("wallet_address", address)
    .order("joined_at", { ascending: false });
  if (error) throw error;
  return data;
}
