'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import dynamicImport from 'next/dynamic'
import Avatar from '../../components/Avatar'
import ListingCard from '../../components/ListingCard'

const MapDisplay = dynamicImport(() => import('../../components/MapDisplay').then(m => ({ default: m.MapDisplay })), { ssr: false })

interface Biz {
  id: string; owner_id: string; name: string; slug: string; type: string
  logo_url: string | null; cover_url: string | null; description: string | null
  address: string | null; latitude: number | null; longitude: number | null
  phone: string | null; website: string | null; hours: any; is_verified: boolean
  created_at: string; city: string | null; email: string | null
  nipt: string | null; withdrawal_days: number | null; updated_at: string | null
}

export default function BiznesPageClient({ params, initialBiz }: { params: { id: string }; initialBiz?: any }) {
  const [biz, setBiz]               = useState<Biz | null>(initialBiz ?? null)
  const [subcats, setSubcats]       = useState<any[]>([])
  const [listings, setListings]     = useState<any[]>([])
  const [loading, setLoading]       = useState(!initialBiz)
  const [loadError, setLoadError]   = useState(false)
  const [activeTab, setActiveTab]   = useState<'grid' | 'info' | 'reviews'>('grid')
  const [userId, setUserId]         = useState<string | null>(null)
  const [isOwner, setIsOwner]       = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)
  const [totalViews, setTotalViews] = useState(0)
  // Faqja renderohet edhe ne server (`initialBiz`). Koha relative e kartes
  // varet nga `Date.now()`, ndaj i jepet ListingCard-it vetem pas montimit.
  const [mounted, setMounted]       = useState(false)

  // Ndjekesit. Tabela `business_followers` ekzistonte ne baze me RLS te plote
  // (lexim publik; shto/hiq vetem rreshtin tend) por asnje ekran nuk e prekte.
  const [followers, setFollowers]   = useState(0)
  const [following, setFollowing]   = useState(false)
  const [followBusy, setFollowBusy] = useState(false)

  useEffect(() => {
    setMounted(true)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUserId(session.user.id)
    })
    fetchBiz()
  }, [])

  async function refreshFollow(bizId: string) {
    const { count } = await supabase
      .from('business_followers')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', bizId)
    setFollowers(count ?? 0)

    const uid = (await supabase.auth.getSession()).data.session?.user.id
    if (!uid) { setFollowing(false); return }
    const { data: mine } = await supabase
      .from('business_followers')
      .select('id')
      .eq('business_id', bizId)
      .eq('user_id', uid)
      .maybeSingle()
    setFollowing(!!mine)
  }

  async function toggleFollow() {
    if (followBusy || !biz) return
    if (!userId) { window.location.href = '/auth/login'; return }
    setFollowBusy(true)
    // Numri perditesohet ne cast dhe kthehet mbrapsht nese shkruarja deshton —
    // butoni s'duhet te rrije i ngrire sa te vije pergjigjja.
    const wasFollowing = following
    setFollowing(!wasFollowing)
    setFollowers(n => n + (wasFollowing ? -1 : 1))

    const { error } = wasFollowing
      ? await supabase.from('business_followers').delete().eq('business_id', biz.id).eq('user_id', userId)
      : await supabase.from('business_followers').insert({ business_id: biz.id, user_id: userId })

    if (error) {
      setFollowing(wasFollowing)
      setFollowers(n => n + (wasFollowing ? 1 : -1))
    }
    setFollowBusy(false)
  }

  async function fetchBiz() {
    try {
      let { data: b } = await supabase.from('businesses').select('*').eq('id', params.id).maybeSingle()
      if (!b) {
        const res = await supabase.from('businesses').select('*').eq('owner_id', params.id).maybeSingle()
        b = res.data
      }
      if (!b) { setLoading(false); return }
      setBiz(b)
      setIsOwner((await supabase.auth.getSession()).data.session?.user.id === b.owner_id)

      const { data: mapRows } = await supabase
        .from('business_subcategory_map')
        .select('subcategory_id, business_subcategories(name, icon)')
        .eq('business_id', b.id)
      if (mapRows) setSubcats(mapRows.map((r: any) => r.business_subcategories).filter(Boolean))

      // `created_at` dhe `rank_tier` u shtuan bashke me ListingCard: karta
      // shfaq kohen relative dhe shenjen VIP, te dyja mungonin ne kete select.
      const { data: ls } = await supabase
        .from('listings')
        .select('id,title,price,currency,images,condition,city,is_premium,views_count,created_at,rank_tier')
        .eq('business_id', b.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20)
      if (ls) {
        setListings(ls)
        setTotalViews(ls.reduce((s: number, l: any) => s + (l.views_count || 0), 0))
      }

      await refreshFollow(b.id)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  // `fmt` u hoq bashke me grid-in e vjeter: ishte i vetmi perdorues i tij dhe
  // formatonte me `toLocaleString('sq-AL')`, qe jep rezultat te ndryshem ne
  // server e ne shfletues (shih lib/format.ts). ListingCard perdor `nf()`.

  function share() {
    if (navigator.share) navigator.share({ title: biz?.name, url: window.location.href })
    else navigator.clipboard?.writeText(window.location.href)
  }

  if (loadError) return (
    <div style={{ maxWidth: 480, margin: '0 auto', background: '#FFFBEA', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }} aria-hidden="true">⚠️</div>
      <div style={{ fontSize: 14, color: '#C42B0F', marginBottom: 16, textAlign: 'center' }}>Nuk u ngarkua biznesi. Kontrollo lidhjen dhe provo sërish.</div>
      <button type="button" onClick={() => window.location.reload()} style={{ background: 'linear-gradient(135deg,#E63312,#c42a0e)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Rifresko</button>
    </div>
  )

  if (loading) return (
    <div style={{ maxWidth: 480, margin: '0 auto', background: '#f8f8f8', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg,#F5C842,#E63312)', aspectRatio: '16/7' }} />
      <div style={{ padding: 16 }}>
        <div style={{ height: 24, background: '#eee', borderRadius: 8, marginBottom: 10, width: '60%' }} />
        <div style={{ height: 14, background: '#eee', borderRadius: 6, width: '40%' }} />
      </div>
    </div>
  )

  if (!biz) return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 40, textAlign: 'center', background: '#FFFBEA', minHeight: '100vh' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }} aria-hidden="true">🏢</div>
      <div style={{ fontWeight: 700, color: '#111', marginBottom: 16 }}>Biznesi nuk u gjet</div>
      <button type="button" onClick={() => window.history.back()} style={{ background: 'linear-gradient(135deg,#E63312,#c42a0e)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>← Kthehu</button>
    </div>
  )

  const descShort = (biz.description || '').length > 120
  const descText  = descExpanded || !descShort ? biz.description : (biz.description || '').slice(0, 120) + '…'

  return (
    <div className="biz-page">
      <style dangerouslySetInnerHTML={{ __html: `
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;}
        /* Gjeresia rrinte si stil inline (maxWidth:480) mbi rrenjen, pra nuk
           kapërcehej dot me CSS dhe desktopi mbetej nje shirit i ngushte.
           Tani eshte klase: mobili identik (480 i centruar), dhe nga 1000px
           e siper dy kolona — koka/info ngjitese majtas, tabet me grid-in
           djathtas, si te faqja e shpalljes (PR #72). */
        .biz-page{background:#f2f2f2;min-height:100vh;padding-bottom:60px;}
        .biz-shell{max-width:480px;margin:0 auto;}
        @media (min-width:1000px){
          .biz-shell{max-width:1120px;display:grid;grid-template-columns:minmax(320px,390px) 1fr;gap:24px;align-items:start;padding:0 20px;}
          .biz-left{position:sticky;top:12px;align-self:start;max-height:calc(100vh - 24px);overflow-y:auto;overscroll-behavior:contain;}
          .biz-left::-webkit-scrollbar{width:0;}
          .biz-right{min-width:0;}
        }
        .biz-tab{flex:1;padding:13px 0;font-size:13px;font-weight:700;border:none;background:none;cursor:pointer;border-bottom:2.5px solid transparent;color:#888;font-family:inherit;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:4px;}
        .biz-tab.active{color:#C42B0F;border-bottom-color:#E63312;}
        /* Grid-i .ig-* (katror 1/1, vetem foto + cmim) u zevendesua nga
           .listings-grid + ListingCard — stilet e tyre rrine te
           app/ui-refine.css, seksioni 8. */
        .action-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:11px 0;border-radius:12px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;border:none;box-shadow:0 2px 8px -2px rgba(0,0,0,.25);transition:transform .15s ease,box-shadow .15s ease;}
        .action-btn:hover{transform:translateY(-1px);}
        .action-btn:active{opacity:.8;}
        .info-row{display:flex;align-items:flex-start;gap:10px;padding:11px 0;border-bottom:1px solid #f0f0f0;}
        .info-row:last-child{border:none;}
        .info-icon{font-size:16px;min-width:22px;text-align:center;margin-top:1px;}
        .info-text{font-size:13px;color:#333;line-height:1.5;flex:1;}
        .info-text a{color:#C42B0F;font-weight:700;text-decoration:none;}
        .stat-pill{display:flex;flex-direction:column;align-items:center;flex:1;}
        .stat-n{font-size:18px;font-weight:800;color:#111;}
        .stat-l{font-size:10px;color:#888;font-weight:500;margin-top:1px;}
        .card{background:#fff;border-radius:16px;margin:8px 12px 0;padding:16px;}
        .card-title{font-size:13px;font-weight:800;color:#111;margin-bottom:14px;display:flex;align-items:center;gap:6px;}
      ` }} />

      <div className="biz-shell">
      <div className="biz-left">
      {/* ── Cover photo ────────────────────────────────────── */}
      <div style={{ position: 'relative' }}>
        <div style={{ aspectRatio: '16/7', overflow: 'hidden', background: 'linear-gradient(135deg,#F5C842,#E63312)' }}>
          {biz.cover_url && (
            <img src={biz.cover_url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          )}
        </div>

        {/* Floating buttons */}
        <button type="button" aria-label="Kthehu mbrapa" onClick={() => window.history.back()} style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,.45)', border: 'none', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <i className="ti ti-arrow-left" aria-hidden="true" style={{ fontSize: 18, color: '#fff' }} />
        </button>
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
          <button type="button" aria-label="Ndaj biznesin" onClick={share} style={{ background: 'rgba(0,0,0,.45)', border: 'none', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <i className="ti ti-share" style={{ fontSize: 16, color: '#fff' }} aria-hidden="true" />
          </button>
          {isOwner && (
            <button type="button" aria-label="Edito biznesin" onClick={() => window.location.href = `/biznese/${biz.id}/edit`} style={{ background: 'rgba(0,0,0,.45)', border: 'none', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <i className="ti ti-pencil" style={{ fontSize: 16, color: '#fff' }} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* ── Identity card (white, rounded top) ──────────────── */}
      <div style={{ background: '#fff', borderRadius: '0 0 20px 20px', paddingBottom: 16, marginBottom: 8 }}>
        {/* Avatar overlapping the cover */}
        <div style={{ position: 'relative', marginTop: -42, marginLeft: 16, marginBottom: 10 }}>
          <Avatar
            src={biz.logo_url}
            name={biz.name}
            type="business"
            verified={biz.is_verified}
            size={84}
          />
        </div>

        {/* Name + verified */}
        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111', lineHeight: 1.2 }}>{biz.name}</h1>
            {biz.is_verified && (
              <span style={{ fontSize: 18, lineHeight: 1 }} aria-hidden="true">✅</span>
            )}
          </div>
          {biz.is_verified && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 6, display: 'inline-block', marginBottom: 10 }}>Biznes i verifikuar</span>
          )}

          {/* Category chips */}
          {subcats.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
              {subcats.map((s, i) => (
                <span key={i} style={{ fontSize: 11, background: '#FFF8E1', color: '#7B5000', padding: '3px 10px', borderRadius: 12, fontWeight: 700, border: '1px solid #F5C84233' }}>
                  {s.icon} {s.name}
                </span>
              ))}
            </div>
          )}

          {/* Stats row */}
          <div style={{ display: 'flex', borderTop: '1px solid #f0f0f0', paddingTop: 14, marginBottom: 14 }}>
            <div className="stat-pill">
              <span className="stat-n">{listings.length}</span>
              <span className="stat-l">Shpallje</span>
            </div>
            <div style={{ width: 1, background: '#f0f0f0' }} />
            <div className="stat-pill">
              <span className="stat-n">{totalViews >= 1000 ? (totalViews / 1000).toFixed(1) + 'K' : totalViews}</span>
              <span className="stat-l">Shikime</span>
            </div>
            <div style={{ width: 1, background: '#f0f0f0' }} />
            <div className="stat-pill">
              <span className="stat-n">{followers}</span>
              <span className="stat-l">Ndjekës</span>
            </div>
            <div style={{ width: 1, background: '#f0f0f0' }} />
            <div className="stat-pill">
              <span className="stat-n">{new Date(biz.created_at).getFullYear()}</span>
              <span className="stat-l">Anëtar prej</span>
            </div>
          </div>

          {/* Lidhja biznes → person. Gjysma tjeter e ndërlidhjes: profili i
              personit çon te biznesi i tij (§4.5). */}
          {biz.owner_id && (
            <div style={{ marginBottom: 12 }}>
              <a
                href={`/u/${biz.owner_id}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#5a5a5a', textDecoration: 'none', minHeight: 36 }}>
                <i className="ti ti-user" style={{ fontSize: 13 }} aria-hidden="true" />
                Menaxhuar nga <span style={{ color: '#C42305', fontWeight: 700 }}>profili i pronarit →</span>
              </a>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {biz.phone && (
              <a href={`tel:${biz.phone}`} className="action-btn" style={{ background: 'linear-gradient(135deg,#E63312,#c42a0e)', color: '#fff' }}>
                <i className="ti ti-phone" style={{ fontSize: 15 }} aria-hidden="true" /> Telefono
              </a>
            )}
            <button type="button" aria-label="Dërgo mesazh" onClick={() => { if (!userId) { window.location.href = '/auth/login'; return } window.location.href = `/messages?biz=${biz.id}` }}
              className="action-btn" style={{ background: 'linear-gradient(135deg,#1a1a1a,#000)', color: '#F5C842' }}>
              <i className="ti ti-message" style={{ fontSize: 15 }} aria-hidden="true" /> Mesazh
            </button>
            {!isOwner && (
              <button
                type="button"
                onClick={toggleFollow}
                disabled={followBusy}
                aria-pressed={following}
                aria-label={following ? 'Mos e ndiq më këtë biznes' : 'Ndiq këtë biznes'}
                className="action-btn"
                style={following
                  ? { background: '#fff', color: '#C42305', border: '1.5px solid #C42305', boxShadow: 'none' }
                  : { background: 'linear-gradient(135deg,#F8D24E,#F5C842)', color: '#111' }}>
                <i className={`ti ti-${following ? 'check' : 'plus'}`} style={{ fontSize: 15 }} aria-hidden="true" />
                {following ? 'Po ndjek' : 'Ndiq'}
              </button>
            )}
            <button type="button" aria-label="Ndaj" onClick={share} className="action-btn" style={{ background: '#f0f0f0', color: '#333', flex: '0 0 48px' }}>
              <i className="ti ti-share-3" style={{ fontSize: 17 }} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Description preview ──────────────────────────────── */}
      {biz.description && (
        <div style={{ background: '#fff', margin: '0 0 8px', padding: '14px 16px' }}>
          <p style={{ fontSize: 13, color: '#444', lineHeight: 1.65, margin: 0 }}>{descText}</p>
          {descShort && (
            <button type="button" aria-expanded={descExpanded} onClick={() => setDescExpanded(e => !e)} style={{ marginTop: 6, background: 'none', border: 'none', color: '#C42B0F', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
              {descExpanded ? 'Shfaq më pak ↑' : 'Shfaq më shumë ↓'}
            </button>
          )}
        </div>
      )}

      {/* ── Quick info strip ─────────────────────────────────── */}
      <div style={{ background: '#fff', margin: '0 0 8px', padding: '4px 16px' }}>
        {biz.address && (
          <div className="info-row">
            <span className="info-icon" aria-hidden="true">📍</span>
            <span className="info-text">{biz.address}</span>
          </div>
        )}
        {biz.phone && (
          <div className="info-row">
            <span className="info-icon" aria-hidden="true">📞</span>
            <span className="info-text"><a href={`tel:${biz.phone}`}>{biz.phone}</a></span>
          </div>
        )}
        {biz.website && (
          <div className="info-row">
            <span className="info-icon" aria-hidden="true">🌐</span>
            <span className="info-text"><a href={biz.website} target="_blank" rel="noopener noreferrer">{biz.website.replace(/^https?:\/\//, '')}</a></span>
          </div>
        )}
        {biz.hours?.schedule && (
          <div className="info-row">
            <span className="info-icon" aria-hidden="true">🕐</span>
            <span className="info-text">{biz.hours.schedule}</span>
          </div>
        )}
      </div>

      </div>{/* /biz-left */}

      <div className="biz-right">
      {/* ── Sticky tabs ──────────────────────────────────────── */}
      <div role="tablist" aria-label="Seksionet e biznesit" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', borderBottom: '1px solid #eee', display: 'flex', marginBottom: 2 }}>
        <button id="tab-grid" type="button" role="tab" aria-selected={activeTab === 'grid'} aria-controls="tabpanel-grid" className={`biz-tab ${activeTab === 'grid' ? 'active' : ''}`} onClick={() => setActiveTab('grid')}>
          <i className="ti ti-layout-grid" style={{ fontSize: 14 }} aria-hidden="true" /> Shpalljet
        </button>
        <button id="tab-info" type="button" role="tab" aria-selected={activeTab === 'info'} aria-controls="tabpanel-info" className={`biz-tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
          <i className="ti ti-info-circle" style={{ fontSize: 14 }} aria-hidden="true" /> Info
        </button>
        <button id="tab-reviews" type="button" role="tab" aria-selected={activeTab === 'reviews'} aria-controls="tabpanel-reviews" className={`biz-tab ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
          <i className="ti ti-star" style={{ fontSize: 14 }} aria-hidden="true" /> Vlerësime
        </button>
      </div>

      {/* ── Instagram grid tab ───────────────────────────────── */}
      {activeTab === 'grid' && (
        <div id="tabpanel-grid" role="tabpanel" aria-labelledby="tab-grid">
          {listings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: '#aaa', background: '#fff' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }} aria-hidden="true">🛍️</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#666', marginBottom: 6 }}>Asnjë shpallje ende</div>
              {isOwner && (
                <button type="button" onClick={() => window.location.href = '/listing/new'} style={{ marginTop: 8, background: 'linear-gradient(135deg,#E63312,#c42a0e)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 24px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>+ Shto shpallje</button>
              )}
            </div>
          ) : (
            // I njejti komponent si te kryefaqja — keshtu kartat e biznesit
            // marrin titull dhe cmim poshte fotos, jo vetem nje pill cmimi mbi
            // te. `showSeller={false}`: te gjitha shpalljet ketu i perkasin
            // ketij biznesi, ndaj chip-i i shitesit vetem do te perseritej.
            <div className="listings-grid" style={{ padding: 12, marginBottom: 0 }}>
              {listings.map((l, idx) => (
                <ListingCard key={l.id} listing={l as any} index={idx} showSeller={false} mounted={mounted} />
              ))}
            </div>
          )}
          <div style={{ textAlign: 'center', padding: '14px 0', fontSize: 11, color: '#bbb' }}>
            <>{listings.length} shpallje aktive <span aria-hidden="true">♾️</span></>
          </div>
        </div>
      )}

      {/* ── Info tab ─────────────────────────────────────────── */}
      {activeTab === 'info' && (
        <div id="tabpanel-info" role="tabpanel" aria-labelledby="tab-info" style={{ padding: '8px 0' }}>
          <div className="card">
            <h2 className="card-title"><i className="ti ti-building-store" style={{ fontSize: 16, color: '#C42B0F' }} aria-hidden="true" /> Rreth biznesit</h2>
            {biz.description
              ? <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7, marginBottom: 12 }}>{biz.description}</p>
              : <p style={{ fontSize: 12, color: '#aaa', marginBottom: 12 }}>Nuk ka përshkrim.</p>
            }
            {biz.type && (
              <div className="info-row">
                <span className="info-icon" aria-hidden="true">🏷️</span>
                <span className="info-text" style={{ textTransform: 'capitalize' }}>{biz.type}</span>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="card-title"><i className="ti ti-map-pin" style={{ fontSize: 16, color: '#C42B0F' }} aria-hidden="true" /> Vendndodhja & Kontakti</h2>
            {biz.address && (
              <div className="info-row">
                <span className="info-icon" aria-hidden="true">📍</span>
                <span className="info-text">{biz.address}</span>
              </div>
            )}
            {biz.city && (
              <div className="info-row">
                <span className="info-icon" aria-hidden="true">🏙️</span>
                <span className="info-text">{biz.city}</span>
              </div>
            )}
            {biz.phone && (
              <div className="info-row">
                <span className="info-icon" aria-hidden="true">📞</span>
                <span className="info-text"><a href={`tel:${biz.phone}`}>{biz.phone}</a></span>
              </div>
            )}
            {biz.email && (
              <div className="info-row">
                <span className="info-icon" aria-hidden="true">✉️</span>
                <span className="info-text"><a href={`mailto:${biz.email}`}>{biz.email}</a></span>
              </div>
            )}
            {biz.website && (
              <div className="info-row">
                <span className="info-icon" aria-hidden="true">🌐</span>
                <span className="info-text"><a href={biz.website} target="_blank" rel="noopener noreferrer">{biz.website.replace(/^https?:\/\//, '')}</a></span>
              </div>
            )}
            {biz.hours?.schedule && (
              <div className="info-row">
                <span className="info-icon" aria-hidden="true">🕐</span>
                <span className="info-text">{biz.hours.schedule}</span>
              </div>
            )}
          </div>

          {subcats.length > 0 && (
            <div className="card">
              <h2 className="card-title"><i className="ti ti-tag" style={{ fontSize: 16, color: '#C42B0F' }} aria-hidden="true" /> Kategoritë</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {subcats.map((s, i) => (
                  <span key={i} style={{ fontSize: 12, background: '#FFF8E1', color: '#7B5000', padding: '5px 12px', borderRadius: 20, fontWeight: 700, border: '1px solid #F5C84244' }}>
                    {s.icon} {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {biz.latitude && biz.longitude && (
            <div style={{ margin: '8px 12px 0', borderRadius: 16, overflow: 'hidden' }}>
              <MapDisplay lat={biz.latitude} lng={biz.longitude} address={biz.address || biz.name} />
            </div>
          )}

          {(biz.nipt || biz.withdrawal_days) && (
            <div className="card">
              <h2 className="card-title"><i className="ti ti-scale" style={{ fontSize: 16, color: '#C42B0F' }} aria-hidden="true" /> Informacion ligjor</h2>
              {biz.nipt && (
                <div className="info-row">
                  <span className="info-icon" aria-hidden="true">🏛️</span>
                  <span className="info-text">NIPT: <strong>{biz.nipt}</strong></span>
                </div>
              )}
              {(biz.withdrawal_days ?? 0) > 0 && (
                <div className="info-row">
                  <span className="info-icon" aria-hidden="true">↩️</span>
                  <span className="info-text">E drejta e tërheqjes: <strong>{biz.withdrawal_days} ditë</strong> (Direktiva EU 2011/83/EU)</span>
                </div>
              )}
            </div>
          )}

          <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 11, color: '#bbb' }}>
            Anëtar që nga {new Date(biz.created_at).toLocaleDateString('sq-AL', { month: 'long', year: 'numeric' })}
          </div>
        </div>
      )}

      {/* ── Reviews tab ──────────────────────────────────────── */}
      {activeTab === 'reviews' && (
        <div id="tabpanel-reviews" role="tabpanel" aria-labelledby="tab-reviews" style={{ background: '#fff', margin: 8, borderRadius: 16, padding: '40px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 14 }} aria-hidden="true">⭐</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#111', marginBottom: 6 }}>Vlerësimet vijnë së shpejti</div>
          <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>Klientët do të mund të lënë vlerësime<br />për shërbimin dhe produktet e biznesit.</div>
        </div>
      )}
      </div>{/* /biz-right */}
      </div>{/* /biz-shell */}
    </div>
  )
}
