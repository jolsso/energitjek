const UPSTREAM = 'https://re.jrc.ec.europa.eu/api/v5_3'

export default async function handler(req, res) {
  const pathSegments = [req.query.path].flat().filter(Boolean)
  const upstreamPath = pathSegments.join('/')
  const search = new URL(req.url, 'http://localhost').search
  const url = `${UPSTREAM}/${upstreamPath}${search}`

  const upstreamRes = await fetch(url, {
    headers: { Host: 're.jrc.ec.europa.eu' },
  })

  const body = await upstreamRes.text()

  for (const [key, value] of upstreamRes.headers.entries()) {
    if (['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) continue
    res.setHeader(key, value)
  }

  res.status(upstreamRes.status).send(body)
}
