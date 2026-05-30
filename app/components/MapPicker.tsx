'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import { GoogleMap, Marker, useLoadScript, Autocomplete } from '@react-google-maps/api'

const LIBRARIES: ('places')[] = ['places']

const MAP_CONTAINER_STYLE = { width: '100%', height: '240px', borderRadius: '10px', overflow: 'hidden' }

const DEFAULT_CENTER = { lat: 41.3275, lng: 19.8187 } // Tiranë

interface MapPickerProps {
  lat: number | null
  lng: number | null
  address: string
  onChange: (lat: number, lng: number, address: string) => void
}

export function MapPicker({ lat, lng, address, onChange }: MapPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: apiKey, libraries: LIBRARIES })

  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(
    lat && lng ? { lat, lng } : null
  )
  const [searchInput, setSearchInput] = useState(address || '')
  const mapRef = useRef<google.maps.Map | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  useEffect(() => {
    if (lat && lng) setMarker({ lat, lng })
  }, [lat, lng])

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  const onAutocompleteLoad = useCallback((ac: google.maps.places.Autocomplete) => {
    autocompleteRef.current = ac
  }, [])

  const onPlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace()
    if (!place?.geometry?.location) return
    const newLat = place.geometry.location.lat()
    const newLng = place.geometry.location.lng()
    const newAddr = place.formatted_address || place.name || ''
    setMarker({ lat: newLat, lng: newLng })
    setSearchInput(newAddr)
    mapRef.current?.panTo({ lat: newLat, lng: newLng })
    mapRef.current?.setZoom(15)
    onChange(newLat, newLng, newAddr)
  }, [onChange])

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return
    const newLat = e.latLng.lat()
    const newLng = e.latLng.lng()
    setMarker({ lat: newLat, lng: newLng })
    // Reverse geocode
    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
      const newAddr = status === 'OK' && results?.[0] ? results[0].formatted_address : `${newLat.toFixed(5)}, ${newLng.toFixed(5)}`
      setSearchInput(newAddr)
      onChange(newLat, newLng, newAddr)
    })
  }, [onChange])

  const onMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return
    const newLat = e.latLng.lat()
    const newLng = e.latLng.lng()
    setMarker({ lat: newLat, lng: newLng })
    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
      const newAddr = status === 'OK' && results?.[0] ? results[0].formatted_address : `${newLat.toFixed(5)}, ${newLng.toFixed(5)}`
      setSearchInput(newAddr)
      onChange(newLat, newLng, newAddr)
    })
  }, [onChange])

  function useMyLocation() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(pos => {
      const newLat = pos.coords.latitude
      const newLng = pos.coords.longitude
      setMarker({ lat: newLat, lng: newLng })
      mapRef.current?.panTo({ lat: newLat, lng: newLng })
      mapRef.current?.setZoom(15)
      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
        const newAddr = status === 'OK' && results?.[0] ? results[0].formatted_address : `${newLat.toFixed(5)}, ${newLng.toFixed(5)}`
        setSearchInput(newAddr)
        onChange(newLat, newLng, newAddr)
      })
    })
  }

  if (loadError) return (
    <div style={{ background: '#FFF0EE', border: '1px solid #F09595', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: '#E63312' }}>
      ⚠️ Harta nuk mund të ngarkohet. Kontrollo çelësin e API-t.
    </div>
  )

  if (!isLoaded) return (
    <div style={{ width: '100%', height: 240, background: '#f5f5f0', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, color: '#aaa' }}>
      <div style={{ width: 18, height: 18, border: '2px solid #F5C842', borderTopColor: '#E63312', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      Duke ngarkuar hartën...
    </div>
  )

  return (
    <div>
      {/* Search bar */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 10 }}>
        <Autocomplete
          onLoad={onAutocompleteLoad}
          onPlaceChanged={onPlaceChanged}
          options={{ fields: ['geometry', 'formatted_address', 'name'] }}
        >
          <input
            type="text"
            placeholder="🔍 Kërko adresën ose qytetin..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            style={{
              flex: 1, border: '1.5px solid #ddd', borderRadius: 9, padding: '9px 12px',
              fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#111',
              width: '100%',
            }}
            onFocus={e => (e.target.style.borderColor = '#F5C842')}
            onBlur={e => (e.target.style.borderColor = '#ddd')}
          />
        </Autocomplete>
        <button
          type="button"
          onClick={useMyLocation}
          title="Përdor lokacionin tim"
          style={{
            width: 40, height: 40, background: '#EEF4FF', border: '1px solid #C3DAFB',
            borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}
        >
          <i className="ti ti-current-location" style={{ fontSize: 18, color: '#185FA5' }} />
        </button>
      </div>

      {/* Map */}
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={marker ?? DEFAULT_CENTER}
        zoom={marker ? 14 : 7}
        onLoad={onMapLoad}
        onClick={onMapClick}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControlOptions: { position: 7 },
        }}
      >
        {marker && (
          <Marker
            position={marker}
            draggable
            onDragEnd={onMarkerDragEnd}
          />
        )}
      </GoogleMap>

      {/* Hint */}
      <div style={{ marginTop: 7, fontSize: 11, color: '#999', display: 'flex', alignItems: 'center', gap: 5 }}>
        <i className="ti ti-info-circle" style={{ fontSize: 13 }} />
        Kliko mbi hartë ose zvarrit markesin për lokacion të saktë
      </div>

      {/* Selected address display */}
      {marker && searchInput && (
        <div style={{ marginTop: 8, background: '#EEF4FF', border: '1px solid #C3DAFB', borderRadius: 9, padding: '8px 12px', fontSize: 12, color: '#185FA5', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <i className="ti ti-map-pin" style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }} />
          <span>{searchInput}</span>
        </div>
      )}
    </div>
  )
}
