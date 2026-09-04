'use client'

export const PREMIUM_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:var(--az-cream)}
.wrap{max-width:480px;margin:0 auto;min-height:100vh;padding-bottom:90px;background:var(--az-cream)}
@media(min-width:768px){.wrap{max-width:760px}}
@media(min-width:1024px){.wrap{max-width:100%;padding-left:clamp(32px,4vw,72px);padding-right:clamp(32px,4vw,72px)}}
.topbar{background:linear-gradient(165deg,var(--az-yellow-hi),var(--az-yellow) 52%,var(--az-yellow-lo));padding:10px 14px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:50}
.back{width:44px;height:44px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;font-size:17px;color:#111;display:flex;align-items:center;justify-content:center;}
.tt{font-size:15px;font-weight:700;color:#111}
.body{padding:14px}
.tiers{display:flex;gap:8px;margin-bottom:12px}
.tr{flex:1;border:2px solid #eee;background:#fff;border-radius:12px;padding:10px 8px;cursor:pointer;font-family:inherit;text-align:center;min-height:44px;display:flex;flex-direction:column;justify-content:center;}
.tr b{display:block;font-size:13px;font-weight:800;color:#111}
.tr span{display:block;font-size:10px;color:#555;margin-top:2px}
.tr.on{border-color:var(--az-red);background:#FFFDF6}
.tr.boost.on{border-color:#7C3AED;background:#F8F5FF}
.hero{background:linear-gradient(135deg,#111,#2a2a2a);border-radius:14px;padding:18px 16px;margin-bottom:14px}
.hero-t{font-size:18px;font-weight:800;color:var(--az-yellow);margin-bottom:5px;line-height:1.3}
.hero-s{font-size:12px;color:#ddd;line-height:1.55}
.seg{display:flex;gap:6px;background:#f2ecd6;border-radius:999px;padding:4px;margin-bottom:14px}
.sg{flex:1;border:none;background:transparent;border-radius:999px;padding:9px 4px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;color:#7a6a30;white-space:nowrap;min-height:44px;}
.sg.on{background:#fff;color:#111;box-shadow:0 1px 4px rgba(0,0,0,.08)}
.save{background:#C42B0F;color:#fff;font-size:8px;font-weight:800;padding:2px 4px;border-radius:5px;margin-left:3px;vertical-align:middle}
.plan{width:100%;text-align:left;background:#fff;border:2px solid #eee;border-radius:12px;padding:14px;margin-bottom:10px;cursor:pointer;font-family:inherit;display:block}
.plan.on{border-color:var(--az-red);background:#FFFDF6}
.plan.feat{border-color:var(--az-yellow)}
.plan.feat.on{border-color:var(--az-red)}
.plan.lock{opacity:.55;cursor:not-allowed}
.p-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.p-name{font-size:15px;font-weight:800;color:#111}
.tag{background:var(--az-yellow);color:#111;font-size:8px;font-weight:800;padding:2px 6px;border-radius:5px;margin-left:6px;vertical-align:middle}
.p-desc{font-size:11px;color:#555;margin-top:3px}
.p-price{text-align:right;white-space:nowrap}
.p-price b{display:block;font-size:19px;font-weight:800;color:#C42B0F}
.p-price span{font-size:10px;color:#aaa}
.p-badge{margin-top:8px;display:inline-block;background:#EAF3DE;color:#3B6D11;font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px}
.feat-list{list-style:none;margin:10px 0 0;padding:10px 0 0;border-top:.5px solid #f0f0f0}
.feat-list li{font-size:11.5px;color:#444;line-height:1.6;padding-left:17px;position:relative}
.feat-list li:before{content:'\\2713';position:absolute;left:0;color:#3B6D11;font-weight:800}
.card{background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;border:.5px solid #eee}
.sec-t{font-size:13px;font-weight:700;color:#111;margin-bottom:10px}
.pm{width:100%;display:flex;align-items:center;gap:9px;border:1.5px solid #e8e8e8;background:#fff;border-radius:10px;padding:11px 12px;margin-bottom:7px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;color:#333;min-height:44px;}
.pm.on{border-color:var(--az-red);background:#FFF7F5}
.pm .ok{margin-left:auto;color:#C42B0F}
.total{display:flex;justify-content:space-between;align-items:center;padding:11px 2px;margin-top:6px;border-top:.5px solid #eee;font-size:12px;color:#666}
.total b{font-size:17px;font-weight:800;color:#111}
.cta{width:100%;background:linear-gradient(135deg,var(--az-red),#c42a0e);color:#fff;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:8px}
.cta:disabled{opacity:.5;cursor:not-allowed}
.center{text-align:center}.muted{color:#555;font-size:12px}.small{font-size:11px;margin-top:8px;text-align:center;line-height:1.5}
.note{background:var(--az-cream);border:.5px solid var(--az-yellow);border-radius:9px;padding:10px 12px;font-size:12px;color:#5d4a00;margin-bottom:12px;line-height:1.5}
.note.ok{background:#EAF3DE;border-color:#97C459;color:#3B6D11}
.note a{color:#C42B0F;font-weight:700}
.msg{border-radius:10px;padding:9px 13px;font-size:12px;font-weight:600;margin-bottom:10px}
.msg.ok{background:#EAF3DE;color:#3B6D11;border:.5px solid #97C459}
.msg.err{background:#FFF0EE;color:#C42B0F;border:.5px solid #F09595}
`
