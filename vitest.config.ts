// ======================================================
// Vitest Configuration — PresensLab
// ======================================================
import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // Env vars agar modul yang bergantung process.env tidak error
    env: {
      NEXT_PUBLIC_SUPABASE_URL:     "https://test.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
      SUPABASE_SERVICE_ROLE_KEY:    "test-service-key",
      UPSTASH_REDIS_REST_URL:       "https://test-redis.upstash.io",
      UPSTASH_REDIS_REST_TOKEN:     "test-redis-token",
      ALLOWED_EMAIL_DOMAIN:         "student.itera.ac.id",
      ALLOWED_EMAILS:               "dosen@itera.ac.id",
      NEXT_PUBLIC_APP_URL:          "http://localhost:3000",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/lib/**", "src/app/api/**"],
      exclude: ["src/lib/supabase/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
