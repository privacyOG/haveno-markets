import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

if (!import.meta.env.VITE_DATABASE_URL)
	throw new Error("VITE_DATABASE_URL is not set");
const client = new Database(
	import.meta.env.VITE_DATABASE_URL.replace("file:", ""),
);
export const db = drizzle({ client });
