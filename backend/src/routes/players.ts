import { Router, Request, Response } from "express";
import { supabase } from "../db/queries";

export const playersRouter = Router();

playersRouter.get("/leaderboard", async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("total_earned_wei", { ascending: false })
      .limit(10);
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

playersRouter.get("/:address", async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("wallet_address", req.params.address)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    res.json(data || null);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

playersRouter.get("/:address/games", async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("game_participants")
      .select("*, games(*)")
      .eq("wallet_address", req.params.address)
      .order("joined_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

playersRouter.get("/:address/badges", async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("nft_badges")
      .select("*")
      .eq("wallet_address", req.params.address);
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
