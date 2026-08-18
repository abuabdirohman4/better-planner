export function verifyCronRequest(request: Request): boolean {
  const auth = request.headers.get('authorization')

  // Manual trigger via curl/test (local dev)
  if (process.env.CRON_SECRET_TOKEN && auth === `Bearer ${process.env.CRON_SECRET_TOKEN}`) {
    return true
  }

  // Vercel automatically injects Authorization: Bearer <CRON_SECRET>
  // when CRON_SECRET env var is set in Vercel dashboard
  if (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) {
    return true
  }

  // Fallback ONLY when no secret is configured at all: trust Vercel cron user-agent.
  // Once CRON_SECRET / CRON_SECRET_TOKEN is set, a Bearer token is mandatory (UA is spoofable).
  const hasSecret = Boolean(process.env.CRON_SECRET || process.env.CRON_SECRET_TOKEN)
  const userAgent = request.headers.get('user-agent') ?? ''
  if (!hasSecret && userAgent.startsWith('vercel-cron/') && process.env.VERCEL === '1') {
    return true
  }

  return false
}
