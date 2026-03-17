/**
 * Generates a minimal but structurally valid PVGIS seriescalc JSON response
 * for use in Playwright route mocks.
 *
 * Production follows a simple seasonal sine curve so assertions on
 * monthly output are predictable.
 */
// Matches the real PVGIS seriescalc response shape:
// - time format is "YYYYMMDD:HHMM" (4-char time, no separating colon)
// - outputs has only "hourly" — NO "totals" field
export function makePVGISResponse(peakKw = 6) {
  const hourly = []

  for (let h = 0; h < 8760; h++) {
    const dayOfYear = Math.floor(h / 24)
    const seasonalFactor = Math.max(0, Math.sin((dayOfYear / 365) * Math.PI))
    const hourOfDay = h % 24
    const dailyFactor = hourOfDay >= 6 && hourOfDay <= 20
      ? Math.sin(((hourOfDay - 6) / 14) * Math.PI)
      : 0

    const P = Math.round(peakKw * 1000 * seasonalFactor * dailyFactor * 0.85)

    const month = String(Math.floor(dayOfYear / 30.44) + 1).padStart(2, '0')
    const day = String((dayOfYear % 30) + 1).padStart(2, '0')
    const hh = String(hourOfDay).padStart(2, '0')
    // Real API format: "YYYYMMDD:HHMM" — no colon inside time part
    hourly.push({ time: `2023${month}${day}:${hh}00`, P, 'G(i)': P * 0.15, T2m: 10 })
  }

  return {
    outputs: { hourly },   // no totals field — matches real API
    meta: { latitude: 56.15, longitude: 10.21 },
  }
}

export function makeNominatimResponse(
  lat = '56.1572',
  lon = '10.2107',
  displayName = 'Rådhuspladsen 2, Aarhus C, Aarhus Kommune, 8000, Danmark',
) {
  return [{ lat, lon, display_name: displayName }]
}
