'use client'
import { useEffect, useState } from 'react'

const API = 'https://sopafwfkrxpcdaljddoh.supabase.co/functions/v1/api'

async function apiFetch(path: string) {
  try {
    const r = await fetch(`${API}/${path}`)
    if (!r.ok) return null
    return r.json()
  } catch { return null }
}

const CSS=`*{box-sizing:border-box;margin:0;padding:0;}body{background:#FFFBEA;font-family:'Plus Jakarta Sans',system-ui,sans-serif;}.wrap{max-width:480px;margin:0 auto;background:#FFFBEA;padding-bottom:80px;}.hdr{background:#F5C842;position:sticky;top:0;z-index:50;}.top{padding:10px 14px;display:flex;align-items:center;justify-content:space-between;}.logo{display:flex;align-items:center;gap:8px;cursor:pointer;}.brand{font-size:19px;font-weight:700;color:#111;letter-spacing:2px;}.navr{display:flex;gap:6px;align-items:center;}.hbtn{width:33px;height:33px;background:rgba(0,0,0,.1);border-radius:50%;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;}.hbtn i{font-size:16px;color:#111;}.lbtn{background:#111;color:#F5C842;border:none;border-radius:7px;padding:7px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;}.srch{padding:0 12px 10px;display:flex;gap:7px;}.sbox{flex:1;background:#fff;border-radius:9px;display:flex;align-items:center;padding:0 11px;gap:7px;border:0.5px solid #e0b030;}.sbox i{font-size:14px;color:#ccc;}.sbox input{border:none;background:transparent;font-size:13px;color:#111;outline:none;flex:1;padding:9px 0;font-family:inherit;}.sbox input::placeholder{color:#ccc;}.sbtn{background:#111;color:#F5C842;border:none;border-radius:9px;padding:10px 13px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;}.cgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:3px;padding:0 10px 10px;}.ci{background:#fff;border:none;border-radius:8px;padding:6px 2px 5px;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;font-family:inherit;}.ci.on{background:#F5C842;}.ci i{font-size:15px;color:#999;}.ci.on i{color:#111;}.ci span{font-size:6px;color:#777;text-align:center;font-weight:500;line-height:1.2;}.ci.on span{color:#111;font-weight:700;}.body{padding:0 10px;}.noads{background:#EAF3DE;border:0.5px solid #97C459;border-radius:6px;padding:5px 11px;display:flex;align-items:center;gap:5px;margin-bottom:8px;}.noads i{font-size:12px;color:#3B6D11;}.noads span{font-size:9px;color:#3B6D11;font-weight:700;}.hero{background:#111;border-radius:12px;padding:14px;display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;position:relative;overflow:hidden;}.hs{position:absolute;top:0;bottom:0;width:3px;background:#E63312;}.hero h2{color:#F5C842;font-size:12px;font-weight:700;margin-bottom:3px;}.hero p{color:#888;font-size:9px;}.hst{display:flex;gap:12px;}.hn{text-align:center;}.hn-v{color:#F5C842;font-size:15px;font-weight:700;}.hn-l{color:#666;font-size:7px;}.aib{background:#111;border-radius:11px;padding:10px 13px;display:flex;align-items:center;gap:8px;border:1px solid #E63312;margin-bottom:8px;}.ai-i{width:29px;height:29px;background:#F5C842;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}.ai-i i{font-size:14px;color:#111;}.ai-t strong{color:#F5C842;font-size:11px;font-weight:700;display:block;}.ai-t span{color:#888;font-size:8.5px;}.ai-btn{background:#E63312;color:#fff;border:none;border-radius:7px;padding:7px 11px;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:inherit;}.tr{display:flex;gap:4px;margin-bottom:8px;}.tc{flex:1;border-radius:7px;padding:5px 4px;display:flex;align-items:center;gap:3px;}.tg{background:#EAF3DE;border:0.5px solid #97C459;}.tb{background:#EEF4FF;border:0.5px solid #85B7EB;}.tr_{background:#FFF0EE;border:0.5px solid #F09595;}.tc i{font-size:11px;}.tc span{font-size:7.5px;font-weight:600;}.tg i,.tg span{color:#3B6D11;}.tb i,.tb span{color:#185FA5;}.tr_ i,.tr_ span{color:#A32D2D;}.frow{display:flex;gap:4px;margin-bottom:8px;overflow-x:auto;}.frow::-webkit-scrollbar{display:none;}.fb{background:#fff;border:0.5px solid #e0b030;border-radius:20px;padding:5px 11px;font-size:9.5px;color:#555;white-space:nowrap;flex-shrink:0;cursor:pointer;font-family:inherit;}.fb.on{background:#F5C842;border-color:#F5C842;color:#111;font-weight:700;}.sec{display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;}.sec span{font-size:13px;font-weight:700;color:#111;}.sec a{color:#E63312;font-size:10px;cursor:pointer;text-decoration:none;}.lgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}.lc{background:#fff;border:0.5px solid #eee;border-radius:11px;overflow:hidden;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.04);}.lc:active{transform:scale(.98);}.limg{height:90px;background:#f9f5e0;display:flex;align-items:center;justify-content:center;position:relative;}.limg img{width:100%;height:100%;object-fit:cover;}.ph{font-size:28px;}.bn{position:absolute;top:4px;left:4px;font-size:8.5px;padding:2px 5px;border-radius:3px;font-weight:700;}.bnr{background:#E63312;color:#fff;}.bnb{background:#111;color:#F5C842;}.bnp{position:absolute;top:4px;right:4px;background:#F5C842;color:#111;font-size:8.5px;padding:2px 5px;border-radius:3px;font-weight:700;}.lb{padding:8px 9px 9px;}.lt{font-size:11.5px;font-weight:700;color:#222;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.lp{font-size:13px;font-weight:700;color:#E63312;margin-bottom:4px;}.lm{display:flex;align-items:center;justify-content:space-between;}.ll{font-size:9px;color:#bbb;display:flex;align-items:center;gap:2px;}.empty{grid-column:1/-1;text-align:center;padding:30px 16px;background:#f9f5e0;border-radius:12px;border:0.5px solid #eee;}.empty i{font-size:38px;color:#e0b030;display:block;margin-bottom:8px;}.empty h3{font-size:13px;font-weight:700;color:#555;margin-bottom:5px;}.empty p{font-size:11px;color:#aaa;line-height:1.6;margin-bottom:12px;}.ebtn{background:#E63312;color:#fff;border:none;border-radius:9px;padding:9px 18px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;}.prem{background:#FFFBEA;border:1.5px solid #F5C842;border-radius:12px;padding:11px 13px;display:flex;align-items:center;gap:8px;margin-bottom:10px;}.prem-i{width:30px;height:30px;background:#F5C842;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}.prem-i i{font-size:15px;color:#111;}.prem-t strong{font-size:11px;font-weight:700;color:#111;display:block;}.prem-t span{font-size:8.5px;color:#888;}.prem-btn{background:#111;color:#F5C842;border:none;border-radius:7px;padding:7px 11px;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:inherit;}.bnav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:#111;padding:8px 10px 14px;display:flex;justify-content:space-around;align-items:center;z-index:100;}.bi{display:flex;flex-direction:column;align-items:center;gap:1px;color:#555;border:none;background:none;font-family:inherit;cursor:pointer;}.bi.on{color:#F5C842;}.bi i{font-size:20px;}.bi span{font-size:8px;color:inherit;}.badd{width:44px;height:44px;background:#E63312;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2.5px solid #FFFBEA;margin-top:-12px;cursor:pointer;}.badd i{font-size:21px;color:#fff;}.spin{display:block;width:28px;height:28px;border:3px solid #F5C842;border-top-color:#E63312;border-radius:50%;animation:sp .7s linear infinite;margin:0 auto 8px;}@keyframes sp{to{transform:rotate(360deg);}}.lw{grid-column:1/-1;text-align:center;padding:28px;color:#bbb;font-size:12px;}`

