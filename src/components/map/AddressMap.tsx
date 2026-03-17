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
}

export function AddressMap({ coordinates, displayName }: Props) {
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
        <Marker position={[coordinates.lat, coordinates.lon]} icon={markerIcon}>
          <Popup maxWidth={240}>
            <span className="text-xs">{displayName}</span>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
