import { building } from "$app/environment";

let db;

if (!building) {
	if (!import.meta.env.VITE_DATABASE_URL)
		throw new Error("VITE_DATABASE_URL is not set");

	const [{ Database }, { drizzle }] = await Promise.all([
		import("bun:sqlite"),
		import("drizzle-orm/bun-sqlite"),
	]);
	const client = new Database(
		import.meta.env.VITE_DATABASE_URL.replace("file:", ""),
	);
	db = drizzle({ client });
}

export { db };
