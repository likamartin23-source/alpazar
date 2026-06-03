'use client'
import { useState } from 'react'

/**
 * ALPAZAR — Avatar origjinal
 * Unazë statusi (gri / ar→kuq / biznes) + badge (✓ / 🏢) + iniciale elegante kur s'ka foto.
 * Një komponent, përdorim i njëtrajtshëm kudo (shpallje, profil, biznes, mesazhe).
 * Rregullat Alpazar: CSS inline, JO Tailwind, JO @/, font Plus Jakarta Sans.
 */

type AvatarType = 'user' | 'premium' | 'business'

interface AvatarProps {
  src?: string | null
  name?: string | null
  type?: AvatarType
  verified?: boolean
  size?: number
  onClick?: () => void
}

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const clean = name.replace(/[_\-.]/g, ' ').trim()
  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function ringStyle(type: AvatarType): React.CSSProperties {
  if (type === 'premium')
    return { background: 'linear-gradient(135deg,#F5C842,#E63312)' }
  if (type === 'business')
    return { background: 'linear-gradient(135deg,#111,#E63312)' }
  return { background: '#e2e2e2' }
}

export default function Avatar({
  src, name, type = 'user', verified = false, size = 48, onClick,
}: AvatarProps) {
  const [broken, setBroken] = useState(false)
  const showImage = src && !broken
  const ring = Math.max(2, Math.round(size * 0.07))
  const white = Math.max(1, Math.round(size * 0.04))
  const inner = size - ring * 2 - white * 2
  const badge = Math.round(size * 0.34)
  const initialsFont = Math.round(inner * 0.4)

  return (
    <div onClick={onClick} style={{ position: 'relative', width: size, height: size, flexShrink: 0, cursor: onClick ? 'pointer' : 'default', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ width: size, height: size, borderRadius: '50%', padding: ring, boxSizing: 'border-box', ...ringStyle(type), transition: 'transform .15s ease' }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#fff', padding: white, boxSizing: 'border-box' }}>
          {showImage ? (
            <img src={src as string} alt={name || 'avatar'} onError={() => setBroken(true)} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#F5C842,#E63312)', color: '#fff', fontWeight: 800, fontSize: initialsFont, letterSpacing: 0.5, userSelect: 'none' }}>
              {getInitials(name)}
            </div>
          )}
        </div>
      </div>
      {(type === 'business' || verified) && (
        <div style={{ position: 'absolute', right: -2, bottom: -2, width: badge, height: badge, borderRadius: '50%', background: verified ? '#16a34a' : '#111', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(badge * 0.55), color: '#fff', lineHeight: 1 }}>
          {verified ? '✓' : '🏢'}
        </div>
      )}
    </div>
  )
}
