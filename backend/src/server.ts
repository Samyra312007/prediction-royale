import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { gamesRouter } from "./routes/games";
import { playersRouter } from "./routes/players";
import { oracleRouter } from "./routes/oracle";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/games", gamesRouter);
app.use("/api/players", playersRouter);
app.use("/api/oracle", oracleRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`PMBR Backend running on port ${port}`);
});
