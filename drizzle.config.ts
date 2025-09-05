import type { Config } from "drizzle-kit";

export default {
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  driver: "pg",
  dbCredentials: {
    // Use the non-pooling URL for migrations
    connectionString: process.env.POSTGRES_URL_NON_POOLING ?? "",
  },
} satisfies Config;

