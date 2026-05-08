/** Origens permitidas para API + Socket.io (browser em outro domínio). */

export function isAllowedFrontendOrigin(origin: string | undefined): boolean {
  if (!origin) return true;

  const extra = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (extra.includes(origin)) return true;

  if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(origin))
    return true;

  // Produção na Vercel: deploy preview e production usam hosts diferentes (*.vercel.app)
  if (/^https:\/\/[^\s/]+\.vercel\.app$/i.test(origin)) return true;

  return false;
}
