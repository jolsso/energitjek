export default {
  fetch() {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' },
    })
  },
}
