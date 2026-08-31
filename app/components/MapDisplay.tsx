'use client'

interface MapDisplayProps {
  lat: number
  lng: number
  address?: string
}

export function MapDisplay({ lat, lng, address }: MapDisplayProps) {
  const delta = 0.008
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`

  return (
    <div>
      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height: 200 }}>
        <iframe
          src={embedUrl}
          width="100%"
          height="200"
          style={{ border: 'none', display: 'block' }}
          loading="lazy"
          title="Vendndodhja e shpalljes"
        />
      </div>
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
        {address && (
          <span style={{ fontSize: 12, color: '#555', flex: 1 }}>
            <i className="ti ti-map-pin" style={{ fontSize: 13, marginRight: 3, color: '#C42B0F' }} aria-hidden="true" />
            {address}
          </span>
        )}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, background: '#EEF4FF',
            color: '#185FA5', border: '1px solid #C3DAFB', borderRadius: 9,
            padding: '6px 12px', fontSize: 11, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
          }}
        >
          <i className="ti ti-map" style={{ fontSize: 13 }} aria-hidden="true" />
          Hap në Maps
        </a>
      </div>
    </div>
  )
}