export default function Home() {
  const [cats, setCats] = useState<any[]>([])
  const [listings, setListings] = useState<any[]>([])
  const [cat, setCat] = useState('all')
  const [fil, setFil] = useState('all')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [totL, setTotL] = useState(0)
  const [totU, setTotU] = useState(0)

  useEffect(() => {
    // Merr kategorite dhe statistikat
    apiFetch('categories').then(d => { if (Array.isArray(d)) setCats(d) })
    apiFetch('stats').then(d => { if (d) { setTotL(d.listings || 0); setTotU(d.users || 0) } })
    loadListings('all', 'all', '')
  }, [])

  async function loadListings(catSlug: string, filter: string, search: string) {
    setLoading(true)
    let qs = 'listings'
    const params: string[] = []
    
    if (catSlug !== 'all') {
      const catData = await apiFetch(`cat-id?slug=${encodeURIComponent(catSlug)}`)
      if (catData?.id) params.push(`category_id=${catData.id}`)
    }
    if (filter === 'new') params.push('condition=i_ri')
    if (filter === 'used') params.push('condition=i_perdorur')
    if (filter === 'premium') params.push('premium=true')
    if (search.trim()) params.push(`q=${encodeURIComponent(search.trim())}`)
    if (params.length) qs += '?' + params.join('&')
    
    const data = await apiFetch(qs)
    setListings(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function changeCat(slug: string) {
    setCat(slug)
    loadListings(slug, fil, q)
  }

  function changeFil(f: string) {
    setFil(f)
    loadListings(cat, f, q)
  }

  function doSearch(e: any) {
    e.preventDefault()
    loadListings(cat, fil, q)
  }

  const fmt = (p: number, c: string) => !p ? 'Çmim me marrëveshje' : c === 'EUR' ? `${p.toLocaleString()} €` : `${p.toLocaleString()} L`
  const go = (u: string) => { window.location.href = u }

  return (<>
    <style>{CSS}</style>
    <div className="wrap">
      <div className="hdr">
        <div className="top">
          <div className="logo" onClick={() => go('/')}>
            <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="#E63312"/>
              <g fill="#111">
                <ellipse cx="20" cy="22" rx="4" ry="5.5"/>
                <circle cx="15.5" cy="13" r="3.2"/>
                <circle cx="24.5" cy="13" r="3.2"/>
                <polygon points="13,15.5 11,16.5 13,17.5"/>
                <polygon points="27,15.5 29,16.5 27,17.5"/>
                <polygon points="20,20 6,18 8,26 20,25"/>
                <polygon points="20,20 34,18 32,26 20,25"/>
                <polygon points="17,27 23,27 24,33 20,32 16,33"/>
              </g>
              <rect x="24" y="26" width="12" height="10" rx="3" fill="#F5C842"/>
            </svg>
            <span className="brand">ALPAZAR</span>
          </div>
          <div className="navr">
            <button className="hbtn"><i className="ti ti-bell"/></button>
            <button className="lbtn" onClick={() => go('/auth/login')}>Hyr / Regjistrohu</button>
          </div>
        </div>

        <form className="srch" onSubmit={doSearch}>
          <div className="sbox">
            <i className="ti ti-search"/>
            <input type="text" placeholder="Kërko çdo gjë në Shqipëri..." value={q} onChange={e => setQ(e.target.value)}/>
          </div>
          <button type="submit" className="sbtn">Kërko</button>
        </form>

        <div className="cgrid">
          <button className={`ci ${cat === 'all' ? 'on' : ''}`} onClick={() => changeCat('all')}>
            <i className="ti ti-layout-grid"/><span>Të gjitha</span>
          </button>
          {cats.map((c: any) => (
            <button key={c.id} className={`ci ${cat === c.slug ? 'on' : ''}`} onClick={() => changeCat(c.slug)}>
              <i className={`ti ti-${c.icon}`}/><span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="body">
        <div className="noads"><i className="ti ti-ad-off"/><span>Pa reklama — për të gjithë gjithmonë</span></div>

        <div className="hero">
          <div className="hs" style={{left:0}}/><div className="hs" style={{right:0}}/>
          <div><h2>🦅 Shit · Bli · Bëj Pazrin Tënd</h2><p>Platforma #1 shqiptare e tregtisë</p></div>
          <div className="hst">
            <div className="hn"><div className="hn-v">{totL}</div><div className="hn-l">Shpallje</div></div>
            <div className="hn"><div className="hn-v">{totU}</div><div className="hn-l">Përdorues</div></div>
          </div>
        </div>

        <div className="aib">
          <div className="ai-i"><i className="ti ti-robot"/></div>
          <div className="ai-t"><strong>AI Asistent · 24/7</strong><span>Gjej çfarë kërkosh me gjuhë të lirë</span></div>
          <button className="ai-btn">Pyet ↗</button>
        </div>

        <div className="tr">
          <div className="tc tg"><i className="ti ti-shield-check"/><span>Të verifikuar</span></div>
          <div className="tc tb"><i className="ti ti-star"/><span>Vlerësime</span></div>
          <div className="tc tr_"><i className="ti ti-message-circle"/><span>Chat live</span></div>
        </div>

        <div className="frow">
          {[{id:'all',l:'Të gjitha'},{id:'new',l:'I ri'},{id:'used',l:'I përdorur'},{id:'premium',l:'Premium ⭐'}].map(f => (
            <button key={f.id} className={`fb ${fil === f.id ? 'on' : ''}`} onClick={() => changeFil(f.id)}>{f.l}</button>
          ))}
        </div>

        <div className="sec"><span>🔥 Shpallje të fundit</span><a onClick={() => changeCat('all')}>Të gjitha →</a></div>

        <div className="lgrid">
          {loading
            ? <div className="lw"><div className="spin"/><div>Duke ngarkuar...</div></div>
            : listings.length === 0
              ? (
                <div className="empty">
                  <i className="ti ti-mood-empty"/>
                  <h3>Nuk ka shpallje aktualisht</h3>
                  <p>Bëhu i pari që shton!<br/>Regjistrimi është falas.</p>
                  <button className="ebtn" onClick={() => go('/auth/login')}>+ Shto shpallje falas</button>
                </div>
              )
              : listings.map((l: any) => (
                <div key={l.id} className="lc" onClick={() => go(`/listing/${l.id}`)}>
                  <div className="limg">
                    {l.images?.[0] ? <img src={l.images[0]} alt={l.title}/> : <span className="ph">📦</span>}
                    {l.condition === 'i_ri' && <span className="bn bnr">I ri</span>}
                    {l.condition === 'i_perdorur' && <span className="bn bnb">I përdorur</span>}
                    {l.is_premium && <span className="bnp">⭐</span>}
                  </div>
                  <div className="lb">
                    <div className="lt">{l.title}</div>
                    <div className="lp">{fmt(l.price, l.currency)}</div>
                    <div className="lm">
                      <span className="ll"><i className="ti ti-map-pin" style={{fontSize:9}}/>{l.city || 'Shqipëri'}</span>
                    </div>
                  </div>
                </div>
              ))
          }
        </div>

        <div className="prem">
          <div className="prem-i"><i className="ti ti-crown"/></div>
          <div className="prem-t">
            <strong>👑 Alpazar Premium — 9.99€/muaj</strong>
            <span>Dyqan · Badge · Shpallje ∞ · Statistika</span>
          </div>
          <button className="prem-btn" onClick={() => go('/premium')}>Shiko</button>
        </div>
      </div>

      <nav className="bnav">
        <button className="bi on"><i className="ti ti-home"/><span>Kreu</span></button>
        <button className="bi" onClick={() => go('/search')}><i className="ti ti-search"/><span>Kërko</span></button>
        <div className="badd" onClick={() => go('/auth/login')}><i className="ti ti-plus"/></div>
        <button className="bi" onClick={() => go('/auth/login')}><i className="ti ti-message"/><span>Mesazhe</span></button>
        <button className="bi" onClick={() => go('/auth/login')}><i className="ti ti-user"/><span>Profili</span></button>
      </nav>
    </div>
  </>)
}
