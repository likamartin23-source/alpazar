'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function SavedSearchesPage() {
  const [searches, setSearches] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [userId, setUserId]     = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = '/auth/login'; return }
      setUserId(session.user.id)
      const { data } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      setSearches(data || [])
      setLoading(false)
    })
  }, [])

  async function toggleNotify(id: string, current: boolean) {
    setSearches(prev => prev.map(s => s.id === id ? { ...s, notify: !current } : s))
    await supabase.from('saved_searches').update({ notify: !current }).eq('id', id)
  }

  async function deleteSearch(id: string) {
    setSearches(prev => prev.filter(s => s.id !== id))
    await supabase.from('saved_searches').delete().eq('id', id)
  }

  function runSearch(s: any) {
    const filters = s.filters || {}
    const p = new URLSearchParams()
    if (s.query) p.set('q', s.query)
    if (filters.cat)      p.set('cat', filters.cat)
    if (filters.city)     p.set('city', filters.city)
    if (filters.cond)     p.set('cond', filters.cond)
    if (filters.priceMin) p.set('priceMin', filters.priceMin)
    if (filters.priceMax) p.set('priceMax', filters.priceMax)
    window.location.href = `/search/results?${p.toString()}`
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 0 80px' }}>
      <div style={{ padding: '12px 16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => window.history.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 22, color: '#111' }} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#111', margin: 0 }}>Kërkimet e ruajtura 🔔</h1>
      </div>

      <div style={{ padding: '16px' }}>
        {loading ? (
          <div style={{ color: '#888', textAlign: 'center', padding: 40 }}>Duke ngarkuar...</div>
        ) : searches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#111', marginBottom: 8 }}>Ende s'ke kërkime të ruajtura</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Ruaj filtrat e kërkimit dhe njoftohu kur dalin shpallje të reja</div>
            <button
              onClick={() => { window.location.href = '/search' }}
              style={{ background: '#E63312', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              🔍 Fillo një kërkim
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {searches.map(s => {
              const filters = s.filters || {}
              const tags = [
                s.query && `"${s.query}"`,
                filters.city, filters.cond,
                filters.priceMin && `min ${filters.priceMin}L`,
                filters.priceMax && `max ${filters.priceMax}L`,
              ].filter(Boolean)
              return (
                <div key={s.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: 14, padding: '14px 14px 12px', boxShadow: '0 1px 6px rgba(0,0,0,.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                        {tags.map(t => (
                          <span key={t} style={{ background: '#F5F5F5', color: '#444', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6 }}>{t}</span>
                        ))}
                      </div>
                      <button
                        onClick={() => runSearch(s)}
                        style={{ background: 'none', border: 'none', color: '#E63312', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                      >
                        🔍 Kërko tani →
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={() => toggleNotify(s.id, s.notify)}
                        title={s.notify ? 'Çaktivizo njoftime' : 'Aktivizo njoftime'}
                        style={{
                          width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                          background: s.notify ? '#E63312' : '#ddd', position: 'relative', transition: 'background .2s',
                        }}
                      >
                        <div style={{
                          position: 'absolute', top: 2, left: s.notify ? 18 : 2,
                          width: 16, height: 16, borderRadius: '50%', background: '#fff',
                          transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                        }} />
                      </button>
                      <button
                        onClick={() => deleteSearch(s.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', padding: 4 }}
                      >
                        <i className="ti ti-trash" style={{ fontSize: 16 }} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
