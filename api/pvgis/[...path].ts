import type { VercelRequest, VercelResponse } from '@vercel/node'

const UPSTREAM = 'https://re.jrc.ec.europa.eu/api/v5_3'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathSegments = (req.query['path'] as string[]) ?? []
  const upstreamPath = pathSegments.join('/')
  const search = new URL(req.url ?? '', 'http://localhost').search
  const url = `${UPSTREAM}/${upstreamPath}${search}`

  const upstreamRes = await fetch(url, {
    headers: { Host: 're.jrc.ec.europa.eu' },
  })

  const body = await upstreamRes.text()

  upstreamRes.headers.forEach((value, key) => {
    if (['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) return
    res.setHeader(key, value)
  })

  res.status(upstreamRes.status).send(body)
}
