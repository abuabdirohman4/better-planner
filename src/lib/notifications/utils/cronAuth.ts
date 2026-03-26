export function verifyCronRequest(request: Request): boolean {
  const auth = request.headers.get('authorization')

  // Support both our custom token and Vercel's built-in CRON_SECRET
  if (process.env.CRON_SECRET_TOKEN && auth === `Bearer ${process.env.CRON_SECRET_TOKEN}`) {
    return true
  }
  if (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) {
    return true
  }

  // Vercel also sets x-vercel-cron: 1 header for cron invocations
  const vercelCron = request.headers.get('x-vercel-cron')
  if (vercelCron === '1' && process.env.VERCEL === '1') {
    return true
  }

  return false
}
