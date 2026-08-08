'use client'

export const PREMIUM_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA}
.wrap{max-width:480px;margin:0 auto;min-height:100vh;padding-bottom:90px;background:#FFFBEA}
.topbar{background:linear-gradient(165deg,#F8D24E,#F5C842 52%,#EEB828);padding:10px 14px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:50}
.back{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;font-size:17px;color:#111}
.tt{font-size:15px;font-weight:700;color:#111}
.body{padding:14px}
.hero{background:linear-gradient(135deg,#111,#2a2a2a);border-radius:14px;padding:18px 16px;margin-bottom:14px}
.hero-t{font-size:19px;font-weight:800;color:#F5C842;margin-bottom:4px}
.hero-s{font-size:12px;color:#ddd;line-height:1.5}
.seg{display:flex;gap:6px;background:#f2ecd6;border-radius:999px;padding:4px;margin-bottom:14px}
.sg{flex:1;border:none;background:transparent;border-radius:999px;padding:9px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;color:#7a6a30}
.sg.on{background:#fff;color:#111;box-shadow:0 1px 4px rgba(0,0,0,.08)}
.save{background:#E63312;color:#fff;font-size:9px;font-weight:800;padding:2px 5px;border-radius:5px;margin-left:4px}
.plan{width:100%;text-align:left;background:#fff;border:2px solid #eee;border-radius:12px;padding:14px;margin-bottom:10px;cursor:pointer;font-family:inherit;display:block}
.plan.on{border-color:#E63312;background:#FFFDF6}
.plan.feat{border-color:#F5C842}
.plan.feat.on{border-color:#E63312}
.p-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.p-name{font-size:15px;font-weight:800;color:#111}
.tag{background:#F5C842;color:#111;font-size:8px;font-weight:800;padding:2px 6px;border-radius:5px;margin-left:6px;vertical-align:middle}
.p-desc{font-size:11px;color:#888;margin-top:3px}
.p-price{text-align:right;white-space:nowrap}
.p-price b{display:block;font-size:19px;font-weight:800;color:#E63312}
.p-price span{font-size:10px;color:#aaa}
.p-badge{margin-top:8px;display:inline-block;background:#EAF3DE;color:#3B6D11;font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px}
.card{background:#fff;border-radius:12px;padding:16px;margin-bottom:12px;border:.5px solid #eee}
.sec-t{font-size:13px;font-weight:700;color:#111;margin-bottom:10px}
.pm{width:100%;display:flex;align-items:center;gap:9px;border:1.5px solid #e8e8e8;background:#fff;border-radius:10px;padding:11px 12px;margin-bottom:7px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;color:#333}
.pm.on{border-color:#E63312;background:#FFF7F5}
.pm .ok{margin-left:auto;color:#E63312}
.cta{width:100%;background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:8px}
.cta:disabled{opacity:.5;cursor:not-allowed}
.center{text-align:center}.muted{color:#888;font-size:12px}.small{font-size:11px;margin-top:8px;text-align:center}
.note{background:#FFFBEA;border:.5px solid #F5C842;border-radius:9px;padding:10px 12px;font-size:12px;color:#5d4a00;margin-bottom:12px}
.note a{color:#E63312;font-weight:700}
.msg{border-radius:10px;padding:9px 13px;font-size:12px;font-weight:600;margin-bottom:10px}
.msg.ok{background:#EAF3DE;color:#3B6D11;border:.5px solid #97C459}
.msg.err{background:#FFF0EE;color:#E63312;border:.5px solid #F09595}
`
