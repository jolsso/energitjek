import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Coordinates } from '@/types'

// Leaflet's default marker icons break with bundlers — fix by pointing to the CDN
const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Directional arrow icon showing which way the solar panels face.
// azimuthDeg: 0=south, -90=east, 90=west → compass bearing = 180 + azimuthDeg
function makeArrowIcon(azimuthDeg: number) {
  const bearing = 180 + azimuthDeg
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="28"
        fill="rgba(251,191,36,0.18)"
        stroke="rgba(217,119,6,0.55)"
        stroke-width="1.5"
        stroke-dasharray="4 3"/>
      <g transform="rotate(${bearing} 32 32)">
        <line x1="32" y1="30" x2="32" y2="10"
          stroke="#d97706" stroke-width="2.5" stroke-linecap="round"/>
        <polygon points="32,3 26,13 38,13" fill="#d97706"/>
      </g>
      <circle cx="32" cy="32" r="3.5" fill="#d97706"/>
    </svg>
  `.trim()
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [64, 64],
    iconAnchor: [32, 32],
  })
}

function FlyTo({ coords }: { coords: Coordinates }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([coords.lat, coords.lon], 15, { duration: 1.2 })
  }, [coords, map])
  return null
}

interface Props {
  coordinates: Coordinates
  displayName: string
  azimuthDeg?: number
}

export function AddressMap({ coordinates, displayName, azimuthDeg }: Props) {
  return (
    <div className="rounded-md overflow-hidden border border-border h-48">
      <MapContainer
        center={[coordinates.lat, coordinates.lon]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyTo coords={coordinates} />
        {/* Direction arrow behind the pin */}
        {azimuthDeg !== undefined && (
          <Marker
            position={[coordinates.lat, coordinates.lon]}
            icon={makeArrowIcon(azimuthDeg)}
            zIndexOffset={-100}
          />
        )}
        {/* Address pin */}
        <Marker position={[coordinates.lat, coordinates.lon]} icon={markerIcon}>
          <Popup maxWidth={240}>
            <span className="text-xs">{displayName}</span>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
