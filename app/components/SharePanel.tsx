'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export interface SharePanelProps {
  shareUrl: string
  shareText: string
  refCode?: string | null
  listingId?: string | null
  userId?: string | null
}

// ─── Inline SVGs për ikonat e platformave ────────────────────────────────────

function FbIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

function IgIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
    </svg>
  )
}

function LiIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}

function TtIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.79a8.18 8.18 0 0 0 4.79 1.53V6.9a4.85 4.85 0 0 1-1.02-.21z"/>
    </svg>
  )
}

function WaIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  )
}

function VbIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.5 1C5.7 1.1 1.1 5.7 1 11.5c-.04 2.1.55 4 1.53 5.65L1 23l6.09-1.5c1.57.9 3.4 1.41 5.27 1.45C18.1 23.02 23 18.1 23 12c0-6.07-5.1-11.09-11.5-11zm4.55 15.9c-.31.85-1.5 1.58-2.26 1.6-.74.02-1.46-.47-4.31-1.64C6.67 15.6 5 12.02 4.87 11.85c-.13-.17-1.08-1.43-1.08-2.73 0-1.3.68-1.94 1.08-2.1.31-.13.86-.19 1.09.13.22.32.98 1.68 1.07 1.8.09.12.16.37 0 .59-.16.22-.24.36-.46.55-.22.18-.47.4-.27.72.2.31.9 1.48 1.94 2.4 1.33 1.18 2.44 1.55 2.78 1.72.33.17.53.14.72-.08.2-.22.84-.98 1.06-1.32.22-.34.45-.28.76-.17.31.11 1.97.93 2.31 1.09.34.17.57.25.66.4.09.14.09.82-.22 1.65z"/>
    </svg>
  )
}

const PLATFORMS = [
  {
    id: 'facebook' as const,
    label: 'Facebook',
    bg: '#1877F2',
    buildUrl: (u: string, t: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
    Icon: FbIcon,
    openApp: null,
  },
  {
    id: 'instagram' as const,
    label: 'Instagram',
    bg: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
    buildUrl: null,
    Icon: IgIcon,
    openApp: 'https://www.instagram.com',
  },
  {
    id: 'linkedin' as const,
    label: 'LinkedIn',
    bg: '#0A66C2',
    buildUrl: (u: string, t: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}`,
    Icon: LiIcon,
    openApp: null,
  },
  {
    id: 'tiktok' as const,
    label: 'TikTok',
    bg: '#010101',
    buildUrl: null,
    Icon: TtIcon,
    openApp: 'https://www.tiktok.com',
  },
  {
    id: 'whatsapp' as const,
    label: 'WhatsApp',
    bg: '#25D366',
    buildUrl: (u: string, t: string) => `https://wa.me/?text=${encodeURIComponent(t + '\n' + u)}`,
    Icon: WaIcon,
    openApp: null,
  },
  {
    id: 'viber' as const,
    label: 'Viber',
    bg: '#7360F2',
    buildUrl: (u: string, t: string) => `viber://forward?text=${encodeURIComponent(t + '\n' + u)}`,
    Icon: VbIcon,
    openApp: null,
  },
]

type PlatformId = 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'whatsapp' | 'viber' | 'copy'

function logShare(userId: string, platform: PlatformId, listingId?: string | null, refCode?: string | null) {
  supabase.from('shares').insert({
    user_id: userId,
    listing_id: listingId ?? null,
    platform,
    ref_code: refCode ?? null,
  }).then(() => {})
}

function copyText(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text))
  } else {
    fallbackCopy(text)
  }
}

function fallbackCopy(text: string) {
  const el = document.createElement('textarea')
  el.value = text
  el.style.position = 'fixed'
  el.style.opacity = '0'
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
}

export function SharePanel({ shareUrl, shareText, refCode, listingId, userId }: SharePanelProps) {
  const [copied, setCopied] = useState<PlatformId | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  function handlePlatform(p: typeof PLATFORMS[number]) {
    if (userId) logShare(userId, p.id, listingId, refCode)

    if (p.buildUrl) {
      window.open(p.buildUrl(shareUrl, shareText), '_blank', 'noopener,noreferrer')
    } else {
      // Instagram / TikTok: copy link → then open app
      copyText(shareUrl)
      setCopied(p.id as PlatformId)
      setTimeout(() => {
        window.open(p.openApp!, '_blank', 'noopener,noreferrer')
        setCopied(null)
      }, 1200)
    }
  }

  function handleCopyLink() {
    copyText(shareUrl)
    if (userId) logShare(userId, 'copy', listingId, refCode)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {refCode && (
        <div style={{
          background: '#FFFBEA', border: '1px dashed #F5C842', borderRadius: 9,
          padding: '8px 12px', fontSize: 11, color: '#856404',
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#E63312" style={{ flexShrink: 0 }}>
            <path d="M20 12a8 8 0 0 1-8 8 8 8 0 0 1-8-8 8 8 0 0 1 8-8 8 8 0 0 1 8 8m-8-6a6 6 0 0 0-6 6 6 6 0 0 0 6 6 6 6 0 0 0 6-6 6 6 0 0 0-6-6m-1 3h2v2h2v2h-2v2h-2v-2H9v-2h2V9z"/>
          </svg>
          <span>Me kodin tënd — nëse miku regjistrohet fiton <strong>50 pikë!</strong> 🎁</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
        {PLATFORMS.map(p => {
          const isCopying = copied === p.id
          return (
            <button
              key={p.id}
              onClick={() => handlePlatform(p)}
              style={{
                background: isCopying ? '#EAF3DE' : p.bg,
                color: isCopying ? '#3B6D11' : '#fff',
                border: 'none', borderRadius: 10,
                padding: '10px 4px', fontSize: 10, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                transition: 'opacity .15s', minHeight: 62,
              }}
            >
              {isCopying
                ? <span style={{ fontSize: 18, lineHeight: 1 }}>✅</span>
                : <p.Icon />
              }
              {isCopying ? 'Kopjuar!' : p.label}
              {(p.id === 'instagram' || p.id === 'tiktok') && !isCopying && (
                <span style={{ fontSize: 8, opacity: 0.8, fontWeight: 400 }}>kopjo & hap</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Copy link bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        background: '#f4f4f4', borderRadius: 9, padding: '7px 10px',
      }}>
        <span style={{
          flex: 1, fontSize: 11, color: '#666',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{shareUrl}</span>
        <button
          onClick={handleCopyLink}
          style={{
            background: linkCopied ? '#EAF3DE' : '#111',
            color: linkCopied ? '#3B6D11' : '#F5C842',
            border: 'none', borderRadius: 7,
            padding: '6px 12px', fontSize: 11, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
            transition: 'background .2s',
          }}
        >
          {linkCopied ? '✓ Kopjuar' : '🔗 Kopjo'}
        </button>
      </div>
    </div>
  )
}
