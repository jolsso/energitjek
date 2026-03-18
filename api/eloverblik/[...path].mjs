export const config = { runtime: 'edge' }

const UPSTREAM = 'https://api.eloverblik.dk/customerapi'

export default async function handler(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace(/^\/api\/eloverblik\/?/, '')
  const upstreamUrl = `${UPSTREAM}/${path}${url.search}`

  const headers = new Headers(request.headers)
  headers.delete('host')

  const upstreamRes = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
  })

  const resHeaders = new Headers(upstreamRes.headers)
  resHeaders.delete('content-encoding')
  resHeaders.delete('transfer-encoding')

  const body = await upstreamRes.text()
  return new Response(body, { status: upstreamRes.status, headers: resHeaders })
}
