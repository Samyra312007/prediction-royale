import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const required = [
  "ARB_SEPOLIA_RPC",
  "GAME_FACTORY_ADDRESS",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_KEY",
];

for (const key of required) {
  if (!process.env[key]) {
    console.warn(`Warning: ${key} not set in environment`);
  }
}
