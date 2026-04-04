const UPSTREAM = 'https://re.jrc.ec.europa.eu/api/v5_3'

export default async function handler(req, res) {
  const path = req.url.replace(/^\/api\/pvgis\/?/, '')
  const upstreamUrl = `${UPSTREAM}/${path}`

  const upstreamRes = await fetch(upstreamUrl)

  const body = await upstreamRes.text()
  const contentType = upstreamRes.headers.get('content-type')
  if (contentType) res.setHeader('Content-Type', contentType)
  if (upstreamRes.status === 200) {
    // PVGIS returns historical climate data — immutable for a given location/config
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800')
  }
  res.status(upstreamRes.status).send(body)
}
