import { Router, Request, Response } from "express";
import { supabase } from "../db/queries";

export const gamesRouter = Router();

gamesRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

gamesRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("id", req.params.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

gamesRouter.get("/:id/players", async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("game_participants")
      .select("*, players(*)")
      .eq("game_id", req.params.id);
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

gamesRouter.get("/:id/rounds", async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("rounds")
      .select("*")
      .eq("game_id", req.params.id)
      .order("round_number", { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

gamesRouter.get("/:id/leaderboard", async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("round_scores")
      .select("*, players(*)")
      .eq("game_id", req.params.id)
      .order("cumulative_score", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
