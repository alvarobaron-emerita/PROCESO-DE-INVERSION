import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  BASE_URL: z.string().optional(),
  BASE_URL_OTHER_PORT: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional().default(""),
});

export const env = envSchema.parse({
  ...process.env,
  NODE_ENV: process.env.NODE_ENV ?? "development",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? "",
});
