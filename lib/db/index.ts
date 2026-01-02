import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }
  console.warn("DATABASE_URL not set - using dummy connection for build");
}

const client = connectionString 
  ? postgres(connectionString)
  : postgres("postgres://dummy:dummy@localhost:5432/dummy");

export const db = drizzle(client, { schema });

export * from "./schema";
