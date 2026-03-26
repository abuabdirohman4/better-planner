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

  // Vercel cron without CRON_SECRET set — allow if running on Vercel
  // and request comes from Vercel cron (User-Agent: vercel-cron/1.0)
  const userAgent = request.headers.get('user-agent') ?? ''
  if (userAgent.startsWith('vercel-cron/') && process.env.VERCEL === '1') {
    return true
  }

  return false
}
