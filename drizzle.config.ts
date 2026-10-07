import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd());

export default defineConfig({
	schema: "./src/lib/db/schema",
	out: "./drizzle",
	dialect: "postgresql",
	// Migrations must use the direct (non-pooled) connection.
	dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED! },
});
