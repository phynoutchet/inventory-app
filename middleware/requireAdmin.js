import crypto from 'node:crypto'

export function requireAdmin(req, res, next) {
  const supplied = Buffer.from(String(req.body?.admin_password ?? ''))
  const expected = Buffer.from(process.env.ADMIN_PASSWORD ?? '')

  const ok =
    expected.length > 0 &&
    supplied.length === expected.length &&
    crypto.timingSafeEqual(supplied, expected)

  if (ok) return next()

  res.status(403).render('error', {
    title: 'Forbidden',
    status: 403,
    message: 'Incorrect admin password. Go back and try again.',
  })
}