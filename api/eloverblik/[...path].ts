import type { VercelRequest, VercelResponse } from '@vercel/node'

const UPSTREAM = 'https://api.eloverblik.dk/customerapi'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathSegments = (req.query['path'] as string[]) ?? []
  const upstreamPath = pathSegments.join('/')
  const search = new URL(req.url ?? '', 'http://localhost').search
  const url = `${UPSTREAM}/${upstreamPath}${search}`

  const headers: Record<string, string> = {}
  for (const [key, value] of Object.entries(req.headers)) {
    if (key.toLowerCase() === 'host') continue
    if (typeof value === 'string') headers[key] = value
    else if (Array.isArray(value)) headers[key] = value.join(', ')
  }

  const upstreamRes = await fetch(url, {
    method: req.method,
    headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
  })

  const body = await upstreamRes.text()

  upstreamRes.headers.forEach((value, key) => {
    if (['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) return
    res.setHeader(key, value)
  })

  res.status(upstreamRes.status).send(body)
}
