import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Charger .env.local
config({ path: ".env.local" });

// Parser l'URL de connexion
function parseDbUrl(url: string) {
  const regex = /postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
  const match = url.match(regex);
  if (!match) throw new Error("Invalid DATABASE_URL format");
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5].split("?")[0],
  };
}

const dbUrl = process.env.DATABASE_URL || "";
const { host, port, user, password, database } = parseDbUrl(dbUrl);

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host,
    port,
    user,
    password,
    database,
    ssl: false,
  },
});
