// ======================================================
// Logger Utility — hanya aktif di development
// Di production: semua log di-suppress agar tidak bocor
// ke DevTools browser dan tidak aid attacker
// ======================================================

const isDev = process.env.NODE_ENV === "development"

export const logger = {
  log:   (...args: unknown[]) => { if (isDev) console.log(...args) },
  warn:  (...args: unknown[]) => { if (isDev) console.warn(...args) },
  error: (...args: unknown[]) => { if (isDev) console.error(...args) },
  info:  (...args: unknown[]) => { if (isDev) console.info(...args) },
}
