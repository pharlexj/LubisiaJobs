// import { Pool, neonConfig } from '@neondatabase/serverless';
import "dotenv/config";
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';
// import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
// import * as schema from "@shared/schema";

// neonConfig.webSocketConstructor = ws;

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });