const UPSTREAM = 'https://re.jrc.ec.europa.eu/api/v5_3'

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const path = url.pathname.replace(/^\/api\/pvgis\/?/, '')
    const upstreamUrl = `${UPSTREAM}/${path}${url.search}`

    const upstreamRes = await fetch(upstreamUrl)

    const headers = new Headers(upstreamRes.headers)
    headers.delete('content-encoding')
    headers.delete('transfer-encoding')

    const body = await upstreamRes.text()
    return new Response(body, { status: upstreamRes.status, headers })
  },
}
