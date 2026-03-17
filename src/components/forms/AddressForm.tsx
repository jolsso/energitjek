import { useState } from 'react'
import { MapPin, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { geocodeAddress } from '@/lib/geocoding'
import { AddressMap } from '@/components/map/AddressMap'

export function AddressForm() {
  const { address, coordinates, setAddress, setPostcode, setCoordinates, setPriceArea } = useAppStore()
  const [localAddress, setLocalAddress] = useState(address)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [matchedName, setMatchedName] = useState<string | null>(null)

  const handleLookup = async () => {
    if (!localAddress.trim()) return
    setLoading(true)
    setError(null)
    setMatchedName(null)
    setCoordinates(null)
    try {
      const result = await geocodeAddress(localAddress)
      setMatchedName(result.displayName)
      setAddress(localAddress)
      setPostcode(result.postcode)
      setCoordinates(result.coordinates)
      setPriceArea(result.priceArea)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ukendt fejl')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (value: string) => {
    setLocalAddress(value)
    setMatchedName(null)
    setCoordinates(null)
    setError(null)
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <h2 className="font-semibold flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        Adresse
      </h2>

      <div className="flex gap-2">
        <input
          type="text"
          value={localAddress}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
          placeholder="Søndergade 12, 8000 Aarhus"
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={handleLookup}
          disabled={loading || !localAddress.trim()}
          className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Søg'}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-red-600">
          <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {matchedName && coordinates && (
        <>
          <div className="flex items-start gap-2 rounded-md bg-green-50 border border-green-200 p-3">
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-green-800">Placering fundet</p>
              <p className="text-xs text-green-700">{matchedName}</p>
              <p className="text-xs text-green-600 mt-1">
                Er dette den rigtige adresse? Ellers præcisér din søgning.
              </p>
            </div>
          </div>
          <AddressMap coordinates={coordinates} displayName={matchedName} />
        </>
      )}

      <p className="text-xs text-muted-foreground">
        Adressen bruges kun til at bestemme solindfaldsdata og gemmes ikke.
      </p>
    </div>
  )
}
