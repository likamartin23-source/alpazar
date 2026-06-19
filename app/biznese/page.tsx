'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Avatar from '../components/Avatar'

interface Biz {
  id: string; name: string; type: string; logo_url: string | null
  city: string | null; description: string | null; is_verified: boolean
  listing_count?: number
}

const TYPE_LABELS: Record<string, string> = {
  sherbime: '🛠️ Shërbime',
  produkte: '📦 Produkte',
  sherbime_produkte: '🔁 Shërbime & Produkte',
}

export default function BiznestPage() {
  const [businesses, setBusinesses] = useState<Biz[]>([])
  const [loading, setLoading]       = useState(true)
  const [loadError, setLoadError]   = useState(false)
  const [search, setSearch]         = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    supabase
      .from('businesses')
      .select('id,name,type,logo_url,city,description,is_verified')
      .order('is_verified', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) { setLoadError(true); setLoading(false); return }
        setBusinesses(data || [])
        setLoading(false)
      })
  }, [])

  const filtered = businesses.filter(b => {
    const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase()) || (b.city || '').toLowerCase().includes(search.toLowerCase())
    const matchType = !typeFilter || b.type === typeFilter
    return matchSearch && matchType
  })

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', background: '#FFFBEA', minHeight: '100vh', paddingBottom: 80, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg,#F5C842,#f0bc30)', padding: '14px 16px 16px' }}>
        <button aria-label="Kthehu mbrapa" onClick={() => window.history.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: 10, padding: 0 }}>
          <i className="ti ti-arrow-left" aria-hidden="true" style={{ fontSize: 22, color: '#111' }} />
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111', margin: '0 0 4px' }}>🏢 Bizneset</h1>
        <p style={{ fontSize: 13, color: '#7B5000', margin: 0 }}>Zbulo bizneset shqiptare në Alpazar</p>
      </div>

      {/* Search + filter */}
      <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Kërko biznes ose qytet..."
          style={{ width: '100%', padding: '10px 14px', border: '1px solid #e5e5e5', borderRadius: 12, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {[
            { key: '', label: 'Të gjithë' },
            { key: 'sherbime', label: '🛠️ Shërbime' },
            { key: 'produkte', label: '📦 Produkte' },
            { key: 'sherbime_produkte', label: '🔁 Të dyja' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setTypeFilter(f.key)}
              style={{ flexShrink: 0, padding: '6px 14px', background: typeFilter === f.key ? '#111' : '#f0f0f0', color: typeFilter === f.key ? '#F5C842' : '#555', border: 'none', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Create business CTA */}
      <div style={{ margin: '12px 16px 4px', background: 'linear-gradient(135deg,#111,#333)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => window.location.href = '/biznese/new'}>
        <div>
          <div style={{ color: '#F5C842', fontWeight: 800, fontSize: 14, marginBottom: 2 }}>+ Krijo Biznesin Tënd</div>
          <div style={{ color: '#aaa', fontSize: 11 }}>Falas · Prezencë profesionale online</div>
        </div>
        <i className="ti ti-arrow-right" style={{ fontSize: 20, color: '#F5C842' }} aria-hidden="true" />
      </div>

      {/* List */}
      <div style={{ padding: '8px 12px' }}>
        {loadError ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 40 }}>⚠️</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Gabim gjatë ngarkimit</div>
            <button onClick={() => window.location.reload()} style={{ background: '#E63312', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Rifresko</button>
          </div>
        ) : loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#eee' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 14, background: '#eee', borderRadius: 6, width: '60%', marginBottom: 7 }} />
                  <div style={{ height: 11, background: '#eee', borderRadius: 5, width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: '#888' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🏢</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{search || typeFilter ? 'Asnjë biznes nuk përputhet' : 'Asnjë biznes ende'}</div>
            {(search || typeFilter) && (
              <button onClick={() => { setSearch(''); setTypeFilter('') }} style={{ marginTop: 12, background: '#F5C842', border: 'none', borderRadius: 10, padding: '8px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Pastro filtrat
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(b => (
              <div
                key={b.id}
                onClick={() => window.location.href = `/biznese/${b.id}`}
                style={{ background: '#fff', borderRadius: 14, padding: 14, display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,.06)', transition: 'transform .1s' }}
              >
                <Avatar src={b.logo_url} name={b.name} type="business" verified={b.is_verified} size={52} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                    {b.is_verified && <span style={{ fontSize: 13 }}>✅</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    {b.type && (
                      <span style={{ fontSize: 10, background: '#FFF8E1', color: '#7B5000', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                        {TYPE_LABELS[b.type] || b.type}
                      </span>
                    )}
                    {b.city && (
                      <span style={{ fontSize: 11, color: '#888' }}>📍 {b.city}</span>
                    )}
                  </div>
                  {b.description && (
                    <div style={{ fontSize: 11, color: '#666', marginTop: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                      {b.description}
                    </div>
                  )}
                </div>
                <i className="ti ti-chevron-right" style={{ fontSize: 16, color: '#ccc', flexShrink: 0 }} aria-hidden="true" />
              </div>
            ))}
            <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 11, color: '#bbb' }}>
              {filtered.length} biznes{filtered.length !== 1 ? 'e' : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
