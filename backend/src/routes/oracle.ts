import { Router, Request, Response } from "express";

export const oracleRouter = Router();

const PRICE_CACHE: Record<string, { price: number; timestamp: number }> = {};

oracleRouter.get("/price/:feed", async (req: Request, res: Response) => {
  try {
    const feed = req.params.feed;
    if (PRICE_CACHE[feed] && Date.now() - PRICE_CACHE[feed].timestamp < 10000) {
      return res.json({ price: PRICE_CACHE[feed].price, feed, cached: true });
    }
    const response = await fetch(
      `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${feed}`
    );
    const data = await response.json();
    const price = Number(data.parsed?.[0]?.price?.price) / 1e8 || 0;
    PRICE_CACHE[feed] = { price, timestamp: Date.now() };
    res.json({ price, feed, cached: false });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

oracleRouter.get("/history/:feed", async (req: Request, res: Response) => {
  try {
    const mockHistory = Array.from({ length: 20 }, (_, i) => ({
      timestamp: Date.now() - (19 - i) * 30000,
      price: 67000 + Math.random() * 1000,
    }));
    res.json(mockHistory);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
