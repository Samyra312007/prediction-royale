import { Router, Request, Response } from "express";

export const oracleRouter = Router();

const PRICE_CACHE: Record<string, { price: number; timestamp: number }> = {};

const PYTH_FEED_IDS: Record<string, string> = {
  btcusd: "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  ethusd: "ff61491a931112ddf1bd8147cd1b641375f79f582e6d84b2c3b5c0c9c6f0c1e0",
};

oracleRouter.get("/price/:feed", async (req: Request, res: Response) => {
  try {
    const feed = req.params.feed.toLowerCase();
    if (PRICE_CACHE[feed] && Date.now() - PRICE_CACHE[feed].timestamp < 10000) {
      return res.json({ price: PRICE_CACHE[feed].price, feed, cached: true });
    }
    const pythId = PYTH_FEED_IDS[feed] || feed;
    const response = await fetch(
      `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${pythId}`
    );
    const data = await response.json() as any;
    const price = Number(data.parsed?.[0]?.price?.price) / 1e8 || 0;
    PRICE_CACHE[feed] = { price, timestamp: Date.now() };
    res.json({ price, feed, cached: false });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

oracleRouter.get("/history/:feed", async (req: Request, res: Response) => {
  try {
    const feed = req.params.feed.toLowerCase();
    const pythId = PYTH_FEED_IDS[feed] || feed;
    const now = Math.floor(Date.now() / 1000);

    const prices: { timestamp: number; price: number }[] = [];
    for (let t = now - 600; t < now; t += 60) {
      try {
        const response = await fetch(`https://hermes.pyth.network/v2/updates/price/${t}?ids[]=${pythId}`);
        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch { continue; }
        const p = data.parsed?.find?.((x: any) => x.id === pythId) || data.parsed?.[0];
        if (p?.price?.price) {
          prices.push({
            timestamp: Number(p.price.publish_time || t) * 1000,
            price: Number(p.price.price) / 1e8,
          });
        }
      } catch { continue; }
    }
    res.json(prices.slice(-20));
  } catch { res.json([]); }
});
