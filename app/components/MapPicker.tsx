'use client'

import { useState } from 'react'

interface MapPickerProps {
  lat: number | null
  lng: number | null
  address: string
  onChange: (lat: number, lng: number, address: string) => void
  onCityChange?: (city: string) => void
}

export function MapPicker({ lat, lng, address, onChange, onCityChange }: MapPickerProps) {
  const [input, setInput] = useState(address || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function reverseGeocode(newLat: number, newLng: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}&accept-language=sq`,
        { headers: { 'User-Agent': 'Alpazar/1.0 contact@alpazar.al' } }
      )
      if (!res.ok) throw new Error('geocode error')
      const data = await res.json()
      const addr = data.display_name || `${newLat.toFixed(5)}, ${newLng.toFixed(5)}`
      setInput(addr)
      onChange(newLat, newLng, addr)
      if (onCityChange) {
        const city =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.county ||
          ''
        if (city) onCityChange(city)
      }
    } catch {
      const addr = `${newLat.toFixed(5)}, ${newLng.toFixed(5)}`
      setInput(addr)
      onChange(newLat, newLng, addr)
    }
  }

  function getGPS() {
    if (!navigator.geolocation) {
      setError('GPS nuk mbështetet nga shfletuesi juaj.')
      return
    }
    setLoading(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      async pos => {
        await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
        setLoading(false)
      },
      () => {
        setError('Nuk u mor lokacioni. Kontrollo lejet e GPS-it.')
        setLoading(false)
      },
      { timeout: 10000 }
    )
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setInput(val)
    onChange(lat ?? 0, lng ?? 0, val)
  }

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Shkruaj adresën (rruga, qyteti, zona)..."
          value={input}
          onChange={handleInput}
          style={{
            flex: 1, border: '1.5px solid #ddd', borderRadius: 9, padding: '9px 12px',
            fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#111',
          }}
          onFocus={e => (e.target.style.borderColor = '#F5C842')}
          onBlur={e => (e.target.style.borderColor = '#ddd')}
        />
        <button
          type="button"
          onClick={getGPS}
          disabled={loading}
          aria-label="Gjej lokacionin tim automatikisht"
          style={{
            width: 42, height: 42, background: '#EEF4FF', border: '1px solid #C3DAFB',
            borderRadius: 9, cursor: loading ? 'wait' : 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <div style={{ width: 16, height: 16, border: '2px solid #C3DAFB', borderTopColor: '#185FA5', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/>
              <line x1="12" y1="2" x2="12" y2="6"/>
              <line x1="12" y1="18" x2="12" y2="22"/>
              <line x1="2" y1="12" x2="6" y2="12"/>
              <line x1="18" y1="12" x2="22" y2="12"/>
            </svg>
          )}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 6, fontSize: 11, color: '#E63312' }}>{error}</div>
      )}

      <div style={{ marginTop: 6, fontSize: 11, color: '#aaa', display: 'flex', alignItems: 'center', gap: 5 }}>
        <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="#aaa" style={{ flexShrink: 0 }}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
        Shkruaj manualisht ose kliko ikonën e GPS për lokacion automatik
      </div>

      {input && (
        <div style={{ marginTop: 8, background: '#EEF4FF', border: '1px solid #C3DAFB', borderRadius: 9, padding: '8px 12px', fontSize: 12, color: '#185FA5', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <span>{input}</span>
        </div>
      )}
    </div>
  )
}
