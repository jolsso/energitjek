const UPSTREAM = 'https://api.eloverblik.dk/customerapi'

export default async function handler(req, res) {
  const pathSegments = [req.query.path].flat().filter(Boolean)
  const upstreamPath = pathSegments.join('/')
  const search = new URL(req.url, 'http://localhost').search
  const url = `${UPSTREAM}/${upstreamPath}${search}`

  const headers = {}
  for (const [key, value] of Object.entries(req.headers)) {
    if (key.toLowerCase() === 'host') continue
    headers[key] = Array.isArray(value) ? value.join(', ') : value
  }

  const upstreamRes = await fetch(url, {
    method: req.method,
    headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
  })

  const body = await upstreamRes.text()

  for (const [key, value] of upstreamRes.headers.entries()) {
    if (['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) continue
    res.setHeader(key, value)
  }

  res.status(upstreamRes.status).send(body)
}
