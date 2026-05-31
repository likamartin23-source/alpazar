'use client'

import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api'

const MAP_CONTAINER_STYLE = { width: '100%', height: '200px', borderRadius: '10px', overflow: 'hidden' }

interface MapDisplayProps {
  lat: number
  lng: number
  address?: string
}

export function MapDisplay({ lat, lng, address }: MapDisplayProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: apiKey, libraries: [] })

  const center = { lat, lng }

  const addressRow = (
    <div style={{ marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
      {address && (
        <span style={{ fontSize: 12, color: '#555', flex: 1 }}>
          <i className="ti ti-map-pin" style={{ fontSize: 13, marginRight: 3, color: '#E63312' }} />
          {address}
        </span>
      )}
      <a
        href={`https://www.google.com/maps?q=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, background: '#EEF4FF',
          color: '#185FA5', border: '1px solid #C3DAFB', borderRadius: 9,
          padding: '6px 12px', fontSize: 11, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
        }}
      >
        <i className="ti ti-map" style={{ fontSize: 13 }} />
        Hap në Maps
      </a>
    </div>
  )

  if (loadError || !apiKey) return (
    <div>
      <div style={{ width: '100%', height: 120, background: '#f5f5f0', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: '#aaa' }}>
        <i className="ti ti-map-off" style={{ fontSize: 22, color: '#ccc' }} />
        <span>Harta nuk është e disponueshme</span>
      </div>
      {addressRow}
    </div>
  )

  if (!isLoaded) return (
    <div>
      <div style={{ width: '100%', height: 200, background: '#f5f5f0', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, color: '#aaa' }}>
        <div style={{ width: 16, height: 16, border: '2px solid #F5C842', borderTopColor: '#E63312', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
        Duke ngarkuar hartën...
      </div>
      {addressRow}
    </div>
  )

  return (
    <div>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={15}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: true,
          scrollwheel: false,
          draggable: true,
        }}
      >
        <Marker position={center} />
      </GoogleMap>
      {addressRow}
    </div>
  )
}
