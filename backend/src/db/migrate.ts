import fs from "fs";
import path from "path";

async function migrate() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");

  console.log("=== Schema SQL - Run this in Supabase SQL Editor ===");
  console.log(sql);
  console.log("===================================================");
  console.log("Or pipe this file directly: psql $SUPABASE_DB_URL < schema.sql");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
